import { SectionPlaceholder } from "@/components/section-placeholder";

const TABS = [
  {
    title: "Gebruikers",
    description:
      "Rutger en Annelie als eigenaren. Een boekhouder of kijker kan later via de gebruikers-tab worden toegevoegd.",
  },
  {
    title: "Entiteiten",
    description:
      "Per entiteit: naam, BTW-status, kleur, drempel voor goedkeuring, dual approval. Nu read-only.",
  },
  {
    title: "Categorieen",
    description: "Algemene set en entiteit-specifieke uitbreidingen. Nu read-only.",
  },
  {
    title: "Leveranciers",
    description:
      "Lijst met leervoorkeuren per leverancier. Vult zich automatisch in Stap 6 wanneer extractie loopt.",
  },
  {
    title: "Mailboxen",
    description:
      "Verbind in Stap 5 een of meerdere Gmail-mailboxen. Per mailbox een default-entiteit. Bijvoorbeeld factuur@uswente.org koppelt automatisch aan Stichting Us Wente.",
  },
];

export default function InstellingenPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 md:px-8 md:py-10">
      <header className="space-y-1">
        <h1 className="text-3xl">Instellingen</h1>
        <p className="text-sm text-[color:var(--color-muted-foreground)]">
          Vijf onderdelen, in volgende stappen werkend gemaakt.
        </p>
      </header>

      <ul className="space-y-3">
        {TABS.map((tab) => (
          <li
            key={tab.title}
            className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5"
          >
            <h2 className="text-lg">{tab.title}</h2>
            <p className="mt-1 text-sm text-[color:var(--color-muted-foreground)]">
              {tab.description}
            </p>
          </li>
        ))}
      </ul>

      <SectionPlaceholder
        title="Wat hier komt"
        description="De tabs worden ingedeeld in een instellingen-shell met edit-formulieren, sleutels en koppelingsstatus."
        upcoming={[]}
      />
    </div>
  );
}
