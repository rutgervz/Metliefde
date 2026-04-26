"use client";

import { useMemo, useState, useTransition } from "react";
import { Tag as TagIcon, X, Plus, Loader2, Sparkles } from "lucide-react";
import {
  addTagToInvoiceAction,
  removeTagFromInvoiceAction,
} from "@/app/(app)/factuur/[id]/actions";
import { cn } from "@/lib/utils";

export type TagOption = { id: string; name: string; color: string };

// Veelvoorkomende tags voor Nederlandse boekhouding plus categorieen.
// Worden getoond als snel-toe-te-voegen suggesties boven de input.
const SUGGESTED_TAG_NAMES = [
  "Software",
  "Telecom",
  "Internet",
  "Hosting",
  "Domeinregistratie",
  "Reis",
  "Brandstof",
  "Parkeren",
  "Verzekering",
  "Onderhoud",
  "Kantoorartikelen",
  "Eten en drinken",
  "Representatie",
  "Drukwerk",
  "Boekhouding",
  "Advies",
  "Energie",
  "Water",
  "BTW aftrekbaar",
  "BTW 21%",
  "BTW 9%",
  "BTW 0%",
  "Investering",
  "Terugkerend abonnement",
  "Verzamelfactuur",
  "Doorbelasten",
  "Buitenland",
  "Privé",
  "Zakelijk",
];

export function TagsManager({
  invoiceId,
  current,
  available,
  smartSuggestions = [],
}: {
  invoiceId: string;
  current: TagOption[];
  available: TagOption[];
  smartSuggestions?: string[];
}) {
  const [tags, setTags] = useState<TagOption[]>(current);
  const [input, setInput] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const taken = useMemo(
    () => new Set(tags.map((t) => t.name.toLowerCase())),
    [tags],
  );
  const trimmed = input.trim();
  const lower = trimmed.toLowerCase();
  const matches = useMemo(
    () =>
      available
        .filter((t) => !taken.has(t.name.toLowerCase()))
        .filter((t) => (trimmed ? t.name.toLowerCase().includes(lower) : true))
        .slice(0, 6),
    [available, taken, trimmed, lower],
  );
  const exactExists =
    available.some((t) => t.name.toLowerCase() === lower) ||
    tags.some((t) => t.name.toLowerCase() === lower);
  const showCreate = trimmed.length > 0 && !exactExists;

  // Slimme suggesties: tags die op andere facturen van deze leverancier
  // staan, ontdubbeld en zonder de al toegevoegde.
  const smart = useMemo(
    () =>
      smartSuggestions.filter((name) => !taken.has(name.toLowerCase())).slice(0, 8),
    [smartSuggestions, taken],
  );

  // Algemene boekhoud-conventies als tweede laag, exclusief wat al getoond is.
  const generic = useMemo(() => {
    const usedSet = new Set([
      ...taken,
      ...smart.map((s) => s.toLowerCase()),
    ]);
    return SUGGESTED_TAG_NAMES.filter(
      (name) => !usedSet.has(name.toLowerCase()),
    ).slice(0, 12);
  }, [taken, smart]);

  function addByName(name: string) {
    const value = name.trim();
    if (!value) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await addTagToInvoiceAction({ invoiceId, name: value });
        if (result) {
          // Probeer kleur uit available te halen, anders default.
          const fromAvail = available.find((t) => t.id === result.tagId);
          setTags((prev) =>
            prev.some((t) => t.id === result.tagId)
              ? prev
              : [...prev, { id: result.tagId, name: result.name, color: fromAvail?.color ?? "#888888" }],
          );
          setInput("");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Toevoegen mislukte.");
      }
    });
  }

  function remove(tagId: string) {
    setError(null);
    const before = tags;
    setTags((prev) => prev.filter((t) => t.id !== tagId));
    startTransition(async () => {
      try {
        await removeTagFromInvoiceAction({ invoiceId, tagId });
      } catch (err) {
        setTags(before);
        setError(err instanceof Error ? err.message : "Verwijderen mislukte.");
      }
    });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (matches[0]) {
        addByName(matches[0].name);
      } else if (showCreate) {
        addByName(trimmed);
      }
    }
  }

  return (
    <div className="space-y-2">
      {smart.length > 0 ? (
        <div className="space-y-1.5">
          <p className="flex items-center gap-1 text-xs text-[color:var(--color-muted-foreground)]">
            <Sparkles className="h-3 w-3 text-[color:var(--color-primary)]" />
            Op basis van eerdere facturen van deze leverancier
          </p>
          <div className="flex flex-wrap gap-1.5">
            {smart.map((name) => (
              <button
                key={`smart-${name}`}
                type="button"
                onClick={() => addByName(name)}
                disabled={pending}
                className="inline-flex items-center gap-1 rounded-full border border-[color:var(--color-primary)]/40 bg-[color:var(--color-primary-soft)]/40 px-2 py-0.5 text-xs text-[color:var(--color-primary)] hover:bg-[color:var(--color-primary-soft)] disabled:opacity-60"
              >
                <Plus className="h-3 w-3" />
                {name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {generic.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-xs text-[color:var(--color-muted-foreground)]">
            Veelgebruikt in boekhouding
          </p>
          <div className="flex flex-wrap gap-1.5">
            {generic.map((name) => (
              <button
                key={`generic-${name}`}
                type="button"
                onClick={() => addByName(name)}
                disabled={pending}
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-[color:var(--color-border)] bg-transparent px-2 py-0.5 text-xs text-[color:var(--color-muted-foreground)] hover:border-[color:var(--color-primary)] hover:bg-[color:var(--color-primary-soft)]/30 hover:text-[color:var(--color-primary)] disabled:opacity-60"
              >
                <Plus className="h-3 w-3" />
                {name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-1.5">
        {tags.length === 0 ? (
          <span className="text-xs text-[color:var(--color-muted-foreground)]">
            Nog geen tags toegevoegd.
          </span>
        ) : (
          tags.map((t) => (
            <span
              key={t.id}
              className="inline-flex items-center gap-1 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-muted)] py-0.5 pl-2 pr-1 text-xs"
            >
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: t.color }}
              />
              {t.name}
              <button
                type="button"
                onClick={() => remove(t.id)}
                disabled={pending}
                aria-label={`Verwijder tag ${t.name}`}
                className="rounded-full p-0.5 text-[color:var(--color-muted-foreground)] hover:bg-[color:var(--color-background)] hover:text-[color:var(--color-foreground)]"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))
        )}
      </div>

      <div className="relative">
        <div className="flex items-center gap-2 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-background)] px-2 py-1.5">
          <TagIcon className="h-3.5 w-3.5 shrink-0 text-[color:var(--color-muted-foreground)]" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Tag toevoegen..."
            disabled={pending}
            className="flex-1 bg-transparent text-sm placeholder:text-[color:var(--color-muted-foreground)] focus:outline-none"
          />
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[color:var(--color-muted-foreground)]" />
          ) : null}
        </div>

        {(matches.length > 0 || showCreate) && input.length > 0 ? (
          <ul className="absolute left-0 right-0 top-full z-30 mt-1 max-h-60 overflow-y-auto rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-lg">
            {matches.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => addByName(t.name)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-[color:var(--color-muted)]"
                >
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: t.color }}
                  />
                  {t.name}
                </button>
              </li>
            ))}
            {showCreate ? (
              <li>
                <button
                  type="button"
                  onClick={() => addByName(trimmed)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm",
                    "border-t border-[color:var(--color-border)]",
                    "text-[color:var(--color-primary)] hover:bg-[color:var(--color-primary-soft)]/30",
                  )}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Nieuw: <span className="font-medium">{trimmed}</span>
                </button>
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>

      {error ? (
        <p className="text-xs text-[color:var(--color-status-afgewezen)]">{error}</p>
      ) : null}
    </div>
  );
}
