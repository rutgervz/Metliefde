import { createClient } from "@/lib/supabase/server";
import type { InvoiceRow, InvoiceStatus, OwnerSphere } from "@/lib/types";

/**
 * De voor-de-inbox-lijst nodige velden, plus naam van leverancier en
 * entiteit voor weergave in de kanban-kaarten.
 */
export type InvoiceCardTag = { id: string; name: string; color: string };

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
  tags: InvoiceCardTag[];
};

export type InvoiceListFilters = {
  sphere?: OwnerSphere | "alle" | "samen";
  query?: string;
  statusIn?: InvoiceStatus[];
  tag?: string | null;
  limit?: number;
};

export type InvoiceDetail = InvoiceRow & {
  vendor: { id: string; name: string; email_domain: string | null } | null;
  entity:
    | {
        id: string;
        name: string;
        color: string;
        owner_sphere: OwnerSphere;
      }
    | null;
};

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
  invoice_tags: { tag: { id: string; name: string; color: string } | null }[] | null;
};

export async function getInvoiceById(id: string): Promise<InvoiceDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select(
      `*,
       vendor:vendors ( id, name, email_domain ),
       entity:entities ( id, name, color, owner_sphere )`,
    )
    .eq("id", id)
    .maybeSingle();
  return (data as unknown as InvoiceDetail | null) ?? null;
}

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
       entities ( name, color, owner_sphere ),
       invoice_tags ( tag:tags ( id, name, color ) )`,
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
  const items = rows.map((r) => ({
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
    tags: (r.invoice_tags ?? [])
      .map((it) => it.tag)
      .filter((t): t is InvoiceCardTag => t !== null),
  }));

  // Tag-filter doen we client-side want PostgREST kan join-filtering op
  // many-to-many lastig efficient uitdrukken zonder een view.
  if (filters.tag) {
    const wanted = filters.tag.toLowerCase();
    return items.filter((i) =>
      i.tags.some((t) => t.name.toLowerCase() === wanted),
    );
  }
  return items;
}
