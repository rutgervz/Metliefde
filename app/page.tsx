export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-6 px-6 py-16">
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-widest text-[color:var(--color-muted-foreground)]">
          Met Liefde
        </p>
        <h1 className="text-4xl">Facturen</h1>
        <p className="text-lg text-[color:var(--color-muted-foreground)]">
          Gedeeld factuur- en abonnementenbeheer. Fase 1 in opbouw.
        </p>
      </header>

      <section className="rounded-xl border border-[color:var(--color-border)] bg-white p-6">
        <h2 className="mb-3 text-2xl">Status van de opbouw</h2>
        <ol className="space-y-2 text-[color:var(--color-foreground)]">
          <li>Stap 1 Project en Supabase — bezig</li>
          <li className="text-[color:var(--color-muted-foreground)]">Stap 2 Auth-laag — volgt</li>
          <li className="text-[color:var(--color-muted-foreground)]">Stap 3 Layout en navigatie — volgt</li>
        </ol>
      </section>

      <footer className="text-sm text-[color:var(--color-muted-foreground)]">
        Werk op een Vercel-preview. Volg README voor de opzet-stappen.
      </footer>
    </main>
  );
}
