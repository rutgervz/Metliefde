"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { setMailAccountDefaultEntityForId } from "@/app/(app)/instellingen/mailboxen/actions";

type EntityOption = {
  id: string;
  name: string;
};

/**
 * Auto-save dropdown voor de default-entiteit van een mailbox. Schrijft
 * direct bij selectie weg via een server action en toont kort een
 * bevestigingsvinkje. Geen apart opslaan-knop nodig.
 */
export function EntityPicker({
  mailAccountId,
  current,
  entities,
}: {
  mailAccountId: string;
  current: string | null;
  entities: EntityOption[];
}) {
  const [value, setValue] = useState<string>(current ?? "");
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function onChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value;
    setValue(next);
    startTransition(async () => {
      try {
        await setMailAccountDefaultEntityForId(
          mailAccountId,
          next === "" ? null : next,
        );
        setSavedAt(Date.now());
      } catch (err) {
        console.error("opslaan mislukte", err);
      }
    });
  }

  const showSaved = savedAt !== null && Date.now() - savedAt < 2000;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label
        htmlFor={`entity-${mailAccountId}`}
        className="text-xs text-[color:var(--color-muted-foreground)]"
      >
        Default-entiteit
      </label>
      <select
        id={`entity-${mailAccountId}`}
        value={value}
        onChange={onChange}
        disabled={pending}
        className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2 py-1.5 text-sm disabled:opacity-60"
      >
        <option value="">Geen</option>
        {entities.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
          </option>
        ))}
      </select>
      {pending ? (
        <Loader2
          className="h-3.5 w-3.5 animate-spin text-[color:var(--color-muted-foreground)]"
          aria-hidden="true"
        />
      ) : showSaved ? (
        <span className="inline-flex items-center gap-1 text-xs text-[color:var(--color-status-voldaan)]">
          <Check className="h-3.5 w-3.5" />
          Opgeslagen
        </span>
      ) : null}
    </div>
  );
}
