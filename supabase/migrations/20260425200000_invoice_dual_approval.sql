-- =====================================================================
-- Met Liefde - dual approval kolommen
-- =====================================================================
--
-- Voor entiteiten met default_requires_dual_approval (Stichting Us Wente
-- in eerste instantie) en facturen boven een drempel houden we twee
-- handtekeningen bij. approved_by is de eerste; co_approved_by de tweede.
-- Pas wanneer beide gezet zijn beweegt de status naar goedgekeurd.
-- =====================================================================

alter table public.invoices
    add column if not exists co_approved_by uuid references public.users(id) on delete set null,
    add column if not exists co_approved_at timestamptz;

create index if not exists idx_invoices_awaiting_dual
    on public.invoices(invoice_date desc)
    where requires_approval = true
      and (approved_by is null or co_approved_by is null);
