-- ============================================================================
-- Aktie & Pension — initial schema
-- Multi-tenant: one household per auth user (households.id = auth.uid()).
-- Every child table carries household_id for simple, fast RLS.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- households : one row per user account. id == auth.users.id
-- ---------------------------------------------------------------------------
create table public.households (
  id uuid primary key references auth.users(id) on delete cascade,
  household_name text,
  currency text not null default 'DKK',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- persons : members of a household. Max 2 (enforced by trigger below).
-- ---------------------------------------------------------------------------
create table public.persons (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  birth_date date,
  retirement_age integer not null default 68,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.enforce_max_persons()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from public.persons where household_id = new.household_id) >= 2 then
    raise exception 'En husstand kan maksimalt have 2 personer';
  end if;
  return new;
end;
$$;

create trigger persons_max_two
  before insert on public.persons
  for each row execute function public.enforce_max_persons();

-- ---------------------------------------------------------------------------
-- assumptions : tax & projection parameters per household (1:1)
-- ---------------------------------------------------------------------------
create table public.assumptions (
  household_id uuid primary key references households(id) on delete cascade,
  pal_rate numeric not null default 15.3,
  inflation_rate numeric not null default 2.0,
  ask_rate numeric not null default 17,
  ask_loft numeric not null default 174200,
  aktie_lav_rate numeric not null default 27,
  aktie_hoej_rate numeric not null default 42,
  aktie_graense numeric not null default 79400,
  personfradrag numeric not null default 54100,
  bundskat_rate numeric not null default 37.0,
  mellemskat_bund numeric not null default 641200,
  mellemskat_rate numeric not null default 7.5,
  topskat_bund numeric not null default 777900,
  topskat_rate numeric not null default 7.5,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- pension_schemes
-- ---------------------------------------------------------------------------
create table public.pension_schemes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  person_id uuid not null references persons(id) on delete cascade,
  scheme_type text not null default 'ratepension'
    check (scheme_type in ('arbejdsmarkedspension','ratepension','livrente','aldersopsparing','andet')),
  provider text,
  name text not null,
  current_value numeric not null default 0,
  monthly_contribution numeric not null default 0,
  expected_return_pct numeric not null default 6,
  fetched_return_pct numeric,
  return_basis text not null default 'historical'
    check (return_basis in ('historical','ytd','blend')),
  payout_start_age integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- investment_accounts (depots) + holdings (individual stocks/funds) + price history
-- ---------------------------------------------------------------------------
create table public.investment_accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  person_id uuid references persons(id) on delete set null,
  kind text not null default 'frie_midler'
    check (kind in ('frie_midler','aktiesparekonto','pensionsdepot')),
  name text not null,
  broker text,
  created_at timestamptz not null default now()
);

create table public.holdings (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  account_id uuid not null references investment_accounts(id) on delete cascade,
  name text not null,
  ticker text,
  isin text,
  instrument_type text not null default 'aktie'
    check (instrument_type in ('aktie','investeringsforening_aktiebaseret','investeringsforening_obligationsbaseret','obligation','kontant')),
  quantity numeric not null default 0,
  avg_cost_price numeric not null default 0,
  currency text not null default 'DKK',
  manual_price numeric,
  last_price numeric,
  last_price_at timestamptz,
  price_source text not null default 'auto' check (price_source in ('auto','manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.holding_price_history (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  holding_id uuid not null references holdings(id) on delete cascade,
  price_date date not null,
  price numeric not null,
  created_at timestamptz not null default now(),
  unique (holding_id, price_date)
);

-- ---------------------------------------------------------------------------
-- assets & liabilities
-- ---------------------------------------------------------------------------
create table public.assets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  owner_ids uuid[] not null default '{}',
  kind text not null check (kind in ('bolig','bil','bankindestaaende','andet')),
  name text not null,
  value numeric not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.liabilities (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  owner_ids uuid[] not null default '{}',
  kind text not null check (kind in ('realkredit','billaan','studielaan','andet')),
  name text not null,
  remaining_debt numeric not null default 0,
  interest_rate_pct numeric,
  term_years integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- income_streams & budget_items
-- ---------------------------------------------------------------------------
create table public.income_streams (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  person_id uuid references persons(id) on delete cascade,
  kind text not null check (kind in ('løn','folkepension','atp','efterløn','andet')),
  amount numeric not null default 0,
  frequency text not null default 'månedlig' check (frequency in ('månedlig','årlig')),
  created_at timestamptz not null default now()
);

create table public.budget_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  person_id uuid references persons(id) on delete set null,
  group_name text not null default 'Andet',
  name text not null,
  direction text not null default 'ud' check (direction in ('ind','ud')),
  amount numeric not null default 0,
  frequency text not null default 'månedlig'
    check (frequency in ('månedlig','kvartalsvis','halvårligt','årlig','engangs')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- planning_settings : "what-if" scenario inputs (frie midler / udbetaling)
-- ---------------------------------------------------------------------------
create table public.planning_settings (
  household_id uuid primary key references households(id) on delete cascade,
  free_funds jsonb not null default '{"lump":0,"monthly":0,"ret":7,"years":20,"tax":"ask"}'::jsonb,
  payout jsonb not null default '{"potOverride":null,"years":15,"ret":3,"otherIncome":0}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- pension_measurements : actual vs. forecast tracking over time
-- ---------------------------------------------------------------------------
create table public.pension_measurements (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  measured_on date not null,
  total_value numeric not null,
  created_at timestamptz not null default now(),
  unique (household_id, measured_on)
);

-- ============================================================================
-- updated_at trigger helper
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger households_set_updated_at before update on public.households
  for each row execute function public.set_updated_at();
create trigger assumptions_set_updated_at before update on public.assumptions
  for each row execute function public.set_updated_at();
create trigger pension_schemes_set_updated_at before update on public.pension_schemes
  for each row execute function public.set_updated_at();
create trigger holdings_set_updated_at before update on public.holdings
  for each row execute function public.set_updated_at();
create trigger assets_set_updated_at before update on public.assets
  for each row execute function public.set_updated_at();
create trigger liabilities_set_updated_at before update on public.liabilities
  for each row execute function public.set_updated_at();
create trigger planning_settings_set_updated_at before update on public.planning_settings
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Row Level Security — every table scoped to household_id = auth.uid()
-- ============================================================================
alter table public.households enable row level security;
alter table public.persons enable row level security;
alter table public.assumptions enable row level security;
alter table public.pension_schemes enable row level security;
alter table public.investment_accounts enable row level security;
alter table public.holdings enable row level security;
alter table public.holding_price_history enable row level security;
alter table public.assets enable row level security;
alter table public.liabilities enable row level security;
alter table public.income_streams enable row level security;
alter table public.budget_items enable row level security;
alter table public.planning_settings enable row level security;
alter table public.pension_measurements enable row level security;

create policy "own household" on public.households
  for all using (id = auth.uid()) with check (id = auth.uid());
create policy "own household rows" on public.persons
  for all using (household_id = auth.uid()) with check (household_id = auth.uid());
create policy "own household rows" on public.assumptions
  for all using (household_id = auth.uid()) with check (household_id = auth.uid());
create policy "own household rows" on public.pension_schemes
  for all using (household_id = auth.uid()) with check (household_id = auth.uid());
create policy "own household rows" on public.investment_accounts
  for all using (household_id = auth.uid()) with check (household_id = auth.uid());
create policy "own household rows" on public.holdings
  for all using (household_id = auth.uid()) with check (household_id = auth.uid());
create policy "own household rows" on public.holding_price_history
  for all using (household_id = auth.uid()) with check (household_id = auth.uid());
create policy "own household rows" on public.assets
  for all using (household_id = auth.uid()) with check (household_id = auth.uid());
create policy "own household rows" on public.liabilities
  for all using (household_id = auth.uid()) with check (household_id = auth.uid());
create policy "own household rows" on public.income_streams
  for all using (household_id = auth.uid()) with check (household_id = auth.uid());
create policy "own household rows" on public.budget_items
  for all using (household_id = auth.uid()) with check (household_id = auth.uid());
create policy "own household rows" on public.planning_settings
  for all using (household_id = auth.uid()) with check (household_id = auth.uid());
create policy "own household rows" on public.pension_measurements
  for all using (household_id = auth.uid()) with check (household_id = auth.uid());

-- ============================================================================
-- Auto-provisioning: new auth user -> household + first person + defaults
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display_name text;
begin
  display_name := coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1));

  insert into public.households (id, household_name) values (new.id, display_name);
  insert into public.persons (household_id, name, is_primary) values (new.id, display_name, true);
  insert into public.assumptions (household_id) values (new.id);
  insert into public.planning_settings (household_id) values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
