-- Pluggy read-only Open Finance integration. Imported balances are snapshots,
-- while transaction amounts remain independent ledger entries in cents.
create table public.financial_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'pluggy' check (provider = 'pluggy'),
  provider_item_id uuid not null,
  institution_id integer not null,
  institution_name text not null,
  institution_image_url text,
  is_sandbox boolean not null default false,
  status text not null default 'syncing' check (status in ('connected','syncing','waiting_user_input','waiting_user_action','error','disconnected')),
  last_sync_at timestamptz,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_item_id),
  unique (user_id, id)
);
create index financial_connections_user_idx on public.financial_connections (user_id, status);

alter table public.accounts
  add column source text not null default 'manual' check (source in ('manual','open_finance','import')),
  add column provider text check (provider is null or provider = 'pluggy'),
  add column financial_connection_id uuid,
  add column external_id text,
  add column provider_balance_cents bigint,
  add column currency_code text not null default 'BRL' check (currency_code = 'BRL'),
  add column last_synced_at timestamptz,
  add constraint accounts_connection_owner foreign key (user_id, financial_connection_id)
    references public.financial_connections(user_id, id) on delete restrict,
  add constraint accounts_open_finance_source check (
    source <> 'open_finance' or
    (provider = 'pluggy' and financial_connection_id is not null and external_id is not null and provider_balance_cents is not null)
  );
create unique index accounts_provider_external_idx on public.accounts (provider, external_id);
create index accounts_connection_idx on public.accounts (financial_connection_id);

alter table public.transactions
  add column source text not null default 'manual' check (source in ('manual','open_finance','csv','ofx','xlsx','pdf')),
  add column provider text check (provider is null or provider = 'pluggy'),
  add column external_id text,
  add column fingerprint text,
  add column possible_duplicate boolean not null default false,
  add column category_overridden boolean not null default false,
  add column provider_deleted boolean not null default false,
  add column updated_at timestamptz not null default now(),
  add constraint transactions_open_finance_source check (
    source <> 'open_finance' or
    (provider = 'pluggy' and external_id is not null and account_id is not null and benefit_id is null)
  );
create unique index transactions_provider_external_idx
  on public.transactions (provider, account_id, external_id);
create index transactions_fingerprint_idx on public.transactions (user_id, fingerprint) where fingerprint is not null;

create table public.categorization_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pattern text not null check (char_length(pattern) between 2 and 100),
  category text not null check (char_length(category) between 2 and 80),
  priority integer not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);
create index categorization_rules_user_idx on public.categorization_rules (user_id, enabled, priority desc);

create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'pluggy' check (provider = 'pluggy'),
  provider_event_id uuid not null,
  event_type text not null,
  provider_item_id uuid not null,
  transaction_ids uuid[] not null default '{}',
  status text not null default 'pending' check (status in ('pending','processing','processed','error')),
  attempts integer not null default 0,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  last_error_code text,
  unique (provider, provider_event_id)
);
create index webhook_events_pending_idx on public.webhook_events (received_at) where status in ('pending','error');

alter table public.financial_connections enable row level security;
alter table public.categorization_rules enable row level security;
alter table public.webhook_events enable row level security;
create policy financial_connections_select on public.financial_connections for select to authenticated
  using ((select auth.uid()) = user_id);
create policy categorization_rules_select on public.categorization_rules for select to authenticated
  using ((select auth.uid()) = user_id);
create policy categorization_rules_insert on public.categorization_rules for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy categorization_rules_update on public.categorization_rules for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy categorization_rules_delete on public.categorization_rules for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Browser sessions may create only manual records. Provider-owned records are
-- written by isolated server code after ownership checks.
drop policy accounts_insert on public.accounts;
create policy accounts_insert on public.accounts for insert to authenticated
  with check ((select auth.uid()) = user_id and source = 'manual' and provider is null and financial_connection_id is null and external_id is null);
drop policy accounts_update on public.accounts;
create policy accounts_update on public.accounts for update to authenticated
  using ((select auth.uid()) = user_id and source = 'manual')
  with check ((select auth.uid()) = user_id and source = 'manual' and provider is null and financial_connection_id is null and external_id is null);
drop policy transactions_insert on public.transactions;
create policy transactions_insert on public.transactions for insert to authenticated
  with check ((select auth.uid()) = user_id and source = 'manual' and provider is null and external_id is null);

revoke update, delete on public.accounts, public.transactions from authenticated;
grant update (category, category_overridden) on public.transactions to authenticated;
grant select on public.financial_connections to authenticated;
grant select, insert, update, delete on public.categorization_rules to authenticated;
-- No anon/authenticated grant or RLS policy for webhook_events.
grant select, insert, update, delete on public.financial_connections, public.accounts,
  public.transactions, public.categorization_rules, public.webhook_events to service_role;

-- Batch merge avoids a race that could overwrite a manually corrected category.
-- Only service_role may execute this SECURITY INVOKER function.
create function public.merge_open_finance_transactions(p_rows jsonb)
returns integer language plpgsql security invoker set search_path = public as $$
declare merged_count integer;
begin
  insert into public.transactions (
    id, user_id, account_id, description, amount_cents, type, date, category,
    source, provider, external_id, fingerprint, possible_duplicate, provider_deleted
  )
  select id, user_id, account_id, description, amount_cents, type, date, category,
    'open_finance', 'pluggy', external_id, fingerprint, possible_duplicate, false
  from jsonb_to_recordset(p_rows) as r(
    id uuid, user_id uuid, account_id uuid, description text, amount_cents bigint,
    type text, date date, category text, external_id text, fingerprint text,
    possible_duplicate boolean
  )
  on conflict (provider, account_id, external_id)
  do update set
    description = excluded.description,
    amount_cents = excluded.amount_cents,
    type = excluded.type,
    date = excluded.date,
    category = case when transactions.category_overridden then transactions.category else excluded.category end,
    fingerprint = excluded.fingerprint,
    possible_duplicate = excluded.possible_duplicate,
    provider_deleted = false,
    updated_at = now();
  get diagnostics merged_count = row_count;
  return merged_count;
end;
$$;
revoke all on function public.merge_open_finance_transactions(jsonb) from public, anon, authenticated;
grant execute on function public.merge_open_finance_transactions(jsonb) to service_role;
