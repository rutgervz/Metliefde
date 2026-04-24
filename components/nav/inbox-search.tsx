"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

/**
 * Inline zoekveld op de inbox. Schrijft de term in ?q=... zodat de
 * URL deelbaar en bookmarkbaar is. Het feitelijke filteren op data
 * komt zodra er facturen zijn (Stap 5 en 6); de UI werkt nu al.
 */
export function InboxSearch({ initialValue }: { initialValue: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialValue);
  const [, startTransition] = useTransition();

  function update(next: string) {
    setValue(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next.trim()) {
      params.set("q", next.trim());
    } else {
      params.delete("q");
    }
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `/inbox?${qs}` : "/inbox", { scroll: false });
    });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    update(value);
  }

  return (
    <form
      role="search"
      onSubmit={onSubmit}
      className="flex items-center gap-2 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-2.5"
    >
      <Search className="h-4 w-4 shrink-0 text-[color:var(--color-muted-foreground)]" />
      <input
        type="search"
        value={value}
        onChange={(e) => update(e.target.value)}
        placeholder="Zoek op leverancier, bedrag, factuurnummer..."
        className="flex-1 bg-transparent text-sm placeholder:text-[color:var(--color-muted-foreground)] focus:outline-none"
        aria-label="Zoeken in inbox"
      />
      {value ? (
        <button
          type="button"
          onClick={() => update("")}
          aria-label="Zoekterm wissen"
          className="rounded-full p-1 text-[color:var(--color-muted-foreground)] hover:bg-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </form>
  );
}
