import { createClient } from "@/lib/supabase/server";
import type { EntityRow, OwnerSphere } from "@/lib/types";

/**
 * Vereenvoudigde entity-row voor lijstweergaven. Selecteer alleen
 * wat de UI nodig heeft, niet alle kolommen.
 */
export type EntityListItem = Pick<
  EntityRow,
  | "id"
  | "name"
  | "legal_name"
  | "owner_sphere"
  | "color"
  | "is_vat_deductible"
  | "active"
  | "sort_order"
>;

export type EntitiesGroupedBySphere = Record<OwnerSphere, EntityListItem[]>;

export async function listActiveEntities(): Promise<EntityListItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("entities")
    .select(
      "id, name, legal_name, owner_sphere, color, is_vat_deductible, active, sort_order",
    )
    .eq("active", true)
    .order("sort_order", { ascending: true });
  return data ?? [];
}

export async function listEntitiesGroupedBySphere(): Promise<EntitiesGroupedBySphere> {
  const items = await listActiveEntities();
  const initial: EntitiesGroupedBySphere = {
    annelie: [],
    rutger: [],
    gezamenlijk: [],
  };
  return items.reduce((acc, entity) => {
    acc[entity.owner_sphere].push(entity);
    return acc;
  }, initial);
}
