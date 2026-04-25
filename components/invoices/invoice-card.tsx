import Link from "next/link";
import { AlertTriangle, Clock } from "lucide-react";
import type { InvoiceListItem } from "@/lib/queries/invoices";
import { cn } from "@/lib/utils";

const NUMBER = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

function dayDiff(target: Date, now = new Date()): number {
  const ms = target.getTime() - now.setHours(0, 0, 0, 0);
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

type DueState = {
  label: string;
  tone: "verstreken" | "urgent" | "binnenkort" | "rustig" | "geen";
};

function describeDueDate(due: string | null): DueState {
  if (!due) return { label: "Geen vervaldatum", tone: "geen" };
  const date = new Date(due);
  if (isNaN(date.getTime())) return { label: "Geen vervaldatum", tone: "geen" };
  const days = dayDiff(date);
  const formatted = date.toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
  });
  if (days < 0) {
    return {
      label: `${Math.abs(days)} dagen over - betalen voor ${formatted}`,
      tone: "verstreken",
    };
  }
  if (days === 0) return { label: `Betalen vandaag (${formatted})`, tone: "urgent" };
  if (days === 1) return { label: `Betalen morgen (${formatted})`, tone: "urgent" };
  if (days <= 7) return { label: `Betalen binnen ${days} dagen (${formatted})`, tone: "urgent" };
  if (days <= 21) return { label: `Betalen voor ${formatted}`, tone: "binnenkort" };
  return { label: `Betalen voor ${formatted}`, tone: "rustig" };
}

const DUE_TONE_CLASS: Record<DueState["tone"], string> = {
  verstreken:
    "bg-[color:var(--color-status-afgewezen)]/15 text-[color:var(--color-status-afgewezen)]",
  urgent:
    "bg-[color:var(--color-primary-soft)] text-[color:var(--color-primary)]",
  binnenkort:
    "bg-[color:var(--color-muted)] text-[color:var(--color-foreground)]",
  rustig: "bg-[color:var(--color-muted)] text-[color:var(--color-muted-foreground)]",
  geen: "bg-[color:var(--color-muted)] text-[color:var(--color-muted-foreground)]",
};

export function InvoiceCard({ invoice }: { invoice: InvoiceListItem }) {
  const due = describeDueDate(invoice.due_date);
  const amount =
    invoice.amount_gross !== null ? NUMBER.format(invoice.amount_gross) : "—";

  return (
    <Link
      href={`/factuur/${invoice.id}`}
      className="block space-y-2 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3 text-sm transition-colors hover:border-[color:var(--color-primary)] hover:bg-[color:var(--color-primary-soft)]/30">
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="truncate text-sm">
            {invoice.vendor_name ?? "Onbekende leverancier"}
          </p>
          {invoice.invoice_number ? (
            <p className="truncate text-xs text-[color:var(--color-muted-foreground)]">
              {invoice.invoice_number}
            </p>
          ) : null}
        </div>
        <span className="shrink-0 font-medium tabular-nums">{amount}</span>
      </header>

      <div
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs",
          DUE_TONE_CLASS[due.tone],
        )}
      >
        {due.tone === "verstreken" ? (
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <Clock className="h-3.5 w-3.5 shrink-0" />
        )}
        <span className="truncate">{due.label}</span>
      </div>

      <footer className="flex flex-wrap items-center gap-2 text-xs">
        {invoice.entity_name && invoice.entity_color ? (
          <span className="inline-flex items-center gap-1.5 text-[color:var(--color-muted-foreground)]">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: invoice.entity_color }}
            />
            {invoice.entity_name}
          </span>
        ) : (
          <span className="text-[color:var(--color-muted-foreground)]">
            Geen entiteit
          </span>
        )}
        {invoice.needs_review ? (
          <span className="rounded-full bg-[color:var(--color-status-betwist)]/15 px-2 py-0.5 text-[color:var(--color-status-betwist)]">
            Te beoordelen
          </span>
        ) : null}
      </footer>
    </Link>
  );
}
