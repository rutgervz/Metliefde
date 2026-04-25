"use client";

import { useState, useTransition } from "react";
import { Loader2, ChevronDown, Check } from "lucide-react";
import { changeStatusAction } from "@/app/(app)/factuur/[id]/actions";
import type { InvoiceStatus, InvoiceStatusReason } from "@/lib/types";
import { cn } from "@/lib/utils";

type Action = {
  to: InvoiceStatus;
  label: string;
  primary?: boolean;
  needsReason?: boolean;
  needsNote?: boolean;
};

const TRANSITIONS: Record<InvoiceStatus, Action[]> = {
  binnengekomen: [
    { to: "goedgekeurd", label: "Goedkeuren", primary: true },
    { to: "te_beoordelen", label: "Te beoordelen" },
    { to: "afgewezen", label: "Afwijzen", needsReason: true },
    { to: "betwist", label: "Betwisten", needsReason: true },
    { to: "on_hold", label: "On hold", needsNote: true },
  ],
  te_beoordelen: [
    { to: "goedgekeurd", label: "Goedkeuren", primary: true },
    { to: "afgewezen", label: "Afwijzen", needsReason: true },
    { to: "betwist", label: "Betwisten", needsReason: true },
    { to: "on_hold", label: "On hold", needsNote: true },
  ],
  goedgekeurd: [
    { to: "klaar_voor_betaling", label: "Klaarzetten voor betaling", primary: true },
    { to: "te_beoordelen", label: "Terug naar beoordelen" },
    { to: "betwist", label: "Betwisten", needsReason: true },
    { to: "on_hold", label: "On hold", needsNote: true },
  ],
  klaar_voor_betaling: [
    { to: "voldaan", label: "Markeer als voldaan", primary: true },
    { to: "goedgekeurd", label: "Terug naar goedgekeurd" },
    { to: "betwist", label: "Betwisten", needsReason: true },
  ],
  voldaan: [
    { to: "gearchiveerd", label: "Archiveren", primary: true },
    { to: "betwist", label: "Heropen voor betwisting", needsReason: true },
  ],
  afgewezen: [
    { to: "gearchiveerd", label: "Archiveren", primary: true },
    { to: "betwist", label: "Heropen", needsReason: true },
  ],
  betwist: [
    { to: "goedgekeurd", label: "Akkoord, goedkeuren" },
    { to: "afgewezen", label: "Afwijzen", needsReason: true },
    { to: "voldaan", label: "Markeer als voldaan" },
    { to: "on_hold", label: "On hold", needsNote: true },
  ],
  on_hold: [
    { to: "te_beoordelen", label: "Terug naar inbox", primary: true },
    { to: "goedgekeurd", label: "Goedkeuren" },
    { to: "klaar_voor_betaling", label: "Klaarzetten voor betaling" },
    { to: "voldaan", label: "Voldaan" },
    { to: "afgewezen", label: "Afwijzen", needsReason: true },
    { to: "betwist", label: "Betwisten", needsReason: true },
  ],
  gearchiveerd: [{ to: "betwist", label: "Heropenen voor betwisting", needsReason: true }],
};

const REASON_OPTIONS: Array<{ value: InvoiceStatusReason; label: string }> = [
  { value: "dubbele_factuur", label: "Dubbele factuur" },
  { value: "bedrag_klopt_niet", label: "Bedrag klopt niet" },
  { value: "dienst_niet_geleverd", label: "Dienst niet geleverd" },
  { value: "kwaliteit_onder_maat", label: "Kwaliteit onder maat" },
  { value: "verkeerde_adressering", label: "Verkeerde adressering" },
  { value: "onverwachte_verhoging", label: "Onverwachte verhoging" },
  { value: "geen_overeenkomst", label: "Geen overeenkomst" },
  { value: "wachten_op_creditnota", label: "Wachten op creditnota" },
  { value: "contract_opgezegd", label: "Contract opgezegd" },
  { value: "overig", label: "Overig" },
];

export function StatusActions({
  invoiceId,
  currentStatus,
}: {
  invoiceId: string;
  currentStatus: InvoiceStatus;
}) {
  const transitions = TRANSITIONS[currentStatus] ?? [];
  const primary = transitions.find((t) => t.primary);
  const others = transitions.filter((t) => !t.primary);

  const [pending, startTransition] = useTransition();
  const [openMenu, setOpenMenu] = useState(false);
  const [modalAction, setModalAction] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);

  function run(action: Action, reason?: InvoiceStatusReason, note?: string) {
    setError(null);
    startTransition(async () => {
      try {
        await changeStatusAction({ invoiceId, toStatus: action.to, reason, note });
        setModalAction(null);
        setOpenMenu(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Mislukt.");
      }
    });
  }

  function onActionClick(action: Action) {
    if (action.needsReason || action.needsNote) {
      setModalAction(action);
      setOpenMenu(false);
    } else {
      run(action);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {primary ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => onActionClick(primary)}
            className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--color-primary)] px-4 py-2 text-sm text-[color:var(--color-primary-foreground)] hover:bg-[color:var(--color-primary-hover)] disabled:opacity-60"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {primary.label}
          </button>
        ) : null}

        {others.length > 0 ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu((v) => !v)}
              disabled={pending}
              className="inline-flex items-center gap-1 rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm text-[color:var(--color-foreground)] hover:bg-[color:var(--color-muted)]"
            >
              Anders <ChevronDown className="h-4 w-4" />
            </button>
            {openMenu ? (
              <ul className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-lg">
                {others.map((action) => (
                  <li key={action.to}>
                    <button
                      type="button"
                      onClick={() => onActionClick(action)}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-[color:var(--color-muted)]"
                    >
                      {action.label}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="mt-2 rounded-md border border-[color:var(--color-status-afgewezen)] bg-[color:var(--color-muted)] p-2 text-xs text-[color:var(--color-status-afgewezen)]">
          {error}
        </p>
      ) : null}

      {modalAction ? (
        <ReasonModal
          action={modalAction}
          pending={pending}
          onSubmit={(reason, note) => run(modalAction, reason, note)}
          onClose={() => setModalAction(null)}
        />
      ) : null}
    </>
  );
}

function ReasonModal({
  action,
  pending,
  onSubmit,
  onClose,
}: {
  action: Action;
  pending: boolean;
  onSubmit: (reason: InvoiceStatusReason | undefined, note: string | undefined) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<InvoiceStatusReason>(REASON_OPTIONS[0].value);
  const [note, setNote] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 md:items-center">
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5">
        <h2 className="text-xl">{action.label}</h2>
        {action.needsReason ? (
          <div className="space-y-1">
            <label className="text-xs text-[color:var(--color-muted-foreground)]">
              Reden
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as InvoiceStatusReason)}
              className="w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-background)] px-2 py-1.5 text-sm"
            >
              {REASON_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <div className="space-y-1">
          <label className="text-xs text-[color:var(--color-muted-foreground)]">
            {action.needsNote ? "Wat verwacht je?" : "Toelichting (optioneel)"}
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder={
              action.needsNote
                ? "Bijvoorbeeld: wachten op creditnota van leverancier"
                : "Korte toelichting"
            }
            className="w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-background)] px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-md border border-[color:var(--color-border)] px-3 py-1.5 text-sm hover:bg-[color:var(--color-muted)]"
          >
            Annuleren
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              onSubmit(action.needsReason ? reason : undefined, note || undefined)
            }
            className={cn(
              "inline-flex items-center gap-1 rounded-md bg-[color:var(--color-primary)] px-3 py-1.5 text-sm text-[color:var(--color-primary-foreground)] hover:bg-[color:var(--color-primary-hover)] disabled:opacity-60",
            )}
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Bevestigen
          </button>
        </div>
      </div>
    </div>
  );
}
