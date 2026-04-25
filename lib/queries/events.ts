import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/database.types";

export type InvoiceEvent = {
  id: string;
  action: string;
  payload: Json;
  note: string | null;
  actor_label: string;
  created_at: string;
};

export async function listInvoiceEvents(invoiceId: string): Promise<InvoiceEvent[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("id, action, payload, note, actor_label, created_at")
    .eq("invoice_id", invoiceId)
    .order("created_at", { ascending: false });
  return (data as InvoiceEvent[] | null) ?? [];
}
