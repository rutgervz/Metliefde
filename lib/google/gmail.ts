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

export type FetchedAttachment = {
  filename: string;
  mimeType: string;
  data: Buffer;
};

export type FetchedMessage = {
  id: string;
  threadId: string | null;
  internalDate: Date | null;
  subject: string;
  from: string;
  fromEmail: string;
  fromDomain: string;
  to: string;
  date: string;
  snippet: string;
  bodyText: string;
  bodyHtml: string;
  attachments: FetchedAttachment[];
};

function header(
  headers: gmail_v1.Schema$MessagePartHeader[] | undefined,
  name: string,
): string {
  const found = headers?.find(
    (h) => h.name?.toLowerCase() === name.toLowerCase(),
  );
  return found?.value ?? "";
}

function decodeBase64Url(encoded: string): Buffer {
  const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64");
}

function extractParts(
  part: gmail_v1.Schema$MessagePart,
  acc: { text: string; html: string; attachments: gmail_v1.Schema$MessagePart[] },
) {
  const mimeType = part.mimeType ?? "";
  const filename = part.filename ?? "";

  if (filename && part.body?.attachmentId) {
    acc.attachments.push(part);
    return;
  }

  if (mimeType === "text/plain" && part.body?.data) {
    acc.text += decodeBase64Url(part.body.data).toString("utf8");
  } else if (mimeType === "text/html" && part.body?.data) {
    acc.html += decodeBase64Url(part.body.data).toString("utf8");
  }

  if (part.parts) {
    for (const child of part.parts) {
      extractParts(child, acc);
    }
  }
}

function parseFromHeader(value: string): { name: string; email: string; domain: string } {
  const match = value.match(/<([^>]+)>/);
  const email = (match?.[1] ?? value).trim().toLowerCase();
  const name = (match ? value.slice(0, value.indexOf("<")) : "").trim().replace(/(^"|"$)/g, "");
  const domain = email.includes("@") ? email.split("@")[1] : "";
  return { name: name || email, email, domain };
}

/**
 * Haalt het volledige Gmail-bericht op inclusief headers, body en
 * eventuele bijlagen. Bijlagen worden in een tweede call gedownload
 * naar Buffer-data zodat we ze direct kunnen uploaden naar storage.
 */
export async function fetchMessageWithAttachments(
  gmail: gmail_v1.Gmail,
  messageId: string,
): Promise<FetchedMessage> {
  const msg = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });
  const payload = msg.data.payload;
  if (!payload) {
    throw new Error("Bericht heeft geen payload.");
  }

  const headers = payload.headers ?? [];
  const subject = header(headers, "Subject");
  const fromValue = header(headers, "From");
  const toValue = header(headers, "To");
  const dateValue = header(headers, "Date");
  const { name: fromName, email: fromEmail, domain: fromDomain } = parseFromHeader(fromValue);

  const acc = { text: "", html: "", attachments: [] as gmail_v1.Schema$MessagePart[] };
  extractParts(payload, acc);

  const attachments: FetchedAttachment[] = [];
  for (const part of acc.attachments) {
    const attachmentId = part.body?.attachmentId;
    if (!attachmentId) continue;
    const result = await gmail.users.messages.attachments.get({
      userId: "me",
      messageId,
      id: attachmentId,
    });
    const data = result.data.data;
    if (!data) continue;
    attachments.push({
      filename: part.filename ?? "bijlage",
      mimeType: part.mimeType ?? "application/octet-stream",
      data: decodeBase64Url(data),
    });
  }

  const internalDate = msg.data.internalDate
    ? new Date(Number(msg.data.internalDate))
    : null;

  return {
    id: messageId,
    threadId: msg.data.threadId ?? null,
    internalDate,
    subject,
    from: fromName,
    fromEmail,
    fromDomain,
    to: toValue,
    date: dateValue,
    snippet: msg.data.snippet ?? "",
    bodyText: acc.text,
    bodyHtml: acc.html,
    attachments,
  };
}
