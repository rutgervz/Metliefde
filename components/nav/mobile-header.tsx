import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import type { ThemeMode } from "@/lib/theme";

export function MobileHeader({
  displayName,
  themeMode,
}: {
  displayName: string;
  themeMode: ThemeMode;
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)]/90 px-4 py-3 backdrop-blur md:hidden">
      <Link href="/inbox" className="font-serif text-xl tracking-tight">
        Met Liefde
      </Link>
      <div className="flex items-center gap-2 text-sm">
        <ThemeToggle mode={themeMode} className="px-1.5" />
        <span className="hidden max-w-[8rem] truncate text-[color:var(--color-muted-foreground)] sm:inline">
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
