import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import type { MailAccountInsert, MailAccountStatus } from "@/lib/types";

const upsertSchema = z.object({
  email: z.string().email().toLowerCase(),
  display_name: z.string().nullable().optional(),
  provider: z.literal("gmail").default("gmail"),
  status: z
    .enum(["verbonden", "herauth_nodig", "gepauzeerd", "ontkoppeld"])
    .default("verbonden"),
  default_entity_id: z.string().uuid().nullable().optional(),
  connected_by: z.string().uuid().nullable().optional(),
  access_token: z.string().nullable().optional(),
  refresh_token: z.string().nullable().optional(),
  token_expires_at: z.string().nullable().optional(),
  scopes: z.array(z.string()).nullable().optional(),
  gmail_label: z.string().default("Facturen/Inbox"),
});

/**
 * Upserten op email zodat opnieuw verbinden van dezelfde mailbox de
 * tokens en status ververst zonder duplicaat.
 */
export async function upsertMailAccount(input: MailAccountInsert) {
  const parsed = upsertSchema.parse(input);
  const admin = createServiceClient();
  const { data, error } = await admin
    .from("mail_accounts")
    .upsert(parsed, { onConflict: "email" })
    .select("id")
    .single();
  if (error) {
    throw new Error(`upsertMailAccount: ${error.message}`);
  }
  return data;
}

const updateSchema = z.object({
  id: z.string().uuid(),
  default_entity_id: z.string().uuid().nullable().optional(),
  display_name: z.string().nullable().optional(),
  gmail_label: z.string().optional(),
  status: z
    .enum(["verbonden", "herauth_nodig", "gepauzeerd", "ontkoppeld"])
    .optional(),
});

export async function updateMailAccount(
  input: z.input<typeof updateSchema>,
): Promise<void> {
  const { id, ...rest } = updateSchema.parse(input);
  const admin = createServiceClient();
  const { error } = await admin.from("mail_accounts").update(rest).eq("id", id);
  if (error) {
    throw new Error(`updateMailAccount: ${error.message}`);
  }
}

export async function setMailAccountStatus(
  id: string,
  status: MailAccountStatus,
): Promise<void> {
  await updateMailAccount({ id, status });
}
