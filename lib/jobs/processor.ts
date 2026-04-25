import { createServiceClient } from "@/lib/supabase/service";
import {
  buildClientForAccount,
  fetchMessageWithAttachments,
  gmailClient,
} from "@/lib/google/gmail";
import { extractInvoiceWithHaiku } from "@/lib/extractors/haiku";
import { createInvoiceFromExtraction } from "@/lib/mutations/invoices";
import { applySuggestedTags } from "@/lib/mutations/tags";
import {
  buildAttachmentPath,
  uploadAttachment,
} from "@/lib/storage/invoices";
import type { Database } from "@/lib/database.types";

type JobRow = Database["public"]["Tables"]["jobs"]["Row"];

export type JobResult = {
  jobId: string;
  status: "gereed" | "mislukt";
  invoiceId?: string;
  message?: string;
};

async function markJobRunning(jobId: string): Promise<void> {
  const admin = createServiceClient();
  await admin
    .from("jobs")
    .update({
      status: "bezig",
      started_at: new Date().toISOString(),
      attempts: 1,
    })
    .eq("id", jobId);
}

async function markJobDone(
  jobId: string,
  attempts: number,
): Promise<void> {
  const admin = createServiceClient();
  await admin
    .from("jobs")
    .update({
      status: "gereed",
      finished_at: new Date().toISOString(),
      attempts,
      last_error: null,
    })
    .eq("id", jobId);
}

async function markJobFailed(
  jobId: string,
  attempts: number,
  message: string,
): Promise<void> {
  const admin = createServiceClient();
  await admin
    .from("jobs")
    .update({
      status: "mislukt",
      finished_at: new Date().toISOString(),
      attempts,
      last_error: message.slice(0, 500),
    })
    .eq("id", jobId);
}

async function getMailAccount(id: string) {
  const admin = createServiceClient();
  const { data, error } = await admin
    .from("mail_accounts")
    .select(
      "id, email, access_token, refresh_token, token_expires_at, default_entity_id, gmail_label, status",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

async function processExtractInvoiceJob(job: JobRow): Promise<JobResult> {
  const payload = job.payload as Record<string, unknown>;
  const mailAccountId = String(payload.mail_account_id ?? "");
  const gmailMessageId = String(payload.gmail_message_id ?? "");

  if (!mailAccountId || !gmailMessageId) {
    return {
      jobId: job.id,
      status: "mislukt",
      message: "Job-payload ontbreekt mail_account_id of gmail_message_id.",
    };
  }

  const account = await getMailAccount(mailAccountId);
  if (!account || account.status !== "verbonden") {
    return {
      jobId: job.id,
      status: "mislukt",
      message: "Mailbox bestaat niet meer of is niet verbonden.",
    };
  }

  const oauth = buildClientForAccount({
    access_token: account.access_token,
    refresh_token: account.refresh_token,
    token_expires_at: account.token_expires_at,
  });
  const gmail = gmailClient(oauth);

  const message = await fetchMessageWithAttachments(gmail, gmailMessageId);

  // Eerst de eerste relevante bijlage uploaden, voordat we extracten.
  let storagePath: string | null = null;
  let storageMime: string | null = null;
  const primary =
    message.attachments.find((a) => a.mimeType === "application/pdf") ??
    message.attachments.find((a) => a.mimeType.startsWith("image/")) ??
    null;
  if (primary) {
    storagePath = buildAttachmentPath(
      mailAccountId,
      gmailMessageId,
      primary.filename,
      message.internalDate,
    );
    storageMime = primary.mimeType;
    await uploadAttachment(storagePath, primary.data, primary.mimeType);
  }

  const extraction = await extractInvoiceWithHaiku(message);
  if (!extraction) {
    return {
      jobId: job.id,
      status: "mislukt",
      message: "Haiku-extractie gaf geen geldige data terug.",
    };
  }

  const result = await createInvoiceFromExtraction({
    mailAccountId,
    gmailMessageId,
    defaultEntityId: account.default_entity_id,
    message,
    extraction,
    storagePath,
    storageMimeType: storageMime,
  });

  if (result.status === "error") {
    return { jobId: job.id, status: "mislukt", message: result.message };
  }

  // Tag-suggesties van Haiku toepassen, alleen voor net-aangemaakte facturen.
  if (
    result.status === "created" &&
    extraction.suggested_tags &&
    extraction.suggested_tags.length > 0
  ) {
    try {
      await applySuggestedTags(result.invoiceId, extraction.suggested_tags);
    } catch (err) {
      console.error("applySuggestedTags faalde", err);
    }
  }

  return {
    jobId: job.id,
    status: "gereed",
    invoiceId: result.invoiceId,
    message: result.status === "duplicate" ? "Reeds bekende factuur." : undefined,
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Reset jobs die al langer dan 4 minuten op 'bezig' staan terug naar
 * 'wachtend' zodat een gecrashte of getimeoute run ze niet voor altijd
 * blokkeert.
 */
async function recoverStaleJobs(): Promise<number> {
  const admin = createServiceClient();
  const cutoff = new Date(Date.now() - 4 * 60 * 1000).toISOString();
  const { data, error } = await admin
    .from("jobs")
    .update({
      status: "wachtend",
      started_at: null,
      last_error: "Hervat na timeout van vorige run.",
    })
    .eq("status", "bezig")
    .lt("started_at", cutoff)
    .select("id");
  if (error) {
    console.error("recoverStaleJobs faalde", error);
    return 0;
  }
  return data?.length ?? 0;
}

/**
 * Verwerkt een batch wachtende jobs. Elke job wordt op zichzelf
 * uitgevoerd en bijgewerkt; falen van een job blokkeert de rest niet.
 * Met Vercel Pro hebben we 300s function-timeout, dus grotere batches
 * mogelijk. Tussen jobs een korte pauze om rate-limits te respecteren.
 */
export async function processPendingJobs(maxJobs = 15): Promise<JobResult[]> {
  await recoverStaleJobs();

  const admin = createServiceClient();
  const { data: jobs, error } = await admin
    .from("jobs")
    .select("*")
    .eq("status", "wachtend")
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(maxJobs);

  if (error) throw new Error(error.message);

  const results: JobResult[] = [];
  for (const [index, job] of (jobs ?? []).entries()) {
    if (index > 0) {
      // Korte pauze tussen calls. Bij rate-limit doet de Haiku-wrapper
      // alsnog een eigen backoff, dus deze 1s is enkel een vriendelijke
      // basisspreiding.
      await sleep(1_000);
    }
    await markJobRunning(job.id);
    const attempts = (job.attempts ?? 0) + 1;
    try {
      let result: JobResult;
      switch (job.kind) {
        case "extract_invoice":
          result = await processExtractInvoiceJob(job);
          break;
        default:
          result = {
            jobId: job.id,
            status: "mislukt",
            message: `Onbekende job kind: ${job.kind}`,
          };
      }

      if (result.status === "gereed") {
        await markJobDone(job.id, attempts);
      } else {
        await markJobFailed(job.id, attempts, result.message ?? "");
      }
      results.push(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await markJobFailed(job.id, attempts, message);
      results.push({ jobId: job.id, status: "mislukt", message });
    }
  }

  return results;
}
