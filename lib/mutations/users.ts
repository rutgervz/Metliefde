import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import type { UserInsert } from "@/lib/types";

const upsertSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().toLowerCase(),
  display_name: z.string().min(1).max(120),
  role: z.enum(["eigenaar", "boekhouder", "kijker"]).default("eigenaar"),
  active: z.boolean().default(true),
});

/**
 * Synchroniseert auth-gebruiker naar public.users. Wordt gebruikt vanuit
 * de OAuth-callback, dus draait met de service role om RLS te omzeilen.
 */
export async function upsertUserProfile(input: UserInsert) {
  const parsed = upsertSchema.parse(input);
  const admin = createServiceClient();
  const { error } = await admin.from("users").upsert(parsed, {
    onConflict: "id",
  });
  if (error) {
    throw new Error(`upsertUserProfile: ${error.message}`);
  }
}
