alter table public.investment_accounts
  add column monthly_contribution numeric not null default 0,
  add column expected_return_pct numeric not null default 6,
  add column projection_years integer not null default 15;

alter table public.pension_schemes
  add column payout_years integer;
alter table public.pension_schemes
  add constraint pension_schemes_payout_years_check check (payout_years is null or (payout_years between 10 and 25));
