import { redirect } from "next/navigation";
import Link from "next/link";
import {
  getHouseholdBundle,
  getPensionSchemes,
  getInvestmentAccounts,
  getBudgetItems,
  getIncomeStreams,
  getAssets,
  getLiabilities,
} from "@/lib/data";
import { ageFromBirthDate, projectHousehold, schemeReturnPct, type SchemeCalcInput } from "@/lib/finance/pension";
import { simulateFreeFunds, combineFreeFunds } from "@/lib/finance/freeFunds";
import { projectNetWorth, type AssetGrowthInput } from "@/lib/finance/netWorth";
import { fmtKr } from "@/lib/finance/format";
import { toMonthly, personColor } from "@/lib/constants";
import { Stat } from "@/components/ui/Stat";
import { LineAreaChart } from "@/components/charts/LineAreaChart";
import type { AssetKind } from "@/lib/types";

export default async function DashboardPage() {
  const bundle = await getHouseholdBundle();
  if (!bundle) redirect("/login");
  const { persons, assumptions } = bundle;

  const [schemes, accounts, budgetItems, incomeStreams, assets, liabilities] = await Promise.all([
    getPensionSchemes(),
    getInvestmentAccounts(),
    getBudgetItems(),
    getIncomeStreams(),
    getAssets(),
    getLiabilities(),
  ]);

  const calcInputs: SchemeCalcInput[] = schemes.map((s) => {
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

  const accountSims = accounts.map((acc) =>
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
  const frieMidlerNow = accounts.reduce((s, a) => s + Number(a.current_value), 0);

  const pensionNow = schemes.reduce((s, sc) => s + Number(sc.current_value), 0);
  const assetsTotal = assets.reduce((s, a) => s + Number(a.value), 0);
  const liabilitiesTotal = liabilities.reduce((s, l) => s + Number(l.remaining_debt), 0);
  const equity = assetsTotal - liabilitiesTotal;
  const netWorthNow = pensionNow + frieMidlerNow + equity;

  const monthlyIncome =
    incomeStreams.reduce((s, i) => s + toMonthly(Number(i.amount), i.frequency), 0) +
    budgetItems.filter((b) => b.direction === "ind").reduce((s, b) => s + toMonthly(Number(b.amount), b.frequency), 0);
  const monthlyExpenses = budgetItems.filter((b) => b.direction === "ud").reduce((s, b) => s + toMonthly(Number(b.amount), b.frequency), 0);
  const surplus = monthlyIncome - monthlyExpenses;

  // ── Samlet formue over tid ─────────────────────────────────────────────
  const horizonYears = Math.max(proj?.horizonYears || 0, frieMidlerSim.years || 0);
  const assetGrowthInputs: AssetGrowthInput[] = assets.map((a) => ({
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
        <Stat label="Nettoformue i dag" value={fmtKr(netWorthNow)} color="var(--grow)" />
        <Stat label="Pension i alt" value={fmtKr(pensionNow)} hint={proj ? `${fmtKr(proj.totals.finalNominal)} ved pension` : undefined} />
        <Stat label="Frie midler" value={fmtKr(frieMidlerNow)} color="var(--grow)" />
        <Stat label="Månedligt rådighedsbeløb" value={fmtKr(surplus)} color={surplus >= 0 ? "var(--grow)" : "var(--real)"} />
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

      <div className="grid cols-2 gap-[16px]">
        {persons.map((p, i) => {
          const personPension = schemes.filter((s) => s.person_id === p.id).reduce((s, sc) => s + Number(sc.current_value), 0);
          return (
            <div key={p.id} className="card">
              <div className="flex items-center gap-2 mb-2">
                <span className="dot" style={{ background: personColor(i) }} />
                <h3 style={{ margin: 0 }}>{p.name}</h3>
              </div>
              <div className="flex justify-between text-[13px] mb-1">
                <span style={{ color: "var(--muted)" }}>Pension</span>
                <span className="num">{fmtKr(personPension)}</span>
              </div>
              <div className="flex justify-between text-[13px] mb-1">
                <span style={{ color: "var(--muted)" }}>Pensionsalder</span>
                <span className="num">{p.retirement_age} år</span>
              </div>
            </div>
          );
        })}
      </div>

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
