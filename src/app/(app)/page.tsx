import { redirect } from "next/navigation";
import Link from "next/link";
import {
  getHouseholdBundle,
  getPensionSchemes,
  getHoldings,
  getInvestmentAccounts,
  getBudgetItems,
  getIncomeStreams,
  getAssets,
  getLiabilities,
} from "@/lib/data";
import { ageFromBirthDate, projectHousehold, schemeReturnPct, type SchemeCalcInput } from "@/lib/finance/pension";
import { portfolioReturn } from "@/lib/finance/holdings";
import { fmtKr, fmtPct } from "@/lib/finance/format";
import { toMonthly, personColor } from "@/lib/constants";
import { Stat } from "@/components/ui/Stat";
import { LineAreaChart } from "@/components/charts/LineAreaChart";
import type { FreeFundsConfig } from "@/lib/types";

export default async function DashboardPage() {
  const bundle = await getHouseholdBundle();
  if (!bundle) redirect("/login");
  const { persons, assumptions, planningSettings } = bundle;

  const [schemes, holdings, accounts, budgetItems, incomeStreams, assets, liabilities] = await Promise.all([
    getPensionSchemes(),
    getHoldings(),
    getInvestmentAccounts(),
    getBudgetItems(),
    getIncomeStreams(),
    getAssets(),
    getLiabilities(),
  ]);
  void accounts;

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

  const ffCfg = planningSettings.free_funds as unknown as FreeFundsConfig;

  const invReturn = portfolioReturn(holdings);
  const pensionNow = schemes.reduce((s, sc) => s + Number(sc.current_value), 0);
  const assetsTotal = assets.reduce((s, a) => s + Number(a.value), 0);
  const liabilitiesTotal = liabilities.reduce((s, l) => s + Number(l.remaining_debt), 0);
  const equity = assetsTotal - liabilitiesTotal;
  const netWorthNow = pensionNow + invReturn.marketValue + Number(ffCfg.lump || 0) + equity;

  const monthlyIncome =
    incomeStreams.reduce((s, i) => s + toMonthly(Number(i.amount), i.frequency), 0) +
    budgetItems.filter((b) => b.direction === "ind").reduce((s, b) => s + toMonthly(Number(b.amount), b.frequency), 0);
  const monthlyExpenses = budgetItems.filter((b) => b.direction === "ud").reduce((s, b) => s + toMonthly(Number(b.amount), b.frequency), 0);
  const surplus = monthlyIncome - monthlyExpenses;

  const chartData = proj
    ? proj.series.map((y) => {
        const row: Record<string, number> = { year: y.year, total: y.total, real: y.real };
        return row;
      })
    : [];

  return (
    <div className="grid gap-[18px]">
      <div className="grid stats-grid" style={{ gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        <Stat label="Nettoformue i dag" value={fmtKr(netWorthNow)} color="var(--grow)" />
        <Stat label="Pension i alt" value={fmtKr(pensionNow)} hint={proj ? `${fmtKr(proj.totals.finalNominal)} ved pension` : undefined} />
        <Stat
          label="Investeringer"
          value={fmtKr(invReturn.marketValue)}
          hint={invReturn.gainPct == null ? undefined : `${invReturn.gain >= 0 ? "+" : ""}${fmtPct(invReturn.gainPct)} afkast`}
          color={invReturn.gain >= 0 ? "var(--grow)" : "var(--real)"}
        />
        <Stat label="Månedligt rådighedsbeløb" value={fmtKr(surplus)} color={surplus >= 0 ? "var(--grow)" : "var(--real)"} />
      </div>

      {proj && chartData.length >= 2 && (
        <div className="card">
          <h3>Husstandens pension — fremskrivning</h3>
          <p className="cap">Samlet formue for hele husstanden frem mod sidste pensionsalder.</p>
          <LineAreaChart
            data={chartData}
            series={[
              { key: "total", name: "Samlet pension", stroke: "var(--grow)", fill: "var(--grow-soft)", fillOp: 0.6 },
              { key: "real", name: "Nutidsværdi", stroke: "var(--real)", width: 2.2, dashed: true },
            ]}
            xKey="year"
          />
        </div>
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
        <Link href="/investeringer" className="btn ghost" style={{ justifyContent: "center" }}>
          Se investeringer →
        </Link>
        <Link href="/budget" className="btn ghost" style={{ justifyContent: "center" }}>
          Se budget →
        </Link>
      </div>
    </div>
  );
}
