"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { changeInvoiceStatus, type ChangeStatusInput } from "@/lib/mutations/invoices";
import {
  findOrCreateTagByName,
  linkTagToInvoice,
  unlinkTagFromInvoice,
} from "@/lib/mutations/tags";
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
