import { createClient } from "@/lib/supabase/server";
import { SectionPlaceholder } from "@/components/section-placeholder";

type EntityRow = {
  id: string;
  name: string;
  legal_name: string | null;
  owner_sphere: "rutger" | "annelie" | "gezamenlijk";
  color: string;
  is_vat_deductible: boolean;
  active: boolean;
};

const SPHERE_LABEL: Record<EntityRow["owner_sphere"], string> = {
  annelie: "Annelie",
  rutger: "Rutger",
  gezamenlijk: "Samen",
};

export default async function EntiteitenPage() {
  const supabase = await createClient();
  const result = await supabase
    .from("entities")
    .select("id, name, legal_name, owner_sphere, color, is_vat_deductible, active")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  const entities = (result.data as EntityRow[] | null) ?? [];

  const grouped = entities.reduce<Record<EntityRow["owner_sphere"], EntityRow[]>>(
    (acc, entity) => {
      acc[entity.owner_sphere].push(entity);
      return acc;
    },
    { annelie: [], rutger: [], gezamenlijk: [] },
  );

  const order: EntityRow["owner_sphere"][] = ["annelie", "rutger", "gezamenlijk"];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 md:px-8 md:py-10">
      <header className="space-y-1">
        <h1 className="text-3xl">Entiteiten</h1>
        <p className="text-sm text-[color:var(--color-muted-foreground)]">
          Per sfeer gegroepeerd.
        </p>
      </header>

      {order.map((sphere) => {
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
