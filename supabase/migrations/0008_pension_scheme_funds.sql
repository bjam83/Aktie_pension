-- Per-scheme fund allocation + self-reported yearly returns. Pension providers like AP Pension
-- invest in their own proprietary fund pools (not public securities), so returns can't be fetched
-- anywhere — only read off the provider's own site, same reasoning as pension_measurements.
create table public.pension_scheme_funds (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  scheme_id uuid not null references pension_schemes(id) on delete cascade,
  name text not null,
  allocation_pct numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pension_fund_returns (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  fund_id uuid not null references pension_scheme_funds(id) on delete cascade,
  year integer not null check (year between 2000 and 2100),
  return_pct numeric not null,
  created_at timestamptz not null default now(),
  unique (fund_id, year)
);

create trigger pension_scheme_funds_set_updated_at before update on public.pension_scheme_funds
  for each row execute function public.set_updated_at();

alter table public.pension_scheme_funds enable row level security;
alter table public.pension_fund_returns enable row level security;

create policy "own household rows" on public.pension_scheme_funds
  for all using (household_id = auth.uid()) with check (household_id = auth.uid());
create policy "own household rows" on public.pension_fund_returns
  for all using (household_id = auth.uid()) with check (household_id = auth.uid());
