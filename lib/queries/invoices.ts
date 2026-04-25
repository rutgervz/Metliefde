import { createClient } from "@/lib/supabase/server";
import type { InvoiceRow, InvoiceStatus, OwnerSphere } from "@/lib/types";

/**
 * De voor-de-inbox-lijst nodige velden, plus naam van leverancier en
 * entiteit voor weergave in de kanban-kaarten.
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
  | "expense_reason"
> & {
  vendor_name: string | null;
  entity_name: string | null;
  entity_color: string | null;
  entity_owner_sphere: OwnerSphere | null;
};

export type InvoiceListFilters = {
  sphere?: OwnerSphere | "alle" | "samen";
  query?: string;
  statusIn?: InvoiceStatus[];
  limit?: number;
};

/**
 * Stap 5/6 vullen deze lijst pas met data. Voor nu accepteren we de
 * filters al en geven we een lege array terug zodat de UI in de
 * tussentijd niet crasht.
 */
type InvoiceJoinedRow = {
  id: string;
  vendor_id: string | null;
  entity_id: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  due_date: string | null;
  amount_gross: number | null;
  currency: string;
  status: InvoiceStatus;
  needs_review: boolean;
  requires_approval: boolean;
  expense_reason: string | null;
  vendors: { name: string } | null;
  entities: { name: string; color: string; owner_sphere: OwnerSphere } | null;
};

export async function listInboxInvoices(
  filters: InvoiceListFilters = {},
): Promise<InvoiceListItem[]> {
  const supabase = await createClient();

  let query = supabase
    .from("invoices")
    .select(
      `id, vendor_id, entity_id, invoice_number, invoice_date, due_date,
       amount_gross, currency, status, needs_review, requires_approval,
       expense_reason,
       vendors ( name ),
       entities ( name, color, owner_sphere )`,
    )
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("invoice_date", { ascending: false, nullsFirst: false })
    .limit(filters.limit ?? 200);

  if (filters.statusIn && filters.statusIn.length > 0) {
    query = query.in("status", filters.statusIn);
  } else {
    query = query.not("status", "in", "(voldaan,gearchiveerd,afgewezen)");
  }

  if (filters.sphere && filters.sphere !== "alle") {
    const sphere = filters.sphere === "samen" ? "gezamenlijk" : filters.sphere;
    query = query.filter("entities.owner_sphere", "eq", sphere);
  }

  if (filters.query && filters.query.length > 0) {
    const term = `%${filters.query}%`;
    query = query.or(
      `invoice_number.ilike.${term},expense_reason.ilike.${term}`,
    );
  }

  const { data } = await query;
  const rows = (data ?? []) as unknown as InvoiceJoinedRow[];
  return rows.map((r) => ({
    id: r.id,
    vendor_id: r.vendor_id,
    entity_id: r.entity_id,
    invoice_number: r.invoice_number,
    invoice_date: r.invoice_date,
    due_date: r.due_date,
    amount_gross: r.amount_gross,
    currency: r.currency,
    status: r.status,
    needs_review: r.needs_review,
    requires_approval: r.requires_approval,
    expense_reason: r.expense_reason,
    vendor_name: r.vendors?.name ?? null,
    entity_name: r.entities?.name ?? null,
    entity_color: r.entities?.color ?? null,
    entity_owner_sphere: r.entities?.owner_sphere ?? null,
  }));
}
