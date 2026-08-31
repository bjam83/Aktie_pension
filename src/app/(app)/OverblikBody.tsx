"use client";

import Link from "next/link";
import { ageFromBirthDate, projectHousehold, schemeReturnPct, estimateFolkepension, type SchemeCalcInput } from "@/lib/finance/pension";
import { simulateFreeFunds, combineFreeFunds } from "@/lib/finance/freeFunds";
import { projectNetWorth, type AssetGrowthInput } from "@/lib/finance/netWorth";
import { buildPersonPayout, DEFAULT_PAYOUT } from "@/lib/finance/payoutBuilder";
import { fmtKr } from "@/lib/finance/format";
import { toMonthly } from "@/lib/constants";
import { Stat } from "@/components/ui/Stat";
import { LineAreaChart } from "@/components/charts/LineAreaChart";
import { HOUSEHOLD_FILTER, usePersonFilter } from "@/components/layout/PersonFilterContext";
import type {
  AssetKind,
  Asset,
  Liability,
  BudgetItem,
  IncomeStream,
  InvestmentAccount,
  PensionScheme,
  Person,
  Assumptions,
  PlanningSettings,
  PayoutConfig,
} from "@/lib/types";

export function OverblikBody({
  persons,
  assumptions,
  planningSettings,
  schemes,
  accounts,
  budgetItems,
  incomeStreams,
  assets,
  liabilities,
}: {
  persons: Person[];
  assumptions: Assumptions;
  planningSettings: PlanningSettings;
  schemes: PensionScheme[];
  accounts: InvestmentAccount[];
  budgetItems: BudgetItem[];
  incomeStreams: IncomeStream[];
  assets: Asset[];
  liabilities: Liability[];
}) {
  const { personId } = usePersonFilter();
  // A stored personId can point at someone who was since removed — fall back
  // to the whole household rather than showing an empty page.
  const filterPersonId = personId !== HOUSEHOLD_FILTER && persons.some((p) => p.id === personId) ? personId : null;

  // "Joint"/unassigned items (nullable person_id, or an empty owner_ids array)
  // count toward a person's filtered view too, not just the household total —
  // filtering to one person shows "their stuff plus what's shared", not a
  // strict partition.
  const ownedByFilter = (ownerIds: string[]) => filterPersonId === null || ownerIds.length === 0 || ownerIds.includes(filterPersonId);
  const belongsToFilter = (pid: string | null) => filterPersonId === null || pid === null || pid === filterPersonId;

  const vPersons = filterPersonId === null ? persons : persons.filter((p) => p.id === filterPersonId);
  const vSchemes = filterPersonId === null ? schemes : schemes.filter((s) => s.person_id === filterPersonId);
  const vAccounts = filterPersonId === null ? accounts : accounts.filter((a) => belongsToFilter(a.person_id));
  const vAssets = filterPersonId === null ? assets : assets.filter((a) => ownedByFilter(a.owner_ids));
  const vLiabilities = filterPersonId === null ? liabilities : liabilities.filter((l) => ownedByFilter(l.owner_ids));
  const vIncomeStreams = filterPersonId === null ? incomeStreams : incomeStreams.filter((i) => belongsToFilter(i.person_id));
  const vBudgetItems = filterPersonId === null ? budgetItems : budgetItems.filter((b) => belongsToFilter(b.person_id));

  const calcInputs: SchemeCalcInput[] = vSchemes.map((s) => {
    const person = persons.find((p) => p.id === s.person_id);
    return {
      id: s.id,
      personId: s.person_id,
      name: s.name,
      currentValue: Number(s.current_value),
      monthlyContribution: Number(s.monthly_contribution),
      returnPct: schemeReturnPct(s),
      ageNow: person ? ageFromBirthDate(person.birth_date, 40) : 40,
      ageRetire: person?.retirement_age ?? 68,
    };
  });
  const proj = calcInputs.length ? projectHousehold(calcInputs, assumptions.pal_rate, assumptions.inflation_rate) : null;

  const accountSims = vAccounts.map((acc) =>
    simulateFreeFunds(
      {
        lump: Number(acc.current_value),
        monthly: Number(acc.monthly_contribution),
        ret: Number(acc.expected_return_pct),
        years: Number(acc.projection_years),
        tax: acc.kind === "aktiesparekonto" ? "ask" : "depot",
      },
      assumptions,
      assumptions.inflation_rate
    )
  );
  const frieMidlerSim = combineFreeFunds(accountSims);
  const frieMidlerNow = vAccounts.reduce((s, a) => s + Number(a.current_value), 0);

  const pensionNow = vSchemes.reduce((s, sc) => s + Number(sc.current_value), 0);
  const assetsTotal = vAssets.reduce((s, a) => s + Number(a.value), 0);
  const liabilitiesTotal = vLiabilities.reduce((s, l) => s + Number(l.remaining_debt), 0);
  const equity = assetsTotal - liabilitiesTotal;
  const netWorthNow = pensionNow + frieMidlerNow + equity;

  const monthlyIncome =
    vIncomeStreams.reduce((s, i) => s + toMonthly(Number(i.amount), i.frequency), 0) +
    vBudgetItems.filter((b) => b.direction === "ind").reduce((s, b) => s + toMonthly(Number(b.amount), b.frequency), 0);
  const monthlyExpenses = vBudgetItems.filter((b) => b.direction === "ud").reduce((s, b) => s + toMonthly(Number(b.amount), b.frequency), 0);
  const surplus = monthlyIncome - monthlyExpenses;

  // ── Forventet rådighedsbeløb ved pension: folkepension + pensionsudbetalinger (netto), minus
  // dagens udgifter — samme udbetalingsberegning som på Udbetaling. "Primær person" (bruges til at
  // afgøre hvem frie midler-potten lægges ind under) bestemmes altid ud fra hele husstanden, uanset
  // personfilteret, så tallene ikke skifter alt efter hvem der er filtreret til.
  const primaryPerson = persons.find((p) => p.is_primary) ?? persons[0];
  const payoutByPerson = (planningSettings.payout as unknown as Record<string, PayoutConfig>) || {};
  const retirementMonthlyIncome = vPersons.reduce((sum, p) => {
    const personSchemes = vSchemes.filter((s) => s.person_id === p.id);
    const cfg = payoutByPerson[p.id] ?? DEFAULT_PAYOUT;
    const isPrimary = p.id === primaryPerson?.id;
    const { payout } = buildPersonPayout(p, personSchemes, vAccounts, isPrimary, cfg, assumptions);
    return sum + (payout?.netMonthly ?? 0) + estimateFolkepension(p.retirement_age).net;
  }, 0);
  const disposableAtRetirement = retirementMonthlyIncome - monthlyExpenses;

  // ── Samlet formue over tid ─────────────────────────────────────────────
  const horizonYears = Math.max(proj?.horizonYears || 0, frieMidlerSim.years || 0);
  const assetGrowthInputs: AssetGrowthInput[] = vAssets.map((a) => ({
    kind: a.kind as AssetKind,
    value: Number(a.value),
    growthRatePct: Number(a.growth_rate_pct),
  }));
  const netWorthSeries =
    horizonYears >= 1
      ? projectNetWorth(proj?.series.map((y) => ({ year: y.year, total: y.total })) ?? [], frieMidlerSim.series, assetGrowthInputs, liabilitiesTotal, horizonYears)
      : [];

  return (
    <div className="grid gap-[18px]">
      <div className="grid stats-grid" style={{ gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        <Stat
          label="Nettoformue i dag"
          value={fmtKr(netWorthNow)}
          hint={netWorthSeries.length ? `${fmtKr(netWorthSeries[netWorthSeries.length - 1].netWorth)} ved pension` : undefined}
          color="var(--grow)"
        />
        <Stat label="Pension i alt" value={fmtKr(pensionNow)} hint={proj ? `${fmtKr(proj.totals.finalNominal)} ved pension` : undefined} />
        <Stat
          label="Frie midler"
          value={fmtKr(frieMidlerNow)}
          hint={vAccounts.length > 0 ? `${fmtKr(frieMidlerSim.finalNominal)} ved pension` : undefined}
          color="var(--grow)"
        />
        <Stat
          label="Månedligt rådighedsbeløb"
          value={fmtKr(surplus)}
          hint={`${fmtKr(disposableAtRetirement)} ved pension`}
          color={surplus >= 0 ? "var(--grow)" : "var(--real)"}
        />
      </div>

      {netWorthSeries.length >= 2 ? (
        <div className="card">
          <h3>Samlet formue over tid</h3>
          <p className="cap">Areal = sammensætning af formuen · stiplet linje = samlet nettoformue (efter gæld).</p>
          <LineAreaChart
            data={netWorthSeries as unknown as Record<string, number>[]}
            series={[
              { key: "pension", name: "Pension", stroke: "var(--grow)", fill: "var(--grow-soft)", fillOp: 0.85 },
              { key: "frieMidler", name: "Frie midler", stroke: "var(--amber)", fill: "var(--amber-soft)", fillOp: 0.85 },
              { key: "ejendomme", name: "Ejendomme", stroke: "var(--s2)", fill: "var(--s2-soft)", fillOp: 0.85 },
              { key: "biler", name: "Biler", stroke: "var(--real)", fill: "#D79A7C", fillOp: 0.85 },
              { key: "andre", name: "Andre aktiver", stroke: "var(--indbetalt)", fill: "var(--indbetalt)", fillOp: 0.6 },
              { key: "netWorth", name: "Nettoformue (efter gæld)", stroke: "var(--ink)", width: 2.4, dashed: true },
            ]}
            xKey="year"
            height={300}
          />
        </div>
      ) : (
        <div className="note">Tilføj pension, frie midler eller aktiver for at se den samlede formue som graf over tid.</div>
      )}

      <div className="grid cols-3 gap-3">
        <Link href="/pension" className="btn ghost" style={{ justifyContent: "center" }}>
          Se pension →
        </Link>
        <Link href="/frie-midler" className="btn ghost" style={{ justifyContent: "center" }}>
          Se frie midler →
        </Link>
        <Link href="/budget" className="btn ghost" style={{ justifyContent: "center" }}>
          Se budget →
        </Link>
      </div>
    </div>
  );
}
