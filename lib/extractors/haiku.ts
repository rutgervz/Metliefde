import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { FetchedAttachment, FetchedMessage } from "@/lib/google/gmail";

const MODEL = "claude-haiku-4-5-20251001";

const extractionSchema = z.object({
  vendor_name: z.string().nullable(),
  vendor_email_domain: z.string().nullable(),
  document_kind: z
    .enum(["factuur", "creditnota", "bon", "orderbevestiging", "onbekend"])
    .default("onbekend"),
  invoice_number: z.string().nullable(),
  invoice_date: z.string().nullable(),
  due_date: z.string().nullable(),
  amount_gross: z.number().nullable(),
  amount_net: z.number().nullable(),
  amount_vat: z.number().nullable(),
  vat_rate: z.number().nullable(),
  currency: z.string().default("EUR"),
  payment_reference: z.string().nullable(),
  recipient_iban: z.string().nullable(),
  expense_reason: z.string().nullable(),
  is_recurring_hint: z.boolean().default(false),
  suggested_tags: z.array(z.string().min(1).max(40)).default([]),
  confidence: z.number().min(0).max(1).default(0.5),
});

export type ExtractedInvoice = z.infer<typeof extractionSchema>;

const SYSTEM_PROMPT = `Je bent een Nederlands factuur-extractor. Je krijgt een e-mail (onderwerp, afzender, body) en eventueel een PDF-bijlage. Je taak is om de feitelijke factuur-informatie eruit te halen volgens een strict JSON-schema.

Belangrijke regels:
- Gebruik alleen wat letterlijk in het document staat. Niets afleiden of berekenen.
- Datums in YYYY-MM-DD formaat. Nederlandse notatie zoals "12 maart 2026" omzetten naar 2026-03-12.
- Bedragen als getal in euro met punt als decimaalteken. "EUR 123,45" wordt 123.45.
- BTW-percentage als getal: 21% wordt 21.
- Als een veld niet duidelijk in het document staat, geef null terug. Niet gokken.
- document_kind:
  - "factuur" voor reguliere facturen met factuurnummer
  - "creditnota" voor terugboekingen
  - "bon" voor kassabonnen of betaalbewijzen zonder factuurnummer
  - "orderbevestiging" voor mails die alleen een bestelling bevestigen
  - "onbekend" als je niet zeker bent
- expense_reason: een korte omschrijving van waar de uitgave voor was (bijvoorbeeld "Domeinregistratie indigo.ventures 2026"). Maximaal 1 zin.
- suggested_tags: 1 tot 4 korte Nederlandse tags die deze factuur typeren. Kies passend uit:
  - Categorie: "Software", "Telecom", "Internet", "Hosting", "Domeinregistratie", "Reis", "Brandstof", "Parkeren", "Verzekering", "Onderhoud", "Kantoorartikelen", "Eten en drinken", "Representatie", "Drukwerk", "Boekhouding", "Advies", "Energie", "Water"
  - Boekhoud-conventies: "BTW aftrekbaar", "BTW 21%", "BTW 9%", "BTW 0%", "Investering", "Terugkerend abonnement", "Verzamelfactuur", "Doorbelasten", "Buitenland"
  - Aard: "Privé", "Zakelijk"
  Verzin geen tags die niet duidelijk uit de tekst volgen. Geen synoniemen toevoegen.
- confidence: 1.0 als alle hoofdvelden duidelijk zijn, 0.5 als veel onzeker is, lager bij grote twijfel.`;

const TOOLS: Anthropic.Tool[] = [
  {
    name: "lever_factuur_data",
    description:
      "Lever de geextraheerde factuur-data terug volgens het schema.",
    input_schema: {
      type: "object",
      properties: {
        vendor_name: {
          type: ["string", "null"],
          description: "Naam van de leverancier zoals op het document.",
        },
        vendor_email_domain: {
          type: ["string", "null"],
          description: "Domein van de afzender van de mail (zonder @).",
        },
        document_kind: {
          type: "string",
          enum: ["factuur", "creditnota", "bon", "orderbevestiging", "onbekend"],
        },
        invoice_number: { type: ["string", "null"] },
        invoice_date: {
          type: ["string", "null"],
          description: "YYYY-MM-DD",
        },
        due_date: {
          type: ["string", "null"],
          description: "YYYY-MM-DD - betalen voor deze datum",
        },
        amount_gross: {
          type: ["number", "null"],
          description: "Totaalbedrag inclusief BTW.",
        },
        amount_net: { type: ["number", "null"] },
        amount_vat: { type: ["number", "null"] },
        vat_rate: { type: ["number", "null"] },
        currency: { type: "string", default: "EUR" },
        payment_reference: {
          type: ["string", "null"],
          description: "Betalingskenmerk of factuurnummer voor de overschrijving.",
        },
        recipient_iban: {
          type: ["string", "null"],
          description: "IBAN waarop betaald moet worden.",
        },
        expense_reason: {
          type: ["string", "null"],
          description: "Korte omschrijving van de uitgave.",
        },
        is_recurring_hint: {
          type: "boolean",
          description: "True als dit een terugkerend abonnement lijkt.",
        },
        suggested_tags: {
          type: "array",
          items: { type: "string" },
          description: "1 tot 4 korte Nederlandse tags voor deze factuur.",
        },
        confidence: {
          type: "number",
          description: "0 tot 1.",
        },
      },
      required: [
        "document_kind",
        "vendor_name",
        "invoice_number",
        "invoice_date",
        "due_date",
        "amount_gross",
        "amount_net",
        "amount_vat",
        "vat_rate",
        "currency",
        "payment_reference",
        "recipient_iban",
        "is_recurring_hint",
        "suggested_tags",
        "confidence",
      ],
    },
  },
];

function preferredAttachment(
  attachments: FetchedAttachment[],
): FetchedAttachment | null {
  const pdf = attachments.find((a) => a.mimeType === "application/pdf");
  if (pdf) return pdf;
  const image = attachments.find((a) => a.mimeType.startsWith("image/"));
  if (image) return image;
  return attachments[0] ?? null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wrap een Haiku-call met retry op 429 rate-limit responses. Honoreert
 * de retry-after header indien aanwezig, anders exponential backoff.
 * Andere errors gaan direct door.
 */
async function callHaikuWithRetry(
  client: Anthropic,
  body: Anthropic.MessageCreateParamsNonStreaming,
  maxAttempts = 4,
): Promise<Anthropic.Message> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await client.messages.create(body);
    } catch (err) {
      lastError = err;
      const isRateLimit =
        err instanceof Anthropic.APIError && err.status === 429;
      if (!isRateLimit || attempt === maxAttempts) {
        throw err;
      }
      const retryAfterRaw = err.headers?.["retry-after"];
      const retryAfterSeconds =
        typeof retryAfterRaw === "string" ? Number(retryAfterRaw) : NaN;
      const waitMs = Number.isFinite(retryAfterSeconds)
        ? retryAfterSeconds * 1000
        : Math.min(60_000, 4_000 * 2 ** (attempt - 1));
      console.log(`Rate-limit getroffen, wacht ${waitMs}ms voor poging ${attempt + 1}`);
      await sleep(waitMs);
    }
  }
  throw lastError;
}

/**
 * Extraheert factuur-data uit een e-mail met Claude Haiku. Geeft een
 * gestructureerd object terug volgens extractionSchema, of null als
 * de extractie volledig faalt. Confidence wordt door Haiku zelf
 * meegegeven; lage waarden moeten in de UI als 'te beoordelen' worden
 * behandeld.
 */
export async function extractInvoiceWithHaiku(
  message: FetchedMessage,
): Promise<ExtractedInvoice | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY ontbreekt. Voeg toe in Vercel env vars en redeploy.",
    );
  }

  const client = new Anthropic({ apiKey });
  const attachment = preferredAttachment(message.attachments);

  const headerText = [
    `Onderwerp: ${message.subject}`,
    `Afzender: ${message.from} <${message.fromEmail}>`,
    `Domein afzender: ${message.fromDomain}`,
    `Datum: ${message.date}`,
    `Snippet: ${message.snippet}`,
  ].join("\n");

  const bodyText = message.bodyText || message.bodyHtml.replace(/<[^>]*>/g, " ");

  const userContent: Array<
    | { type: "text"; text: string }
    | {
        type: "document";
        source: { type: "base64"; media_type: "application/pdf"; data: string };
      }
    | {
        type: "image";
        source: {
          type: "base64";
          media_type: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
          data: string;
        };
      }
  > = [
    {
      type: "text",
      text: `${headerText}\n\n--- E-mail body ---\n${bodyText.slice(0, 20000)}`,
    },
  ];

  if (attachment) {
    if (attachment.mimeType === "application/pdf") {
      userContent.push({
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: attachment.data.toString("base64"),
        },
      });
    } else if (attachment.mimeType.startsWith("image/")) {
      const mediaType = attachment.mimeType as
        | "image/jpeg"
        | "image/png"
        | "image/webp"
        | "image/gif";
      userContent.push({
        type: "image",
        source: {
          type: "base64",
          media_type: mediaType,
          data: attachment.data.toString("base64"),
        },
      });
    }
  }

  const response = await callHaikuWithRetry(client, {
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    tools: TOOLS,
    tool_choice: { type: "tool", name: "lever_factuur_data" },
    messages: [{ role: "user", content: userContent }],
  });

  const toolBlock = response.content.find((b) => b.type === "tool_use");
  if (!toolBlock || toolBlock.type !== "tool_use") {
    return null;
  }

  const parsed = extractionSchema.safeParse(toolBlock.input);
  if (!parsed.success) {
    console.error("haiku extraction validation faalde", parsed.error);
    return null;
  }
  return parsed.data;
}
