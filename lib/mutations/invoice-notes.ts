import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";

const addNoteSchema = z.object({
  invoiceId: z.string().uuid(),
  content: z.string().min(1).max(2000),
});

/**
 * Voeg een vrije notitie toe aan een factuur. Auteur is de huidig
 * ingelogde gebruiker; hun id komt uit Supabase Auth.
 */
export async function addInvoiceNote(input: z.input<typeof addNoteSchema>) {
  const parsed = addNoteSchema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Niet ingelogd.");

  const admin = createServiceClient();
  const { data, error } = await admin
    .from("invoice_notes")
    .insert({
      invoice_id: parsed.invoiceId,
      author_id: user.id,
      content: parsed.content.trim(),
    })
    .select("id")
    .single();
  if (error) {
    throw new Error(`addInvoiceNote: ${error.message}`);
  }
  return data;
}

const removeNoteSchema = z.object({
  invoiceId: z.string().uuid(),
  noteId: z.string().uuid(),
});

export async function removeInvoiceNote(
  input: z.input<typeof removeNoteSchema>,
) {
  const parsed = removeNoteSchema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Niet ingelogd.");

  const admin = createServiceClient();
  const { error } = await admin
    .from("invoice_notes")
    .delete()
    .eq("id", parsed.noteId)
    .eq("invoice_id", parsed.invoiceId);
  if (error) {
    throw new Error(`removeInvoiceNote: ${error.message}`);
  }
}
