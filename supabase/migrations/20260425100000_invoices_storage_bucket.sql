-- =====================================================================
-- Met Liefde - storage bucket voor factuur-bijlagen
-- =====================================================================
--
-- Prive bucket waar PDF's en andere factuur-bijlagen leven. Bestanden
-- zijn alleen via signed URLs of vanuit de service role toegankelijk.
-- RLS-policies geven eigenaars lees- en schrijftoegang; boekhouders en
-- kijkers krijgen de factuur via signed URLs uit de service-laag.
--
-- Toegevoegd op invoices: storage_path en original_mime_type zodat de
-- UI weet waar het bestand staat en hoe het te tonen.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'invoices',
    'invoices',
    false,
    52428800,
    array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'message/rfc822']
)
on conflict (id) do update
set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy invoices_storage_owner_select
on storage.objects for select to authenticated
using (
    bucket_id = 'invoices'
    and is_owner()
);

create policy invoices_storage_owner_insert
on storage.objects for insert to authenticated
with check (
    bucket_id = 'invoices'
    and is_owner()
);

create policy invoices_storage_owner_update
on storage.objects for update to authenticated
using (
    bucket_id = 'invoices'
    and is_owner()
)
with check (
    bucket_id = 'invoices'
    and is_owner()
);

create policy invoices_storage_owner_delete
on storage.objects for delete to authenticated
using (
    bucket_id = 'invoices'
    and is_owner()
);

alter table public.invoices
    add column if not exists storage_path text,
    add column if not exists original_mime_type text;
