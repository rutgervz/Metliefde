import { createClient } from "@/lib/supabase/server";

export type TagListItem = {
  id: string;
  name: string;
  color: string;
};

export async function listAllTags(): Promise<TagListItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tags")
    .select("id, name, color")
    .order("name", { ascending: true });
  return data ?? [];
}

export async function listInvoiceTags(invoiceId: string): Promise<TagListItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoice_tags")
    .select("tag:tags ( id, name, color )")
    .eq("invoice_id", invoiceId);
  type Row = { tag: TagListItem | null };
  const rows = (data ?? []) as unknown as Row[];
  return rows
    .map((r) => r.tag)
    .filter((t): t is TagListItem => t !== null)
    .sort((a, b) => a.name.localeCompare(b.name, "nl"));
}
