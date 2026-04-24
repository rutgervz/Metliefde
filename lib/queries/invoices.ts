import { createClient } from "@/lib/supabase/server";
import type { InvoiceRow, InvoiceStatus, OwnerSphere } from "@/lib/types";

/**
 * De voor-de-inbox-lijst nodige velden. Houdt de payload klein op mobiel.
 */
export type InvoiceListItem = Pick<
  InvoiceRow,
  | "id"
  | "vendor_id"
  | "entity_id"
  | "invoice_number"
  | "invoice_date"
  | "due_date"
  | "amount_gross"
  | "currency"
  | "status"
  | "needs_review"
  | "requires_approval"
>;

export type InvoiceListFilters = {
  sphere?: OwnerSphere | "alle";
  query?: string;
  statusIn?: InvoiceStatus[];
  limit?: number;
};

/**
 * Stap 5/6 vullen deze lijst pas met data. Voor nu accepteren we de
 * filters al en geven we een lege array terug zodat de UI in de
 * tussentijd niet crasht.
 */
export async function listInboxInvoices(
  filters: InvoiceListFilters = {},
): Promise<InvoiceListItem[]> {
  const supabase = await createClient();

  let query = supabase
    .from("invoices")
    .select(
      "id, vendor_id, entity_id, invoice_number, invoice_date, due_date, amount_gross, currency, status, needs_review, requires_approval",
    )
    .order("invoice_date", { ascending: false, nullsFirst: false })
    .limit(filters.limit ?? 100);

  if (filters.statusIn && filters.statusIn.length > 0) {
    query = query.in("status", filters.statusIn);
  } else {
    query = query.not("status", "in", "(voldaan,gearchiveerd,afgewezen)");
  }

  if (filters.query && filters.query.length > 0) {
    // pg_trgm-indexen staan al klaar op invoice_number, expense_reason
    // en raw_text. Voorlopig zoeken we op factuurnummer; in Stap 12
    // breiden we dit uit met facetten en cross-table search.
    query = query.ilike("invoice_number", `%${filters.query}%`);
  }

  const { data } = await query;
  return data ?? [];
}
