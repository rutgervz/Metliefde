"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentUserProfile } from "@/lib/queries/users";
import {
  setMailAccountStatus,
  updateMailAccount,
} from "@/lib/mutations/mail-accounts";
import { syncMailboxById } from "@/lib/google/sync";

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

/**
 * Variant met expliciete argumenten in plaats van FormData. Wordt
 * aangeroepen vanuit de client-side EntityPicker zodat de auto-save
 * niet afhankelijk is van form-submission gedrag.
 */
export async function setMailAccountDefaultEntityForId(
  mailAccountId: string,
  entityId: string | null,
) {
  await ensureOwner();
  const parsed = setDefaultEntitySchema.parse({ mailAccountId, entityId });
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

export async function triggerMailboxSync(formData: FormData) {
  await ensureOwner();
  const { mailAccountId } = idOnlySchema.parse({
    mailAccountId: formData.get("mailAccountId"),
  });
  await syncMailboxById(mailAccountId);
  revalidatePath("/instellingen/mailboxen");
}

/**
 * Variant met expliciete argumenten voor de SyncButton client component.
 * Geeft het sync-resultaat terug zodat de UI direct kan tonen wat er
 * gebeurde, zonder eerst op revalidatie te wachten.
 */
export async function triggerMailboxSyncForId(mailAccountId: string) {
  await ensureOwner();
  const { mailAccountId: id } = idOnlySchema.parse({ mailAccountId });
  const result = await syncMailboxById(id);
  revalidatePath("/instellingen/mailboxen");
  const summary =
    result.status === "ok"
      ? result.total === 0
        ? `Geen berichten met label gevonden.`
        : `${result.enqueued ?? 0} nieuw, ${result.skipped ?? 0} al bekend.`
      : result.message ?? "Sync mislukte.";
  return { status: result.status, summary };
}
