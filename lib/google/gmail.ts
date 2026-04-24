import { google, type gmail_v1 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { createOAuthClient } from "./oauth";

export type MailAccountTokens = {
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
};

/**
 * Bouwt een OAuth-client met de tokens van een mailbox. De googleapis-
 * client ververst access tokens automatisch wanneer hij verlopen is,
 * mits er een refresh_token beschikbaar is. De aanroeper kan via de
 * 'tokens' event new tokens persistent maken.
 */
export function buildClientForAccount(account: MailAccountTokens): OAuth2Client {
  const client = createOAuthClient();
  client.setCredentials({
    access_token: account.access_token ?? undefined,
    refresh_token: account.refresh_token ?? undefined,
    expiry_date: account.token_expires_at
      ? new Date(account.token_expires_at).getTime()
      : undefined,
  });
  return client;
}

export function gmailClient(auth: OAuth2Client): gmail_v1.Gmail {
  return google.gmail({ version: "v1", auth });
}

/**
 * Zoekt het label-ID dat hoort bij een hierarchische naam zoals
 * "Facturen/Inbox". Gmail noemt dit het user-defined label-pad.
 * Geeft null terug als het label niet bestaat.
 */
export async function findLabelId(
  gmail: gmail_v1.Gmail,
  name: string,
): Promise<string | null> {
  const response = await gmail.users.labels.list({ userId: "me" });
  const target = response.data.labels?.find((l) => l.name === name);
  return target?.id ?? null;
}

/**
 * Haalt tot maxResults message-ID's op met het opgegeven label,
 * recentste eerst. Voor incremental sync (gebaseerd op historyId)
 * voegen we een aparte functie toe in een latere iteratie.
 */
export async function listMessagesByLabel(
  gmail: gmail_v1.Gmail,
  labelId: string,
  maxResults = 50,
): Promise<string[]> {
  const result = await gmail.users.messages.list({
    userId: "me",
    labelIds: [labelId],
    maxResults,
  });
  return (result.data.messages ?? []).map((m) => m.id!).filter(Boolean);
}

export async function getProfile(gmail: gmail_v1.Gmail) {
  const result = await gmail.users.getProfile({ userId: "me" });
  return {
    emailAddress: result.data.emailAddress ?? null,
    historyId: result.data.historyId ?? null,
  };
}
