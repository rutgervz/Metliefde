-- =====================================================================
-- Met Liefde — herstel default privileges voor Supabase-rollen
-- =====================================================================
--
-- Context: migratie 001 gebruikte de cleanup `drop schema public cascade`
-- tijdens de installatie. Dat wiste niet alleen alle tabellen maar ook de
-- default grants op het public-schema voor anon, authenticated en
-- service_role. Daardoor kreeg elke query via PostgREST een
-- "permission denied for table users" error, ongeacht de RLS-policies.
--
-- Deze migratie herstelt:
--   - Schema-toegang (USAGE) voor de drie Supabase-rollen
--   - Bestaande rechten op tabellen, sequences, functies en routines
--   - Default privileges voor toekomstige objecten in public
--
-- Na deze migratie blijven RLS-policies de daadwerkelijke rij-filter; de
-- grants maken alleen dat de rollen uberhaupt iets mogen proberen.
-- =====================================================================

grant usage on schema public to anon, authenticated, service_role;

grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;

alter default privileges in schema public
    grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
    grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public
    grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public
    grant all on routines to anon, authenticated, service_role;

-- Einde migratie
