"use client";

import { cn } from "@/lib/utils";

/**
 * Het volledige Us Wente-logo in PNG, voor splash-momenten zoals de
 * login-pagina. Switcht tussen lichte en donkere strokes via de
 * data-theme dark variant. Gebruik voor inline app-chrome de
 * Wordmark-component in plaats van dit logo.
 */

const LIGHT_SRC = "/logo-uswente.png";
const DARK_SRC = "/logo-uswente-dark.png";

export function Logo({
  className,
  alt = "Us Wente",
}: {
  className?: string;
  alt?: string;
}) {
  return (
    <>
      <img
        src={LIGHT_SRC}
        alt={alt}
        className={cn("block h-auto w-auto select-none dark:hidden", className)}
      />
      <img
        src={DARK_SRC}
        alt={alt}
        className={cn("hidden h-auto w-auto select-none dark:block", className)}
      />
    </>
  );
}
