import { createServiceClient } from "@/lib/supabase/service";

/**
 * Slimme tag-suggesties op basis van eerdere facturen van dezelfde
 * leverancier. Geeft tag-namen gesorteerd op frequentie. Wanneer een
 * leverancier nog geen geschiedenis heeft, geeft de functie een lege
 * lijst terug en valt de UI terug op de generieke boekhoud-conventies.
 */
export async function getSuggestedTagsByVendor(
  invoiceId: string,
): Promise<string[]> {
  const admin = createServiceClient();

  const { data: invoice } = await admin
    .from("invoices")
    .select("vendor_id")
    .eq("id", invoiceId)
    .maybeSingle();
  if (!invoice?.vendor_id) return [];

  // Haal alle invoices van deze vendor (behalve deze factuur zelf) en
  // verzamel hun tags. Tellen op tag-naam.
  const { data: peers } = await admin
    .from("invoices")
    .select("id")
    .eq("vendor_id", invoice.vendor_id)
    .neq("id", invoiceId);
  const peerIds = (peers ?? []).map((p) => p.id);
  if (peerIds.length === 0) return [];

  type TagRow = { tag: { name: string } | null };
  const { data: tagRows } = await admin
    .from("invoice_tags")
    .select("tag:tags ( name )")
    .in("invoice_id", peerIds);
  const rows = (tagRows ?? []) as unknown as TagRow[];

  const counts = new Map<string, number>();
  for (const row of rows) {
    const name = row.tag?.name;
    if (!name) continue;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);
}
