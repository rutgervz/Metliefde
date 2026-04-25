"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  approveInvoice,
  changeInvoiceStatus,
  type ChangeStatusInput,
  updateInvoiceFields,
  type UpdateInvoiceFieldsInput,
} from "@/lib/mutations/invoices";
import { createClient } from "@/lib/supabase/server";
import {
  findOrCreateTagByName,
  linkTagToInvoice,
  unlinkTagFromInvoice,
} from "@/lib/mutations/tags";
import {
  addInvoiceNote,
  removeInvoiceNote,
} from "@/lib/mutations/invoice-notes";
import { getCurrentUserProfile } from "@/lib/queries/users";

async function ensureMutator() {
  const profile = await getCurrentUserProfile();
  if (!profile || (profile.role !== "eigenaar" && profile.role !== "boekhouder")) {
    throw new Error("Geen rechten om deze factuur te muteren.");
  }
}

export async function changeStatusAction(input: ChangeStatusInput) {
  await ensureMutator();
  await changeInvoiceStatus(input);
  revalidatePath("/inbox");
  revalidatePath(`/factuur/${input.invoiceId}`);
}

export async function updateFieldsAction(input: UpdateInvoiceFieldsInput) {
  await ensureMutator();
  await updateInvoiceFields(input);
  revalidatePath("/inbox");
  revalidatePath(`/factuur/${input.invoiceId}`);
}

const approveSchemaAction = z.object({ invoiceId: z.string().uuid() });

export async function approveInvoiceAction(
  input: z.input<typeof approveSchemaAction>,
) {
  await ensureMutator();
  const parsed = approveSchemaAction.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Niet ingelogd.");
  const result = await approveInvoice({
    invoiceId: parsed.invoiceId,
    userId: user.id,
  });
  revalidatePath("/inbox");
  revalidatePath(`/factuur/${parsed.invoiceId}`);
  return result;
}

const addTagSchema = z.object({
  invoiceId: z.string().uuid(),
  name: z.string().min(1).max(40),
});

export async function addTagToInvoiceAction(
  input: z.input<typeof addTagSchema>,
): Promise<{ tagId: string; name: string } | null> {
  await ensureMutator();
  const parsed = addTagSchema.parse(input);
  const tag = await findOrCreateTagByName(parsed.name);
  if (!tag) return null;
  await linkTagToInvoice({ invoiceId: parsed.invoiceId, tagId: tag.id });
  revalidatePath(`/factuur/${parsed.invoiceId}`);
  return { tagId: tag.id, name: tag.name };
}

const removeTagSchema = z.object({
  invoiceId: z.string().uuid(),
  tagId: z.string().uuid(),
});

export async function removeTagFromInvoiceAction(
  input: z.input<typeof removeTagSchema>,
): Promise<void> {
  await ensureMutator();
  const parsed = removeTagSchema.parse(input);
  await unlinkTagFromInvoice(parsed);
  revalidatePath(`/factuur/${parsed.invoiceId}`);
}

const noteSchema = z.object({
  invoiceId: z.string().uuid(),
  content: z.string().min(1).max(2000),
});

export async function addNoteAction(input: z.input<typeof noteSchema>) {
  // Iedereen met read-toegang mag noteren — RLS regelt zichtbaarheid.
  const profile = await getCurrentUserProfile();
  if (!profile) throw new Error("Niet ingelogd.");
  const parsed = noteSchema.parse(input);
  await addInvoiceNote(parsed);
  revalidatePath(`/factuur/${parsed.invoiceId}`);
}

const removeNoteSchemaAction = z.object({
  invoiceId: z.string().uuid(),
  noteId: z.string().uuid(),
});

export async function removeNoteAction(
  input: z.input<typeof removeNoteSchemaAction>,
) {
  const profile = await getCurrentUserProfile();
  if (!profile) throw new Error("Niet ingelogd.");
  const parsed = removeNoteSchemaAction.parse(input);
  await removeInvoiceNote(parsed);
  revalidatePath(`/factuur/${parsed.invoiceId}`);
}
