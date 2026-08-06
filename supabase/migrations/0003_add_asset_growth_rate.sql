alter table public.assets add column growth_rate_pct numeric not null default 0;
comment on column public.assets.growth_rate_pct is 'Forventet årlig værdiudvikling i procent (positiv for ejendomme, typisk negativ for biler).';
