"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-items";

export function Sidebar({
  displayName,
}: {
  displayName: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-[color:var(--color-border)] bg-white md:flex">
      <div className="px-6 pb-6 pt-8">
        <p className="font-serif text-2xl tracking-tight">Met Liefde</p>
      </div>

      <nav aria-label="Hoofdnavigatie" className="flex-1 px-3">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-[color:var(--color-muted)] text-[color:var(--color-foreground)]"
                      : "text-[color:var(--color-muted-foreground)] hover:bg-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-[color:var(--color-border)] px-4 py-4">
        <p className="truncate text-sm text-[color:var(--color-foreground)]">
          {displayName}
        </p>
        <form action="/auth/signout" method="post" className="mt-1">
          <button
            type="submit"
            className="text-xs text-[color:var(--color-muted-foreground)] underline-offset-4 hover:underline"
          >
            Uitloggen
          </button>
        </form>
      </div>
    </aside>
  );
}
