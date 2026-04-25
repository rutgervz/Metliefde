"use client";

import { useState, useTransition } from "react";
import { Loader2, RefreshCw, Check } from "lucide-react";
import { triggerMailboxSyncForId } from "@/app/(app)/instellingen/mailboxen/actions";

/**
 * Sync nu-knop met zichtbare loading-state. Toont een spinner tijdens
 * de Gmail-call (kan een paar seconden duren) en kort daarna een vinkje
 * met samenvatting zodat de gebruiker direct weet dat het werkte.
 */
export function SyncButton({ mailAccountId }: { mailAccountId: string }) {
  const [pending, startTransition] = useTransition();
  const [lastResult, setLastResult] = useState<string | null>(null);

  function onClick() {
    setLastResult(null);
    startTransition(async () => {
      try {
        const result = await triggerMailboxSyncForId(mailAccountId);
        setLastResult(result?.summary ?? "Sync klaar.");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Sync mislukte.";
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
        className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--color-primary)] px-2.5 py-1.5 text-xs text-[color:var(--color-primary)] hover:bg-[color:var(--color-primary-soft)] disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <RefreshCw className="h-3.5 w-3.5" />
        )}
        {pending ? "Syncen..." : "Sync nu"}
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
