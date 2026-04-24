-- =====================================================================
-- Met Liefde — mail_accounts
-- =====================================================================
--
-- Mailboxen zijn losgekoppeld van login-gebruikers. Een eigenaar (Rutger
-- of Annelie) kan meerdere Gmail-accounts verbinden, elk met een eigen
-- default-entiteit. Voorbeeld: factuur@uswente.org koppelt aan
-- Stichting Us Wente i.o., Rutger's persoonlijke Gmail aan Rutger prive.
--
-- Per factuur leggen we vast uit welke mailbox hij komt zodat de
-- voorgestelde entiteit met hoge zekerheid kan worden gezet.
-- =====================================================================

create type mail_provider as enum ('gmail');

create type mail_account_status as enum (
    'verbonden',
    'herauth_nodig',
    'gepauzeerd',
    'ontkoppeld'
);

create table mail_accounts (
    id                      uuid primary key default uuid_generate_v4(),

    email                   text not null unique,
    display_name            text,

    provider                mail_provider not null default 'gmail',
    status                  mail_account_status not null default 'verbonden',

    default_entity_id       uuid references entities(id) on delete set null,
    connected_by            uuid references users(id) on delete set null,

    -- TODO: voor go-live versleutelen via pgsodium. In fase 1 plain text
    -- onder bescherming van Supabase's at-rest encryption en RLS.
    access_token            text,
    refresh_token           text,
    token_expires_at        timestamptz,
    scopes                  text[],

    gmail_history_id        text,
    gmail_label             text not null default 'Facturen/Inbox',

    last_synced_at          timestamptz,
    last_error              text,
    notes                   text,

    created_at              timestamptz not null default now(),
    updated_at              timestamptz not null default now()
);

create trigger trg_mail_accounts_updated_at before update on mail_accounts
    for each row execute function set_updated_at();

create index idx_mail_accounts_status
    on mail_accounts(status)
    where status <> 'ontkoppeld';
create index idx_mail_accounts_default_entity
    on mail_accounts(default_entity_id);

-- Koppel facturen aan een mailbox.
alter table invoices
    add column mail_account_id uuid references mail_accounts(id) on delete set null;

create index idx_invoices_mail_account on invoices(mail_account_id);

-- RLS: alleen eigenaren mogen mailbox-configuratie zien of muteren.
-- Tokens horen niet zichtbaar te zijn voor boekhouders of kijkers.
alter table mail_accounts enable row level security;

create policy mail_accounts_owner_all on mail_accounts
    for all to authenticated
    using (is_owner())
    with check (is_owner());

-- Einde migratie
