-- Optional link to the fund's page on the pension provider's own site (e.g. AP Pension's
-- fondliste), so a fund can be "refreshed" by scraping its annual-return table instead of
-- typing each year in by hand. Nullable — funds without a link just skip that button.
alter table public.pension_scheme_funds add column source_url text;
