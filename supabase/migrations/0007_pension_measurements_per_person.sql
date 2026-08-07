-- pension_measurements was scaffolded early on but never wired up to any UI (table is empty in
-- production). Reshapes it into a per-person historical log: each entry is a snapshot of one
-- person's total pension value on a given date, plus the return they report having achieved
-- (as read off their pension provider's own statement/app) — used to show a historical
-- development graph and to compute a historical average return as a benchmark for the forecast.
alter table public.pension_measurements
  add column person_id uuid references public.persons(id) on delete cascade,
  add column return_pct numeric;

-- Table is empty in production, so this is safe: backfill is a no-op, just tighten the constraint.
alter table public.pension_measurements
  alter column person_id set not null;

alter table public.pension_measurements
  drop constraint pension_measurements_household_id_measured_on_key;

alter table public.pension_measurements
  add constraint pension_measurements_person_measured_on_key unique (person_id, measured_on);
