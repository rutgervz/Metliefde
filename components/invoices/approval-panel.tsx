"use client";

import { useState, useTransition } from "react";
import { Loader2, Check, ShieldCheck } from "lucide-react";
import { approveInvoiceAction } from "@/app/(app)/factuur/[id]/actions";

export type ApprovalUser = {
  id: string;
  display_name: string;
};

export function ApprovalPanel({
  invoiceId,
  currentUserId,
  approvedBy,
  approvedAt,
  coApprovedBy,
  coApprovedAt,
  approvers,
}: {
  invoiceId: string;
  currentUserId: string;
  approvedBy: string | null;
  approvedAt: string | null;
  coApprovedBy: string | null;
  coApprovedAt: string | null;
  approvers: ApprovalUser[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [first, setFirst] = useState({ id: approvedBy, at: approvedAt });
  const [second, setSecond] = useState({ id: coApprovedBy, at: coApprovedAt });

  const userMap = new Map(approvers.map((a) => [a.id, a.display_name]));
  const isAlreadyApprover =
    first.id === currentUserId || second.id === currentUserId;
  const fullyApproved = first.id !== null && second.id !== null;

  function approve() {
    setError(null);
    setFeedback(null);
    startTransition(async () => {
      try {
        const result = await approveInvoiceAction({ invoiceId });
        setFeedback(result.message);
        // Lokaal bijwerken zodat de UI direct meedraait
        if (!first.id) {
          setFirst({ id: currentUserId, at: new Date().toISOString() });
        } else if (!second.id) {
          setSecond({ id: currentUserId, at: new Date().toISOString() });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Goedkeuren mislukte.");
      }
    });
  }

  function fmt(iso: string | null): string {
    if (!iso) return "";
    return new Date(iso).toLocaleString("nl-NL", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "Europe/Amsterdam",
    });
  }

  return (
    <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5">
      <div className="mb-3 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-[color:var(--color-primary)]" />
        <h2 className="text-base font-medium">Dubbele goedkeuring</h2>
      </div>

      <ul className="mb-4 space-y-1 text-sm">
        <li className="flex items-center gap-2">
          {first.id ? (
            <>
              <Check className="h-4 w-4 text-[color:var(--color-status-voldaan)]" />
              <span>
                Eerste goedkeuring door{" "}
                <span className="font-medium">
                  {userMap.get(first.id) ?? "onbekend"}
                </span>{" "}
                op {fmt(first.at)}
              </span>
            </>
          ) : (
            <span className="text-[color:var(--color-muted-foreground)]">
              Eerste goedkeuring nog niet gegeven
            </span>
          )}
        </li>
        <li className="flex items-center gap-2">
          {second.id ? (
            <>
              <Check className="h-4 w-4 text-[color:var(--color-status-voldaan)]" />
              <span>
                Tweede goedkeuring door{" "}
                <span className="font-medium">
                  {userMap.get(second.id) ?? "onbekend"}
                </span>{" "}
                op {fmt(second.at)}
              </span>
            </>
          ) : (
            <span className="text-[color:var(--color-muted-foreground)]">
              {first.id
                ? "Wacht op tweede goedkeuring door de partner"
                : "Tweede goedkeuring nog niet gegeven"}
            </span>
          )}
        </li>
      </ul>

      {!fullyApproved ? (
        <button
          type="button"
          onClick={approve}
          disabled={pending || isAlreadyApprover}
          className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--color-primary)] px-4 py-2 text-sm text-[color:var(--color-primary-foreground)] hover:bg-[color:var(--color-primary-hover)] disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShieldCheck className="h-4 w-4" />
          )}
          {isAlreadyApprover
            ? "Jij hebt al getekend"
            : first.id
              ? "Bevestigen als tweede"
              : "Eerste goedkeuring geven"}
        </button>
      ) : (
        <p className="text-sm text-[color:var(--color-status-voldaan)]">
          Volledig goedgekeurd.
        </p>
      )}

      {feedback ? (
        <p className="mt-2 text-xs text-[color:var(--color-muted-foreground)]">
          {feedback}
        </p>
      ) : null}
      {error ? (
        <p className="mt-2 text-xs text-[color:var(--color-status-afgewezen)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
