"use client";

import { useState, useTransition } from "react";
import { Loader2, Cog, Check } from "lucide-react";
import { processQueueNow } from "@/app/(app)/instellingen/mailboxen/actions";

/**
 * Knop om wachtende extract_invoice-jobs nu te verwerken in plaats
 * van wachten op de cron. Toont voortgang en samenvatting na afloop.
 */
export function ProcessJobsButton() {
  const [pending, startTransition] = useTransition();
  const [lastResult, setLastResult] = useState<string | null>(null);

  function onClick() {
    setLastResult(null);
    startTransition(async () => {
      try {
        const result = await processQueueNow();
        setLastResult(result.summary);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Verwerken mislukte.";
        setLastResult(message.slice(0, 200));
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
          <Cog className="h-3.5 w-3.5" />
        )}
        {pending ? "Verwerken..." : "Verwerk wachtende jobs"}
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
