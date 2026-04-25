import crypto from "node:crypto";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import type { ExtractedInvoice } from "@/lib/extractors/haiku";
import type { FetchedMessage } from "@/lib/google/gmail";
import type { InvoiceInsert } from "@/lib/types";

const NEEDS_REVIEW_THRESHOLD = 0.85;
const DUAL_APPROVAL_AMOUNT_THRESHOLD = 500;

function buildContentHash(input: {
  mailAccountId: string;
  gmailMessageId: string;
  vendorName: string | null;
  invoiceNumber: string | null;
  amountGross: number | null;
}): string {
  const raw = [
    input.mailAccountId,
    input.gmailMessageId,
    (input.vendorName ?? "").toLowerCase(),
    (input.invoiceNumber ?? "").toLowerCase(),
    input.amountGross ?? 0,
  ].join("|");
  return crypto.createHash("sha256").update(raw).digest("hex");
}

const upsertVendorSchema = z.object({
  name: z.string().min(1),
  email_domain: z.string().nullable(),
});

async function upsertVendorByDomain(
  name: string,
  emailDomain: string | null,
): Promise<string | null> {
  const parsed = upsertVendorSchema.parse({ name, email_domain: emailDomain });
  const admin = createServiceClient();

  if (parsed.email_domain) {
    const existing = await admin
      .from("vendors")
      .select("id, name")
      .eq("email_domain", parsed.email_domain)
      .maybeSingle();
    if (existing.data) {
      // Update naam alleen als ie nog leeg of placeholder is.
      if (!existing.data.name || existing.data.name === parsed.email_domain) {
        await admin
          .from("vendors")
          .update({ name: parsed.name })
          .eq("id", existing.data.id);
      }
      return existing.data.id;
    }
  }

  const { data, error } = await admin
    .from("vendors")
    .insert({
      name: parsed.name,
      email_domain: parsed.email_domain,
    })
    .select("id")
    .single();
  if (error) {
    console.error("vendor insert mislukte", error);
    return null;
  }
  return data.id;
}

export type CreateInvoiceInput = {
  mailAccountId: string;
  gmailMessageId: string;
  defaultEntityId: string | null;
  message: FetchedMessage;
  extraction: ExtractedInvoice;
  storagePath: string | null;
  storageMimeType: string | null;
};

export type CreateInvoiceResult =
  | { status: "created"; invoiceId: string }
  | { status: "duplicate"; invoiceId: string }
  | { status: "error"; message: string };

/**
 * Maakt een factuur-rij op basis van een geextraheerde set velden.
 * Idempotent via content_hash zodat een tweede run dezelfde mail
 * niet nogmaals invoegt.
 */
export async function createInvoiceFromExtraction(
  input: CreateInvoiceInput,
): Promise<CreateInvoiceResult> {
  const admin = createServiceClient();
  const ext = input.extraction;

  const vendorId = ext.vendor_name
    ? await upsertVendorByDomain(ext.vendor_name, ext.vendor_email_domain ?? input.message.fromDomain)
    : null;

  const contentHash = buildContentHash({
    mailAccountId: input.mailAccountId,
    gmailMessageId: input.gmailMessageId,
    vendorName: ext.vendor_name,
    invoiceNumber: ext.invoice_number,
    amountGross: ext.amount_gross,
  });

  // Bij duplicate: linken naar bestaande invoice-id.
  const existing = await admin
    .from("invoices")
    .select("id")
    .eq("content_hash", contentHash)
    .maybeSingle();
  if (existing.data) {
    return { status: "duplicate", invoiceId: existing.data.id };
  }

  const needsReview = (ext.confidence ?? 0) < NEEDS_REVIEW_THRESHOLD;

  // Bepaal of dubbele goedkeuring nodig is op basis van de entiteit en
  // het bedrag. Boven de drempel sowieso.
  let requiresApproval = false;
  if (input.defaultEntityId) {
    const entity = await admin
      .from("entities")
      .select("default_requires_dual_approval")
      .eq("id", input.defaultEntityId)
      .maybeSingle();
    if (entity.data?.default_requires_dual_approval) {
      requiresApproval = true;
    }
  }
  if (
    typeof ext.amount_gross === "number" &&
    ext.amount_gross >= DUAL_APPROVAL_AMOUNT_THRESHOLD
  ) {
    requiresApproval = true;
  }

  const insert: InvoiceInsert = {
    content_hash: contentHash,
    mail_account_id: input.mailAccountId,
    vendor_id: vendorId,
    entity_id: input.defaultEntityId,
    document_kind: ext.document_kind,
    status: "binnengekomen",
    invoice_number: ext.invoice_number,
    invoice_date: ext.invoice_date,
    due_date: ext.due_date,
    amount_gross: ext.amount_gross,
    amount_net: ext.amount_net,
    amount_vat: ext.amount_vat,
    vat_rate: ext.vat_rate,
    currency: ext.currency || "EUR",
    payment_reference: ext.payment_reference,
    recipient_iban: ext.recipient_iban,
    expense_reason: ext.expense_reason,
    extracted_by: "llm_haiku",
    extraction_confidence: ext.confidence,
    needs_review: needsReview,
    requires_approval: requiresApproval,
    gmail_message_id: input.gmailMessageId,
    storage_path: input.storagePath,
    original_mime_type: input.storageMimeType,
    original_filename:
      input.message.attachments.find((a) => a.mimeType === "application/pdf")?.filename ??
      input.message.attachments[0]?.filename ??
      null,
    raw_text: input.message.bodyText.slice(0, 50000) || null,
  };

  const { data, error } = await admin
    .from("invoices")
    .insert(insert)
    .select("id")
    .single();
  if (error) {
    return { status: "error", message: error.message };
  }
  return { status: "created", invoiceId: data.id };
}

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  binnengekomen: ["te_beoordelen", "goedgekeurd", "afgewezen", "betwist", "on_hold"],
  te_beoordelen: ["goedgekeurd", "afgewezen", "betwist", "on_hold"],
  goedgekeurd: ["klaar_voor_betaling", "on_hold", "betwist", "te_beoordelen"],
  klaar_voor_betaling: ["voldaan", "goedgekeurd", "betwist"],
  voldaan: ["gearchiveerd", "betwist"],
  afgewezen: ["gearchiveerd", "betwist"],
  betwist: ["goedgekeurd", "afgewezen", "voldaan", "on_hold"],
  on_hold: [
    "te_beoordelen",
    "goedgekeurd",
    "klaar_voor_betaling",
    "voldaan",
    "afgewezen",
    "betwist",
  ],
  gearchiveerd: ["betwist"],
};

const statusChangeSchema = z.object({
  invoiceId: z.string().uuid(),
  toStatus: z.enum([
    "binnengekomen",
    "te_beoordelen",
    "goedgekeurd",
    "klaar_voor_betaling",
    "voldaan",
    "afgewezen",
    "betwist",
    "on_hold",
    "gearchiveerd",
  ]),
  reason: z
    .enum([
      "dubbele_factuur",
      "bedrag_klopt_niet",
      "dienst_niet_geleverd",
      "kwaliteit_onder_maat",
      "verkeerde_adressering",
      "onverwachte_verhoging",
      "geen_overeenkomst",
      "wachten_op_creditnota",
      "contract_opgezegd",
      "overig",
    ])
    .optional(),
  note: z.string().max(2000).optional(),
});

export type ChangeStatusInput = z.input<typeof statusChangeSchema>;

/**
 * Wijzigt de status van een factuur. Valideert tegen de toegestane
 * transities en zet bij afwijzen / betwisten ook reason en note. De
 * trigger log_invoice_status_change schrijft automatisch een event.
 */
const updateFieldsSchema = z.object({
  invoiceId: z.string().uuid(),
  entity_id: z.string().uuid().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  expense_reason: z.string().max(500).nullable().optional(),
  invoice_number: z.string().max(120).nullable().optional(),
  invoice_date: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  amount_gross: z.number().nullable().optional(),
  amount_net: z.number().nullable().optional(),
  amount_vat: z.number().nullable().optional(),
  vat_rate: z.number().nullable().optional(),
  payment_reference: z.string().max(200).nullable().optional(),
  recipient_iban: z.string().max(40).nullable().optional(),
});

export type UpdateInvoiceFieldsInput = z.input<typeof updateFieldsSchema>;

/**
 * Werk een set bewerkbare factuur-velden bij in een keer. Alleen velden
 * die in de input zitten worden meegestuurd, andere blijven onaangeroerd.
 * Gebruikt de service client zodat ook boekhouders BTW-correcties kunnen
 * doen zonder eigen RLS-policy.
 */
export async function updateInvoiceFields(input: UpdateInvoiceFieldsInput) {
  const parsed = updateFieldsSchema.parse(input);
  const { invoiceId, ...rest } = parsed;
  const update: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rest)) {
    if (value !== undefined) update[key] = value;
  }
  if (Object.keys(update).length === 0) return;

  // Bij handmatige correctie de needs_review-vlag automatisch wegen.
  update.needs_review = false;

  const admin = createServiceClient();
  const { error } = await admin
    .from("invoices")
    .update(update as never)
    .eq("id", invoiceId);
  if (error) {
    throw new Error(`updateInvoiceFields: ${error.message}`);
  }
}

export async function changeInvoiceStatus(input: ChangeStatusInput) {
  const parsed = statusChangeSchema.parse(input);
  const admin = createServiceClient();

  const current = await admin
    .from("invoices")
    .select("status")
    .eq("id", parsed.invoiceId)
    .single();
  if (current.error) {
    throw new Error(`Factuur niet gevonden: ${current.error.message}`);
  }
  const allowed = ALLOWED_TRANSITIONS[current.data.status] ?? [];
  if (!allowed.includes(parsed.toStatus)) {
    throw new Error(
      `Overgang van ${current.data.status} naar ${parsed.toStatus} is niet toegestaan.`,
    );
  }

  const { error } = await admin
    .from("invoices")
    .update({
      status: parsed.toStatus,
      status_reason: parsed.reason ?? null,
      status_note: parsed.note ?? null,
      ...(parsed.toStatus === "voldaan"
        ? { paid_at: new Date().toISOString().slice(0, 10) }
        : {}),
    })
    .eq("id", parsed.invoiceId);
  if (error) {
    throw new Error(`Status wijzigen mislukte: ${error.message}`);
  }
}

const approveSchema = z.object({
  invoiceId: z.string().uuid(),
  userId: z.string().uuid(),
});

export type ApprovalState = {
  approvedFirst: boolean;
  approvedBoth: boolean;
  message: string;
};

/**
 * Goedkeuring registreren. Bij requires_approval=true is een tweede
 * onafhankelijke handtekening van een andere user nodig voordat de
 * status naar 'goedgekeurd' beweegt. Bij requires_approval=false zet
 * deze functie de status direct naar goedgekeurd.
 */
export async function approveInvoice(
  input: z.input<typeof approveSchema>,
): Promise<ApprovalState> {
  const parsed = approveSchema.parse(input);
  const admin = createServiceClient();

  const { data: invoice, error: readErr } = await admin
    .from("invoices")
    .select(
      "id, status, requires_approval, approved_by, co_approved_by",
    )
    .eq("id", parsed.invoiceId)
    .single();
  if (readErr) throw new Error(readErr.message);

  if (invoice.approved_by === parsed.userId || invoice.co_approved_by === parsed.userId) {
    return {
      approvedFirst: invoice.approved_by !== null,
      approvedBoth: invoice.approved_by !== null && invoice.co_approved_by !== null,
      message: "Je hebt deze factuur al goedgekeurd.",
    };
  }

  const now = new Date().toISOString();

  // Geen dubbele approval nodig: direct door naar goedgekeurd.
  if (!invoice.requires_approval) {
    const { error } = await admin
      .from("invoices")
      .update({
        approved_by: parsed.userId,
        approved_at: now,
        status: "goedgekeurd",
      })
      .eq("id", parsed.invoiceId);
    if (error) throw new Error(error.message);
    return {
      approvedFirst: true,
      approvedBoth: false,
      message: "Goedgekeurd.",
    };
  }

  // Eerste handtekening: zet approved_by, status blijft.
  if (!invoice.approved_by) {
    const { error } = await admin
      .from("invoices")
      .update({
        approved_by: parsed.userId,
        approved_at: now,
      })
      .eq("id", parsed.invoiceId);
    if (error) throw new Error(error.message);
    return {
      approvedFirst: true,
      approvedBoth: false,
      message: "Eerste goedkeuring genoteerd. Wacht op de tweede.",
    };
  }

  // Tweede handtekening door een andere user: door naar goedgekeurd.
  const { error } = await admin
    .from("invoices")
    .update({
      co_approved_by: parsed.userId,
      co_approved_at: now,
      status: "goedgekeurd",
    })
    .eq("id", parsed.invoiceId);
  if (error) throw new Error(error.message);
  return {
    approvedFirst: true,
    approvedBoth: true,
    message: "Volledig goedgekeurd.",
  };
}

