import { createServiceClient } from "@/lib/supabase/service";
import {
  buildClientForAccount,
  fetchMessageWithAttachments,
  gmailClient,
} from "@/lib/google/gmail";
import { extractInvoiceWithHaiku } from "@/lib/extractors/haiku";
import { applySuggestedTags } from "@/lib/mutations/tags";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type RetagResult = {
  invoiceId: string;
  status: "ok" | "skipped" | "error";
  tagsApplied?: number;
  message?: string;
};

/**
 * Vraagt Haiku opnieuw om tags voor een bestaande factuur. Alleen
 * suggested_tags worden toegepast; andere velden niet aangeraakt.
 * Gebruikt de bestaande Gmail-bron via de mailbox-tokens.
 */
export async function retagInvoice(invoiceId: string): Promise<RetagResult> {
  const admin = createServiceClient();
  const { data: inv, error } = await admin
    .from("invoices")
    .select("id, mail_account_id, gmail_message_id")
    .eq("id", invoiceId)
    .maybeSingle();
  if (error) return { invoiceId, status: "error", message: error.message };
  if (!inv) return { invoiceId, status: "error", message: "Factuur niet gevonden." };
  if (!inv.mail_account_id || !inv.gmail_message_id) {
    return { invoiceId, status: "skipped", message: "Geen mail-koppeling." };
  }

  const { data: account } = await admin
    .from("mail_accounts")
    .select("access_token, refresh_token, token_expires_at")
    .eq("id", inv.mail_account_id)
    .maybeSingle();
  if (!account) {
    return { invoiceId, status: "skipped", message: "Mailbox niet gevonden." };
  }

  const oauth = buildClientForAccount({
    access_token: account.access_token,
    refresh_token: account.refresh_token,
    token_expires_at: account.token_expires_at,
  });
  const gmail = gmailClient(oauth);

  let message;
  try {
    message = await fetchMessageWithAttachments(gmail, inv.gmail_message_id);
  } catch (err) {
    return {
      invoiceId,
      status: "error",
      message: err instanceof Error ? err.message : "Gmail-fetch faalde.",
    };
  }

  let extraction;
  try {
    extraction = await extractInvoiceWithHaiku(message);
  } catch (err) {
    return {
      invoiceId,
      status: "error",
      message: err instanceof Error ? err.message : "Haiku-call faalde.",
    };
  }

  if (!extraction || !extraction.suggested_tags?.length) {
    return { invoiceId, status: "ok", tagsApplied: 0 };
  }

  // Bewaar de suggesties op de factuur zelf zodat ze later opnieuw
  // getoond kunnen worden in de TagsManager.
  try {
    await admin
      .from("invoices")
      .update({ haiku_suggested_tags: extraction.suggested_tags })
      .eq("id", invoiceId);
  } catch (err) {
    console.error("haiku_suggested_tags persist faalde", err);
  }

  try {
    await applySuggestedTags(invoiceId, extraction.suggested_tags);
  } catch (err) {
    return {
      invoiceId,
      status: "error",
      message: err instanceof Error ? err.message : "Tags toepassen faalde.",
    };
  }
  return {
    invoiceId,
    status: "ok",
    tagsApplied: extraction.suggested_tags.length,
  };
}

/**
 * Hertag alle facturen die nog geen tags hebben. Sequentieel met
 * korte pauze tussen calls om de rate-limit niet te raken.
 */
export async function retagInvoicesWithoutTags(maxInvoices = 25): Promise<{
  attempted: number;
  ok: number;
  skipped: number;
  failed: number;
  results: RetagResult[];
}> {
  const admin = createServiceClient();

  // Vind invoice-id's zonder tag-koppelingen.
  const { data: tagged } = await admin.from("invoice_tags").select("invoice_id");
  const taggedIds = new Set((tagged ?? []).map((t) => t.invoice_id));

  const { data: invoices } = await admin
    .from("invoices")
    .select("id, gmail_message_id, mail_account_id")
    .not("gmail_message_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(200);

  const targets = (invoices ?? []).filter((inv) => !taggedIds.has(inv.id)).slice(0, maxInvoices);

  const results: RetagResult[] = [];
  for (const [index, inv] of targets.entries()) {
    if (index > 0) await sleep(1_000);
    const result = await retagInvoice(inv.id);
    results.push(result);
  }

  return {
    attempted: results.length,
    ok: results.filter((r) => r.status === "ok").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    failed: results.filter((r) => r.status === "error").length,
    results,
  };
}
