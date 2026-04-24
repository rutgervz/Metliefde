import Link from "next/link";
import { cn } from "@/lib/utils";

export type Sphere = "alle" | "annelie" | "rutger" | "samen";

const SPHERES: Array<{ key: Sphere; label: string; color: string }> = [
  { key: "alle", label: "Alle", color: "var(--color-muted-foreground)" },
  { key: "annelie", label: "Annelie", color: "#EC4899" },
  { key: "rutger", label: "Rutger", color: "#6B7280" },
  { key: "samen", label: "Samen", color: "#8B5CF6" },
];

export function SphereFilter({
  basePath,
  active,
}: {
  basePath: string;
  active: Sphere;
}) {
  return (
    <nav
      aria-label="Filter op sfeer"
      className="-mx-1 flex gap-2 overflow-x-auto px-1"
    >
      {SPHERES.map((sphere) => {
        const isActive = sphere.key === active;
        const href =
          sphere.key === "alle" ? basePath : `${basePath}?sfeer=${sphere.key}`;
        return (
          <Link
            key={sphere.key}
            href={href}
            className={cn(
              "shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors",
              isActive
                ? "border-[color:var(--color-foreground)] bg-[color:var(--color-foreground)] text-white"
                : "border-[color:var(--color-border)] bg-white text-[color:var(--color-muted-foreground)] hover:text-[color:var(--color-foreground)]",
            )}
          >
            <span className="flex items-center gap-2">
              {sphere.key !== "alle" ? (
                <span
                  aria-hidden="true"
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: sphere.color }}
                />
              ) : null}
              {sphere.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function parseSphere(value: string | undefined): Sphere {
  if (value === "annelie" || value === "rutger" || value === "samen") {
    return value;
  }
  return "alle";
}
