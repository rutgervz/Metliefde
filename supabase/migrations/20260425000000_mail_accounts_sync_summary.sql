-- =====================================================================
-- Met Liefde - mail_accounts: last_sync_summary
-- =====================================================================
--
-- Tekstuele samenvatting van de laatste sync, zichtbaar in de UI:
--   "0 berichten gevonden met label Facturen/Inbox"
--   "3 nieuwe ingepakt, 12 al bekend"
-- Geen errors, gewoon menselijke statusregel.
-- =====================================================================

alter table mail_accounts
    add column last_sync_summary text;
