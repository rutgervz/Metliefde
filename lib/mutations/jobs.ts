import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";

const enqueueExtractInvoiceSchema = z.object({
  mailAccountId: z.string().uuid(),
  gmailMessageId: z.string().min(1),
});

/**
 * Plaats een extract_invoice-job in de queue voor een Gmail-bericht.
 * Skipt wanneer er al een job, of een factuur, voor deze combinatie
 * bestaat. Idempotent te maken zonder unique-constraint omdat we de
 * cron elke 15 minuten draaien.
 */
export async function enqueueExtractInvoice(
  input: z.input<typeof enqueueExtractInvoiceSchema>,
): Promise<{ skipped: boolean; reason?: string; jobId?: string }> {
  const { mailAccountId, gmailMessageId } =
    enqueueExtractInvoiceSchema.parse(input);
  const admin = createServiceClient();

  // Heeft deze message al een job openstaan, draaiend of klaar?
  const existingJob = await admin
    .from("jobs")
    .select("id")
    .eq("kind", "extract_invoice")
    .filter("payload->>mail_account_id", "eq", mailAccountId)
    .filter("payload->>gmail_message_id", "eq", gmailMessageId)
    .limit(1)
    .maybeSingle();
  if (existingJob.data) {
    return { skipped: true, reason: "job_exists" };
  }

  // Of is er al een factuur uit dit bericht geextraheerd?
  const existingInvoice = await admin
    .from("invoices")
    .select("id")
    .eq("mail_account_id", mailAccountId)
    .eq("gmail_message_id", gmailMessageId)
    .limit(1)
    .maybeSingle();
  if (existingInvoice.data) {
    return { skipped: true, reason: "invoice_exists" };
  }

  const { data, error } = await admin
    .from("jobs")
    .insert({
      kind: "extract_invoice",
      payload: {
        mail_account_id: mailAccountId,
        gmail_message_id: gmailMessageId,
      },
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`enqueueExtractInvoice: ${error.message}`);
  }
  return { skipped: false, jobId: data.id };
}
