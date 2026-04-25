import { createClient } from "@/lib/supabase/server";
import type { MailAccountRow } from "@/lib/types";

/**
 * Velden die we tonen in de mailbox-lijst. Tokens en raw error-tekst
 * laten we bewust weg uit deze projection.
 */
export type MailAccountListItem = Pick<
  MailAccountRow,
  | "id"
  | "email"
  | "display_name"
  | "provider"
  | "status"
  | "default_entity_id"
  | "gmail_label"
  | "last_synced_at"
  | "last_error"
  | "last_sync_summary"
>;

export async function listMailAccounts(): Promise<MailAccountListItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mail_accounts")
    .select(
      "id, email, display_name, provider, status, default_entity_id, gmail_label, last_synced_at, last_error, last_sync_summary",
    )
    .neq("status", "ontkoppeld")
    .order("created_at", { ascending: true });
  return data ?? [];
}
