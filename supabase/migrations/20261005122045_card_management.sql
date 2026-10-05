alter table public.accounts add column institution_id text;

-- Browser users may edit only the fields used by manual cards. The existing
-- accounts UPDATE policy still restricts rows to their owner and source=manual.
grant update (name, institution, institution_id, kind, opening_balance_cents,
  color, credit_limit_cents, credit_available_cents, credit_used_cents,
  credit_line_id) on public.accounts to authenticated;
