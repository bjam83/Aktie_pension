"use client";

import { ageFromBirthDate, projectHousehold, schemeReturnPct, type SchemeCalcInput } from "@/lib/finance/pension";
import { simulateFreeFunds, combineFreeFunds } from "@/lib/finance/freeFunds";
import { projectNetWorth, type AssetGrowthInput } from "@/lib/finance/netWorth";
import { fmtKr } from "@/lib/finance/format";
import { toMonthly, LIABILITY_KIND_OPTIONS, INCOME_KIND_OPTIONS, labelFor } from "@/lib/constants";
import { removeLiabilityAction, removeIncomeStreamAction } from "@/lib/actions/budget";
import { LineAreaChart } from "@/components/charts/LineAreaChart";
import { HOUSEHOLD_FILTER, usePersonFilter } from "@/components/layout/PersonFilterContext";
import type { AssetKind, Assumptions, Person, PensionScheme, InvestmentAccount, BudgetItem, IncomeStream, Asset, Liability } from "@/lib/types";
import { BudgetItemRow } from "./BudgetItemRow";
import { AssetRow } from "./AssetRow";
import { AddBudgetItemForm, AddAssetForm, AddLiabilityForm, AddIncomeStreamForm } from "./AddForms";

export function BudgetBody({
  persons,
  assumptions,
  budgetItems,
  incomeStreams,
  assets,
  liabilities,
  schemes,
  accounts,
}: {
  persons: Person[];
  assumptions: Assumptions;
  budgetItems: BudgetItem[];
  incomeStreams: IncomeStream[];
  assets: Asset[];
  liabilities: Liability[];
  schemes: PensionScheme[];
  accounts: InvestmentAccount[];
}) {
  const { personId } = usePersonFilter();
  const filterPersonId = personId !== HOUSEHOLD_FILTER && persons.some((p) => p.id === personId) ? personId : null;

  // "Fælles"/unassigned items (nullable person_id, or an empty owner_ids array)
  // stay visible for every person — filtering to one person shows "their stuff
  // plus what's shared", not a strict partition of the household totals.
  const ownedByFilter = (ownerIds: string[]) => filterPersonId === null || ownerIds.length === 0 || ownerIds.includes(filterPersonId);
  const belongsToFilter = (pid: string | null) => filterPersonId === null || pid === null || pid === filterPersonId;

  const vBudgetItems = filterPersonId === null ? budgetItems : budgetItems.filter((b) => belongsToFilter(b.person_id));
  const vIncomeStreams = filterPersonId === null ? incomeStreams : incomeStreams.filter((i) => belongsToFilter(i.person_id));
  const vAssets = filterPersonId === null ? assets : assets.filter((a) => ownedByFilter(a.owner_ids));
  const vLiabilities = filterPersonId === null ? liabilities : liabilities.filter((l) => ownedByFilter(l.owner_ids));
  const vSchemes = filterPersonId === null ? schemes : schemes.filter((s) => s.person_id === filterPersonId);
  const vAccounts = filterPersonId === null ? accounts : accounts.filter((a) => belongsToFilter(a.person_id));

  const personName = (id: string | null) => persons.find((p) => p.id === id)?.name ?? "Fælles";

  // ── Income vs. expenses ─────────────────────────────────────────────
  const monthlyIncomeFromStreams = vIncomeStreams.reduce((s, i) => s + toMonthly(Number(i.amount), i.frequency), 0);
  const monthlyIncomeFromBudget = vBudgetItems.filter((b) => b.direction === "ind").reduce((s, b) => s + toMonthly(Number(b.amount), b.frequency), 0);
  const monthlyExpenses = vBudgetItems.filter((b) => b.direction === "ud").reduce((s, b) => s + toMonthly(Number(b.amount), b.frequency), 0);
  const totalMonthlyIncome = monthlyIncomeFromStreams + monthlyIncomeFromBudget;
  const surplus = totalMonthlyIncome - monthlyExpenses;

  // ── Net worth today ──────────────────────────────────────────────────
  const pensionNow = vSchemes.reduce((s, sc) => s + Number(sc.current_value), 0);
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
  const frieMidlerNow = vAccounts.reduce((s, a) => s + Number(a.current_value), 0);
  const sim = combineFreeFunds(accountSims);
  const liabilitiesTotal = vLiabilities.reduce((s, l) => s + Number(l.remaining_debt), 0);

  const assetsByKind = (kind: AssetKind | "andet-samlet") =>
    vAssets
      .filter((a) => (kind === "andet-samlet" ? a.kind !== "bolig" && a.kind !== "bil" : a.kind === kind))
      .reduce((s, a) => s + Number(a.value), 0);
  const ejendommeNow = assetsByKind("bolig");
  const bilerNow = assetsByKind("bil");
  const andreNow = assetsByKind("andet-samlet");
  const equityNow = ejendommeNow + bilerNow + andreNow - liabilitiesTotal;

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

  const netWorthNow = pensionNow + frieMidlerNow + equityNow;

  // ── Net worth over time ──────────────────────────────────────────────
  const horizonYears = Math.max(proj?.horizonYears || 0, sim.years || 0);
  const assetGrowthInputs: AssetGrowthInput[] = vAssets.map((a) => ({
    kind: a.kind as AssetKind,
    value: Number(a.value),
    growthRatePct: Number(a.growth_rate_pct),
  }));
  const netWorthSeries =
    horizonYears >= 1
      ? projectNetWorth(
          proj?.series.map((y) => ({ year: y.year, total: y.total })) ?? [],
          sim.series.map((y) => ({ year: y.year, nominal: y.nominal })),
          assetGrowthInputs,
          liabilitiesTotal,
          horizonYears
        )
      : [];
  const netWorthAtHorizon = netWorthSeries[netWorthSeries.length - 1];

  return (
    <div className="grid gap-[18px]">
      <div className="card">
        <h3>Indkomst vs. udgifter</h3>
        <div className="grid cols-2 gap-3 mb-2">
          <div>
            <div className="text-[11px] font-medium mb-2" style={{ color: "var(--muted)" }}>
              INDKOMST
            </div>
            <div className="flex justify-between text-[13px]">
              <span>I alt</span>
              <span className="num font-semibold" style={{ color: "var(--grow)" }}>
                {fmtKr(totalMonthlyIncome)}/md.
              </span>
            </div>
          </div>
          <div>
            <div className="text-[11px] font-medium mb-2" style={{ color: "var(--muted)" }}>
              UDGIFTER
            </div>
            <div className="flex justify-between text-[13px]">
              <span>I alt</span>
              <span className="num font-semibold" style={{ color: "var(--real)" }}>
                {fmtKr(monthlyExpenses)}/md.
              </span>
            </div>
          </div>
        </div>
        <div className="pt-2" style={{ borderTop: "1px solid var(--line)" }}>
          <div className="flex justify-between text-[14px] font-semibold">
            <span>{surplus >= 0 ? "Månedligt overskud" : "Månedligt underskud"}</span>
            <span className="num" style={{ color: surplus >= 0 ? "var(--grow)" : "var(--real)" }}>
              {surplus >= 0 ? "+" : ""}
              {fmtKr(surplus)}/md.
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <h3 style={{ margin: 0 }}>Indkomstkilder</h3>
        </div>
        {vIncomeStreams.length === 0 && <div className="empty">Ingen faste indkomster registreret.</div>}
        {vIncomeStreams.map((inc) => (
          <div key={inc.id} className="flex items-center justify-between py-1.5" style={{ borderBottom: "1px solid var(--line)" }}>
            <span className="text-[13px]">
              {labelFor(INCOME_KIND_OPTIONS, inc.kind)} · {personName(inc.person_id)}
            </span>
            <div className="flex items-center gap-2">
              <span className="num text-[13px]">{fmtKr(toMonthly(Number(inc.amount), inc.frequency))}/md.</span>
              <form action={removeIncomeStreamAction}>
                <input type="hidden" name="id" value={inc.id} />
                <button className="btn ghost tiny" type="submit">
                  Slet
                </button>
              </form>
            </div>
          </div>
        ))}
        <AddIncomeStreamForm persons={persons} />
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <h3 style={{ margin: 0 }}>Månedligt udgiftsbudget</h3>
          <span className="num text-[13px] font-semibold">{fmtKr(monthlyExpenses)}/md.</span>
        </div>
        <div className="mt-3">
          {vBudgetItems.map((item) => (
            <BudgetItemRow key={item.id} item={item} persons={persons} />
          ))}
        </div>
        <AddBudgetItemForm />
      </div>

      <div className="grid cols-2 gap-[16px]">
        <div className="card">
          <div className="flex items-center justify-between">
            <h3 style={{ margin: 0 }}>Aktiver</h3>
            <span className="num text-[13px] font-semibold">{fmtKr(ejendommeNow + bilerNow + andreNow)}</span>
          </div>
          {vAssets.length === 0 && <div className="empty">Ingen aktiver endnu.</div>}
          {vAssets.map((a) => (
            <AssetRow key={a.id} asset={a} persons={persons} />
          ))}
          <AddAssetForm persons={persons} />
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <h3 style={{ margin: 0 }}>Gæld</h3>
            <span className="num text-[13px] font-semibold" style={{ color: "var(--real)" }}>
              {fmtKr(liabilitiesTotal)}
            </span>
          </div>
          {vLiabilities.length === 0 && <div className="empty">Ingen gæld registreret.</div>}
          {vLiabilities.map((l) => (
            <div key={l.id} className="flex items-center justify-between py-1.5" style={{ borderBottom: "1px solid var(--line)" }}>
              <span className="text-[13px]">
                {l.name} <span style={{ color: "var(--faint)" }}>· {labelFor(LIABILITY_KIND_OPTIONS, l.kind)}</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="num text-[13px]">{fmtKr(l.remaining_debt)}</span>
                <form action={removeLiabilityAction}>
                  <input type="hidden" name="id" value={l.id} />
                  <button className="btn ghost tiny" type="submit">
                    Slet
                  </button>
                </form>
              </div>
            </div>
          ))}
          <AddLiabilityForm persons={persons} />
        </div>
      </div>

      <div className="card">
        <h3>Samlet nettoformue</h3>
        <p className="cap">Pension, frie midler, ejendomme, biler og andre aktiver — i dag og ved pension.</p>
        <div className="grid cols-2 gap-4">
          <div>
            <div className="text-[11px] font-medium mb-2" style={{ color: "var(--muted)" }}>
              I DAG
            </div>
            <div className="flex justify-between text-[13px] mb-1">
              <span>Pension</span>
              <span className="num">{fmtKr(pensionNow)}</span>
            </div>
            <div className="flex justify-between text-[13px] mb-1">
              <span>Frie midler</span>
              <span className="num">{fmtKr(frieMidlerNow)}</span>
            </div>
            <div className="flex justify-between text-[13px] mb-1">
              <span>Ejendomme</span>
              <span className="num">{fmtKr(ejendommeNow)}</span>
            </div>
            <div className="flex justify-between text-[13px] mb-1">
              <span>Biler</span>
              <span className="num">{fmtKr(bilerNow)}</span>
            </div>
            <div className="flex justify-between text-[13px] mb-1">
              <span>Andre aktiver</span>
              <span className="num">{fmtKr(andreNow)}</span>
            </div>
            <div className="flex justify-between text-[13px] mb-1">
              <span>Gæld</span>
              <span className="num" style={{ color: "var(--real)" }}>
                −{fmtKr(liabilitiesTotal)}
              </span>
            </div>
            <div className="flex justify-between text-[14px] font-semibold pt-2 mt-1" style={{ borderTop: "1px solid var(--line)" }}>
              <span>I alt</span>
              <span className="num" style={{ color: "var(--grow)" }}>
                {fmtKr(netWorthNow)}
              </span>
            </div>
          </div>
          <div>
            <div className="text-[11px] font-medium mb-2" style={{ color: "var(--muted)" }}>
              VED PENSION{horizonYears >= 1 ? ` (om ${horizonYears} år)` : ""}
            </div>
            <div className="flex justify-between text-[13px] mb-1">
              <span>Pension (fremskrevet)</span>
              <span className="num">{fmtKr(netWorthAtHorizon?.pension ?? proj?.totals.finalNominal ?? 0)}</span>
            </div>
            <div className="flex justify-between text-[13px] mb-1">
              <span>Frie midler (fremskrevet)</span>
              <span className="num">{fmtKr(netWorthAtHorizon?.frieMidler ?? sim.finalNominal)}</span>
            </div>
            <div className="flex justify-between text-[13px] mb-1">
              <span>Ejendomme (fremskrevet)</span>
              <span className="num">{fmtKr(netWorthAtHorizon?.ejendomme ?? ejendommeNow)}</span>
            </div>
            <div className="flex justify-between text-[13px] mb-1">
              <span>Biler (fremskrevet)</span>
              <span className="num">{fmtKr(netWorthAtHorizon?.biler ?? bilerNow)}</span>
            </div>
            <div className="flex justify-between text-[13px] mb-1">
              <span>Andre aktiver (fremskrevet)</span>
              <span className="num">{fmtKr(netWorthAtHorizon?.andre ?? andreNow)}</span>
            </div>
            <div className="flex justify-between text-[13px] mb-1">
              <span>Gæld (uændret)</span>
              <span className="num" style={{ color: "var(--real)" }}>
                −{fmtKr(liabilitiesTotal)}
              </span>
            </div>
            <div className="flex justify-between text-[14px] font-semibold pt-2 mt-1" style={{ borderTop: "1px solid var(--line)" }}>
              <span>I alt</span>
              <span className="num" style={{ color: "var(--grow)" }}>
                {fmtKr(netWorthAtHorizon?.netWorth ?? netWorthNow)}
              </span>
            </div>
          </div>
        </div>

        {netWorthSeries.length >= 2 ? (
          <div className="mt-5">
            <h3>Nettoformue over tid</h3>
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
              height={320}
            />
          </div>
        ) : (
          <div className="note mt-4">
            Tilføj pensionsordninger, frie midler eller aktiver med værdiudvikling for at se nettoformuen som graf over tid.
          </div>
        )}
      </div>
    </div>
  );
}
