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
