import { createClient } from "@/lib/supabase/server";
import type { UserRow } from "@/lib/types";

/**
 * Haalt het profiel van de huidig ingelogde gebruiker op uit public.users.
 * Geeft null terug wanneer er nog geen sync heeft plaatsgevonden.
 */
export async function getCurrentUserProfile(): Promise<
  Pick<UserRow, "id" | "email" | "display_name" | "role" | "active"> | null
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("id, email, display_name, role, active")
    .eq("id", user.id)
    .maybeSingle();

  return data;
}
