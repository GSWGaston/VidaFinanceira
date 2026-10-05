-- Legacy records keep their existing account behavior. New standalone manual
-- cards can explicitly say that no debit account is linked.
alter table public.accounts
  add column has_linked_account boolean not null default true;

grant update (has_linked_account, active) on public.accounts to authenticated;
