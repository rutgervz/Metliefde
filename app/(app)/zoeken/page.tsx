import { SectionPlaceholder } from "@/components/section-placeholder";
import { Search } from "lucide-react";

export default function ZoekenPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 md:px-8 md:py-10">
      <header className="space-y-1">
        <h1 className="text-3xl">Zoeken</h1>
        <p className="text-sm text-[color:var(--color-muted-foreground)]">
          Volledige tekst over leverancier, bedrag, factuurnummer, reden en notities.
        </p>
      </header>

      <div className="flex items-center gap-2 rounded-xl border border-[color:var(--color-border)] bg-white px-4 py-3">
        <Search className="h-4 w-4 text-[color:var(--color-muted-foreground)]" />
        <input
          type="search"
          disabled
          placeholder="Zoeken — actief in Stap 12"
          className="flex-1 bg-transparent text-sm placeholder:text-[color:var(--color-muted-foreground)] focus:outline-none disabled:cursor-not-allowed"
        />
      </div>

      <SectionPlaceholder
        title="Wat hier komt"
        description="Trigram-zoekindexen staan al in het schema. Stap 12 maakt het zoekveld werkend met facetten."
        upcoming={[
          "Filter op sfeer, entiteit, status, datumrange en bedragrange",
          "Resultaten in dezelfde kaartcomponent als de inbox",
          "Zoeken in notities en raw extractie-tekst",
        ]}
      />
    </div>
  );
}
