"use server";

import { revalidatePath } from "next/cache";
import { changeInvoiceStatus, type ChangeStatusInput } from "@/lib/mutations/invoices";
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
