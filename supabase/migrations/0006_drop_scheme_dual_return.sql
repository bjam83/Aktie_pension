-- Fjerner den leftover "årets faktiske afkast / fremskriv med"-mekanik på pension_schemes
-- (var tiltænkt at blande med live kursopslag, som blev fjernet igen). En ordning har nu kun
-- ét afkastfelt: expected_return_pct.
alter table public.pension_schemes
  drop column if exists fetched_return_pct,
  drop column if exists return_basis;
