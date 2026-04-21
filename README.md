# Met Liefde Facturen

Gedeeld factuur- en abonnementenbeheer voor Rutger en Annelie. Next.js 15 PWA op Vercel, met Supabase als backend.

Het volledige plan staat in `docs/pakket-compleet.md`. Dit bestand is de lopende leeswijzer voor opbouw en dagelijks gebruik.

## Status

Fase 1 in opbouw. Zie `docs/pakket-compleet.md`, deel 4, voor de 14 stappen. Dit moment wordt stap 1 (project en Supabase) opgeleverd.

## Ontwikkelstijl

Alle wijzigingen gaan via commits naar feature-branches. Vercel bouwt automatisch een preview bij elke commit. Rutger test de preview op zijn telefoon en geeft feedback. Er is geen lokale ontwikkelomgeving en geen terminal-werk bij de gebruiker.

## Eerste keer opzetten (voor Rutger, op de telefoon)

Deze stappen zet je één keer achter elkaar. Houd een scherm met notities ernaast — je hebt straks wat sleutels nodig.

### 1. Supabase-project aanmaken

Ga naar `supabase.com`, log in, klik op **New project**. Kies een naam zoals `metliefde-facturen`, kies regio **Frankfurt (eu-central-1)** of **Amsterdam (eu-west)**, verzin een databasewachtwoord en bewaar het in je wachtwoordkluis. Laat het project 2-3 minuten klaarzetten.

### 2. Migratie draaien

Open in je Supabase-project de **SQL Editor** via het linkermenu. Maak een nieuwe query. Kopieer de volledige inhoud van `supabase/migrations/001_init.sql` uit deze repo en plak in de editor. Klik **Run**. Je ziet onderaan een groene melding. Negeer eventuele waarschuwingen over `users`-tabel (die maken we hieronder).

### 3. Google OAuth provider aanzetten in Supabase

Ga in Supabase naar **Authentication → Providers**. Zoek **Google** in de lijst en klik aan. Laat deze tab open staan, we komen hierop terug in stap 2 van de opbouw (auth-laag) wanneer we het Google-project hebben.

### 4. API-sleutels kopiëren

Ga naar **Project Settings → API**. Kopieer:

- `Project URL` — dit wordt `NEXT_PUBLIC_SUPABASE_URL`
- `anon` key onder **Project API keys** — dit wordt `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` key — dit wordt `SUPABASE_SERVICE_ROLE_KEY`

Sla deze drie even op in een notitie.

### 5. Anthropic API-sleutel aanmaken

Ga naar `console.anthropic.com`, log in, maak een API-key aan. Kopieer de waarde. Deze wordt `ANTHROPIC_API_KEY`. (Nog niet actief in stap 1, maar alvast bewaren.)

### 6. Vercel-project koppelen aan deze GitHub-repo

Ga naar `vercel.com`, log in met GitHub. Klik **Add New → Project**. Kies de repo `rutgervz/metliefde`. Vercel herkent Next.js automatisch. Klik door naar **Environment Variables** en plak de waarden uit stap 4 en 5:

```
NEXT_PUBLIC_SUPABASE_URL        = <waarde uit stap 4>
NEXT_PUBLIC_SUPABASE_ANON_KEY   = <waarde uit stap 4>
SUPABASE_SERVICE_ROLE_KEY       = <waarde uit stap 4>
ANTHROPIC_API_KEY               = <waarde uit stap 5>
ALLOWED_EMAILS                  = <jouw-adres>,<annelies-adres>
```

De Google-variabelen komen in stap 5 van de opbouw, die kunnen nu leeg blijven.

Klik **Deploy**. Vercel bouwt en geeft je een URL. Open die op je telefoon: je ziet de tijdelijke landingspagina van de app.

### 7. Eerste aanmelding voorbereiden (stap 2 van de opbouw)

Dit doen we pas wanneer de auth-laag live staat. Instructies volgen dan.

## Structuur van de repo

```
app/                  — Next.js App Router (pages, layouts, routes)
lib/                  — helpers, queries, mutations, extractors
components/           — UI-componenten (shadcn/ui, eigen)
public/               — statische assets
supabase/migrations/  — SQL-migraties, versiebeheer voor het schema
docs/                 — plan en referentie-documenten
```

## Volgende stappen

Zie `docs/pakket-compleet.md` deel 4. Nadat Rutger stap 1 hierboven heeft afgerond op Vercel en Supabase, gaat Claude verder met stap 2 (Google OAuth + whitelisting) in de codebase.
