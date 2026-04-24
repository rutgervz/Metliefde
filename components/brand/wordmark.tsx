import { cn } from "@/lib/utils";

const SIZE_CLASS = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-3xl",
  xl: "text-5xl",
} as const;

/**
 * Tekstuele wordmark voor inline gebruik in app-chrome (sidebar,
 * mobiele header). Het ornate Us Wente-logo bewaren we voor
 * splash-momenten zoals de login en het app-icoon.
 */
export function Wordmark({
  className,
  size = "md",
}: {
  className?: string;
  size?: keyof typeof SIZE_CLASS;
}) {
  return (
    <span
      className={cn(
        "font-serif font-medium leading-none tracking-tight text-[color:var(--color-primary)]",
        SIZE_CLASS[size],
        className,
      )}
    >
      Met Liefde
    </span>
  );
}
