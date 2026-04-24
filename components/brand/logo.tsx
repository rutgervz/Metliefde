"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Logo voor inline gebruik in sidebar, mobiele header en login.
 *
 * Verwacht twee bestanden in /public, een voor elk thema:
 *   public/logo-uswente.svg       — transparant, donkere strokes (light mode)
 *   public/logo-uswente-dark.svg  — transparant, lichte strokes (dark mode)
 *
 * Wanneer de bestanden ontbreken valt de component terug op een
 * stijlvolle serif-tekst in het brand-rood.
 */

const LIGHT_SRC = "/logo-uswente.svg";
const DARK_SRC = "/logo-uswente-dark.svg";

export function Logo({
  className,
  alt = "Met Liefde",
}: {
  className?: string;
  alt?: string;
}) {
  const [imgFailed, setImgFailed] = useState(false);

  if (imgFailed) {
    return (
      <span
        className={cn(
          "font-serif tracking-tight text-[color:var(--color-primary)]",
          className,
        )}
      >
        Met Liefde
      </span>
    );
  }

  return (
    <>
      <img
        src={LIGHT_SRC}
        alt={alt}
        onError={() => setImgFailed(true)}
        className={cn("block h-auto select-none dark:hidden", className)}
      />
      <img
        src={DARK_SRC}
        alt={alt}
        onError={() => setImgFailed(true)}
        className={cn("hidden h-auto select-none dark:block", className)}
      />
    </>
  );
}
