-- =====================================================================
-- Met Liefde - haiku_suggested_tags op invoices
-- =====================================================================
--
-- Haiku produceert per factuur 1-4 tag-suggesties op basis van mail-
-- onderwerp, body en PDF-inhoud. Tot nu toe pasten we ze direct toe en
-- gooiden de lijst weg. Door ze ook op te slaan kunnen we contextuele
-- voorstellen tonen in de UI - zelfs nadat tags weer zijn verwijderd.
-- =====================================================================

alter table public.invoices
    add column if not exists haiku_suggested_tags text[];
