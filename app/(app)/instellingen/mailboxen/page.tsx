import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Mail,
  AlertCircle,
  Pause,
  Play,
  Unlink,
  RefreshCw,
} from "lucide-react";
import { listMailAccounts } from "@/lib/queries/mail-accounts";
import { listActiveEntities } from "@/lib/queries/entities";
import { getCurrentUserProfile } from "@/lib/queries/users";
import { checkMailboxConfig } from "@/lib/google/config";
import {
  disconnectMailAccount,
  pauseMailAccount,
  resumeMailAccount,
  setMailAccountDefaultEntity,
  triggerMailboxSync,
} from "./actions";
import type { MailAccountStatus } from "@/lib/types";

const STATUS_LABEL: Record<MailAccountStatus, string> = {
  verbonden: "Verbonden",
  herauth_nodig: "Herauth nodig",
  gepauzeerd: "Gepauzeerd",
  ontkoppeld: "Ontkoppeld",
};

const STATUS_COLOR: Record<MailAccountStatus, string> = {
  verbonden: "var(--color-status-voldaan)",
  herauth_nodig: "var(--color-status-betwist)",
  gepauzeerd: "var(--color-status-on-hold)",
  ontkoppeld: "var(--color-muted-foreground)",
};

const ERROR_MESSAGES: Record<string, string> = {
  geweigerd: "Toegang afgewezen op het Google-scherm.",
  geen_code: "Onvolledige terugkomst van Google. Probeer het opnieuw.",
  ongeldige_state: "De aanvraag verliep tussen de stappen door. Probeer opnieuw.",
  uitwisseling: "Code uitwisseling met Google mislukte.",
  geen_token: "Google gaf geen access token terug.",
  id_token: "ID-token van Google kon niet worden gevalideerd.",
  geen_email: "Het Google-account had geen email beschikbaar.",
  opslaan: "Mailbox kon niet worden opgeslagen.",
  alleen_eigenaar: "Alleen eigenaars kunnen mailboxen verbinden.",
  config_ontbreekt: "Server-configuratie is incompleet.",
  setup: "Initialisatie van de OAuth-flow mislukte.",
};

export default async function MailboxenPage({
  searchParams,
}: {
  searchParams: Promise<{
    verbonden?: string;
    error?: string;
    missing?: string;
    details?: string;
  }>;
}) {
  const params = await searchParams;
  const profile = await getCurrentUserProfile();
  const isOwner = profile?.role === "eigenaar";

  const [mailboxes, entities] = await Promise.all([
    listMailAccounts(),
    listActiveEntities(),
  ]);

  const config = checkMailboxConfig();

  const errorKey = params.error;
  const errorMessage = errorKey ? ERROR_MESSAGES[errorKey] : null;
  const errorDetails =
    errorKey === "config_ontbreekt" && params.missing
      ? `Ontbrekend: ${params.missing.split(",").join(", ")}`
      : params.details ?? null;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 md:px-8 md:py-10">
      <Link
        href="/instellingen"
        className="inline-flex items-center gap-1 text-sm text-[color:var(--color-muted-foreground)] hover:text-[color:var(--color-foreground)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Instellingen
      </Link>

      <header className="space-y-1">
        <h1 className="text-3xl">Mailboxen</h1>
        <p className="text-sm text-[color:var(--color-muted-foreground)]">
          Verbind een of meerdere Gmail-mailboxen waar facturen binnenkomen.
          Elke mailbox krijgt een default-entiteit.
        </p>
      </header>

      {params.verbonden ? (
        <p className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-muted)] p-3 text-sm">
          Mailbox <span className="font-medium">{params.verbonden}</span> is
          verbonden.
        </p>
      ) : null}

      {errorMessage ? (
        <div className="flex items-start gap-2 rounded-lg border border-[color:var(--color-status-afgewezen)] bg-[color:var(--color-muted)] p-3 text-sm text-[color:var(--color-status-afgewezen)]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="space-y-1">
            <p>{errorMessage}</p>
            {errorDetails ? (
              <p className="text-xs opacity-90">{errorDetails}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {!config.ready && isOwner ? (
        <div className="rounded-lg border border-[color:var(--color-status-betwist)] bg-[color:var(--color-muted)] p-4 text-sm">
          <p className="font-medium">Server-configuratie incompleet</p>
          <p className="mt-1 text-[color:var(--color-muted-foreground)]">
            Vercel mist {config.missing.join(", ")}. Stel deze in onder
            Project Settings → Environment Variables en redeploy. Zie de
            README, sectie "Stap 5a afmaken".
          </p>
        </div>
      ) : null}

      {isOwner ? (
        <a
          href="/api/mailbox/connect"
          className="inline-flex w-fit items-center gap-2 rounded-lg bg-[color:var(--color-primary)] px-4 py-2 text-sm text-[color:var(--color-primary-foreground)] transition hover:bg-[color:var(--color-primary-hover)]"
        >
          <Plus className="h-4 w-4" />
          Verbind mailbox
        </a>
      ) : (
        <p className="text-sm text-[color:var(--color-muted-foreground)]">
          Alleen eigenaars kunnen mailboxen verbinden.
        </p>
      )}

      {mailboxes.length === 0 ? (
        <section className="rounded-xl border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 text-sm text-[color:var(--color-muted-foreground)]">
          Nog geen mailboxen verbonden.
        </section>
      ) : (
        <ul className="space-y-3">
          {mailboxes.map((box) => (
            <li
              key={box.id}
              className="space-y-3 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-sm font-medium">
                    <Mail className="h-4 w-4 shrink-0 text-[color:var(--color-muted-foreground)]" />
                    {box.email}
                  </p>
                  {box.display_name ? (
                    <p className="mt-0.5 truncate text-xs text-[color:var(--color-muted-foreground)]">
                      {box.display_name}
                    </p>
                  ) : null}
                </div>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs"
                  style={{
                    color: STATUS_COLOR[box.status],
                    borderColor: STATUS_COLOR[box.status],
                    borderWidth: 1,
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: STATUS_COLOR[box.status] }}
                  />
                  {STATUS_LABEL[box.status]}
                </span>
              </div>

              {box.last_error ? (
                <p className="rounded-md bg-[color:var(--color-muted)] p-2 text-xs text-[color:var(--color-status-afgewezen)]">
                  {box.last_error}
                </p>
              ) : null}

              {isOwner ? (
                <>
                  <form
                    action={setMailAccountDefaultEntity}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <input type="hidden" name="mailAccountId" value={box.id} />
                    <label
                      htmlFor={`entity-${box.id}`}
                      className="text-xs text-[color:var(--color-muted-foreground)]"
                    >
                      Default-entiteit
                    </label>
                    <select
                      id={`entity-${box.id}`}
                      name="entityId"
                      defaultValue={box.default_entity_id ?? ""}
                      className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2 py-1.5 text-sm"
                    >
                      <option value="">Geen</option>
                      {entities.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="rounded-md border border-[color:var(--color-border)] px-2.5 py-1.5 text-xs text-[color:var(--color-muted-foreground)] hover:bg-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
                    >
                      Opslaan
                    </button>
                  </form>

                  <div className="flex flex-wrap gap-2">
                    {box.status === "verbonden" ? (
                      <>
                        <form action={triggerMailboxSync}>
                          <input
                            type="hidden"
                            name="mailAccountId"
                            value={box.id}
                          />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--color-primary)] px-2.5 py-1.5 text-xs text-[color:var(--color-primary)] hover:bg-[color:var(--color-primary-soft)]"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Sync nu
                          </button>
                        </form>
                        <form action={pauseMailAccount}>
                          <input
                            type="hidden"
                            name="mailAccountId"
                            value={box.id}
                          />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--color-border)] px-2.5 py-1.5 text-xs text-[color:var(--color-muted-foreground)] hover:bg-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
                          >
                            <Pause className="h-3.5 w-3.5" />
                            Pauzeer
                          </button>
                        </form>
                      </>
                    ) : box.status === "gepauzeerd" ? (
                      <form action={resumeMailAccount}>
                        <input type="hidden" name="mailAccountId" value={box.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--color-border)] px-2.5 py-1.5 text-xs text-[color:var(--color-muted-foreground)] hover:bg-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]"
                        >
                          <Play className="h-3.5 w-3.5" />
                          Hervat
                        </button>
                      </form>
                    ) : box.status === "herauth_nodig" ? (
                      <a
                        href="/api/mailbox/connect"
                        className="inline-flex items-center gap-1.5 rounded-md bg-[color:var(--color-primary)] px-2.5 py-1.5 text-xs text-[color:var(--color-primary-foreground)] hover:bg-[color:var(--color-primary-hover)]"
                      >
                        Heraut
                      </a>
                    ) : null}

                    <form action={disconnectMailAccount}>
                      <input type="hidden" name="mailAccountId" value={box.id} />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--color-border)] px-2.5 py-1.5 text-xs text-[color:var(--color-status-afgewezen)] hover:bg-[color:var(--color-muted)]"
                      >
                        <Unlink className="h-3.5 w-3.5" />
                        Ontkoppel
                      </button>
                    </form>
                  </div>
                </>
              ) : null}

              {box.last_synced_at ? (
                <p className="text-xs text-[color:var(--color-muted-foreground)]">
                  Laatst opgehaald{" "}
                  {new Date(box.last_synced_at).toLocaleString("nl-NL", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                  {" - "}label{" "}
                  <code className="rounded bg-[color:var(--color-muted)] px-1">
                    {box.gmail_label}
                  </code>
                </p>
              ) : (
                <p className="text-xs text-[color:var(--color-muted-foreground)]">
                  Nog niet gesynced. Klik "Sync nu" om handmatig op te halen.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
