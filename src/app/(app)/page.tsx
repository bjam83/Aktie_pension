import { redirect } from "next/navigation";
import {
  getHouseholdBundle,
  getPensionSchemes,
  getInvestmentAccounts,
  getBudgetItems,
  getIncomeStreams,
  getAssets,
  getLiabilities,
} from "@/lib/data";
import { ageFromBirthDate, projectHousehold, schemeReturnPct, estimateFolkepension, type SchemeCalcInput } from "@/lib/finance/pension";
import { simulateFreeFunds, combineFreeFunds } from "@/lib/finance/freeFunds";
import { projectNetWorth, type AssetGrowthInput } from "@/lib/finance/netWorth";
import { buildPersonPayout, DEFAULT_PAYOUT } from "@/lib/finance/payoutBuilder";
import { toMonthly } from "@/lib/constants";
import { LineAreaChart } from "@/components/charts/LineAreaChart";
import { HOUSEHOLD_FILTER } from "@/components/layout/HouseholdViewContext";
import { OverblikHero, type OverblikView } from "./OverblikHero";
import type { AssetKind, PayoutConfig, Asset, Liability, IncomeStream, BudgetItem, InvestmentAccount, PensionScheme, Person } from "@/lib/types";

export default async function DashboardPage() {
  const bundle = await getHouseholdBundle();
  if (!bundle) redirect("/login");
  const { persons, assumptions, planningSettings } = bundle;

  const [schemes, accounts, budgetItems, incomeStreams, assets, liabilities] = await Promise.all([
    getPensionSchemes(),
    getInvestmentAccounts(),
    getBudgetItems(),
    getIncomeStreams(),
    getAssets(),
    getLiabilities(),
  ]);

  const primaryPerson = persons.find((p) => p.is_primary) ?? persons[0];
  const payoutByPerson = (planningSettings.payout as unknown as Record<string, PayoutConfig>) || {};

  // ── Per-view slice of the household (household-wide, or one person) ────────
  // "Joint"/unassigned items (person_id null, or an empty owner_ids array) count
  // toward every individual person's view as well as the household view — a
  // person's slice is "their stuff plus what's shared", not a strict partition
  // that sums back to the household total. Returns the public hero numbers plus
  // a couple of internal pieces (proj/frieMidlerSim) the household call reuses
  // below to build the full yearly net-worth series without recomputing.
  function buildView(filterPersonId: string | null) {
    const ownedByFilter = (ownerIds: string[]) => filterPersonId === null || ownerIds.length === 0 || ownerIds.includes(filterPersonId);
    const belongsToFilter = (personId: string | null) => filterPersonId === null || personId === null || personId === filterPersonId;

    const vSchemes: PensionScheme[] = filterPersonId === null ? schemes : schemes.filter((s) => s.person_id === filterPersonId);
    const vAccounts: InvestmentAccount[] = filterPersonId === null ? accounts : accounts.filter((a) => belongsToFilter(a.person_id));
    const vAssets: Asset[] = filterPersonId === null ? assets : assets.filter((a) => ownedByFilter(a.owner_ids));
    const vLiabilities: Liability[] = filterPersonId === null ? liabilities : liabilities.filter((l) => ownedByFilter(l.owner_ids));
    const vIncomeStreams: IncomeStream[] = filterPersonId === null ? incomeStreams : incomeStreams.filter((i) => belongsToFilter(i.person_id));
    const vBudgetItems: BudgetItem[] = filterPersonId === null ? budgetItems : budgetItems.filter((b) => belongsToFilter(b.person_id));
    const vPersons: Person[] = filterPersonId === null ? persons : persons.filter((p) => p.id === filterPersonId);

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

    const retirementMonthlyIncome = vPersons.reduce((sum, p) => {
      const personSchemes = vSchemes.filter((s) => s.person_id === p.id);
      const cfg = payoutByPerson[p.id] ?? DEFAULT_PAYOUT;
      const isPrimary = p.id === primaryPerson?.id;
      const { payout } = buildPersonPayout(p, personSchemes, vAccounts, isPrimary, cfg, assumptions);
      return sum + (payout?.netMonthly ?? 0) + estimateFolkepension(p.retirement_age).net;
    }, 0);
    const disposableAtRetirement = retirementMonthlyIncome - monthlyExpenses;

    // A single person's slice doesn't get its own yearly projection (asset
    // growth + debt paydown) — only the household view does, built below from
    // `proj`/`frieMidlerSim` reused from this call. So a person's at-retirement
    // net worth is the simpler sum of pension + frie midler end values plus
    // today's equity, a deliberate, disclosed approximation for this round.
    const netWorthAtRetirementApprox = (proj?.totals.finalNominal ?? 0) + frieMidlerSim.finalNominal + equity;

    const view: OverblikView = {
      netWorthNow,
      netWorthAtRetirement: netWorthAtRetirementApprox,
      pensionNow,
      pensionAtRetirement: proj?.totals.finalNominal ?? 0,
      frieMidlerNow,
      frieMidlerAtRetirement: frieMidlerSim.finalNominal,
      surplus,
      disposableAtRetirement,
      liabilitiesTotal,
      schemeCount: vSchemes.length,
      accountCount: vAccounts.length,
    };
    return { view, proj, frieMidlerSim, assetsTotal, liabilitiesTotal };
  }

  const views: Record<string, OverblikView> = {};
  for (const p of persons) views[p.id] = buildView(p.id).view;

  // ── Household view + samlet formue over tid — the chart doesn't follow the
  // person filter (a true per-person yearly projection is out of scope this
  // round), so it's always built from the full household. ──────────────────
  const household = buildView(null);
  const horizonYears = Math.max(household.proj?.horizonYears || 0, household.frieMidlerSim.years || 0);
  const assetGrowthInputs: AssetGrowthInput[] = assets.map((a) => ({
    kind: a.kind as AssetKind,
    value: Number(a.value),
    growthRatePct: Number(a.growth_rate_pct),
  }));
  const netWorthSeries =
    horizonYears >= 1
      ? projectNetWorth(
          household.proj?.series.map((y) => ({ year: y.year, total: y.total })) ?? [],
          household.frieMidlerSim.series,
          assetGrowthInputs,
          household.liabilitiesTotal,
          horizonYears
        )
      : [];
  views[HOUSEHOLD_FILTER] = {
    ...household.view,
    netWorthAtRetirement: netWorthSeries.length ? netWorthSeries[netWorthSeries.length - 1].netWorth : household.view.netWorthAtRetirement,
  };

  return (
    <div className="grid gap-[18px]">
      <OverblikHero views={views} palRate={assumptions.pal_rate} inflationRate={assumptions.inflation_rate} />

      {netWorthSeries.length >= 2 ? (
        <div className="card">
          <h3>Samlet formue over tid</h3>
          <p className="cap">Areal = sammensætning af formuen · stiplet linje = samlet nettoformue (efter gæld).</p>
          <LineAreaChart
            data={netWorthSeries as unknown as Record<string, number>[]}
            series={[
              { key: "pension", name: "Pension", stroke: "var(--grow)", fill: "var(--grow-soft)", fillOp: 0.85 },
              { key: "frieMidler", name: "Frie midler", stroke: "var(--s2)", fill: "var(--s2-soft)", fillOp: 0.85 },
              { key: "ejendomme", name: "Ejendomme", stroke: "var(--accent-800)", fill: "var(--accent-300)", fillOp: 0.7 },
              { key: "biler", name: "Biler", stroke: "var(--neutral-700)", fill: "var(--neutral-400)", fillOp: 0.7 },
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
    </div>
  );
}
