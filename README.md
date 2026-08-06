# Pension & opsparing

Husstandens overblik over pension, investeringer og budget — multi-bruger, med egen konto pr. bruger.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind v4)
- **Supabase** — Auth (email/password) + Postgres med Row Level Security
- Hostes på **Vercel**

## Funktioner

- **Multi-bruger login** — hver bruger opretter sin egen konto med eget password. Al data er isoleret pr. konto via RLS
  (`household_id = auth.uid()`), og en Postgres-trigger opretter automatisk husstand + første person ved signup.
- **Husstandsoverblik** — default én person i husstanden, men der kan tilføjes én mere (navngivet), og pension,
  investeringskonti, aktiver, gæld og indkomst kan knyttes til en bestemt person.
- **Pension** — fremskrivning med PAL-skat og inflation, pr. ordning og for hele husstanden samlet.
- **Investeringer** — depoter (frie midler / aktiesparekonto / pensionsdepot) med individuelle aktier/fonde. Kurser
  hentes automatisk fra Stooq (gratis, ingen API-nøgle) når tickeren er i Stooq-format (fx `AAPL.US`, `NOVO-B.DK`),
  med manuel kurs som fallback.
- **Udbetaling** — simulerer annuitetsudbetaling pr. person, inkl. dansk indkomstskat og et estimat for folkepension.
- **Frie midler** — opsparing uden for pension, med aktiesparekonto- eller aktiedepot-beskatning.
- **Budget** — indtægter/udgifter, aktiver/gæld og samlet nettoformue i dag og ved pension.
- **Indstillinger** — alle skattesatser og antagelser kan justeres pr. husstand.
- Responsivt design til både mobil (bundnavigation) og computer (faner).

## Kom i gang lokalt

```bash
npm install
cp .env.example .env.local   # udfyld med Supabase URL + anon key
npm run dev
```

## Supabase — nødvendig opsætning efter deploy

Auth-mailskabeloner og tilladte redirect-URL'er sættes i Supabase-dashboardet (kan ikke sættes via migration):

1. Gå til **Authentication → URL Configuration** for projektet.
2. Sæt **Site URL** til appens produktions-URL (fx `https://<dit-projekt>.vercel.app`).
3. Tilføj samme URL (+ `http://localhost:3000` til lokal udvikling) under **Redirect URLs**.

Uden dette vil bekræftelses- og nulstillingslinks i emails pege forkert.

## Databaseskema

Se `supabase/migrations/` — kørt via Supabase MCP mod projektet `aktie-pension`. Kernetabeller:
`households`, `persons`, `assumptions`, `pension_schemes`, `investment_accounts`, `holdings`,
`holding_price_history`, `assets`, `liabilities`, `income_streams`, `budget_items`, `planning_settings`.
