import type { InvoiceEvent } from "@/lib/queries/events";

const STATUS_LABEL: Record<string, string> = {
  binnengekomen: "Binnengekomen",
  te_beoordelen: "Te beoordelen",
  goedgekeurd: "Goedgekeurd",
  klaar_voor_betaling: "Klaar voor betaling",
  voldaan: "Voldaan",
  afgewezen: "Afgewezen",
  betwist: "Betwist",
  on_hold: "On hold",
  gearchiveerd: "Gearchiveerd",
};

const REASON_LABEL: Record<string, string> = {
  dubbele_factuur: "dubbele factuur",
  bedrag_klopt_niet: "bedrag klopt niet",
  dienst_niet_geleverd: "dienst niet geleverd",
  kwaliteit_onder_maat: "kwaliteit onder maat",
  verkeerde_adressering: "verkeerde adressering",
  onverwachte_verhoging: "onverwachte verhoging",
  geen_overeenkomst: "geen overeenkomst",
  wachten_op_creditnota: "wachten op creditnota",
  contract_opgezegd: "contract opgezegd",
  overig: "overig",
};

function formatTime(date: string): string {
  return new Date(date).toLocaleString("nl-NL", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Amsterdam",
  });
}

function describeEvent(event: InvoiceEvent): string {
  const payload = (event.payload ?? {}) as Record<string, unknown>;
  if (event.action === "created") {
    const by = String(payload.extracted_by ?? "");
    const conf = payload.confidence;
    if (by) {
      return `Toegevoegd via ${by}${
        typeof conf === "number" ? ` (${Math.round(conf * 100)}% zeker)` : ""
      }`;
    }
    return "Factuur toegevoegd";
  }
  if (event.action === "status_changed") {
    const from = STATUS_LABEL[String(payload.from ?? "")] ?? String(payload.from ?? "");
    const to = STATUS_LABEL[String(payload.to ?? "")] ?? String(payload.to ?? "");
    const reason = payload.reason ? REASON_LABEL[String(payload.reason)] ?? String(payload.reason) : null;
    return `Status van "${from}" naar "${to}"${reason ? ` (${reason})` : ""}`;
  }
  return event.action;
}

export function AuditLog({ events }: { events: InvoiceEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-[color:var(--color-muted-foreground)]">
        Nog geen activiteit.
      </p>
    );
  }
  return (
    <ol className="space-y-2 text-sm">
      {events.map((event) => (
        <li
          key={event.id}
          className="flex items-baseline gap-2 border-l-2 border-[color:var(--color-border)] pl-3"
        >
          <span className="text-xs text-[color:var(--color-muted-foreground)]">
            {formatTime(event.created_at)}
          </span>
          <span className="flex-1">
            <span className="font-medium">{event.actor_label}</span> ·{" "}
            {describeEvent(event)}
            {event.note ? (
              <span className="block text-xs text-[color:var(--color-muted-foreground)]">
                "{event.note}"
              </span>
            ) : null}
          </span>
        </li>
      ))}
    </ol>
  );
}
