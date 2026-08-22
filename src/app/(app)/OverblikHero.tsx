"use client";

import { useHouseholdView, HOUSEHOLD_FILTER } from "@/components/layout/HouseholdViewContext";
import { ListRow } from "@/components/ui/ListRow";
import { Stat } from "@/components/ui/Stat";
import { fmtKr, fmtPct } from "@/lib/finance/format";

export interface OverblikView {
  netWorthNow: number;
  netWorthAtRetirement: number;
  pensionNow: number;
  pensionAtRetirement: number;
  frieMidlerNow: number;
  frieMidlerAtRetirement: number;
  surplus: number;
  disposableAtRetirement: number;
  liabilitiesTotal: number;
  schemeCount: number;
  accountCount: number;
}

/**
 * Reads the global person + perspective context and renders the matching slice
 * of pre-computed data. All the underlying math (projectHousehold, combineFreeFunds
 * etc.) runs server-side in page.tsx per person + for the household as a whole —
 * this component only ever picks which of those already-computed numbers to show.
 */
export function OverblikHero({
  views,
  palRate,
  inflationRate,
}: {
  views: Record<string, OverblikView>;
  palRate: number;
  inflationRate: number;
}) {
  const { personId, perspective } = useHouseholdView();
  const view = views[personId] ?? views[HOUSEHOLD_FILTER];
  const atRetirement = perspective === "retirement";

  const netWorth = atRetirement ? view.netWorthAtRetirement : view.netWorthNow;
  const pension = atRetirement ? view.pensionAtRetirement : view.pensionNow;
  const frieMidler = atRetirement ? view.frieMidlerAtRetirement : view.frieMidlerNow;
  const disposable = atRetirement ? view.disposableAtRetirement : view.surplus;

  return (
    <>
      <div className="card">
        <p className="cap">{atRetirement ? "Nettoformue ved pension" : "Nettoformue i dag"}</p>
        <div className="num" style={{ fontSize: "var(--fs-2xl)", fontWeight: 600, letterSpacing: "-0.01em" }}>
          {fmtKr(netWorth)}
        </div>
        {!atRetirement && (
          <p style={{ marginTop: 6, color: "var(--faint)", fontSize: "var(--fs-xs)" }}>
            {fmtKr(view.netWorthAtRetirement)} ved pension
          </p>
        )}
      </div>

      <div className="grid cols-3" style={{ display: "grid", gap: 12 }}>
        <Stat label="PAL-skat" value={fmtPct(palRate)} />
        <Stat label="Inflation" value={fmtPct(inflationRate)} />
        <Stat label="Gæld i alt" value={fmtKr(view.liabilitiesTotal)} />
      </div>

      <div className="card lrow-list">
        <ListRow href="/pension" label="Pension" subtext={`${view.schemeCount} ${view.schemeCount === 1 ? "ordning" : "ordninger"}`} value={fmtKr(pension)} valueColor="var(--grow)" />
        <ListRow href="/frie-midler" label="Frie midler" subtext={`${view.accountCount} ${view.accountCount === 1 ? "konto" : "konti"}`} value={fmtKr(frieMidler)} valueColor="var(--s2)" />
        <ListRow href="/budget" label="Rådighed" subtext={atRetirement ? "pr. måned, ved pension" : "pr. måned, i dag"} value={fmtKr(disposable)} />
      </div>
    </>
  );
}
