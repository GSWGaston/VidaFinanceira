-- Initial vertical slice. Amounts are stored as integer BRL cents.
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  currency_code text not null default 'BRL' check (currency_code = 'BRL'),
  country_code text not null default 'BR',
  created_at timestamptz not null default now()
);

create table public.accounts (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  institution text not null check (char_length(institution) between 2 and 80),
  kind text not null check (kind in ('checking','savings','digital','cash','investment','other')),
  opening_balance_cents bigint not null default 0,
  color text not null default '#176e55' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, id)
);

create table public.benefit_accounts (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  company text not null check (char_length(company) between 2 and 80),
  kind text not null check (kind in ('va','vr','mobility','fuel','other')),
  opening_balance_cents bigint not null default 0,
  monthly_credit_cents bigint not null default 0 check (monthly_credit_cents >= 0),
  credit_day smallint check (credit_day between 1 and 28),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, id)
);

create table public.transactions (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null check (char_length(description) between 2 and 120),
  amount_cents bigint not null check (amount_cents > 0),
  type text not null check (type in ('income','expense')),
  date date not null,
  category text not null check (char_length(category) between 2 and 80),
  account_id uuid,
  benefit_id uuid,
  created_at timestamptz not null default now(),
  constraint one_source check ((account_id is not null) <> (benefit_id is not null)),
  constraint own_account foreign key (user_id, account_id) references public.accounts(user_id, id) on delete restrict,
  constraint own_benefit foreign key (user_id, benefit_id) references public.benefit_accounts(user_id, id) on delete restrict
);

create index transactions_user_date_idx on public.transactions (user_id, date desc);
create index transactions_user_account_idx on public.transactions (user_id, account_id);
create index transactions_user_benefit_idx on public.transactions (user_id, benefit_id);

alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.benefit_accounts enable row level security;
alter table public.transactions enable row level security;

create policy profiles_select on public.profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy profiles_insert on public.profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy profiles_update on public.profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy profiles_delete on public.profiles for delete to authenticated using ((select auth.uid()) = user_id);

create policy accounts_select on public.accounts for select to authenticated using ((select auth.uid()) = user_id);
create policy accounts_insert on public.accounts for insert to authenticated with check ((select auth.uid()) = user_id);
create policy accounts_update on public.accounts for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy accounts_delete on public.accounts for delete to authenticated using ((select auth.uid()) = user_id);

create policy benefits_select on public.benefit_accounts for select to authenticated using ((select auth.uid()) = user_id);
create policy benefits_insert on public.benefit_accounts for insert to authenticated with check ((select auth.uid()) = user_id);
create policy benefits_update on public.benefit_accounts for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy benefits_delete on public.benefit_accounts for delete to authenticated using ((select auth.uid()) = user_id);

create policy transactions_select on public.transactions for select to authenticated using ((select auth.uid()) = user_id);
create policy transactions_insert on public.transactions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy transactions_update on public.transactions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy transactions_delete on public.transactions for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.profiles, public.accounts, public.benefit_accounts, public.transactions to authenticated;
