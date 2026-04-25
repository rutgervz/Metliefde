"use client";

import { useState, useTransition } from "react";
import { Loader2, Tags, Check } from "lucide-react";
import { retagExistingInvoicesAction } from "@/app/(app)/instellingen/mailboxen/actions";

/**
 * Trigger om bestaande facturen zonder tags door Haiku te halen voor
 * tag-suggesties. Eenmalig nuttig nadat de tag-feature is uitgerold.
 */
export function RetagButton() {
  const [pending, startTransition] = useTransition();
  const [lastResult, setLastResult] = useState<string | null>(null);

  function onClick() {
    setLastResult(null);
    startTransition(async () => {
      try {
        const result = await retagExistingInvoicesAction();
        setLastResult(result.summary);
      } catch (err) {
        setLastResult(err instanceof Error ? err.message : "Hertaggen mislukte.");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--color-border)] px-2.5 py-1.5 text-xs text-[color:var(--color-muted-foreground)] hover:bg-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)] disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Tags className="h-3.5 w-3.5" />
        )}
        {pending ? "Hertaggen..." : "Hertag bestaande"}
      </button>
      {!pending && lastResult ? (
        <span className="inline-flex items-center gap-1 text-xs text-[color:var(--color-status-voldaan)]">
          <Check className="h-3.5 w-3.5" />
          {lastResult}
        </span>
      ) : null}
    </div>
  );
}
