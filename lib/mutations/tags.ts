import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";

function normalize(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

/**
 * Vindt een tag op naam (case-insensitive) of maakt hem aan.
 * Gebruikt de service client om RLS te omzeilen.
 */
export async function findOrCreateTagByName(
  rawName: string,
): Promise<{ id: string; name: string } | null> {
  const name = normalize(rawName);
  if (!name) return null;

  const admin = createServiceClient();
  const existing = await admin
    .from("tags")
    .select("id, name")
    .ilike("name", name)
    .limit(1)
    .maybeSingle();
  if (existing.data) return existing.data;

  const created = await admin
    .from("tags")
    .insert({ name })
    .select("id, name")
    .single();
  if (created.error) {
    console.error("tag insert mislukte", created.error);
    return null;
  }
  return created.data;
}

const linkSchema = z.object({
  invoiceId: z.string().uuid(),
  tagId: z.string().uuid(),
});

export async function linkTagToInvoice(
  input: z.input<typeof linkSchema>,
): Promise<void> {
  const parsed = linkSchema.parse(input);
  const admin = createServiceClient();
  const { error } = await admin.from("invoice_tags").upsert({
    invoice_id: parsed.invoiceId,
    tag_id: parsed.tagId,
  });
  if (error) {
    throw new Error(`linkTagToInvoice: ${error.message}`);
  }
}

export async function unlinkTagFromInvoice(
  input: z.input<typeof linkSchema>,
): Promise<void> {
  const parsed = linkSchema.parse(input);
  const admin = createServiceClient();
  const { error } = await admin
    .from("invoice_tags")
    .delete()
    .eq("invoice_id", parsed.invoiceId)
    .eq("tag_id", parsed.tagId);
  if (error) {
    throw new Error(`unlinkTagFromInvoice: ${error.message}`);
  }
}

/**
 * Past een lijst suggested tag-namen toe op een factuur. Maakt
 * ontbrekende tags aan en linkt ze. Idempotent.
 */
export async function applySuggestedTags(
  invoiceId: string,
  names: string[],
): Promise<void> {
  for (const raw of names) {
    const tag = await findOrCreateTagByName(raw);
    if (!tag) continue;
    try {
      await linkTagToInvoice({ invoiceId, tagId: tag.id });
    } catch (err) {
      console.error("applySuggestedTags link mislukte", err);
    }
  }
}
