import crypto from "node:crypto";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import type { ExtractedInvoice } from "@/lib/extractors/haiku";
import type { FetchedMessage } from "@/lib/google/gmail";
import type { InvoiceInsert } from "@/lib/types";

const NEEDS_REVIEW_THRESHOLD = 0.85;

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
