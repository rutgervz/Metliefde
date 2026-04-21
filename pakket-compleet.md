# Met Liefde Facturen — compleet pakket voor Claude Code

Dit is het complete pakket in één bestand. Het bevat:

1. Startinstructies voor Claude Code
2. Het projectplan met architectuur, datamodel, curatie, rollen en fasering
3. De Supabase-migratie (SQL) om de database op te zetten
4. Stap-voor-stap implementatie-instructie voor fase 1

Lees alles voordat je begint. Stel vragen waar onduidelijk.

---

# DEEL 1 — Startinstructies voor Claude Code

## Context

Dit is de Met Liefde Facturen-app. Een Progressive Web App voor het cureren, archiveren en beheren van facturen en abonnementen. Gedeeld door Rutger en Annelie, met latere uitbreiding voor een boekhouder. De app werkt op telefoon en laptop via dezelfde URL.

## Doelgroep

Rutger en Annelie zijn geen ontwikkelaars die meebouwen — ze zijn eindgebruikers. Rutger bouwt deze app met jou (Claude Code) vanaf zijn telefoon, zonder terminal. Alle keuzes moeten daarop afgestemd zijn.

## Werkwijze

Geen lokale ontwikkeling. Geen terminal. Alle code gaat naar GitHub via commits in de Claude Code interface. Vercel bouwt automatisch staging-previews bij elke commit. Rutger opent de preview-URL op zijn telefoon en geeft feedback. Jij past aan, commit, nieuwe preview.

Supabase wordt geconfigureerd door Rutger zelf via het Supabase-dashboard. Geef precieze stappen wanneer hij iets moet doen, in plaats van te proberen het voor hem te doen via een terminal.

## Grondregels

Complete vervangingsbestanden bij wijzigingen, geen diffs.
Nederlands in UI-tekst en codecommentaar.
Geen dash- of hyphen-bullets in geproduceerde content.
TypeScript strict mode.
Server Components waar mogelijk, Server Actions voor mutaties.
Geen lokale unit tests in fase 1. Wel zod-validatie in server actions.
Fouten oplossen betekent code aanpassen en opnieuw pushen — niet debuggen in een terminal.

## Stack

Next.js 15 met App Router.
Supabase (database, auth, realtime, storage).
Vercel voor hosting en cron-jobs.
Tailwind CSS met shadcn/ui voor componenten.
Google OAuth (whitelist op twee emailadressen in fase 1).
Gmail API en Google Drive API via googleapis.
Anthropic SDK voor Claude Haiku fallback.
Geen Moneybird, geen bank-integratie in fase 1.

## Volgorde

Lees eerst DEEL 2 (projectplan) volledig. Dit is de waarheid over wat we bouwen.
Lees daarna DEEL 4 (implementatie-instructie) voor concrete stappen.
Gebruik DEEL 3 (SQL-migratie) als eerste Supabase-migratie, ongewijzigd.
Begin met stap 1 uit de implementatie-instructie.
Stel vragen voordat je code schrijft als iets onduidelijk is.

---

# DEEL 2 — Projectplan

# Met Liefde Facturen

## Projectplan voor een gedeelde factuur- en abonnementenbeheer-app

**Voor:** Rutger en Annelie
**Context:** Onderdeel van de bredere Met Liefde family office structuur
**Platform:** Progressive Web App (werkt op laptop en Android-telefoon)
**Stack:** Next.js, Supabase, Vercel, Google Drive API, Gmail API, Claude Haiku API

---

## 1. Filosofie en uitgangspunten

Deze app is een werktuig, geen product. Hij dient jullie gedeelde administratie en hoeft niet schaalbaar te zijn naar andere gebruikers. Daaruit volgt een aantal keuzes die anders zouden zijn bij een commercieel product.

Eén waarheid. Jij en Annelie werken in dezelfde database, zien dezelfde facturen, maken dezelfde toewijzingen. Geen gedeelde mailbox die uit elkaar loopt, geen twee spreadsheets die elkaar tegenspreken.

Fiscaal correct vanaf het begin. Elke factuur die binnenkomt wordt direct gestructureerd op een manier die een accountant of Moneybird zonder tussenkomst kan verwerken. BTW-splitsing, juridische entiteit, bewaarplicht, alles klopt.

Ruimte voor intuïtie. Categorisering en toewijzing zijn nooit volledig automatisch. De app stelt voor, jullie bevestigen. Dat houdt het menselijke oordeel in de lus en voorkomt dat fouten zich onopgemerkt opstapelen.

Eigendom van data. PDFs leven in Google Drive onder jullie eigen account. Metadata in een Supabase-database die jullie kunnen exporteren. Niets zit opgesloten in een third-party SaaS.

Uitbreidbaar zonder herstructurering. De modulaire opbouw maakt het mogelijk om later OCR voor papieren bonnen, Moneybird-synchronisatie, bank-integratie of een rapportagelaag toe te voegen zonder de kern te herschrijven.

---

## 2. Architectuur

### 2.1 Hoog niveau

```
Gmail (Rutger + Annelie)
        │
        ▼  label "Facturen/Inbox" via Gmail filter
Gmail API (watch push of cron-pull)
        │
        ▼
Vercel cron job (elke 15 min)
        │
        ├── Regel-extractor (20+ leveranciers)
        │   │
        │   ▼ bij onbekende afzender of extractie-fout
        ├── Claude Haiku fallback
        │
        ▼
Supabase (metadata) + Google Drive (PDFs)
        │
        ▼
Next.js PWA (web en mobiel)
        │
        ▼
Rutger en Annelie
```

### 2.2 Technische keuzes

**Next.js 15 met App Router op Vercel.** Sluit aan bij de stack die je al kent van Stal Florida. Server Components voor lees-views, Server Actions voor mutaties, API routes voor webhooks en cron.

**Supabase** voor Postgres, auth (Google OAuth met whitelisting op jouw en Annelie's e-mail), Row Level Security, en Realtime voor live-sync wanneer een van jullie een factuur toewijst.

**Google Drive API** voor PDF-archivering in een mappenstructuur die ook zonder de app logisch is, zodat jullie altijd directe toegang hebben.

**Gmail API** met push-notificaties via Google Pub/Sub, met een cron-fallback om de 15 minuten voor het geval een notificatie mist.

**Claude Haiku** voor extractie bij onbekende afzenders. Goedkoop genoeg om nooit een probleem te worden, krachtig genoeg om Nederlandse facturen correct te parsen.

**Tailwind CSS met shadcn/ui** voor de UI. Mobiel-eerst ontwerp, maar ook goed bruikbaar op laptop.

**PWA-manifest en service worker** voor installeerbaarheid, offline-cache van de laatste honderd facturen, en push-notificaties bij nieuwe facturen of goedkeuring-verzoeken.

### 2.3 Architectuurprincipes

**Extractie losgekoppeld van opslag.** De extractie-laag is een aparte module met één interface: email in, gestructureerde factuurdata uit. Dit maakt het later triviaal om OCR toe te voegen, de LLM te wisselen, of meerdere extractors parallel te draaien.

**Adapters voor externe systemen.** Google Drive, Gmail, Claude en later Moneybird zitten achter adapter-interfaces. De rest van de app weet niet welke provider gebruikt wordt. Dit maakt testen eenvoudiger en wissels goedkoper.

**Event-sourced audit log.** Elke mutatie op een factuur (status, entiteit, project, split, reden) wordt als event weggeschreven. Jullie zien wie wat wanneer heeft aangepast. Voor een administratie die door twee mensen wordt bijgehouden is dit onmisbaar.

**Idempotente verwerking.** Dezelfde mail twee keer binnenhalen mag nooit twee facturen opleveren. Hash op combinatie van leverancier-factuurnummer-bedrag plus content-hash van de bijlage. Bij collision: update in plaats van insert.

**Queue voor achtergrondwerk.** Inbox-verwerking, Drive-uploads en Claude-calls lopen via een job queue (Supabase-tabel met status-kolom en een Vercel cron die deze afhandelt). Dit voorkomt dat een trage Claude-call de gebruikersinterface vertraagt en geeft je een natuurlijke plek voor retries.

---

## 3. Datamodel

Dit is de essentiële structuur. Ik houd het compact maar volledig genoeg om v1 direct uit te werken.

### 3.1 Kerntabellen

**entities** — de juridische of administratieve entiteiten waartoe een factuur kan behoren.

```
id              uuid PK
name            text        -- "Privé Rutger", "Boerderij Florida", etc.
legal_name      text        -- volledige naam voor BTW-doeleinden
kvk_number      text        -- null voor privé
vat_number      text        -- null indien niet BTW-plichtig
is_vat_deductible boolean   -- mag BTW teruggevraagd worden
drive_folder_id text        -- Google Drive root folder voor deze entiteit
color           text        -- voor visuele herkenning in UI
active          boolean
created_at      timestamptz
```

**vendors** — leveranciers, met leergedrag.

```
id                       uuid PK
name                     text
email_domain             text UNIQUE   -- match op afzender
kvk_number               text
vat_number               text
default_entity_id        uuid FK → entities     -- voorstel bij nieuwe factuur
default_category         text                   -- voorstel categorie
default_project_id       uuid FK → projects NULL
extraction_rule_key      text                   -- welke regel-extractor gebruiken
last_seen_at             timestamptz
invoice_count            int
created_at               timestamptz
```

**invoices** — de kern van het model.

```
id                    uuid PK
content_hash          text UNIQUE        -- SHA256 van mail+PDF, idempotentie
vendor_id             uuid FK → vendors
entity_id             uuid FK → entities
project_id            uuid FK → projects NULL
status                text              -- 'inbox' | 'assigned' | 'approved' | 'paid' | 'archived'
invoice_number        text
invoice_date          date
due_date              date NULL
amount_gross          numeric(12,2)
amount_net            numeric(12,2)
amount_vat            numeric(12,2)
vat_rate              numeric(5,2) NULL  -- 21.00, 9.00, 0.00
currency              text DEFAULT 'EUR'
payment_method        text NULL         -- 'sepa' | 'creditcard' | 'ideal' | 'manual'
payment_reference     text NULL
paid_at               date NULL
expense_reason        text              -- vrije tekst, waarom deze uitgave
category              text              -- 'software' | 'nutsvoorziening' | 'kantoor' | ...
is_recurring          boolean           -- gedetecteerd als abonnement
subscription_id       uuid FK → subscriptions NULL
drive_file_id         text              -- Google Drive PDF location
gmail_message_id      text              -- oorspronkelijke mail
extracted_by          text              -- 'rule:hostnet' | 'llm:haiku' | 'manual'
extraction_confidence numeric(3,2)      -- 0.00 tot 1.00
needs_review          boolean           -- true bij lage confidence of onbekende velden
requires_approval     boolean           -- bedrag boven drempel
approved_by           text NULL         -- 'rutger' | 'annelie'
approved_at           timestamptz NULL
created_at            timestamptz
updated_at            timestamptz
```

**invoice_splits** — voor facturen verdeeld over meerdere entiteiten.

```
id               uuid PK
invoice_id       uuid FK → invoices
entity_id        uuid FK → entities
percentage       numeric(5,2)      -- bijvoorbeeld 40.00
amount_gross     numeric(12,2)     -- berekend maar persistent voor rapportage
amount_vat       numeric(12,2)
project_id       uuid FK → projects NULL
note             text
```

Als er rijen in invoice_splits staan, dan wordt de entity_id op invoices genegeerd voor rapportage.

**subscriptions** — lopende abonnementen.

```
id                  uuid PK
vendor_id           uuid FK → vendors
entity_id           uuid FK → entities
name                text             -- "Adobe Creative Cloud", "KPN Glasvezel"
description         text
frequency           text             -- 'monthly' | 'quarterly' | 'yearly'
expected_amount     numeric(12,2)
expected_day        int              -- dag van de maand
next_expected_date  date
last_invoice_id     uuid FK → invoices NULL
last_used_at        date NULL        -- handmatig of via usage-tracking
status              text             -- 'active' | 'paused' | 'cancelled' | 'forgotten'
cancellation_url    text NULL
cancellation_notice_days int NULL    -- opzegtermijn
notes               text
created_at          timestamptz
```

**projects** — projecten waaraan facturen toegewezen kunnen worden.

```
id              uuid PK
name            text
entity_id       uuid FK → entities    -- primaire entiteit van het project
status          text                  -- 'active' | 'completed' | 'archived'
budget          numeric(12,2) NULL
start_date      date NULL
end_date        date NULL
description     text
created_at      timestamptz
```

Voorbeelden voor jullie: "Renovatie Us Wente", "Voedselbos Florida", "Spiegel opbouw", "Wandelpony uitbreiding".

**tags** en **invoice_tags** — vrije tagging voor vindbaarheid.

```
tags:
id, name, color, created_at

invoice_tags:
invoice_id, tag_id (composite PK)
```

**events** — audit log.

```
id            uuid PK
invoice_id    uuid FK → invoices
actor         text                    -- 'rutger' | 'annelie' | 'system'
action        text                    -- 'created' | 'assigned_entity' | 'approved' | ...
payload       jsonb                   -- before en after waarden
created_at    timestamptz
```

**jobs** — queue voor achtergrondwerk.

```
id            uuid PK
kind          text                    -- 'fetch_gmail' | 'extract_invoice' | 'upload_drive'
payload       jsonb
status        text                    -- 'pending' | 'running' | 'done' | 'failed'
attempts      int
last_error    text
scheduled_for timestamptz
created_at    timestamptz
```

### 3.2 Row Level Security

Twee gebruikers (jij en Annelie) via Google OAuth, beide met volledige rechten op alle tabellen. RLS beperkt toegang tot geautoriseerde e-mailadressen zodat een gelekte link niemand binnenlaat.

### 3.3 Indexen

Index op invoices.content_hash (UNIQUE), invoices.entity_id, invoices.status, invoices.invoice_date, invoices.vendor_id, vendors.email_domain (UNIQUE), subscriptions.next_expected_date.

---

## 4. Extractie-laag

### 4.1 Regel-gebaseerde extractors

Voor elke veelvoorkomende leverancier een eigen parser. Het patroon is altijd hetzelfde: input is een mail met bijlagen, output is een gestructureerd factuur-object.

De top leveranciers om mee te beginnen, gebaseerd op wat waarschijnlijk in jullie inbox zit:

Hostnet, TransIP, Mijn Domein voor domeinen en hosting. KPN, Ziggo, T-Mobile, Odido voor telecom. Vattenfall, Essent, Eneco, Greenchoice, Pure Energie voor energie. Waterbedrijf Noord, Wetterskip Fryslân voor water. Vodafone, Lebara voor mobiel. Coolblue, Bol, MediaMarkt voor aankopen. Adobe, Google Workspace, Microsoft 365, Anthropic, OpenAI, GitHub, Vercel, Supabase, Cursor voor software. Stripe, Mollie voor payment-providers. Postcode Loterij, verzekeringen (Univé, Nationale Nederlanden, FBTO). Gemeente Schiermonnikoog, Belastingdienst, Waterschapsbelasting voor overheid.

Elke parser kent zijn eigen patroon: sommige leveranciers sturen een HTML-mail met alle velden, andere sturen een PDF-bijlage waar de velden uit gelezen moeten worden. De extractie-laag kiest op basis van email_domain welke parser geladen wordt.

### 4.2 Claude Haiku fallback

Wanneer geen regel-extractor matcht, of wanneer een parser faalt, valt de app terug op Claude Haiku. De prompt geeft Claude de mail-inhoud plus de bijlage en vraagt om een gestructureerd JSON-object volgens het factuur-schema. Extractie-confidence wordt door Claude zelf ingeschat en meegegeven.

Bij lage confidence (onder 0.85) wordt de factuur gemarkeerd met needs_review = true en komt hij in een aparte "Te reviewen"-inbox.

### 4.3 Leren

Na drie succesvolle handmatige correcties voor dezelfde leverancier stelt de app voor om een regel-extractor te genereren. Claude Sonnet krijgt de voorbeelden en schrijft de parser, die jij bevestigt en toevoegt aan de codebase. Dit is een semi-automatische groei van de regel-set zonder dat het veel onderhoud kost.

### 4.4 Detectie van abonnementen

Een factuur wordt als terugkerend gemarkeerd als de combinatie van vendor_id en bedrag-bandbreedte (±10%) minstens twee keer eerder voorkwam met een consistente interval (maandelijks, kwartaal, jaarlijks). De app maakt dan automatisch een subscription-record of koppelt aan een bestaande.

---

## 5. Gebruikersinterface

Mobiel-eerst ontwerp. Op de telefoon is het een verticale lijst, op de laptop een tweekoloms layout met lijst links en detail rechts.

### 5.1 Schermen

**Inbox.** De startpagina. Nieuwe facturen bovenaan, gegroepeerd per dag. Elke kaart toont: leverancier-logo, bedrag, voorgestelde entiteit, status-pil. Swipe naar rechts op mobiel: accepteer voorstel. Swipe naar links: open details.

**Factuur-detail.** Alle velden, bewerkbaar. Een preview van de PDF onderaan. Knoppen voor entiteit toewijzen, project toewijzen, reden invullen, tags, splitsen, markeren als betaald. Audit log onderaan ingeklapt.

**Abonnementen.** Een lijst met alle actieve abonnementen, gegroepeerd per entiteit. Visuele waarschuwing bij opzegtermijn die nadert, bij onverwachte prijsstijging, bij abonnement zonder factuur in afgelopen periode (mogelijk verdwaald of opgezegd).

**Projecten.** Overzicht van projecten met totaal-uitgave. Klik op een project voor alle bijbehorende facturen en een kostenverloop-grafiek.

**Entiteiten.** Overzicht per entiteit met maand- en jaartotalen, top-leveranciers, openstaande facturen.

**Zoeken.** Volledige tekst over leverancier, factuurnummer, reden, tags, bedrag-range, datumrange. Filterbare facet-zoek.

**Rapportage.** Kwartaaloverzicht per entiteit voor BTW-aangifte. Export naar CSV voor Moneybird-import.

**Instellingen.** Entiteiten, leveranciers, goedkeuring-drempels, Gmail-connectie, Drive-connectie.

### 5.2 Interactieprincipes

**Voorstellen, niet beslissen.** Bij elke nieuwe factuur toont de app zijn beste gok voor entiteit, project en categorie. Jullie bevestigen met één tik of corrigeren.

**Snel door de inbox.** De "accepteer voorstel"-flow moet onder de 2 seconden per factuur zitten. Bij twintig facturen per week zijn jullie binnen een minuut klaar.

**Vertrouwen tonen.** Elk voorstel toont waarom: "vorige 4 Adobe-facturen gingen naar Met Liefde → software". Jullie zien de logica en leren de app te vertrouwen of juist te corrigeren.

**Goedkeuringsflow subtiel.** Facturen boven een drempel (bijvoorbeeld €500) krijgen een licht vinkje "wacht op goedkeuring van de ander". De ander ziet in zijn inbox een pushnotificatie. Eén tik, klaar.

**Splitsen is een tweede scherm.** Niet in de hoofd-flow. Wel bereikbaar via een knop "Splitsen" die een modaal opent met entiteiten en percentages.

**Reden van uitgave heeft voorbeelden.** Bij lege reden-veld suggereert de app op basis van vendor en categorie drie veelgebruikte redenen. Jullie kunnen kiezen of zelf typen.

### 5.3 PWA-specifiek

Manifest met icoon, naam "Met Liefde Facturen", theme-color passend bij de visuele identiteit. Service worker cachet de laatste honderd facturen offline. Push-notificaties voor nieuwe facturen boven goedkeuring-drempel, voor abonnement-renewals die opkomen, en voor opzegtermijnen die naderen.

Installatie-hint op eerste bezoek ("Voeg toe aan startscherm voor snelle toegang") zodat jullie niet zelf hoeven te bedenken dat het een PWA is.

---

## 6. Best practices voor financieel management

Dit zijn principes die bepalen of de app over een jaar nog steeds nuttig is, of dat jullie hem dan verlaten hebben.

### 6.1 Fiscale integriteit

**Factuurnummer verplicht.** Een document zonder factuurnummer is geen factuur maar een orderbevestiging. De app onderscheidt dit en vraagt bij twijfel.

**BTW-bedrag losgekoppeld van totaal.** Nooit afleiden of berekenen. Altijd lezen uit het originele document. Bij afwijking: vlag voor review.

**Bewaarplicht zeven jaar.** Alle PDFs blijven in Drive, ook na "archiveren". Archiveren betekent: uit de actieve inbox, niet weggegooid.

**Onderscheid factuur, bon, creditnota.** Drie verschillende types, drie verschillende workflows. Creditnota's worden gekoppeld aan de oorspronkelijke factuur.

**Valutadag, niet factuurdatum, is betaalmoment.** Voor cashflow-overzichten altijd paid_at gebruiken, niet invoice_date.

### 6.2 Categorisering

Begin met een beperkte set categorieën die jullie fiscaal relevant vinden, niet met een uitgebreid schema. Voor elke entiteit kan een andere set gelden. Bijvoorbeeld voor Boerderij Florida: voer, diergeneeskundig, gereedschap, onderhoud opstallen, brandstof. Voor Met Liefde: software, advies, kantoor, representatie. Voor privé: hypotheek, energie, verzekering, persoonlijk.

Categorieën zijn later uit te breiden maar niet lichtzinnig. Elke nieuwe categorie maakt het moeilijker om oude facturen consistent te houden.

### 6.3 Abonnementen-hygiëne

Vier signalen per kwartaal beoordelen:

Het "onbekend abonnement"-signaal. Wanneer een leverancier drie maanden achter elkaar een factuur stuurt die niet aan een bekend abonnement hangt, markeren als potentieel nieuw abonnement.

Het "vergeten abonnement"-signaal. Abonnement met status active maar laatste factuur meer dan 1.5 * frequency geleden. Mogelijk opgezegd zonder dat de admin is bijgewerkt, of onterecht als actief gemarkeerd.

Het "prijsstijging"-signaal. Nieuwe factuur met meer dan 10% afwijking van expected_amount. Altijd even checken: terecht, nieuwe tarief, of foutje.

Het "laatst-gebruikt"-signaal. Jullie kunnen handmatig een last_used_at bijhouden voor abonnementen waar dat nuttig is. Adobe CC die zes maanden niet aan stond is een opzeg-kandidaat.

### 6.4 Projectboekhouding

Een project heeft een budget (optioneel) en een looptijd. Alle toegewezen facturen tellen op naar het project-totaal. Bij overschrijding van 80% van het budget: waarschuwing. Bij 100%: hard signaal.

Projecten sluiten expliciet. Na "afgerond" kunnen er nog naleveringen bijkomen (een factuur die drie maanden later binnenkomt voor werk dat al gedaan was). De app laat dat toe maar markeert het duidelijk.

### 6.5 Goedkeuring met licht ceremonieel

Vaste drempel is een begin, maar geef ruimte voor uitzonderingen. Een factuur van €300 van een nieuwe, onbekende leverancier kan meer aandacht verdienen dan een factuur van €800 van Vattenfall. De app markeert nieuwe leveranciers altijd voor goedkeuring door de ander, ongeacht bedrag.

Goedkeuring is geen verantwoording. Het is: de ander heeft het gezien. Geen blokkade, wel bewustzijn.

### 6.6 Rapportage die ertoe doet

Per kwartaal één overzicht per entiteit: netto-omzet, netto-kosten per categorie, BTW-saldo, openstaande facturen. Dit is genoeg voor het gesprek met je accountant.

Per jaar een vergelijking: dit jaar versus vorig jaar, per categorie per entiteit. Dit is waar patronen zichtbaar worden. Jullie zullen dingen zien die anders onopgemerkt blijven.

Geen dashboards met zeventien widgets. Een dashboard is alleen nuttig als je hem wekelijks bekijkt, en een familie-factuurapp die wekelijks bekeken moet worden is een slecht ontworpen familie-factuurapp.

### 6.7 Export en escape hatches

Op elk moment een volledige export mogelijk in twee formaten: een CSV per entiteit per jaar (voor Moneybird, Excel, Exact), en een ZIP met alle PDFs in de Drive-mappenstructuur. Als jullie ooit van app willen wisselen, of als de app stopt, hebben jullie alles in handen.

---

## 6B. Curatie-werkstroom

Facturen zijn geen passieve archiefstukken. Ze doorlopen een actieve levenscyclus waarin jullie beslissingen nemen: goedkeuren, klaarzetten voor betaling, voldoen, afwijzen, betwisten, uitstellen. De app ondersteunt deze curatie als een eerste-klas functie, niet als bijzaak.

### 6B.1 Statussen

**binnengekomen** — factuur is geëxtraheerd en staat in de inbox, nog niet bekeken.
**te beoordelen** — geopend, maar nog geen beslissing genomen. Komt meestal voor bij ongebruikelijke bedragen of onbekende leveranciers.
**goedgekeurd** — akkoord op de factuur zelf, maar nog niet actief in de betaal-queue.
**klaar voor betaling** — opgenomen in de betaal-batch van deze week of dit moment.
**voldaan** — betaling uitgevoerd en bevestigd.
**afgewezen** — niet akkoord. Reden en opmerking verplicht.
**betwist** — in gesprek met leverancier over bedrag, levering of kwaliteit. Opmerking verplicht, verwachte resolutie-datum optioneel.
**on hold** — tijdelijk geparkeerd, wacht op iets externs (creditnota, terugbelverzoek, akkoord derde partij).
**gearchiveerd** — afgerond en uit het zicht, blijft vindbaar in zoek en rapportage.

### 6B.2 Overgangen

Niet elke overgang is toegestaan. Het patroon:

binnengekomen → te beoordelen / goedgekeurd / afgewezen / betwist / on hold
te beoordelen → goedgekeurd / afgewezen / betwist / on hold
goedgekeurd → klaar voor betaling / on hold / betwist
klaar voor betaling → voldaan / goedgekeurd (terug) / betwist
voldaan → gearchiveerd / betwist (zeldzaam, bij terugvordering)
afgewezen → gearchiveerd / betwist (heropend)
betwist → goedgekeurd / afgewezen / voldaan / on hold
on hold → elke status behalve "binnengekomen"

Afwijzen en betwisten vereisen een gestructureerde reden plus een tekstopmerking. De overige overgangen maken de opmerking optioneel.

### 6B.3 Drie soorten opmerkingen

**Statusopmerking.** Gekoppeld aan een overgang, zichtbaar in de audit log. "Afgewezen door Rutger: dubbele factuur, eerder al voldaan op 3 april."

**Vrije notitie.** Losse opmerking op de factuur zelf, altijd zichtbaar in het detailscherm, ongeacht status. "Annelie: even checken of dit onder Us Wente of Met Liefde hoort." Meerdere notities per factuur mogelijk, elk met auteur en tijdstip.

**Reden van uitgave.** Bestaand veld, blijft apart. Geen opmerking over het proces maar over het waarom van de uitgave. "Vervanging defecte harde schijf studio." Voor fiscale verantwoording en latere reflectie.

### 6B.4 Gestructureerde redenen bij afwijzing en betwisting

Een vast lijstje dat de meest voorkomende gevallen dekt, uit te breiden maar niet lichtzinnig:

dubbele factuur, bedrag klopt niet, dienst niet geleverd, kwaliteit onder maat, verkeerde adressering, onverwachte verhoging, geen overeenkomst, wachten op creditnota, contract opgezegd, overig.

Bij "overig" is de tekstopmerking uiteraard extra belangrijk.

### 6B.5 Betaal-batches

Wanneer jullie meerdere facturen in één sessie naar "klaar voor betaling" tillen, worden ze als batch gegroepeerd. Een batch heeft een datum, een maker, een totaalbedrag per entiteit, en een afgeronde-status. Waarde hiervan:

Zondagavond trek je één lijst open: alle "klaar voor betaling" facturen. Je werkt ze af in je banking-app. Tijdens of na de sessie markeer je ze als voldaan, individueel of in één handeling. De batch wordt gesloten en krijgt een totaaltelling. Drie weken later kan je zien: "onze betaalsessie van 21 april, €2.340 uit Met Liefde, €890 uit Boerderij Florida".

Dit is geen boekhouding, wel overzicht.

### 6B.6 Praktische hulpmiddelen

**SEPA-QR en iDEAL-links.** Waar mogelijk genereert de app per factuur een betaal-QR of een iDEAL-link met vooraf ingevulde velden (IBAN, bedrag, kenmerk). Je scant of tikt, de bank-app neemt het over, geen overtypen.

**Batch-export als SEPA-bestand.** Voor entiteiten waar dit mogelijk is, kan de app een SEPA-bestand genereren dat je in één keer importeert in internet bankieren. Eén import, één goedkeuring in de bank, tientallen betalingen.

**Geen directe betaling vanuit de app.** Bewuste keuze. Geen PSD2-betaalinitiatie, geen bank-API voor uitgaande betalingen. De bank doet dat al perfect, het voegt risico en complexiteit toe zonder wezenlijk voordeel. De app bereidt voor, jullie drukken op de knop.

**Automatische voldaan-detectie (later).** In een latere fase kan de app bankafschriften importeren (CSV uit ING, Rabo, ABN, Bunq) of via een read-only PSD2-koppeling bijgewerkte transactielijsten lezen. Matching op bedrag plus kenmerk plus datum. Factuur wordt voorgesteld als voldaan, jij bevestigt met één tik.

### 6B.7 Weergave in de UI

**Inbox wordt een kanban op mobiel en desktop.** Kolommen (of op mobiel: swipebare tabs): binnengekomen, te beoordelen, goedgekeurd, klaar voor betaling, betwist, on hold. Voldaan en afgewezen verbergen zich standaard maar zijn één tik verderop.

**Statusovergangen zijn één tik.** Op de factuurkaart staat de meest waarschijnlijke volgende actie als primaire knop. Voor een nieuwe factuur: "Goedkeuren". Voor een goedgekeurde: "Klaarzetten voor betaling". Voor een klaargezette: "Markeer als voldaan". Andere overgangen achter een submenu.

**Betwiste facturen hebben een eigen view met urgentie.** Oudste eerst, met verwachte resolutie-datum zichtbaar. Bij overschrijding van die datum: visuele waarschuwing. Dit voorkomt dat een betwiste factuur stil in de stapel verdwijnt.

**On hold werkt met een "wacht op"-veld.** Bij het op hold zetten vraagt de app wat je verwacht: een datum, een gebeurtenis, een reactie van iemand. De factuur komt terug in de actieve inbox wanneer die trigger plaatsvindt of de datum verstrijkt.

### 6B.8 Datamodel-aanpassingen

Aan de `invoices` tabel toevoegen:

```
status                text            -- uitgebreide enum zoals boven
status_reason         text NULL       -- gestructureerde reden bij afwijzen/betwisten
status_note           text NULL       -- vrije opmerking bij laatste overgang
hold_until            date NULL       -- bij status 'on hold'
hold_waiting_for      text NULL       -- wat we verwachten
dispute_expected_resolution_at date NULL
payment_batch_id      uuid FK → payment_batches NULL
bookkeeper_verified_at timestamptz NULL
bookkeeper_verified_by uuid FK → users NULL
bookkeeper_notes      text NULL
```

Nieuwe tabel `invoice_notes`:

```
id              uuid PK
invoice_id      uuid FK → invoices
author_id       uuid FK → users
content         text
created_at      timestamptz
```

Nieuwe tabel `payment_batches`:

```
id              uuid PK
created_by      uuid FK → users
created_at      timestamptz
closed_at       timestamptz NULL
total_amount    numeric(12,2)
note            text NULL
```

De bestaande `events` tabel blijft zoals beschreven en registreert elke statusovergang met payload die voor- en nawaarde bevat plus de opmerking.

---

## 6C. Gebruikers en rollen

De app is vanaf het begin ingericht om meer dan alleen jullie twee te bedienen. Dat betekent geen extra werk vandaag, maar wel dat je straks eenvoudig een boekhouder of adviseur kunt toevoegen zonder migratie.

### 6C.1 Drie rollen

**eigenaar.** Volledige rechten op alles: facturen cureren, goedkeuren, afwijzen, entiteiten en projecten beheren, gebruikers en rechten beheren, exports draaien. Jij en Annelie hebben deze rol.

**boekhouder.** Mag lezen, muteren op beperkte velden (BTW-correcties, categorie-toewijzing, verificatievlag na controle), notities toevoegen, rapportages en exports draaien. Kan geen facturen goedkeuren, afwijzen, betwisten, of gebruikers en entiteiten beheren. Ziet alleen de entiteiten waar hij expliciet toegang tot heeft.

**kijker.** Alleen lezen. Voor een accountant of adviseur die mee mag kijken zonder te muteren. Ook deze rol ziet alleen toegewezen entiteiten.

### 6C.2 Toegang per entiteit

Een boekhouder die alleen de Boerderij Florida-administratie doet hoeft Privé Rutger, Privé Annelie, of Us Wente niet te zien. De koppeltabel `user_entity_access` legt per gebruiker vast welke entiteiten zichtbaar zijn. Voor eigenaren is deze tabel niet nodig: zij hebben impliciet toegang tot alles.

### 6C.3 Werkstroom boekhouder

De boekhouder werkt in een eigen modus van de app die alleen laat zien wat relevant is. Kern van zijn werk:

Ingangspunt is de view "Te verifiëren" — alle facturen met status `voldaan` die nog geen `bookkeeper_verified_at` hebben. Hij loopt deze door, controleert BTW-velden, corrigeert waar nodig, voegt eventueel een notitie toe, en vinkt af als geverifieerd.

Per kwartaal draait hij een export per entiteit in Moneybird-formaat, inclusief alle relevante attachments. Aan de hand daarvan doet hij de aangifte. De export-handeling wordt gelogd in de events-tabel zodat jullie achteraf precies kunnen zien wat er wanneer is uitgevoerd.

Bij fouten of twijfel voegt hij een notitie toe aan de factuur. Jullie zien die notitie automatisch in jullie inbox bij de volgende sessie.

### 6C.4 Waarom dit nu al goed staan moet

Achteraf rol-structuur inbouwen is pijnlijk. Elke actor-referentie in audit logs moet gemigreerd, RLS-policies moeten herschreven, en testcases moeten opnieuw langs. Door het vanaf het begin goed te doen, kost het je nu een paar uur extra en bespaart het je straks een weekend werk.

Het tweede voordeel is filosofisch: het dwingt je om expliciet na te denken over wie wat mag zien. Dat is geen technische vraag maar een vraag over vertrouwen en verantwoordelijkheid binnen de Met Liefde-structuur. Het datamodel vraagt je die vraag vroeg te beantwoorden.

---

## 7. Gefaseerde oplevering

### Fase 1 — Kern (4 tot 6 weken)

Authenticatie met Google OAuth, whitelisted voor jou en Annelie. Supabase datamodel opgezet inclusief gebruikersrollen en per-entiteit-toegang. Gmail-inbox-integratie met label "Facturen/Inbox". Regel-extractors voor de top 10 leveranciers. Claude Haiku fallback. Google Drive archivering. Basis-inbox en factuur-detail. Entiteiten-toewijzing. Volledige statusflow met goedkeuren, klaarzetten, voldaan, afwijzen, betwisten, on hold. Statusopmerkingen en vrije notities. Kanban-inbox. PWA-installatie mogelijk.

Na fase 1 is de app bruikbaar voor dagelijks gebruik, ook al ontbreken features.

### Fase 2 — Compleetheid (3 tot 4 weken)

Abonnementenbeheer volledig. Projecten met budget-tracking. Splitsen over entiteiten. Tagging. Volledige zoekfunctie inclusief zoeken in notities. Audit log zichtbaar in detailscherm. Goedkeuringsflow tussen jou en Annelie met drempel en nieuwe-leverancier-regel. Betaal-batches met SEPA-QR en iDEAL-links. Top 20 leveranciers aan regel-extractors toegevoegd.

### Fase 3 — Inzicht en boekhouder (2 tot 3 weken)

Rapportage per entiteit per kwartaal. Jaarvergelijking. Abonnementen-hygiëne dashboard. CSV-export in Moneybird-formaat per entiteit. Push-notificaties. Boekhouder-modus: eigen view "Te verifiëren", beperkte mutatie-rechten, exports met bijlagen, audit log zichtbaar per actor. Gebruikers- en toegangsbeheer in de instellingen.

### Fase 4 — Mogelijke uitbreidingen

OCR voor papieren kassabonnen via telefoon-camera. Moneybird-API-synchronisatie. Automatische voldaan-detectie via bankafschrift-import of read-only PSD2-koppeling. SEPA-batch-export voor internet bankieren. Rapportage-export naar PDF voor accountant.

---

## 8. Open punten voor beslissing

Dit zijn zaken die ik nu niet voor je invul maar die bij de start helder moeten zijn.

**Welke entiteiten precies.** Ik heb in het model voorbeelden gegeven maar jullie weten welke bestaan. Ik vermoed: Privé Rutger, Privé Annelie, Privé gezamenlijk (hypotheek, kinderen), Met Liefde, Boerderij Florida, Us Wente, Spiegel voor Nederland, eventueel Odyssey-restant.

**Welke projecten vanaf het begin.** Actieve projecten per entiteit die een eigen budget en rapportage verdienen.

**Goedkeuring-drempel.** €500 is een uitgangspunt. Kan hoger of lager. Eventueel verschillende drempels per entiteit.

**Categorieën per entiteit.** Beginset van vijf tot acht per entiteit, uit te breiden.

**Google Drive root.** Ik stel voor: één map "Met Liefde" met daaronder entiteit-mappen. Bestaat er al een structuur, dan sluiten we daarop aan.

**Naamgeving.** "Met Liefde Facturen" is pragmatisch. Een mooiere naam (Schoorsteen, Grootboek, Kasbook) kan later altijd nog.

---

## 9. Wat Claude Code concreet krijgt

Als je dit doorzet naar Claude Code, geef hem dan:

Dit plan in zijn geheel. De stack-keuzes expliciet: Next.js 15 met App Router, Supabase, Vercel, Tailwind plus shadcn/ui, TypeScript, Google Drive en Gmail Node-SDK, Anthropic Node-SDK. Het datamodel als SQL-migratie-bestand. De lijst met regel-extractors die in fase 1 moeten komen. De UI-schermen met voorbeeld-wireframes of referentie-apps.

Stijl-voorkeuren die bij al je werk terugkomen: geen dash-bullet points in UI-tekst, Nederlands in UI en comments, complete vervangingsbestanden bij wijzigingen, terminal-deployments.

Begin Claude Code met fase 1 en laat de rest bewust open tot fase 1 draait.

---

## 10. Afsluitend

Dit is een kleine app met een groot doel. Als hij werkt zoals bedoeld, verdwijnt hij naar de achtergrond en doet zijn werk zonder dat jullie er nog aan denken. Dat is het criterium: niet hoeveel features hij heeft, maar hoeveel tijd hij jullie per maand teruggeeft en hoeveel fouten hij jullie bespaart.

Het diepere punt is dat een familie die een administratie deelt, een taal deelt. De categorieën, de projecten, de entiteiten, de redenen van uitgave zijn niet alleen velden in een database. Ze zijn een manier waarop jullie samen je leven ordenen en begrijpen. De app moet die taal helpen vormen zonder hem op te leggen. Daarom zijn voorstellen en niet automatismen de juiste default, en daarom is audit-log zichtbaarheid belangrijker dan dashboards.

---

# DEEL 3 — Supabase-migratie (SQL)

Dit is de initiële database-migratie. 134 statements, syntactisch gevalideerd. Draai dit ongewijzigd in de Supabase SQL-editor nadat het project is aangemaakt.

```sql
-- =====================================================================
-- Met Liefde Facturen — initiële database-migratie (v2)
-- Supabase / PostgreSQL 15+
-- =====================================================================
--
-- Opbouw:
--   1. Extensies
--   2. Enums
--   3. Gebruikers en rechten
--   4. Kerntabellen
--   5. Indexen
--   6. Helpers voor RLS (current_user_role, has_entity_access, ...)
--   7. Triggers (updated_at, audit events, status-transities)
--   8. Seed-data
--   9. Row Level Security-policies
--  10. Helper-views
--
-- Belangrijke wijzigingen t.o.v. v1:
--   - Gebruikers als eerste-klas entiteit (niet langer een enum)
--   - Rollen: eigenaar, boekhouder, kijker
--   - Per-entiteit-toegang via koppeltabel
--   - RLS-policies filteren echt op toegang, niet meer open voor alle authenticated
--   - Alle actor-referenties nu FK naar users.id
--
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Extensies
-- ---------------------------------------------------------------------

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ---------------------------------------------------------------------
-- 2. Enums
-- ---------------------------------------------------------------------

create type owner_sphere as enum (
    'rutger',
    'annelie',
    'gezamenlijk'
);

create type user_role as enum (
    'eigenaar',
    'boekhouder',
    'kijker'
);

create type invoice_status as enum (
    'binnengekomen',
    'te_beoordelen',
    'goedgekeurd',
    'klaar_voor_betaling',
    'voldaan',
    'afgewezen',
    'betwist',
    'on_hold',
    'gearchiveerd'
);

create type invoice_status_reason as enum (
    'dubbele_factuur',
    'bedrag_klopt_niet',
    'dienst_niet_geleverd',
    'kwaliteit_onder_maat',
    'verkeerde_adressering',
    'onverwachte_verhoging',
    'geen_overeenkomst',
    'wachten_op_creditnota',
    'contract_opgezegd',
    'overig'
);

create type document_kind as enum (
    'factuur',
    'creditnota',
    'bon',
    'orderbevestiging',
    'onbekend'
);

create type payment_method as enum (
    'sepa',
    'creditcard',
    'ideal',
    'incasso',
    'handmatig',
    'onbekend'
);

create type subscription_frequency as enum (
    'wekelijks',
    'maandelijks',
    'kwartaal',
    'halfjaarlijks',
    'jaarlijks'
);

create type subscription_status as enum (
    'actief',
    'gepauzeerd',
    'opgezegd',
    'vergeten'
);

create type project_status as enum (
    'actief',
    'afgerond',
    'gearchiveerd'
);

create type extraction_source as enum (
    'regel',
    'llm_haiku',
    'llm_sonnet',
    'handmatig'
);

create type job_status as enum (
    'wachtend',
    'bezig',
    'gereed',
    'mislukt'
);

-- ---------------------------------------------------------------------
-- 3. Gebruikers en rechten
-- ---------------------------------------------------------------------

-- Gebruikers. id komt overeen met auth.users.id uit Supabase Auth,
-- zodat auth.uid() direct gebruikt kan worden in RLS-policies.
create table users (
    id              uuid primary key,
    email           text not null unique,
    display_name    text not null,
    role            user_role not null default 'kijker',
    active          boolean not null default true,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

-- Per-entiteit-toegang. Eigenaren hebben impliciet toegang tot alles
-- (zie has_entity_access). Boekhouders en kijkers hebben explicite rijen nodig.
create table user_entity_access (
    user_id     uuid not null references users(id) on delete cascade,
    entity_id   uuid not null,
    granted_at  timestamptz not null default now(),
    granted_by  uuid references users(id),
    primary key (user_id, entity_id)
);

-- ---------------------------------------------------------------------
-- 4. Kerntabellen
-- ---------------------------------------------------------------------

create table entities (
    id                              uuid primary key default uuid_generate_v4(),
    name                            text not null unique,
    legal_name                      text,
    kvk_number                      text,
    vat_number                      text,
    owner_sphere                    owner_sphere not null,
    is_vat_deductible               boolean not null default false,
    default_requires_dual_approval  boolean not null default false,
    drive_folder_id                 text,
    color                           text not null default '#888888',
    sort_order                      int not null default 0,
    active                          boolean not null default true,
    notes                           text,
    created_at                      timestamptz not null default now(),
    updated_at                      timestamptz not null default now()
);

alter table user_entity_access
    add constraint user_entity_access_entity_fk
    foreign key (entity_id) references entities(id) on delete cascade;

create table projects (
    id              uuid primary key default uuid_generate_v4(),
    entity_id       uuid not null references entities(id) on delete restrict,
    name            text not null,
    description     text,
    status          project_status not null default 'actief',
    budget          numeric(12,2),
    start_date      date,
    end_date        date,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),
    unique (entity_id, name)
);

create table categories (
    id          uuid primary key default uuid_generate_v4(),
    entity_id   uuid references entities(id) on delete cascade,
    name        text not null,
    description text,
    sort_order  int not null default 0,
    active      boolean not null default true,
    created_at  timestamptz not null default now(),
    unique (entity_id, name)
);

create table vendors (
    id                      uuid primary key default uuid_generate_v4(),
    name                    text not null,
    email_domain            text unique,
    kvk_number              text,
    vat_number              text,
    default_entity_id       uuid references entities(id) on delete set null,
    default_category_id     uuid references categories(id) on delete set null,
    default_project_id      uuid references projects(id) on delete set null,
    extraction_rule_key     text,
    last_seen_at            timestamptz,
    invoice_count           int not null default 0,
    notes                   text,
    created_at              timestamptz not null default now(),
    updated_at              timestamptz not null default now()
);

create table subscriptions (
    id                          uuid primary key default uuid_generate_v4(),
    vendor_id                   uuid not null references vendors(id) on delete restrict,
    entity_id                   uuid not null references entities(id) on delete restrict,
    name                        text not null,
    description                 text,
    frequency                   subscription_frequency not null,
    expected_amount             numeric(12,2) not null,
    expected_day                int,
    next_expected_date          date,
    last_invoice_id             uuid,
    last_used_at                date,
    status                      subscription_status not null default 'actief',
    cancellation_url            text,
    cancellation_notice_days    int,
    notes                       text,
    created_at                  timestamptz not null default now(),
    updated_at                  timestamptz not null default now()
);

create table payment_batches (
    id              uuid primary key default uuid_generate_v4(),
    created_by      uuid not null references users(id) on delete restrict,
    note            text,
    total_amount    numeric(12,2) not null default 0,
    invoice_count   int not null default 0,
    created_at      timestamptz not null default now(),
    closed_at       timestamptz
);

create table invoices (
    id                              uuid primary key default uuid_generate_v4(),

    content_hash                    text not null unique,

    vendor_id                       uuid references vendors(id) on delete set null,
    entity_id                       uuid references entities(id) on delete restrict,
    project_id                      uuid references projects(id) on delete set null,
    category_id                     uuid references categories(id) on delete set null,
    subscription_id                 uuid references subscriptions(id) on delete set null,
    payment_batch_id                uuid references payment_batches(id) on delete set null,

    document_kind                   document_kind not null default 'factuur',

    status                          invoice_status not null default 'binnengekomen',
    status_reason                   invoice_status_reason,
    status_note                     text,
    previous_status                 invoice_status,

    invoice_number                  text,
    invoice_date                    date,
    due_date                        date,

    amount_gross                    numeric(12,2),
    amount_net                      numeric(12,2),
    amount_vat                      numeric(12,2),
    vat_rate                        numeric(5,2),
    currency                        text not null default 'EUR',

    payment_method                  payment_method,
    payment_reference               text,
    recipient_iban                  text,
    paid_at                         date,

    expense_reason                  text,
    requires_approval               boolean not null default false,
    approved_by                     uuid references users(id) on delete set null,
    approved_at                     timestamptz,

    hold_until                      date,
    hold_waiting_for                text,

    dispute_expected_resolution_at  date,

    drive_file_id                   text,
    drive_folder_id                 text,
    gmail_message_id                text,
    original_filename               text,

    extracted_by                    extraction_source not null default 'regel',
    extraction_confidence           numeric(3,2) check (extraction_confidence between 0 and 1),
    needs_review                    boolean not null default false,
    raw_text                        text,

    bookkeeper_verified_at          timestamptz,
    bookkeeper_verified_by          uuid references users(id) on delete set null,
    bookkeeper_notes                text,

    created_at                      timestamptz not null default now(),
    updated_at                      timestamptz not null default now()
);

alter table subscriptions
    add constraint subscriptions_last_invoice_fk
    foreign key (last_invoice_id) references invoices(id) on delete set null;

create table invoice_splits (
    id              uuid primary key default uuid_generate_v4(),
    invoice_id      uuid not null references invoices(id) on delete cascade,
    entity_id       uuid not null references entities(id) on delete restrict,
    project_id      uuid references projects(id) on delete set null,
    category_id     uuid references categories(id) on delete set null,
    percentage      numeric(5,2) not null check (percentage > 0 and percentage <= 100),
    amount_gross    numeric(12,2) not null,
    amount_vat      numeric(12,2) not null,
    note            text,
    created_at      timestamptz not null default now()
);

create table invoice_notes (
    id              uuid primary key default uuid_generate_v4(),
    invoice_id      uuid not null references invoices(id) on delete cascade,
    author_id       uuid not null references users(id) on delete restrict,
    content         text not null,
    created_at      timestamptz not null default now()
);

create table tags (
    id          uuid primary key default uuid_generate_v4(),
    name        text not null unique,
    color       text not null default '#888888',
    created_at  timestamptz not null default now()
);

create table invoice_tags (
    invoice_id  uuid not null references invoices(id) on delete cascade,
    tag_id      uuid not null references tags(id) on delete cascade,
    created_at  timestamptz not null default now(),
    primary key (invoice_id, tag_id)
);

create table events (
    id              uuid primary key default uuid_generate_v4(),
    invoice_id      uuid references invoices(id) on delete cascade,
    actor_id        uuid references users(id) on delete set null,
    actor_label     text not null,
    action          text not null,
    payload         jsonb not null default '{}'::jsonb,
    note            text,
    created_at      timestamptz not null default now()
);

create table jobs (
    id              uuid primary key default uuid_generate_v4(),
    kind            text not null,
    payload         jsonb not null default '{}'::jsonb,
    status          job_status not null default 'wachtend',
    attempts        int not null default 0,
    max_attempts    int not null default 5,
    last_error      text,
    scheduled_for   timestamptz not null default now(),
    started_at      timestamptz,
    finished_at     timestamptz,
    created_at      timestamptz not null default now()
);

create table extraction_samples (
    id              uuid primary key default uuid_generate_v4(),
    vendor_id       uuid references vendors(id) on delete cascade,
    email_subject   text,
    email_body      text,
    attachment_text text,
    corrected_json  jsonb,
    created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 5. Indexen
-- ---------------------------------------------------------------------

create index idx_invoices_status                on invoices(status);
create index idx_invoices_entity                on invoices(entity_id);
create index idx_invoices_vendor                on invoices(vendor_id);
create index idx_invoices_project               on invoices(project_id);
create index idx_invoices_subscription          on invoices(subscription_id);
create index idx_invoices_payment_batch         on invoices(payment_batch_id);
create index idx_invoices_invoice_date          on invoices(invoice_date desc);
create index idx_invoices_due_date              on invoices(due_date)
    where status in ('goedgekeurd','klaar_voor_betaling');
create index idx_invoices_hold_until            on invoices(hold_until)
    where status = 'on_hold';
create index idx_invoices_needs_review          on invoices(created_at desc)
    where needs_review = true;
create index idx_invoices_bookkeeper_pending    on invoices(invoice_date desc)
    where status = 'voldaan' and bookkeeper_verified_at is null;

create index idx_invoices_trgm_expense_reason   on invoices using gin (expense_reason gin_trgm_ops);
create index idx_invoices_trgm_invoice_number   on invoices using gin (invoice_number gin_trgm_ops);
create index idx_invoices_trgm_raw_text         on invoices using gin (raw_text gin_trgm_ops);
create index idx_invoice_notes_trgm_content     on invoice_notes using gin (content gin_trgm_ops);

create index idx_vendors_domain                 on vendors(email_domain);
create index idx_subscriptions_next_expected    on subscriptions(next_expected_date)
    where status = 'actief';
create index idx_events_invoice                 on events(invoice_id, created_at desc);
create index idx_events_actor                   on events(actor_id, created_at desc);
create index idx_jobs_pending                   on jobs(scheduled_for)
    where status = 'wachtend';
create index idx_invoice_tags_tag               on invoice_tags(tag_id);
create index idx_user_entity_access_user        on user_entity_access(user_id);
create index idx_user_entity_access_entity      on user_entity_access(entity_id);

-- ---------------------------------------------------------------------
-- 6. Helpers voor RLS
-- ---------------------------------------------------------------------

create or replace function current_user_role() returns user_role
language sql stable security definer as $$
    select role from users where id = auth.uid() and active = true;
$$;

create or replace function has_entity_access(target_entity_id uuid) returns boolean
language plpgsql stable security definer as $$
declare
    my_role user_role;
begin
    if target_entity_id is null then
        return false;
    end if;

    select role into my_role from users where id = auth.uid() and active = true;

    if my_role is null then
        return false;
    end if;

    if my_role = 'eigenaar' then
        return true;
    end if;

    return exists (
        select 1 from user_entity_access
        where user_id = auth.uid()
          and entity_id = target_entity_id
    );
end;
$$;

create or replace function can_mutate() returns boolean
language sql stable security definer as $$
    select coalesce(
        (select role in ('eigenaar','boekhouder')
         from users where id = auth.uid() and active = true),
        false
    );
$$;

create or replace function is_owner() returns boolean
language sql stable security definer as $$
    select coalesce(
        (select role = 'eigenaar' from users where id = auth.uid() and active = true),
        false
    );
$$;

-- ---------------------------------------------------------------------
-- 7. Triggers
-- ---------------------------------------------------------------------

create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger trg_users_updated_at            before update on users
    for each row execute function set_updated_at();
create trigger trg_entities_updated_at         before update on entities
    for each row execute function set_updated_at();
create trigger trg_projects_updated_at         before update on projects
    for each row execute function set_updated_at();
create trigger trg_vendors_updated_at          before update on vendors
    for each row execute function set_updated_at();
create trigger trg_subscriptions_updated_at    before update on subscriptions
    for each row execute function set_updated_at();
create trigger trg_invoices_updated_at         before update on invoices
    for each row execute function set_updated_at();

create or replace function log_invoice_status_change() returns trigger
language plpgsql as $$
declare
    current_label text;
begin
    if tg_op = 'UPDATE' and old.status is distinct from new.status then
        select coalesce(display_name, 'systeem') into current_label
        from users where id = auth.uid();

        insert into events (invoice_id, actor_id, actor_label, action, payload, note)
        values (
            new.id,
            auth.uid(),
            coalesce(current_label, 'systeem'),
            'status_changed',
            jsonb_build_object(
                'from', old.status,
                'to', new.status,
                'reason', new.status_reason
            ),
            new.status_note
        );
        new.previous_status := old.status;
    end if;
    return new;
end;
$$;

create trigger trg_invoices_status_change      before update on invoices
    for each row execute function log_invoice_status_change();

create or replace function log_invoice_created() returns trigger
language plpgsql as $$
declare
    current_label text;
begin
    select coalesce(display_name, 'systeem') into current_label
    from users where id = auth.uid();

    insert into events (invoice_id, actor_id, actor_label, action, payload)
    values (
        new.id,
        auth.uid(),
        coalesce(current_label, 'systeem'),
        'created',
        jsonb_build_object(
            'extracted_by', new.extracted_by,
            'confidence', new.extraction_confidence,
            'vendor_id', new.vendor_id
        )
    );
    return new;
end;
$$;

create trigger trg_invoices_created            after insert on invoices
    for each row execute function log_invoice_created();

create or replace function update_payment_batch_totals() returns trigger
language plpgsql as $$
declare
    target_batch uuid;
begin
    if tg_op = 'UPDATE' then
        if old.payment_batch_id is not null then
            target_batch := old.payment_batch_id;
            update payment_batches
            set
                total_amount = coalesce((select sum(amount_gross)
                                         from invoices
                                         where payment_batch_id = target_batch), 0),
                invoice_count = (select count(*)
                                 from invoices
                                 where payment_batch_id = target_batch)
            where id = target_batch;
        end if;
        if new.payment_batch_id is not null and new.payment_batch_id is distinct from old.payment_batch_id then
            target_batch := new.payment_batch_id;
            update payment_batches
            set
                total_amount = coalesce((select sum(amount_gross)
                                         from invoices
                                         where payment_batch_id = target_batch), 0),
                invoice_count = (select count(*)
                                 from invoices
                                 where payment_batch_id = target_batch)
            where id = target_batch;
        end if;
    end if;
    return new;
end;
$$;

create trigger trg_invoice_batch_totals        after update of payment_batch_id on invoices
    for each row execute function update_payment_batch_totals();

create or replace function update_vendor_stats() returns trigger
language plpgsql as $$
begin
    if new.vendor_id is not null then
        update vendors
        set
            invoice_count = (select count(*) from invoices where vendor_id = new.vendor_id),
            last_seen_at = now()
        where id = new.vendor_id;
    end if;
    return new;
end;
$$;

create trigger trg_vendor_stats                after insert on invoices
    for each row execute function update_vendor_stats();

-- ---------------------------------------------------------------------
-- 8. Seed-data
-- ---------------------------------------------------------------------

insert into entities (name, legal_name, owner_sphere, is_vat_deductible, default_requires_dual_approval, color, sort_order) values
    ('Annelie privé',           null,                       'annelie',     false, false, '#EC4899', 10),
    ('Apple Tree Beheer BV',    'Apple Tree Beheer B.V.',   'annelie',     true,  false, '#DB2777', 20),
    ('Rutger privé',            null,                       'rutger',      false, false, '#6B7280', 30),
    ('Indigo Ventures BV',      'Indigo Ventures B.V.',     'rutger',      true,  false, '#4B5563', 40),
    ('Gezin privé',             null,                       'gezamenlijk', false, false, '#8B5CF6', 50),
    ('Stichting Us Wente i.o.', 'Stichting Us Wente i.o.',  'gezamenlijk', false, true,  '#0891B2', 60);

insert into categories (entity_id, name, sort_order) values
    (null, 'Software en SaaS',              10),
    (null, 'Telecom en internet',           20),
    (null, 'Energie en nutsvoorziening',    30),
    (null, 'Kantoor en materialen',         40),
    (null, 'Advies en diensten',            50),
    (null, 'Reis en representatie',         60),
    (null, 'Onderhoud en reparatie',        70),
    (null, 'Verzekeringen',                 80),
    (null, 'Belastingen',                   90),
    (null, 'Abonnementen en lidmaatschappen', 100),
    (null, 'Overig',                        999);

-- Entiteit-specifieke categorieën voor Apple Tree Beheer BV (holding)
insert into categories (entity_id, name, sort_order)
select id, cat, sort_order from entities,
    (values
        ('Management fee',              10),
        ('Deelnemingen',                20),
        ('Bestuursvergoeding',          30),
        ('Holding-administratie',       40)
    ) as c(cat, sort_order)
where entities.name = 'Apple Tree Beheer BV';

-- Entiteit-specifieke categorieën voor Indigo Ventures BV
insert into categories (entity_id, name, sort_order)
select id, cat, sort_order from entities,
    (values
        ('Investeringen',               10),
        ('Advies en consultancy',       20),
        ('Onderzoek en ontwikkeling',   30),
        ('Marketing en representatie',  40)
    ) as c(cat, sort_order)
where entities.name = 'Indigo Ventures BV';

-- Entiteit-specifieke categorieën voor Stichting Us Wente i.o.
insert into categories (entity_id, name, sort_order)
select id, cat, sort_order from entities,
    (values
        ('Oprichtingskosten',           10),
        ('Retreats en gasten',          20),
        ('Programma en inhoud',         30),
        ('Onderhoud locatie',           40)
    ) as c(cat, sort_order)
where entities.name = 'Stichting Us Wente i.o.';

-- Entiteit-specifieke categorieën voor Gezin privé
insert into categories (entity_id, name, sort_order)
select id, cat, sort_order from entities,
    (values
        ('Boodschappen',                10),
        ('Kinderen en school',          20),
        ('Hypotheek en huur',           30),
        ('Energie en water',            40),
        ('Verzekering en zorg',         50),
        ('Vakantie en uitjes',          60),
        ('Huishouden',                  70)
    ) as c(cat, sort_order)
where entities.name = 'Gezin privé';

insert into tags (name, color) values
    ('Aftrekbaar',      '#10B981'),
    ('Investering',     '#3B82F6'),
    ('Terugkerend',     '#8B5CF6'),
    ('Urgent',          '#EF4444'),
    ('Nieuw abonnement','#F59E0B'),
    ('Check Annelie',   '#EC4899'),
    ('Check Rutger',    '#0891B2');

-- Gebruikers worden handmatig aangemaakt nadat ze via Supabase Auth zijn geregistreerd.
-- Voorbeeld (na eerste login):
--   insert into users (id, email, display_name, role) values
--       ('<auth_uuid_rutger>',  'rutger@...',  'Rutger',  'eigenaar'),
--       ('<auth_uuid_annelie>', 'annelie@...', 'Annelie', 'eigenaar');

-- ---------------------------------------------------------------------
-- 9. Row Level Security
-- ---------------------------------------------------------------------

alter table users               enable row level security;
alter table user_entity_access  enable row level security;
alter table entities            enable row level security;
alter table projects            enable row level security;
alter table categories          enable row level security;
alter table vendors             enable row level security;
alter table subscriptions       enable row level security;
alter table payment_batches     enable row level security;
alter table invoices            enable row level security;
alter table invoice_splits      enable row level security;
alter table invoice_notes       enable row level security;
alter table tags                enable row level security;
alter table invoice_tags        enable row level security;
alter table events              enable row level security;
alter table jobs                enable row level security;
alter table extraction_samples  enable row level security;

create policy users_self_select on users
    for select to authenticated
    using (id = auth.uid() or is_owner());

create policy users_owner_all on users
    for all to authenticated
    using (is_owner())
    with check (is_owner());

create policy uea_self_select on user_entity_access
    for select to authenticated
    using (user_id = auth.uid() or is_owner());

create policy uea_owner_all on user_entity_access
    for all to authenticated
    using (is_owner())
    with check (is_owner());

create policy entities_select on entities
    for select to authenticated
    using (has_entity_access(id));

create policy entities_owner_mutate on entities
    for all to authenticated
    using (is_owner())
    with check (is_owner());

create policy projects_select on projects
    for select to authenticated
    using (has_entity_access(entity_id));

create policy projects_owner_mutate on projects
    for all to authenticated
    using (is_owner())
    with check (is_owner());

create policy categories_select on categories
    for select to authenticated
    using (entity_id is null or has_entity_access(entity_id));

create policy categories_owner_mutate on categories
    for all to authenticated
    using (is_owner())
    with check (is_owner());

create policy vendors_select on vendors
    for select to authenticated
    using (true);

create policy vendors_mutate on vendors
    for all to authenticated
    using (can_mutate())
    with check (can_mutate());

create policy subscriptions_select on subscriptions
    for select to authenticated
    using (has_entity_access(entity_id));

create policy subscriptions_owner_mutate on subscriptions
    for all to authenticated
    using (is_owner())
    with check (is_owner());

create policy payment_batches_select on payment_batches
    for select to authenticated
    using (true);

create policy payment_batches_owner_mutate on payment_batches
    for all to authenticated
    using (is_owner())
    with check (is_owner());

create policy invoices_select on invoices
    for select to authenticated
    using (entity_id is null or has_entity_access(entity_id));

create policy invoices_owner_all on invoices
    for all to authenticated
    using (is_owner())
    with check (is_owner());

create policy invoices_bookkeeper_update on invoices
    for update to authenticated
    using (
        current_user_role() = 'boekhouder'
        and (entity_id is null or has_entity_access(entity_id))
    )
    with check (
        current_user_role() = 'boekhouder'
        and (entity_id is null or has_entity_access(entity_id))
    );

create policy invoices_insert_mutators on invoices
    for insert to authenticated
    with check (can_mutate());

create policy invoice_splits_select on invoice_splits
    for select to authenticated
    using (
        exists (
            select 1 from invoices i
            where i.id = invoice_splits.invoice_id
              and (i.entity_id is null or has_entity_access(i.entity_id))
        )
    );

create policy invoice_splits_owner_mutate on invoice_splits
    for all to authenticated
    using (is_owner())
    with check (is_owner());

create policy invoice_notes_select on invoice_notes
    for select to authenticated
    using (
        exists (
            select 1 from invoices i
            where i.id = invoice_notes.invoice_id
              and (i.entity_id is null or has_entity_access(i.entity_id))
        )
    );

create policy invoice_notes_insert on invoice_notes
    for insert to authenticated
    with check (
        author_id = auth.uid()
        and exists (
            select 1 from invoices i
            where i.id = invoice_notes.invoice_id
              and (i.entity_id is null or has_entity_access(i.entity_id))
        )
    );

create policy invoice_notes_update_own on invoice_notes
    for update to authenticated
    using (author_id = auth.uid() or is_owner())
    with check (author_id = auth.uid() or is_owner());

create policy invoice_notes_delete_own on invoice_notes
    for delete to authenticated
    using (author_id = auth.uid() or is_owner());

create policy tags_select on tags
    for select to authenticated
    using (true);

create policy tags_mutate on tags
    for all to authenticated
    using (can_mutate())
    with check (can_mutate());

create policy invoice_tags_select on invoice_tags
    for select to authenticated
    using (
        exists (
            select 1 from invoices i
            where i.id = invoice_tags.invoice_id
              and (i.entity_id is null or has_entity_access(i.entity_id))
        )
    );

create policy invoice_tags_mutate on invoice_tags
    for all to authenticated
    using (can_mutate())
    with check (can_mutate());

create policy events_select on events
    for select to authenticated
    using (
        invoice_id is null
        or exists (
            select 1 from invoices i
            where i.id = events.invoice_id
              and (i.entity_id is null or has_entity_access(i.entity_id))
        )
    );

-- JOBS: RLS staat aan, geen policy = geen toegang voor normale gebruikers.
-- Alleen service_role kan queue-items aanmaken en oppakken.

create policy extraction_samples_owner on extraction_samples
    for all to authenticated
    using (is_owner())
    with check (is_owner());

-- ---------------------------------------------------------------------
-- 10. Helper-views
-- ---------------------------------------------------------------------

create or replace view v_workload_by_status as
select
    status,
    count(*) as invoice_count,
    coalesce(sum(amount_gross), 0) as total_amount
from invoices
where status not in ('voldaan','gearchiveerd')
group by status
order by array_position(
    array['binnengekomen','te_beoordelen','goedgekeurd','klaar_voor_betaling','betwist','on_hold','afgewezen']::invoice_status[],
    status
);

create or replace view v_workload_by_entity as
select
    e.id as entity_id,
    e.name as entity_name,
    e.owner_sphere,
    count(i.id) as open_count,
    coalesce(sum(case when i.status = 'klaar_voor_betaling' then i.amount_gross else 0 end), 0) as ready_to_pay,
    coalesce(sum(case when i.status = 'goedgekeurd' then i.amount_gross else 0 end), 0) as approved_pending
from entities e
left join invoices i
    on i.entity_id = e.id
    and i.status not in ('voldaan','gearchiveerd','afgewezen')
where e.active = true
group by e.id, e.name, e.owner_sphere
order by e.sort_order;

-- Werkvoorraad per sfeer (Rutger, Annelie, gezamenlijk)
create or replace view v_workload_by_sphere as
select
    e.owner_sphere,
    count(i.id) as open_count,
    coalesce(sum(case when i.status = 'klaar_voor_betaling' then i.amount_gross else 0 end), 0) as ready_to_pay,
    coalesce(sum(case when i.status = 'goedgekeurd' then i.amount_gross else 0 end), 0) as approved_pending,
    coalesce(sum(case when i.status in ('binnengekomen','te_beoordelen') then i.amount_gross else 0 end), 0) as incoming
from entities e
left join invoices i
    on i.entity_id = e.id
    and i.status not in ('voldaan','gearchiveerd','afgewezen')
where e.active = true
group by e.owner_sphere;

create or replace view v_subscription_alerts as
select
    s.*,
    case
        when s.status = 'actief' and s.next_expected_date < current_date - interval '7 days' then 'mogelijk_vergeten'
        when s.status = 'actief' and s.last_used_at is not null and s.last_used_at < current_date - interval '6 months' then 'ongebruikt'
        else null
    end as alert_kind
from subscriptions s
where s.status = 'actief'
  and (
        s.next_expected_date < current_date - interval '7 days'
        or (s.last_used_at is not null and s.last_used_at < current_date - interval '6 months')
  );

create or replace view v_bookkeeper_pending as
select
    i.id,
    i.invoice_number,
    i.invoice_date,
    i.amount_gross,
    i.amount_vat,
    i.vat_rate,
    i.entity_id,
    e.name as entity_name,
    v.name as vendor_name,
    c.name as category_name
from invoices i
left join entities e      on e.id = i.entity_id
left join vendors v       on v.id = i.vendor_id
left join categories c    on c.id = i.category_id
where i.status = 'voldaan'
  and i.bookkeeper_verified_at is null
order by i.invoice_date desc;

-- Einde migratie
```

---

# DEEL 4 — Implementatie-instructie voor fase 1

## Doel van fase 1

Een werkende PWA die Rutger en Annelie kunnen installeren op telefoon en laptop, waarmee ze facturen uit Gmail kunnen binnenhalen, cureren via de volledige statusflow, archiveren in Google Drive, en toewijzen aan entiteiten.

Na fase 1 is de app bruikbaar voor dagelijks gebruik, ook al ontbreken abonnementenbeheer, projecten, rapportage en boekhouder-modus.

## Opleveringsvolgorde

Volg deze volgorde strikt. Elke stap levert iets wat op Vercel deploybaar is en in staging getest kan worden.

### Stap 1: Project en Supabase

Maak een Next.js 15 project aan met App Router, TypeScript strict, Tailwind en shadcn/ui.
Installeer dependencies: @supabase/supabase-js, @supabase/ssr, @anthropic-ai/sdk, googleapis, google-auth-library, date-fns, zod, react-hook-form.
Maak een Supabase-project aan (dit doet Rutger zelf via het dashboard, geef precieze stappen).
Draai de migratie `migration-001-init.sql` via de Supabase SQL-editor.
Voeg Rutger en Annelie handmatig toe aan de `users`-tabel met rol `eigenaar` nadat ze via Auth zijn geregistreerd.
Configureer omgevingsvariabelen op Vercel: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, ALLOWED_EMAILS (comma-separated whitelist).

### Stap 2: Auth-laag

Implementeer Google OAuth via Supabase Auth met whitelisting op ALLOWED_EMAILS.
Login-pagina die alleen de Google-knop toont. Bij login: controleer of e-mail in whitelist staat, anders sign out en tonen "geen toegang".
Middleware die niet-ingelogde bezoekers naar login doorstuurt voor alle routes behalve `/login`.
Automatische synchronisatie tussen auth.users en public.users: bij eerste login een rij in `users` aanmaken met display_name uit Google-profiel en rol `eigenaar`.

### Stap 3: Layout en navigatie

Mobile-first layout met bottom-navigatie op mobiel en sidebar op desktop. Zes hoofdsecties: Inbox, Entiteiten, Zoeken, Instellingen. Later komt daar Abonnementen, Projecten en Rapportage bij. Voor fase 1 tonen we die nog niet.
Installeerbaarheid via PWA manifest.json en service worker. Theme color uit het ontwerp, icoon nog als placeholder.
Op het inbox-scherm bovenaan de drie sferen (Annelie, Rutger, Samen) als pillen-filter.

### Stap 4: Datamodel-laag (TypeScript)

Genereer TypeScript-types uit het Supabase-schema via `supabase gen types`. Plaats in `lib/database.types.ts`.
Maak een `lib/queries/` map met typed query-functies per domein: invoices, entities, vendors, etc.
Maak een `lib/mutations/` map met typed mutation-functies. Iedere mutation zet correct de `auth.uid()` in context zodat triggers de juiste actor registreren.
Gebruik server actions voor mutaties waar mogelijk. Gebruik React Server Components voor lees-views.

### Stap 5: Gmail-integratie

Implementeer Google OAuth-scope voor Gmail read-only en Drive.file scope.
Sla access- en refresh-tokens versleuteld op in een tabel `user_google_tokens` (nog niet in migratie, voeg toe als migratie 002).
Maak een Gmail-filter aan bij eerste connect: label "Facturen/Inbox" dat automatisch op binnenkomende mail wordt toegepast op basis van afzender-domein (default lege set, gebruiker vult dit uit in instellingen).
Vercel cron-job elke 15 minuten: haalt gelabelde mails op sinds laatste run, schrijft elke mail als `jobs`-record met kind `extract_invoice`.

### Stap 6: Extractie-laag

Maak `lib/extractors/` met de gedeelde interface:
```typescript
export type ExtractedInvoice = {
  vendor_email_domain: string;
  vendor_name: string;
  document_kind: 'factuur' | 'creditnota' | 'bon' | 'orderbevestiging' | 'onbekend';
  invoice_number: string | null;
  invoice_date: string | null;
  due_date: string | null;
  amount_gross: number | null;
  amount_net: number | null;
  amount_vat: number | null;
  vat_rate: number | null;
  currency: string;
  payment_reference: string | null;
  recipient_iban: string | null;
  is_recurring_hint: boolean;
  confidence: number;
}

export interface Extractor {
  key: string;
  matches(email: GmailMessage): boolean;
  extract(email: GmailMessage): Promise<ExtractedInvoice>;
}
```

Implementeer in fase 1 drie regel-extractors als voorbeeld: Hostnet, KPN, Coolblue. Dit zijn patronen waar de rest op kunnen worden gemodelleerd.
Implementeer Claude Haiku fallback: wanneer geen extractor matcht of confidence te laag, stuur email-body plus attachments naar Haiku met een gestructureerde prompt en JSON-output-schema.
Na extractie: content_hash berekenen (SHA256 van vendor + invoice_number + amount_gross), check op duplicaat, anders insert in `invoices`.

### Stap 7: Google Drive archivering

Bij nieuwe factuur: upload de PDF-bijlage (of een gegenereerde PDF van de mailbody als er geen bijlage is) naar Drive.
Mappenstructuur: `/Met Liefde/<entity_name>/<jaar>/<maand>/<vendor>_<invoice_number>.pdf`. Als entity_id nog null is, gebruik `/Met Liefde/_Nieuw/<jaar>/<maand>/`.
Schrijf `drive_file_id` en `drive_folder_id` terug naar de factuur. Bij entity-wijziging later: verplaats het bestand.

### Stap 8: Inbox-UI (kanban)

Hoofdscherm na login. Kolommen: Binnengekomen, Te beoordelen, Goedgekeurd, Klaar voor betaling, Betwist, On hold. Voldaan en afgewezen verbergen zich standaard.
Op mobiel: horizontaal swipebare tabs, niet kolommen naast elkaar. Op desktop: echte kolommen.
Elke kaart toont: vendor-naam, bedrag, factuurdatum, voorgestelde entiteit (gekleurde pil), due date indien relevant.
Tik op kaart opent detail-view. Swipe rechts op mobiel: accepteer voorstel (status → goedgekeurd, entiteit bevestigd). Swipe links: open detail.
Sfeer-filter bovenaan: Alle, Annelie, Rutger, Samen.

### Stap 9: Detail-view en curatie

Volledige factuur-details in een scrollbare view. Bovenaan: grote primaire knop voor de meest waarschijnlijke volgende actie. Onder: submenu met alle overige statusovergangen.
Bewerkbare velden: entity_id, category_id, expense_reason, project_id (fase 2), invoice_number, bedragen (als correctie nodig), due_date.
Bij status-wijziging naar Afgewezen of Betwist: modaal met verplichte reden-keuze uit enum en optionele vrije tekstopmerking.
Bij status-wijziging naar On hold: modaal met hold_until en hold_waiting_for verplicht.
PDF-preview onderaan via embed of link naar Drive.
Notities-sectie: chronologisch, auteur en tijdstip zichtbaar, elke gebruiker kan toevoegen.
Audit log onderaan, ingeklapt: toont alle events uit `events`-tabel gekoppeld aan deze factuur.

### Stap 10: Goedkeuringsflow

Bij facturen boven een drempel (configureerbaar per entiteit, default €500): flag `requires_approval = true`.
Voor entiteiten met `default_requires_dual_approval = true` (Us Wente i.o.): altijd dubbele goedkeuring nodig ongeacht bedrag.
Bij "goedkeuren" door eerste persoon: status blijft op `goedgekeurd` maar `approved_by` wordt gevuld. Pas na bevestiging door tweede persoon gaat status door naar `klaar_voor_betaling`.
Push-notificatie naar partner (fase 2 — in fase 1 alleen visueel in UI).

### Stap 11: Entiteiten-scherm

Lijst van alle entiteiten, gegroepeerd per sfeer (drie secties: Annelie, Rutger, Samen).
Per entiteit: aantal open facturen, totaal klaar voor betaling, totaal goedgekeurd wachtend.
Klik op entiteit: gefilterde inbox-view voor die entiteit.

### Stap 12: Zoeken

Full-text zoekveld dat over invoice_number, expense_reason, vendor_name, raw_text en notes zoekt via pg_trgm.
Filters: sfeer, entiteit, status, datumrange, bedragrange, tags.
Resultaten als lijst met zelfde kaart-component als inbox.

### Stap 13: Instellingen

Tab 1: Gebruikers — jullie twee zichtbaar, geen bewerking in fase 1.
Tab 2: Entiteiten — bewerk naam, BTW-status, kleur, drempel voor goedkeuring, dual approval.
Tab 3: Categorieën — per entiteit en algemeen, toevoegen en hernoemen.
Tab 4: Leveranciers — lijst, koppelingen aan entiteiten en categorieën (leer-gedrag zichtbaar).
Tab 5: Google-koppeling — status van Gmail- en Drive-verbinding, reconnect-knop.

### Stap 14: PWA-installatie

Manifest met naam "Met Liefde Facturen", korte naam "Facturen", standalone display, passende icoon.
Service worker die laatste 100 facturen offline cachet via IndexedDB.
Install-prompt op eerste bezoek met uitleg "Voeg toe aan startscherm voor snelle toegang".

## Wat bewust niet in fase 1 zit

Abonnementenbeheer zichtbaar in UI (detectie en opslag werkt wel op de achtergrond). Projecten. Splitsing over entiteiten. Tagging-UI (data-model staat klaar). Rapportage en export. Betaal-batches met SEPA-QR. Boekhouder-rol en bijbehorende views. Push-notificaties. Bank-integratie. OCR voor papieren bonnen.

## Ontwerp-instructies

Kleur-palet rustig en hoogwaardig. Typografie: systeem-sans voor UI, eventueel een kenmerkend serif-lettertype voor koppen in de stijl van Cormorant Garamond. Veel witruimte. Sobere, functionele iconen. Kaart-gebaseerde UI voor facturen. Statuspillen in consistente kleuren: binnengekomen grijs, te beoordelen amber, goedgekeurd groen, klaar voor betaling blauw, voldaan donkergroen, afgewezen rood, betwist oranje, on hold paars.

De toon in UI-tekst is helder en direct, geen uitroeptekens, geen enthousiasme voor eenvoudige handelingen, wel warmte waar het past.

## Testen zonder terminal

Dit project wordt getest in staging via Vercel preview deployments. Bij elke commit naar een feature-branch opent een preview-URL. Rutger opent die op zijn telefoon en geeft feedback. Claude Code past aan, commit, nieuwe preview.

Schrijf geen lokale unit-tests in fase 1. Integreer wel inline validatie met zod in server actions zodat foute data nooit de database bereikt. Logging gaat naar Vercel log drains — fouten zijn daar terug te vinden.

## Veel voorkomende valkuilen

Supabase triggers gebruiken `auth.uid()` — zorg dat elke mutatie via authenticated context loopt, niet via service role vanuit cron-jobs zonder expliciete actor-label.
PWA service worker kan oude versies blijven serveren — implementeer een versie-check die bij nieuwe deploy automatisch refresht.
Gmail API heeft quota — batch ophalen per 100 tegelijk, niet in parallel.
Google Drive file upload vereist resumable upload voor bestanden groter dan 5MB.
Row Level Security blokkeert queries zonder logged-in user — test altijd als ingelogde gebruiker, niet als anonieme bezoeker.
Anthropic API calls kosten tijd — altijd async via job queue, nooit synchroon vanuit een request.

## Begin hier

Start met stap 1, deploy naar Vercel, verifieer dat Supabase-connectie werkt en Rutger kan inloggen. Pas daarna stap 2 en verder.
