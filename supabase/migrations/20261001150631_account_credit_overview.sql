-- Credit is separate from the account balance. Null means unavailable, including
-- for providers that do not return credit limits.
alter table public.accounts
  add column credit_limit_cents bigint check (credit_limit_cents >= 0),
  add column credit_available_cents bigint check (credit_available_cents >= 0),
  add column credit_used_cents bigint check (credit_used_cents >= 0),
  add column credit_line_id text;
