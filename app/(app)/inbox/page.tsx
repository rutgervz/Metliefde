import { SphereFilter, parseSphere } from "@/components/nav/sphere-filter";
import { InboxSearch } from "@/components/nav/inbox-search";
import { InvoiceCard } from "@/components/invoices/invoice-card";
import { listInboxInvoices, type InvoiceListItem } from "@/lib/queries/invoices";
import type { InvoiceStatus } from "@/lib/types";

const KANBAN_COLUMNS: Array<{ key: InvoiceStatus; label: string }> = [
  { key: "binnengekomen", label: "Binnengekomen" },
  { key: "te_beoordelen", label: "Te beoordelen" },
  { key: "goedgekeurd", label: "Goedgekeurd" },
  { key: "klaar_voor_betaling", label: "Klaar voor betaling" },
  { key: "betwist", label: "Betwist" },
  { key: "on_hold", label: "On hold" },
];

const VISIBLE_STATUSES = KANBAN_COLUMNS.map((c) => c.key);

const FORMATTER = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ sfeer?: string; q?: string }>;
}) {
  const params = await searchParams;
  const sphere = parseSphere(params.sfeer);
  const query = params.q?.trim() ?? "";

  const invoices = await listInboxInvoices({
    sphere,
    query,
    statusIn: VISIBLE_STATUSES,
    limit: 300,
  });

  const grouped = KANBAN_COLUMNS.reduce<Record<InvoiceStatus, InvoiceListItem[]>>(
    (acc, col) => {
      acc[col.key] = invoices.filter((inv) => inv.status === col.key);
      return acc;
    },
    {} as Record<InvoiceStatus, InvoiceListItem[]>,
  );

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 md:px-8 md:py-10">
      <header className="space-y-1">
        <h1 className="text-3xl">Inbox</h1>
        <p className="text-sm text-[color:var(--color-muted-foreground)]">
          {invoices.length} factuur{invoices.length === 1 ? "" : "en"} wachten op een beslissing.
        </p>
      </header>

      <div className="space-y-3">
        <InboxSearch initialValue={query} />
        <SphereFilter basePath="/inbox" active={sphere} />
      </div>

      <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
        <div className="grid min-w-max grid-flow-col auto-cols-[18rem] gap-3 md:auto-cols-[20rem]">
          {KANBAN_COLUMNS.map((column) => {
            const items = grouped[column.key];
            const totalAmount = items.reduce(
              (sum, i) => sum + (i.amount_gross ?? 0),
              0,
            );
            return (
              <div
                key={column.key}
                className="flex flex-col gap-3 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-muted)] p-3"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium">{column.label}</h2>
                  <span className="text-xs text-[color:var(--color-muted-foreground)]">
                    {items.length}
                    {totalAmount > 0
                      ? ` · ${FORMATTER.format(totalAmount)}`
                      : ""}
                  </span>
                </div>

                {items.length === 0 ? (
                  <p className="rounded-md border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 text-center text-xs text-[color:var(--color-muted-foreground)]">
                    Leeg
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {items.map((invoice) => (
                      <li key={invoice.id}>
                        <InvoiceCard invoice={invoice} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
