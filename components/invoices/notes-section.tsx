"use client";

import { useState, useTransition } from "react";
import { Loader2, Send, Trash2 } from "lucide-react";
import {
  addNoteAction,
  removeNoteAction,
} from "@/app/(app)/factuur/[id]/actions";
import type { InvoiceNote } from "@/lib/queries/invoice-notes";

function formatTime(date: string): string {
  return new Date(date).toLocaleString("nl-NL", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Amsterdam",
  });
}

export function NotesSection({
  invoiceId,
  initialNotes,
  currentUserId,
}: {
  invoiceId: string;
  initialNotes: InvoiceNote[];
  currentUserId: string;
}) {
  const [notes, setNotes] = useState<InvoiceNote[]>(initialNotes);
  const [content, setContent] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const trimmed = content.trim();
    if (!trimmed) return;
    setError(null);
    startTransition(async () => {
      try {
        await addNoteAction({ invoiceId, content: trimmed });
        // Optimistisch toevoegen; volledige sync gebeurt bij revalidate
        setNotes((prev) => [
          ...prev,
          {
            id: `temp-${Date.now()}`,
            content: trimmed,
            created_at: new Date().toISOString(),
            author_id: currentUserId,
            author_name: "Jij",
          },
        ]);
        setContent("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Notitie opslaan mislukte.");
      }
    });
  }

  function remove(noteId: string) {
    setError(null);
    const before = notes;
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    startTransition(async () => {
      try {
        await removeNoteAction({ invoiceId, noteId });
      } catch (err) {
        setNotes(before);
        setError(err instanceof Error ? err.message : "Verwijderen mislukte.");
      }
    });
  }

  return (
    <div className="space-y-3">
      {notes.length === 0 ? (
        <p className="text-sm text-[color:var(--color-muted-foreground)]">
          Nog geen notities. Schrijf hieronder iets dat de ander zou willen weten.
        </p>
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => (
            <li
              key={n.id}
              className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-muted)]/40 p-3 text-sm"
            >
              <div className="mb-1 flex items-center justify-between gap-2 text-xs text-[color:var(--color-muted-foreground)]">
                <span>
                  <span className="font-medium text-[color:var(--color-foreground)]">
                    {n.author_name}
                  </span>{" "}
                  · {formatTime(n.created_at)}
                </span>
                {n.author_id === currentUserId ? (
                  <button
                    type="button"
                    onClick={() => remove(n.id)}
                    aria-label="Verwijder notitie"
                    className="text-[color:var(--color-muted-foreground)] hover:text-[color:var(--color-status-afgewezen)]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
              <p className="whitespace-pre-wrap">{n.content}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-end gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit();
            }
          }}
          rows={2}
          placeholder="Notitie voor jezelf of voor de ander..."
          disabled={pending}
          className="flex-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-background)] px-2 py-1.5 text-sm placeholder:text-[color:var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
        />
        <button
          type="button"
          onClick={submit}
          disabled={pending || !content.trim()}
          className="inline-flex items-center gap-1 rounded-md bg-[color:var(--color-primary)] px-3 py-2 text-sm text-[color:var(--color-primary-foreground)] hover:bg-[color:var(--color-primary-hover)] disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
      {error ? (
        <p className="text-xs text-[color:var(--color-status-afgewezen)]">{error}</p>
      ) : null}
    </div>
  );
}
