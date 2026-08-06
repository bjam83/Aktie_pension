alter table public.investment_accounts add column current_value numeric not null default 0;
comment on column public.investment_accounts.current_value is 'Startværdi/nuværende værdi indtastet direkte af brugeren — ingen opslag mod værdipapirer.';
