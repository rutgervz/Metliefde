import { listEntitiesGroupedBySphere } from "@/lib/queries/entities";
import { SectionPlaceholder } from "@/components/section-placeholder";
import type { OwnerSphere } from "@/lib/types";

const SPHERE_LABEL: Record<OwnerSphere, string> = {
  annelie: "Annelie",
  rutger: "Rutger",
  gezamenlijk: "Samen",
};

const ORDER: OwnerSphere[] = ["annelie", "rutger", "gezamenlijk"];

export default async function EntiteitenPage() {
  const grouped = await listEntitiesGroupedBySphere();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 md:px-8 md:py-10">
      <header className="space-y-1">
        <h1 className="text-3xl">Entiteiten</h1>
        <p className="text-sm text-[color:var(--color-muted-foreground)]">
          Per sfeer gegroepeerd.
        </p>
      </header>

      {ORDER.map((sphere) => {
        const items = grouped[sphere];
        if (items.length === 0) return null;
        return (
          <section key={sphere} className="space-y-3">
            <h2 className="text-xs uppercase tracking-widest text-[color:var(--color-muted-foreground)]">
              {SPHERE_LABEL[sphere]}
            </h2>
            <ul className="space-y-2">
              {items.map((entity) => (
                <li
                  key={entity.id}
                  className="flex items-center gap-3 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3"
                >
                  <span
                    aria-hidden="true"
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: entity.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{entity.name}</p>
                    {entity.legal_name ? (
                      <p className="truncate text-xs text-[color:var(--color-muted-foreground)]">
                        {entity.legal_name}
                      </p>
                    ) : null}
                  </div>
                  {entity.is_vat_deductible ? (
                    <span className="rounded-full bg-[color:var(--color-muted)] px-2 py-0.5 text-xs text-[color:var(--color-muted-foreground)]">
                      BTW
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <SectionPlaceholder
        title="Nog te koppelen"
        description="In Stap 11 (entiteiten-scherm) tonen we per entiteit het aantal openstaande facturen, totalen en details."
        upcoming={[]}
      />
    </div>
  );
}
