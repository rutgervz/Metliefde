# Met Liefde Facturen

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
b. Maak een nieuw project aan. Naam: `Met Liefde Facturen`. Koppel aan je persoonlijke of werk-organisatie, dat maakt niet uit.
c. Open in de zoekbalk **OAuth consent screen** en configureer:
   - User type: **External**.
   - App name: `Met Liefde Facturen`.
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
