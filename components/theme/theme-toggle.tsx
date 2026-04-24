"use client";

import { Sun, Moon, SunMedium } from "lucide-react";
import { useTransition } from "react";
import { setThemeMode } from "@/app/actions/theme";
import type { ThemeMode } from "@/lib/theme";
import { cn } from "@/lib/utils";

const NEXT_MODE: Record<ThemeMode, ThemeMode> = {
  auto: "licht",
  licht: "donker",
  donker: "auto",
};

const ICON: Record<ThemeMode, typeof Sun> = {
  auto: SunMedium,
  licht: Sun,
  donker: Moon,
};

const LABEL: Record<ThemeMode, string> = {
  auto: "Automatisch — volgt zonsondergang",
  licht: "Licht thema",
  donker: "Donker thema",
};

export function ThemeToggle({
  mode,
  className,
}: {
  mode: ThemeMode;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  const Icon = ICON[mode];

  return (
    <button
      type="button"
      onClick={() =>
        startTransition(() => {
          void setThemeMode(NEXT_MODE[mode]);
        })
      }
      disabled={pending}
      title={LABEL[mode]}
      aria-label={LABEL[mode]}
      className={cn(
        "inline-flex items-center gap-2 rounded-md border border-transparent px-2 py-1.5 text-xs text-[color:var(--color-muted-foreground)] transition-colors hover:bg-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)] disabled:opacity-60",
        className,
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="capitalize">{mode}</span>
    </button>
  );
}
