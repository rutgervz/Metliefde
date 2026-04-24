"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/queries/users";
import {
  setMailAccountStatus,
  updateMailAccount,
} from "@/lib/mutations/mail-accounts";

async function ensureOwner() {
  const profile = await getCurrentUserProfile();
  if (profile?.role !== "eigenaar") {
    throw new Error("Alleen eigenaars mogen mailboxen beheren.");
  }
}

const setDefaultEntitySchema = z.object({
  mailAccountId: z.string().uuid(),
  entityId: z.string().uuid().nullable(),
});

export async function setMailAccountDefaultEntity(formData: FormData) {
  await ensureOwner();
  const raw = {
    mailAccountId: formData.get("mailAccountId"),
    entityId: formData.get("entityId") || null,
  };
  const parsed = setDefaultEntitySchema.parse({
    mailAccountId: raw.mailAccountId,
    entityId: raw.entityId === "" ? null : raw.entityId,
  });
  await updateMailAccount({
    id: parsed.mailAccountId,
    default_entity_id: parsed.entityId,
  });
  revalidatePath("/instellingen/mailboxen");
}

const idOnlySchema = z.object({
  mailAccountId: z.string().uuid(),
});

export async function pauseMailAccount(formData: FormData) {
  await ensureOwner();
  const { mailAccountId } = idOnlySchema.parse({
    mailAccountId: formData.get("mailAccountId"),
  });
  await setMailAccountStatus(mailAccountId, "gepauzeerd");
  revalidatePath("/instellingen/mailboxen");
}

export async function resumeMailAccount(formData: FormData) {
  await ensureOwner();
  const { mailAccountId } = idOnlySchema.parse({
    mailAccountId: formData.get("mailAccountId"),
  });
  await setMailAccountStatus(mailAccountId, "verbonden");
  revalidatePath("/instellingen/mailboxen");
}

export async function disconnectMailAccount(formData: FormData) {
  await ensureOwner();
  const { mailAccountId } = idOnlySchema.parse({
    mailAccountId: formData.get("mailAccountId"),
  });
  await setMailAccountStatus(mailAccountId, "ontkoppeld");
  revalidatePath("/instellingen/mailboxen");
}

export async function startMailboxConnect() {
  redirect("/api/mailbox/connect");
}
