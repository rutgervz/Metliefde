import Link from "next/link";

/**
 * Compacte header alleen op mobiel zichtbaar. Toont app-naam en uitlog-knop.
 * De vier hoofdsecties zitten in de bottom-nav.
 */
export function MobileHeader({
  displayName,
}: {
  displayName: string;
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[color:var(--color-border)] bg-white/90 px-4 py-3 backdrop-blur md:hidden">
      <Link href="/inbox" className="font-serif text-xl tracking-tight">
        Met Liefde
      </Link>
      <div className="flex items-center gap-3 text-sm">
        <span className="max-w-[10rem] truncate text-[color:var(--color-muted-foreground)]">
          {displayName}
        </span>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="text-xs text-[color:var(--color-muted-foreground)] underline-offset-4 hover:underline"
          >
            Uitloggen
          </button>
        </form>
      </div>
    </header>
  );
}
