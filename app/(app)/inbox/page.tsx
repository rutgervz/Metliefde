import { SphereFilter, parseSphere } from "@/components/nav/sphere-filter";
import { SectionPlaceholder } from "@/components/section-placeholder";

const KANBAN_COLUMNS = [
  "Binnengekomen",
  "Te beoordelen",
  "Goedgekeurd",
  "Klaar voor betaling",
  "Betwist",
  "On hold",
];

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ sfeer?: string }>;
}) {
  const params = await searchParams;
  const sphere = parseSphere(params.sfeer);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 md:px-8 md:py-10">
      <header className="space-y-1">
        <h1 className="text-3xl">Inbox</h1>
        <p className="text-sm text-[color:var(--color-muted-foreground)]">
          Facturen die wachten op een beslissing.
        </p>
      </header>

      <SphereFilter basePath="/inbox" active={sphere} />

      <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
        <div className="grid min-w-max grid-flow-col auto-cols-[16rem] gap-3 md:auto-cols-[18rem]">
          {KANBAN_COLUMNS.map((column) => (
            <div
              key={column}
              className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-muted)] p-3"
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-medium">{column}</h2>
                <span className="text-xs text-[color:var(--color-muted-foreground)]">
                  0
                </span>
              </div>
              <p className="rounded-md border border-dashed border-[color:var(--color-border)] bg-white p-4 text-center text-xs text-[color:var(--color-muted-foreground)]">
                Nog leeg
              </p>
            </div>
          ))}
        </div>
      </div>

      <SectionPlaceholder
        title="Wat hier komt"
        description="De inbox vult zich zodra Stap 5 (Gmail-integratie) en Stap 6 (extractie) draaien."
        upcoming={[
          "Kaarten per factuur met leverancier, bedrag en voorgestelde entiteit",
          "Tik om te openen, swipe om voorstel te bevestigen op mobiel",
          "Filter op sfeer werkt al — kolommen filteren straks op de geselecteerde sfeer",
        ]}
      />
    </div>
  );
}
