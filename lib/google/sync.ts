import { createServiceClient } from "@/lib/supabase/service";
import {
  buildClientForAccount,
  findLabelId,
  gmailClient,
  listMessagesByLabel,
} from "./gmail";
import { enqueueExtractInvoice } from "@/lib/mutations/jobs";
import {
  markMailboxError,
  markMailboxNeedsReauth,
  markMailboxSynced,
  persistRefreshedTokens,
} from "@/lib/mutations/mail-accounts";
import type { MailAccountRow } from "@/lib/types";

export type SyncResult = {
  email: string;
  status: "ok" | "error" | "herauth_nodig";
  message?: string;
  enqueued?: number;
  skipped?: number;
  total?: number;
};

/**
 * Sync een enkele mailbox: ververs token indien nodig, haal het label
 * op, lijst de recente berichten en plaats voor elk een job in de
 * queue. Faalt fail-soft: error-melding op de mailbox-rij, niet op
 * proces-niveau.
 */
export async function syncMailbox(
  account: Pick<
    MailAccountRow,
    | "id"
    | "email"
    | "access_token"
    | "refresh_token"
    | "token_expires_at"
    | "gmail_label"
    | "gmail_history_id"
  >,
): Promise<SyncResult> {
  if (!account.access_token && !account.refresh_token) {
    await markMailboxNeedsReauth(account.id, "Geen tokens beschikbaar.");
    return {
      email: account.email,
      status: "herauth_nodig",
      message: "Geen tokens beschikbaar.",
    };
  }

  const oauth = buildClientForAccount({
    access_token: account.access_token,
    refresh_token: account.refresh_token,
    token_expires_at: account.token_expires_at,
  });

  // Persist nieuw access_token wanneer googleapis automatisch ververst.
  oauth.on("tokens", async (tokens) => {
    if (tokens.access_token) {
      try {
        await persistRefreshedTokens(account.id, {
          access_token: tokens.access_token,
          expiry_date: tokens.expiry_date ?? null,
        });
      } catch (err) {
        console.error("persist refreshed tokens faalde", err);
      }
    }
  });

  const gmail = gmailClient(oauth);

  let labelId: string | null = null;
  try {
    labelId = await findLabelId(gmail, account.gmail_label);
  } catch (err) {
    return await handleGmailError(account, err);
  }

  if (!labelId) {
    const message = `Label "${account.gmail_label}" niet gevonden in Gmail. Maak het aan in Gmail en pas filters toe.`;
    await markMailboxError(account.id, message);
    return { email: account.email, status: "error", message };
  }

  let messageIds: string[] = [];
  try {
    messageIds = await listMessagesByLabel(gmail, labelId, 50);
  } catch (err) {
    return await handleGmailError(account, err);
  }

  let enqueued = 0;
  let skipped = 0;
  for (const messageId of messageIds) {
    try {
      const result = await enqueueExtractInvoice({
        mailAccountId: account.id,
        gmailMessageId: messageId,
      });
      if (result.skipped) {
        skipped += 1;
      } else {
        enqueued += 1;
      }
    } catch (err) {
      console.error("enqueueExtractInvoice mislukte", { messageId, err });
    }
  }

  const summary =
    messageIds.length === 0
      ? `Geen berichten gevonden met label "${account.gmail_label}". Pas een filter toe of label een test-mail.`
      : `${enqueued} nieuw ingepakt, ${skipped} al bekend (totaal ${messageIds.length}).`;

  await markMailboxSynced(account.id, { summary });

  return {
    email: account.email,
    status: "ok",
    enqueued,
    skipped,
    total: messageIds.length,
  };
}

async function handleGmailError(
  account: { id: string; email: string },
  err: unknown,
): Promise<SyncResult> {
  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();
  if (
    lower.includes("invalid_grant") ||
    lower.includes("token has been expired or revoked") ||
    lower.includes("unauthorized")
  ) {
    await markMailboxNeedsReauth(account.id, message);
    return { email: account.email, status: "herauth_nodig", message };
  }
  await markMailboxError(account.id, message);
  return { email: account.email, status: "error", message };
}

/**
 * Sync alle verbonden mailboxen. Gebruikt door zowel de cron als
 * de manuele "Sync nu"-knop.
 */
export async function syncAllConnectedMailboxes(): Promise<SyncResult[]> {
  const admin = createServiceClient();
  const { data, error } = await admin
    .from("mail_accounts")
    .select(
      "id, email, access_token, refresh_token, token_expires_at, gmail_label, gmail_history_id",
    )
    .eq("status", "verbonden");

  if (error) {
    throw new Error(`syncAllConnectedMailboxes: ${error.message}`);
  }

  const results: SyncResult[] = [];
  for (const account of data ?? []) {
    try {
      const result = await syncMailbox(account);
      results.push(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({ email: account.email, status: "error", message });
    }
  }
  return results;
}

export async function syncMailboxById(id: string): Promise<SyncResult> {
  const admin = createServiceClient();
  const { data, error } = await admin
    .from("mail_accounts")
    .select(
      "id, email, access_token, refresh_token, token_expires_at, gmail_label, gmail_history_id",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) {
    throw new Error(`syncMailboxById: ${error.message}`);
  }
  if (!data) {
    throw new Error("Mailbox niet gevonden.");
  }
  return await syncMailbox(data);
}
