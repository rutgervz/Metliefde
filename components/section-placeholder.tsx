/**
 * Tijdelijke placeholder voor secties die we in latere fase 1-stappen
 * vullen met echte data. Houdt de UI consistent.
 */
export function SectionPlaceholder({
  title,
  description,
  upcoming,
}: {
  title: string;
  description: string;
  upcoming: string[];
}) {
  return (
    <section className="rounded-xl border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
      <h2 className="mb-2 text-2xl">{title}</h2>
      <p className="mb-4 text-sm text-[color:var(--color-muted-foreground)]">
        {description}
      </p>
      {upcoming.length > 0 ? (
        <ul className="space-y-1 text-sm text-[color:var(--color-muted-foreground)]">
          {upcoming.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
