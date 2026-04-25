import { createClient } from "@/lib/supabase/server";

export type InvoiceNote = {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  author_name: string;
};

type Row = {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  author: { display_name: string } | null;
};

export async function listInvoiceNotes(invoiceId: string): Promise<InvoiceNote[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoice_notes")
    .select("id, content, created_at, author_id, author:users(display_name)")
    .eq("invoice_id", invoiceId)
    .order("created_at", { ascending: true });
  const rows = (data ?? []) as unknown as Row[];
  return rows.map((r) => ({
    id: r.id,
    content: r.content,
    created_at: r.created_at,
    author_id: r.author_id,
    author_name: r.author?.display_name ?? "Onbekend",
  }));
}
