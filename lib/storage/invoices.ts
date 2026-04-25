import { createServiceClient } from "@/lib/supabase/service";

export const INVOICES_BUCKET = "invoices";

export type UploadedAttachment = {
  path: string;
  size: number;
  mimeType: string;
  filename: string;
};

function safeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "bijlage";
}

/**
 * Bouwt het object-pad voor een bijlage in de invoices-bucket.
 * Voorbeeld: mailbox-uuid/2026/04/19a854...filename.pdf
 */
export function buildAttachmentPath(
  mailAccountId: string,
  gmailMessageId: string,
  filename: string,
  receivedAt: Date | null,
): string {
  const date = receivedAt ?? new Date();
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const safe = safeFilename(filename);
  return `${mailAccountId}/${yyyy}/${mm}/${gmailMessageId}_${safe}`;
}

export async function uploadAttachment(
  path: string,
  data: Buffer | Uint8Array,
  mimeType: string,
): Promise<void> {
  const admin = createServiceClient();
  const { error } = await admin.storage
    .from(INVOICES_BUCKET)
    .upload(path, data, {
      contentType: mimeType,
      upsert: true,
    });
  if (error) {
    throw new Error(`uploadAttachment ${path}: ${error.message}`);
  }
}

/**
 * Genereert een tijdelijk gesigneerde URL voor een bijlage zodat de UI
 * hem kan tonen of laten downloaden zonder publieke bucket te zijn.
 */
export async function getAttachmentSignedUrl(
  path: string,
  expiresInSeconds = 60 * 30,
): Promise<string | null> {
  const admin = createServiceClient();
  const { data, error } = await admin.storage
    .from(INVOICES_BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error) return null;
  return data?.signedUrl ?? null;
}
