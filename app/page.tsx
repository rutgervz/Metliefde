import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/database.types";

type ProfileRow = { display_name: string; role: UserRole };

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profileResult = await supabase
    .from("users")
    .select("display_name, role")
    .eq("id", user.id)
    .maybeSingle();
  const profile = profileResult.data as ProfileRow | null;

  const displayName =
    profile?.display_name ?? user.user_metadata.full_name ?? user.email ?? "Onbekend";

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-6 py-12">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl">Met Liefde</h1>
        </div>
        <div className="flex flex-col items-end gap-1 text-right text-sm">
          <span className="text-[color:var(--color-foreground)]">{displayName}</span>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-xs text-[color:var(--color-muted-foreground)] underline-offset-4 hover:underline"
            >
              Uitloggen
            </button>
          </form>
        </div>
      </header>

      <section className="rounded-xl border border-[color:var(--color-border)] bg-white p-6">
        <h2 className="mb-3 text-2xl">Status van de opbouw</h2>
        <ol className="space-y-2">
          <li className="text-[color:var(--color-muted-foreground)]">Stap 1 Project en Supabase — klaar</li>
          <li>Stap 2 Auth-laag — bezig</li>
          <li className="text-[color:var(--color-muted-foreground)]">Stap 3 Layout en navigatie — volgt</li>
        </ol>
      </section>

      <section className="rounded-xl border border-[color:var(--color-border)] bg-white p-6">
        <h2 className="mb-2 text-xl">Aangemeld als</h2>
        <p className="text-[color:var(--color-muted-foreground)]">
          {user.email} · rol {profile?.role ?? "nog te synchroniseren"}
        </p>
      </section>

      <footer className="text-sm text-[color:var(--color-muted-foreground)]">
        De inbox en curatie-flow komen in volgende stappen.
      </footer>
    </main>
  );
}
