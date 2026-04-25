import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  AlertTriangle,
  Clock,
  ExternalLink,
  FileText,
} from "lucide-react";
import { getInvoiceById } from "@/lib/queries/invoices";
import { listAllTags, listInvoiceTags } from "@/lib/queries/tags";
import { listInvoiceNotes } from "@/lib/queries/invoice-notes";
import { listInvoiceEvents } from "@/lib/queries/events";
import { listActiveEntities } from "@/lib/queries/entities";
import { getAttachmentSignedUrl } from "@/lib/storage/invoices";
import { createClient } from "@/lib/supabase/server";
import { StatusActions } from "@/components/invoices/status-actions";
import { TagsManager } from "@/components/invoices/tags-manager";
import { NotesSection } from "@/components/invoices/notes-section";
import { AuditLog } from "@/components/invoices/audit-log";
import { EditFields } from "@/components/invoices/edit-fields";
import { ApprovalPanel } from "@/components/invoices/approval-panel";
import type { InvoiceStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const NUMBER = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  binnengekomen: "Binnengekomen",
  te_beoordelen: "Te beoordelen",
  goedgekeurd: "Goedgekeurd",
  klaar_voor_betaling: "Klaar voor betaling",
  voldaan: "Voldaan",
  afgewezen: "Afgewezen",
  betwist: "Betwist",
  on_hold: "On hold",
  gearchiveerd: "Gearchiveerd",
};

const STATUS_TONE: Record<InvoiceStatus, string> = {
  binnengekomen:
    "border-[color:var(--color-status-binnengekomen)] text-[color:var(--color-status-binnengekomen)]",
  te_beoordelen:
    "border-[color:var(--color-status-te-beoordelen)] text-[color:var(--color-status-te-beoordelen)]",
  goedgekeurd:
    "border-[color:var(--color-status-goedgekeurd)] text-[color:var(--color-status-goedgekeurd)]",
  klaar_voor_betaling:
    "border-[color:var(--color-status-klaar)] text-[color:var(--color-status-klaar)]",
  voldaan:
    "border-[color:var(--color-status-voldaan)] text-[color:var(--color-status-voldaan)]",
  afgewezen:
    "border-[color:var(--color-status-afgewezen)] text-[color:var(--color-status-afgewezen)]",
  betwist:
    "border-[color:var(--color-status-betwist)] text-[color:var(--color-status-betwist)]",
  on_hold:
    "border-[color:var(--color-status-on-hold)] text-[color:var(--color-status-on-hold)]",
  gearchiveerd:
    "border-[color:var(--color-muted-foreground)] text-[color:var(--color-muted-foreground)]",
};

function formatDate(date: string | null): string {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function describeDueDate(due: string | null) {
  if (!due) return null;
  const date = new Date(due);
  if (isNaN(date.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const days = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const formatted = formatDate(due);
  if (days < 0) {
    return {
      label: `${Math.abs(days)} dagen over - betalen voor ${formatted}`,
      tone: "verstreken" as const,
    };
  }
  if (days === 0) return { label: `Betalen vandaag (${formatted})`, tone: "urgent" as const };
  if (days === 1) return { label: `Betalen morgen (${formatted})`, tone: "urgent" as const };
  if (days <= 7) return { label: `Betalen binnen ${days} dagen (${formatted})`, tone: "urgent" as const };
  if (days <= 21) return { label: `Betalen voor ${formatted}`, tone: "binnenkort" as const };
  return { label: `Betalen voor ${formatted}`, tone: "rustig" as const };
}

const DUE_TONE_CLASS = {
  verstreken:
    "border-[color:var(--color-status-afgewezen)] bg-[color:var(--color-status-afgewezen)]/10 text-[color:var(--color-status-afgewezen)]",
  urgent:
    "border-[color:var(--color-primary)] bg-[color:var(--color-primary-soft)] text-[color:var(--color-primary)]",
  binnenkort: "border-[color:var(--color-border)] bg-[color:var(--color-muted)]",
  rustig: "border-[color:var(--color-border)] bg-[color:var(--color-muted)]",
} as const;

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getInvoiceById(id);
  if (!invoice) notFound();

  const due = describeDueDate(invoice.due_date);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [signedUrl, allTags, currentTags, notes, events, entities] =
    await Promise.all([
      invoice.storage_path
        ? getAttachmentSignedUrl(invoice.storage_path, 60 * 30)
        : Promise.resolve(null),
      listAllTags(),
      listInvoiceTags(invoice.id),
      listInvoiceNotes(invoice.id),
      listInvoiceEvents(invoice.id),
      listActiveEntities(),
    ]);

  // Approver-namen ophalen voor het approval-paneel.
  const approverIds = [invoice.approved_by, invoice.co_approved_by].filter(
    (id): id is string => id !== null,
  );
  let approvers: { id: string; display_name: string }[] = [];
  if (approverIds.length > 0) {
    const { data } = await supabase
      .from("users")
      .select("id, display_name")
      .in("id", approverIds);
    approvers = data ?? [];
  }

  const grossLabel =
    invoice.amount_gross !== null ? NUMBER.format(Number(invoice.amount_gross)) : "—";
  const netLabel =
    invoice.amount_net !== null ? NUMBER.format(Number(invoice.amount_net)) : "—";
  const vatLabel =
    invoice.amount_vat !== null ? NUMBER.format(Number(invoice.amount_vat)) : "—";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 md:px-8 md:py-10">
      <Link
        href="/inbox"
        className="inline-flex items-center gap-1 text-sm text-[color:var(--color-muted-foreground)] hover:text-[color:var(--color-foreground)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Inbox
      </Link>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={cn(
              "inline-flex items-center rounded-full border bg-[color:var(--color-surface)] px-3 py-1 text-xs",
              STATUS_TONE[invoice.status],
            )}
          >
            {STATUS_LABEL[invoice.status]}
          </span>
          {invoice.needs_review ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--color-status-betwist)]/15 px-3 py-1 text-xs text-[color:var(--color-status-betwist)]">
              <AlertTriangle className="h-3.5 w-3.5" />
              Te beoordelen
            </span>
          ) : null}
        </div>
        <div>
          <h1 className="text-3xl">{invoice.vendor?.name ?? "Onbekende leverancier"}</h1>
          {invoice.invoice_number ? (
            <p className="text-sm text-[color:var(--color-muted-foreground)]">
              Factuur {invoice.invoice_number}
            </p>
          ) : null}
        </div>
      </header>

      <section className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
        <p className="font-serif text-5xl">{grossLabel}</p>
        {due ? (
          <div
            className={cn(
              "mt-3 inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm",
              DUE_TONE_CLASS[due.tone],
            )}
          >
            {due.tone === "verstreken" ? (
              <AlertTriangle className="h-4 w-4 shrink-0" />
            ) : (
              <Clock className="h-4 w-4 shrink-0" />
            )}
            {due.label}
          </div>
        ) : (
          <p className="mt-3 text-sm text-[color:var(--color-muted-foreground)]">
            Geen vervaldatum bekend.
          </p>
        )}
      </section>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <StatusActions invoiceId={invoice.id} currentStatus={invoice.status} />
        <EditFields
          invoice={{
            id: invoice.id,
            entity_id: invoice.entity_id,
            expense_reason: invoice.expense_reason,
            invoice_number: invoice.invoice_number,
            invoice_date: invoice.invoice_date,
            due_date: invoice.due_date,
            amount_gross:
              invoice.amount_gross !== null ? Number(invoice.amount_gross) : null,
            amount_net:
              invoice.amount_net !== null ? Number(invoice.amount_net) : null,
            amount_vat:
              invoice.amount_vat !== null ? Number(invoice.amount_vat) : null,
            vat_rate: invoice.vat_rate !== null ? Number(invoice.vat_rate) : null,
            payment_reference: invoice.payment_reference,
            recipient_iban: invoice.recipient_iban,
          }}
          entities={entities.map((e) => ({
            id: e.id,
            name: e.name,
            color: e.color,
            owner_sphere: e.owner_sphere,
          }))}
        />
      </div>

      {invoice.requires_approval && user ? (
        <ApprovalPanel
          invoiceId={invoice.id}
          currentUserId={user.id}
          approvedBy={invoice.approved_by}
          approvedAt={invoice.approved_at}
          coApprovedBy={invoice.co_approved_by}
          coApprovedAt={invoice.co_approved_at}
          approvers={approvers}
        />
      ) : null}

      <section className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5">
        <h2 className="mb-3 text-base font-medium">Toewijzing</h2>
        <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <dt className="text-xs text-[color:var(--color-muted-foreground)]">
              Entiteit
            </dt>
            <dd className="mt-0.5 flex items-center gap-2 text-sm">
              {invoice.entity ? (
                <>
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: invoice.entity.color }}
                  />
                  {invoice.entity.name}
                </>
              ) : (
                <span className="text-[color:var(--color-muted-foreground)]">
                  Niet toegewezen
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[color:var(--color-muted-foreground)]">
              Reden uitgave
            </dt>
            <dd className="mt-0.5 text-sm">
              {invoice.expense_reason ?? "—"}
            </dd>
          </div>
        </dl>
        <div className="mt-4 border-t border-[color:var(--color-border)] pt-4">
          <p className="mb-2 text-xs text-[color:var(--color-muted-foreground)]">
            Tags
          </p>
          <TagsManager
            invoiceId={invoice.id}
            current={currentTags}
            available={allTags}
          />
        </div>
      </section>

      <section className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5">
        <h2 className="mb-3 text-base font-medium">Bedragen</h2>
        <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div>
            <dt className="text-xs text-[color:var(--color-muted-foreground)]">Netto</dt>
            <dd className="text-sm tabular-nums">{netLabel}</dd>
          </div>
          <div>
            <dt className="text-xs text-[color:var(--color-muted-foreground)]">
              BTW {invoice.vat_rate !== null ? `(${invoice.vat_rate}%)` : ""}
            </dt>
            <dd className="text-sm tabular-nums">{vatLabel}</dd>
          </div>
          <div>
            <dt className="text-xs text-[color:var(--color-muted-foreground)]">Bruto</dt>
            <dd className="text-sm tabular-nums">{grossLabel}</dd>
          </div>
          <div>
            <dt className="text-xs text-[color:var(--color-muted-foreground)]">Valuta</dt>
            <dd className="text-sm">{invoice.currency}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5">
        <h2 className="mb-3 text-base font-medium">Datums en betaling</h2>
        <dl className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <dt className="text-xs text-[color:var(--color-muted-foreground)]">
              Factuurdatum
            </dt>
            <dd className="text-sm">{formatDate(invoice.invoice_date)}</dd>
          </div>
          <div>
            <dt className="text-xs text-[color:var(--color-muted-foreground)]">
              Vervaldatum
            </dt>
            <dd className="text-sm">{formatDate(invoice.due_date)}</dd>
          </div>
          <div>
            <dt className="text-xs text-[color:var(--color-muted-foreground)]">
              Betaalkenmerk
            </dt>
            <dd className="break-all text-sm">
              {invoice.payment_reference ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[color:var(--color-muted-foreground)]">IBAN</dt>
            <dd className="break-all text-sm">{invoice.recipient_iban ?? "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-base font-medium">Originele bijlage</h2>
          {signedUrl ? (
            <a
              href={signedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-[color:var(--color-primary)] hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Open in nieuw tabblad
            </a>
          ) : null}
        </div>
        {signedUrl ? (
          invoice.original_mime_type === "application/pdf" ? (
            <iframe
              src={signedUrl}
              title={invoice.original_filename ?? "Factuur PDF"}
              className="h-[60vh] w-full rounded-md border border-[color:var(--color-border)] bg-white"
            />
          ) : (
            <a
              href={signedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-muted)] px-3 py-2 text-sm hover:bg-[color:var(--color-background)]"
            >
              <FileText className="h-4 w-4" />
              {invoice.original_filename ?? "Bekijk bijlage"}
            </a>
          )
        ) : (
          <p className="text-sm text-[color:var(--color-muted-foreground)]">
            Geen bijlage gevonden.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5">
        <h2 className="mb-3 text-base font-medium">Notities</h2>
        {user ? (
          <NotesSection
            invoiceId={invoice.id}
            initialNotes={notes}
            currentUserId={user.id}
          />
        ) : null}
      </section>

      <details className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5">
        <summary className="cursor-pointer text-base font-medium">
          Activiteit ({events.length})
        </summary>
        <div className="mt-4">
          <AuditLog events={events} />
        </div>
      </details>

      <section className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 text-xs text-[color:var(--color-muted-foreground)]">
        Geextraheerd door {invoice.extracted_by}
        {invoice.extraction_confidence !== null
          ? ` met confidence ${Math.round(Number(invoice.extraction_confidence) * 100)}%`
          : ""}
        {invoice.gmail_message_id ? ` · Gmail-id ${invoice.gmail_message_id}` : ""}
      </section>
    </div>
  );
}
