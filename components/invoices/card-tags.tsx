"use client";

import { useRouter, useSearchParams } from "next/navigation";

export type CardTag = { id: string; name: string; color: string };

/**
 * Klikbare tags voor de InvoiceCard in de kanban-inbox. Gebruikt
 * router.push i.p.v. een nested Link zodat de outer card-link niet
 * meegevangen wordt.
 */
export function CardTags({ tags }: { tags: CardTag[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onTagClick(event: React.MouseEvent<HTMLButtonElement>, name: string) {
    event.preventDefault();
    event.stopPropagation();
    const params = new URLSearchParams(searchParams.toString());
    params.set("tag", name);
    router.push(`/inbox?${params.toString()}`);
  }

  return (
    <>
      {tags.slice(0, 2).map((tag) => (
        <button
          key={tag.id}
          type="button"
          onClick={(e) => onTagClick(e, tag.name)}
          className="inline-flex items-center gap-1 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-muted)] px-2 py-0.5 text-[color:var(--color-muted-foreground)] hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)]"
        >
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: tag.color }}
          />
          {tag.name}
        </button>
      ))}
      {tags.length > 2 ? (
        <span className="text-[color:var(--color-muted-foreground)]">
          +{tags.length - 2}
        </span>
      ) : null}
    </>
  );
}
