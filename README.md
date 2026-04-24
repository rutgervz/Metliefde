# Met Liefde

Gedeeld factuur- en abonnementenbeheer voor Rutger en Annelie. Next.js 15 PWA op Vercel, met Supabase als backend.

Het volledige plan staat in `docs/pakket-compleet.md`. Dit bestand is de lopende leeswijzer voor opbouw en dagelijks gebruik.

## Status

Fase 1 in opbouw. Zie `docs/pakket-compleet.md`, deel 4, voor de 14 stappen.

- Stap 1 Project en Supabase — klaar
- Stap 2 Auth-laag — klaar, wacht op jouw Google- en Supabase-instellingen
- Stap 3 Layout en navigatie — volgt

## Ontwikkelstijl

Alle wijzigingen gaan via commits naar feature-branches en worden daarna in `main` gemerged. Vercel bouwt automatisch bij elke push naar `main`. Er is geen lokale ontwikkelomgeving en geen terminal-werk bij de gebruiker.

## Stap 2 afmaken: Google OAuth activeren

De code staat er. Om daadwerkelijk in te kunnen loggen moet je drie dingen eenmalig instellen. Neem er tien minuten voor op je telefoon of laptop.

### 1. Google Cloud project en OAuth-client aanmaken

a. Ga naar `console.cloud.google.com`. Log in.
b. Maak een nieuw project aan. Naam: `Met Liefde`. Koppel aan je persoonlijke of werk-organisatie, dat maakt niet uit.
c. Open in de zoekbalk **OAuth consent screen** en configureer:
   - User type: **External**.
   - App name: `Met Liefde`.
   - User support email: jouw e-mailadres.
   - Developer contact: jouw e-mailadres.
   - Scopes: laat leeg (we voegen in Stap 5 Gmail en Drive toe).
   - Test users: voeg je eigen en Annelie's Gmail-adres toe.
   - Publish status mag op **Testing** blijven in fase 1.
d. Open **Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**.
   - Name: `Supabase Auth`.
   - Authorized redirect URIs, voeg toe:
     - `https://cxfhdvvmazdlsytgvnct.supabase.co/auth/v1/callback`
   - Klik **Create**. Kopieer **Client ID** en **Client Secret**.

### 2. Google-provider aanzetten in Supabase

a. Open Supabase dashboard → je project → **Authentication → Providers**.
b. Zoek **Google** in de lijst en klik aan.
c. Zet Enable op **aan**.
d. Plak de Client ID en Client Secret uit stap 1d.
e. Klik **Save**.

### 2b. URL Configuration in Supabase

Zonder dit stuurt Supabase je na het inloggen door naar `localhost:3000`.

a. Supabase dashboard → **Authentication → URL Configuration**.
b. **Site URL**: `https://metliefde.vercel.app`
c. **Redirect URLs** (Add URL per stuk):
   - `https://metliefde.vercel.app/**`
   - `https://*.vercel.app/**`
d. **Save**.

### 3. Vercel env vars invullen

Ga in Vercel naar het project → **Settings → Environment Variables**. Vul:

```
NEXT_PUBLIC_SUPABASE_URL        = <je Supabase Project URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY   = <je Supabase anon key>
SUPABASE_SERVICE_ROLE_KEY       = <je Supabase service_role key>
ALLOWED_EMAILS                  = <jouw@gmail.com>,<annelie@gmail.com>
```

Laat `ANTHROPIC_API_KEY` en de `GOOGLE_*` velden nog leeg tot Stap 5 en 6.

Klik **Save**. Ga naar **Deployments** en triggere een **Redeploy** van de laatste deployment, of push een lege commit. De nieuwe env vars worden pas actief na een nieuwe deploy.

### 4. Testen

Open de Vercel-URL op je telefoon. Je zou nu:

1. Automatisch worden doorgestuurd naar `/login`.
2. Een Google-knop zien.
3. Na klikken: Google-flow, terug naar de app.
4. Ingelogd: de homepage toont je naam rechts bovenin en je rol is `eigenaar`.

## Stap 5a afmaken: mailboxen verbinden

Voor het verbinden van Gmail-mailboxen moet de bestaande OAuth-client uitgebreid en moet Gmail API aan staan in Google Cloud.

### 1. Gmail API enablen

a. Google Cloud Console → linkermenu → **APIs & Services → Library**.
b. Zoek **Gmail API** → klik aan → **Enable**.

### 2. Scopes toevoegen aan OAuth consent screen

a. Linkermenu → **APIs & Services → OAuth consent screen** → **Edit App** → klik door tot **Scopes**.
b. **Add or remove scopes** → vink aan:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.modify`
c. **Update** → **Save and continue**.
d. Bij testing-mode hoef je verder niets meer te doen. Bij gepubliceerd-mode moet Google deze scopes goedkeuren (niet nodig voor fase 1).

### 3. Extra redirect URI toevoegen

a. Linkermenu → **APIs & Services → Credentials** → klik je OAuth client open (`Supabase Auth`).
b. Bij **Authorized redirect URIs** klik **Add URI** en voeg toe:
   ```
   https://metliefde.vercel.app/api/mailbox/callback
   ```
c. **Save**.

### 4. Vercel env vars

Voeg toe in **Settings → Environment Variables**:

```
GOOGLE_CLIENT_ID         = <client id van OAuth client>
GOOGLE_CLIENT_SECRET     = <client secret van OAuth client>
NEXT_PUBLIC_APP_URL      = https://metliefde.vercel.app
```

Save → **Redeploy** voor activatie.

### 5. Eerste mailbox verbinden

1. Open `metliefde.vercel.app/instellingen/mailboxen`.
2. Klik **Verbind mailbox**.
3. Google-scherm verschijnt; kies het account dat de facturen ontvangt (bijvoorbeeld `factuur@uswente.org`).
4. Geef toestemming voor Gmail readonly + modify.
5. Je komt terug op de mailboxen-pagina met een bevestiging.
6. Stel via de dropdown de **default-entiteit** in (bijvoorbeeld Stichting Us Wente i.o.) en klik **Opslaan**.

Je kunt zoveel mailboxen verbinden als je wil. Pauzeren, hervatten en ontkoppelen kan per mailbox.

## Stap 5b: Gmail-sync activeren

De code voor het ophalen van mails staat live. Twee laatste handelingen:

### 1. Gmail-label aanmaken in elke verbonden mailbox

In Gmail (op laptop of telefoon):

a. Maak een label `Facturen/Inbox` (de schuine streep maakt automatisch een sublabel onder `Facturen`).
b. Stel filters in die binnenkomende factuur-mails dit label geven. Bijvoorbeeld: `from:facturen@vattenfall.nl OR subject:factuur`. Filter → kies "Toepassen op label: Facturen/Inbox".
c. Pas eventueel het label achteraf toe op bestaande mails om te testen.

### 2. CRON_SECRET genereren

a. Verzin of genereer een willekeurige string van minimaal 32 tekens. Bijvoorbeeld via `openssl rand -hex 32` op de terminal, of een wachtwoord-generator.
b. Vercel → Settings → Environment Variables → Add:
   ```
   CRON_SECRET = <jouw-random-string>
   ```
   Bij **Environments** Production aanvinken.
c. Save → **Redeploy** zodat de waarde actief wordt.

Vercel verzorgt zelf het meegeven van deze secret als `Authorization: Bearer ...`-header bij de geplande cron-aanroep.

### 3. Eerste sync handmatig testen

a. Open `metliefde.vercel.app/instellingen/mailboxen`.
b. Klik bij een verbonden mailbox op **Sync nu**.
c. Even wachten — de pagina ververst en toont `Laatst opgehaald` met de tijd.
d. Bij `Last error` (rood vakje) staat eventuele foutmelding.

### 4. Vercel cron schedule

`vercel.json` bevat het schedule `*/15 * * * *` (elke 15 minuten). Vercel pakt dit automatisch op zodra je naar Pro plan upgradet. Op Hobby plan staan crons beperkt tot dagelijks; gebruik dan de **Sync nu**-knop voor handmatige tests, of een externe poller.

Het ophalen plaatst voor elk nieuw bericht een job met `kind=extract_invoice` in de queue. Het verwerken van die jobs (de feitelijke extractie) komt in Stap 6.

Als een verkeerd adres inlogt: redirect naar `/login?error=niet_toegestaan` met de juiste melding.

## Structuur van de repo

```
app/                      — Next.js App Router
  login/                  — login-pagina en server actions
  auth/callback/          — OAuth-callback met whitelist-check en user-sync
  auth/signout/           — uitlog-route
lib/
  supabase/               — SSR client-wrappers (browser, server, service, middleware)
  auth/                   — whitelist-helper
middleware.ts             — auth-protectie voor alle private routes
public/                   — statische assets (PWA-iconen komen later)
supabase/migrations/      — versie-beheerd database-schema
docs/                     — plan en referentie-documenten
```

## Volgende stap

Zodra je Stap 2 werkend hebt (de login-flow hierboven doorloopt): geef het door. Dan begin ik met Stap 3 (mobile-first layout met bottom-navigatie, sferen-filter, PWA-manifest).
