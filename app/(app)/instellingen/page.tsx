import Link from "next/link";
import { Mail, Building2, Tags, Users, Store, ChevronRight } from "lucide-react";

const SECTIONS = [
  {
    href: "/instellingen/mailboxen",
    title: "Mailboxen",
    description:
      "Verbind Gmail-mailboxen waar facturen binnenkomen. Per mailbox een default-entiteit.",
    icon: Mail,
    available: true,
  },
  {
    href: "/instellingen",
    title: "Gebruikers",
    description:
      "Rutger en Annelie als eigenaren. Boekhouder of kijker toevoegen kan later.",
    icon: Users,
    available: false,
  },
  {
    href: "/instellingen",
    title: "Entiteiten",
    description:
      "Naam, BTW-status, kleur, drempel voor goedkeuring, dual approval.",
    icon: Building2,
    available: false,
  },
  {
    href: "/instellingen",
    title: "Categorieen",
    description: "Algemene set en entiteit-specifieke uitbreidingen.",
    icon: Tags,
    available: false,
  },
  {
    href: "/instellingen",
    title: "Leveranciers",
    description:
      "Lijst met leervoorkeuren per leverancier. Vult zich automatisch.",
    icon: Store,
    available: false,
  },
];

export default function InstellingenPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 md:px-8 md:py-10">
      <header className="space-y-1">
        <h1 className="text-3xl">Instellingen</h1>
        <p className="text-sm text-[color:var(--color-muted-foreground)]">
          Vijf onderdelen. Mailboxen werkt al; de rest activeren we in
          opvolgende stappen.
        </p>
      </header>

      <ul className="space-y-3">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const card = (
            <div className="flex items-start gap-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--color-muted-foreground)]" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-base">
                  {section.title}
                  {!section.available ? (
                    <span className="rounded-full bg-[color:var(--color-muted)] px-2 py-0.5 text-xs text-[color:var(--color-muted-foreground)]">
                      Volgt
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 text-sm text-[color:var(--color-muted-foreground)]">
                  {section.description}
                </p>
              </div>
              {section.available ? (
                <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-[color:var(--color-muted-foreground)]" />
              ) : null}
            </div>
          );

          return (
            <li key={section.title}>
              {section.available ? (
                <Link href={section.href} className="block">
                  {card}
                </Link>
              ) : (
                card
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
