import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/brand/logo";
import { signInWithGoogle } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  niet_toegestaan:
    "Dit e-mailadres staat niet op de toegangslijst. Neem contact op met Rutger of Annelie.",
  geen_code: "De aanmelding is onvolledig teruggekeerd van Google. Probeer het opnieuw.",
  uitwisseling: "De aanmeld-sessie kon niet worden ingewisseld. Probeer het opnieuw.",
  oauth: "Er ging iets mis bij het starten van de aanmelding.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect("/");
  }

  const params = await searchParams;
  const errorMessage = params.error ? ERROR_MESSAGES[params.error] : null;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-6 py-16">
      <header className="flex flex-col items-center gap-4">
        <Logo className="h-32 w-auto" />
        <p className="text-base text-[color:var(--color-muted-foreground)]">
          Gedeeld factuurbeheer voor Rutger en Annelie.
        </p>
      </header>

      <section className="space-y-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
        <p className="text-sm text-[color:var(--color-muted-foreground)]">
          Meld je aan met je Google-account. Alleen toegestane adressen krijgen toegang.
        </p>

        <form action={signInWithGoogle}>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3 text-sm font-medium text-[color:var(--color-foreground)] transition hover:bg-[color:var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-foreground)]"
          >
            <GoogleIcon />
            <span>Inloggen met Google</span>
          </button>
        </form>

        {errorMessage ? (
          <p className="rounded-md border border-[color:var(--color-status-afgewezen)] bg-[color:var(--color-muted)] p-3 text-sm text-[color:var(--color-status-afgewezen)]">
            {errorMessage}
          </p>
        ) : null}
      </section>

      <footer className="text-center text-xs text-[color:var(--color-muted-foreground)]">
        Deze app werkt alleen op geautoriseerde accounts.
      </footer>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
    >
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.45c-.28 1.5-1.13 2.78-2.41 3.63v3.02h3.9c2.28-2.1 3.55-5.2 3.55-8.83z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.9-3.02c-1.08.73-2.46 1.16-4.04 1.16-3.11 0-5.74-2.1-6.68-4.92H1.3v3.09C3.27 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.32 14.32A7.2 7.2 0 0 1 4.94 12c0-.81.14-1.6.38-2.32V6.59H1.3A12 12 0 0 0 0 12c0 1.94.47 3.78 1.3 5.41l4.02-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.76c1.76 0 3.33.6 4.57 1.79l3.43-3.43C17.95 1.19 15.24 0 12 0 7.31 0 3.27 2.7 1.3 6.59l4.02 3.09C6.26 6.86 8.89 4.76 12 4.76z"
      />
    </svg>
  );
}
