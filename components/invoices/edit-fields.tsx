"use client";

import { useState, useTransition } from "react";
import { Loader2, Pencil, X, Check } from "lucide-react";
import { updateFieldsAction } from "@/app/(app)/factuur/[id]/actions";
import type { OwnerSphere } from "@/lib/types";

export type EntityOption = {
  id: string;
  name: string;
  color: string;
  owner_sphere: OwnerSphere;
};

export type EditableInvoice = {
  id: string;
  entity_id: string | null;
  expense_reason: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  due_date: string | null;
  amount_gross: number | null;
  amount_net: number | null;
  amount_vat: number | null;
  vat_rate: number | null;
  payment_reference: string | null;
  recipient_iban: string | null;
};

function nullableNumber(input: string): number | null {
  if (input.trim() === "") return null;
  const n = Number(input.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function nullableString(input: string): string | null {
  const t = input.trim();
  return t === "" ? null : t;
}

export function EditFields({
  invoice,
  entities,
}: {
  invoice: EditableInvoice;
  entities: EntityOption[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Lokale draft voor de form-staat. Reset bij openen.
  const [draft, setDraft] = useState({
    entity_id: invoice.entity_id ?? "",
    expense_reason: invoice.expense_reason ?? "",
    invoice_number: invoice.invoice_number ?? "",
    invoice_date: invoice.invoice_date ?? "",
    due_date: invoice.due_date ?? "",
    amount_gross: invoice.amount_gross !== null ? String(invoice.amount_gross) : "",
    amount_net: invoice.amount_net !== null ? String(invoice.amount_net) : "",
    amount_vat: invoice.amount_vat !== null ? String(invoice.amount_vat) : "",
    vat_rate: invoice.vat_rate !== null ? String(invoice.vat_rate) : "",
    payment_reference: invoice.payment_reference ?? "",
    recipient_iban: invoice.recipient_iban ?? "",
  });

  function openEditor() {
    setDraft({
      entity_id: invoice.entity_id ?? "",
      expense_reason: invoice.expense_reason ?? "",
      invoice_number: invoice.invoice_number ?? "",
      invoice_date: invoice.invoice_date ?? "",
      due_date: invoice.due_date ?? "",
      amount_gross: invoice.amount_gross !== null ? String(invoice.amount_gross) : "",
      amount_net: invoice.amount_net !== null ? String(invoice.amount_net) : "",
      amount_vat: invoice.amount_vat !== null ? String(invoice.amount_vat) : "",
      vat_rate: invoice.vat_rate !== null ? String(invoice.vat_rate) : "",
      payment_reference: invoice.payment_reference ?? "",
      recipient_iban: invoice.recipient_iban ?? "",
    });
    setError(null);
    setOpen(true);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      try {
        await updateFieldsAction({
          invoiceId: invoice.id,
          entity_id: draft.entity_id === "" ? null : draft.entity_id,
          expense_reason: nullableString(draft.expense_reason),
          invoice_number: nullableString(draft.invoice_number),
          invoice_date: nullableString(draft.invoice_date),
          due_date: nullableString(draft.due_date),
          amount_gross: nullableNumber(draft.amount_gross),
          amount_net: nullableNumber(draft.amount_net),
          amount_vat: nullableNumber(draft.amount_vat),
          vat_rate: nullableNumber(draft.vat_rate),
          payment_reference: nullableString(draft.payment_reference),
          recipient_iban: nullableString(draft.recipient_iban),
        });
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Opslaan mislukte.");
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={openEditor}
        className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--color-border)] px-2.5 py-1.5 text-xs text-[color:var(--color-muted-foreground)] hover:bg-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
      >
        <Pencil className="h-3.5 w-3.5" />
        Velden bewerken
      </button>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-[color:var(--color-primary)]/30 bg-[color:var(--color-primary-soft)]/20 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Velden bewerken</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Sluit editor"
          className="text-[color:var(--color-muted-foreground)] hover:text-[color:var(--color-foreground)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field label="Entiteit">
          <select
            value={draft.entity_id}
            onChange={(e) => setDraft((d) => ({ ...d, entity_id: e.target.value }))}
            className="w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-background)] px-2 py-1.5 text-sm"
          >
            <option value="">Niet toegewezen</option>
            {entities.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Factuurnummer">
          <input
            type="text"
            value={draft.invoice_number}
            onChange={(e) => setDraft((d) => ({ ...d, invoice_number: e.target.value }))}
            className="w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-background)] px-2 py-1.5 text-sm"
          />
        </Field>

        <Field label="Reden uitgave" full>
          <textarea
            value={draft.expense_reason}
            onChange={(e) => setDraft((d) => ({ ...d, expense_reason: e.target.value }))}
            rows={2}
            className="w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-background)] px-2 py-1.5 text-sm"
          />
        </Field>

        <Field label="Factuurdatum">
          <input
            type="date"
            value={draft.invoice_date}
            onChange={(e) => setDraft((d) => ({ ...d, invoice_date: e.target.value }))}
            className="w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-background)] px-2 py-1.5 text-sm"
          />
        </Field>

        <Field label="Vervaldatum">
          <input
            type="date"
            value={draft.due_date}
            onChange={(e) => setDraft((d) => ({ ...d, due_date: e.target.value }))}
            className="w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-background)] px-2 py-1.5 text-sm"
          />
        </Field>

        <Field label="Netto">
          <input
            type="text"
            inputMode="decimal"
            value={draft.amount_net}
            onChange={(e) => setDraft((d) => ({ ...d, amount_net: e.target.value }))}
            className="w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-background)] px-2 py-1.5 text-sm tabular-nums"
          />
        </Field>

        <Field label="BTW-bedrag">
          <input
            type="text"
            inputMode="decimal"
            value={draft.amount_vat}
            onChange={(e) => setDraft((d) => ({ ...d, amount_vat: e.target.value }))}
            className="w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-background)] px-2 py-1.5 text-sm tabular-nums"
          />
        </Field>

        <Field label="BTW-percentage">
          <input
            type="text"
            inputMode="decimal"
            value={draft.vat_rate}
            onChange={(e) => setDraft((d) => ({ ...d, vat_rate: e.target.value }))}
            placeholder="21"
            className="w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-background)] px-2 py-1.5 text-sm tabular-nums"
          />
        </Field>

        <Field label="Bruto totaal">
          <input
            type="text"
            inputMode="decimal"
            value={draft.amount_gross}
            onChange={(e) => setDraft((d) => ({ ...d, amount_gross: e.target.value }))}
            className="w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-background)] px-2 py-1.5 text-sm tabular-nums"
          />
        </Field>

        <Field label="Betaalkenmerk">
          <input
            type="text"
            value={draft.payment_reference}
            onChange={(e) => setDraft((d) => ({ ...d, payment_reference: e.target.value }))}
            className="w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-background)] px-2 py-1.5 text-sm"
          />
        </Field>

        <Field label="IBAN">
          <input
            type="text"
            value={draft.recipient_iban}
            onChange={(e) => setDraft((d) => ({ ...d, recipient_iban: e.target.value }))}
            className="w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-background)] px-2 py-1.5 text-sm tabular-nums"
          />
        </Field>
      </div>

      {error ? (
        <p className="text-xs text-[color:var(--color-status-afgewezen)]">{error}</p>
      ) : null}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={pending}
          className="rounded-md border border-[color:var(--color-border)] px-3 py-1.5 text-sm hover:bg-[color:var(--color-muted)]"
        >
          Annuleren
        </button>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-md bg-[color:var(--color-primary)] px-3 py-1.5 text-sm text-[color:var(--color-primary-foreground)] hover:bg-[color:var(--color-primary-hover)] disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Opslaan
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  full = false,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "md:col-span-2" : undefined}>
      <label className="mb-1 block text-xs text-[color:var(--color-muted-foreground)]">
        {label}
      </label>
      {children}
    </div>
  );
}
