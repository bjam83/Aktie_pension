"use client";

import { useActionState } from "react";
import { addFundAction, type FormState } from "@/lib/actions/pensionFunds";
import { TextField } from "@/components/ui/Field";
import { PercentField } from "@/components/ui/PercentField";
import { fmtPct } from "@/lib/finance/format";
import {
  weightedFundReturns,
  historicalWeightedAverage,
  ytdWeightedReturn,
  totalAllocationPct,
  fundYearLabel,
  type FundAllocation,
  type FundYearReturn,
} from "@/lib/finance/fundReturns";
import { fundColor } from "@/lib/constants";
import { Stat } from "@/components/ui/Stat";
import { DonutChart } from "@/components/charts/DonutChart";
import { LineAreaChart } from "@/components/charts/LineAreaChart";
import { FundCard } from "./FundCard";
import type { PensionFundReturn, PensionScheme, PensionSchemeFund } from "@/lib/types";

const initialState: FormState = {};

export function FundAllocationCard({
  scheme,
  funds,
  returnsByFund,
}: {
  scheme: PensionScheme;
  funds: PensionSchemeFund[];
  returnsByFund: Map<string, PensionFundReturn[]>;
}) {
  const [state, formAction, pending] = useActionState(addFundAction, initialState);

  const allocations: FundAllocation[] = funds.map((f) => ({ id: f.id, name: f.name, allocationPct: Number(f.allocation_pct) }));
  const yearReturns: FundYearReturn[] = funds.flatMap((f) =>
    (returnsByFund.get(f.id) ?? []).map((r) => ({ fundId: f.id, year: r.year, returnPct: Number(r.return_pct) }))
  );
  const weighted = weightedFundReturns(allocations, yearReturns);
  const ytd = ytdWeightedReturn(weighted);
  const hist = historicalWeightedAverage(weighted);
  const totalAlloc = totalAllocationPct(allocations);
  const allocOff = Math.abs(100 - totalAlloc) > 1;

  const donutData = funds.map((f, i) => ({ name: f.name, value: Number(f.allocation_pct), color: fundColor(i) }));

  const allYears = Array.from(new Set(yearReturns.map((r) => r.year))).sort((a, b) => a - b);
  const chartData =
    allYears.length >= 2
      ? allYears.map((year) => {
          const row: Record<string, number> = { year };
          funds.forEach((f) => {
            const match = yearReturns.find((r) => r.fundId === f.id && r.year === year);
            if (match) row[f.id] = match.returnPct;
          });
          const w = weighted.find((w) => w.year === year);
          if (w) row.weighted = w.weightedReturnPct;
          return row;
        })
      : [];
  const chartSeries = [
    ...funds.map((f, i) => ({ key: f.id, name: f.name, stroke: fundColor(i) })),
    { key: "weighted", name: "Samlet (vægtet)", stroke: "var(--ink)", width: 2.4, dashed: true },
  ];

  return (
    <details className="card">
      <summary style={{ cursor: "pointer", listStyle: "revert" }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "var(--fs-base)", color: "var(--ink)" }}>
          Fondsfordeling — {scheme.name}
        </span>{" "}
        <span className="cap">
          {funds.length} fond{funds.length === 1 ? "" : "e"} · {fmtPct(totalAlloc, 0)} allokeret
        </span>
      </summary>

      <div className="mt-3">
        {funds.length === 0 ? (
          <div className="empty">Ingen fonde registreret endnu for {scheme.name}.</div>
        ) : (
          <>
            <div className="grid cols-3 gap-3 mb-4">
              <Stat
                label="Afkast år til dato"
                value={ytd == null ? "–" : fmtPct(ytd)}
                hint={ytd == null ? "intet afkast indtastet for i år" : undefined}
                color={ytd != null ? "var(--grow)" : undefined}
              />
              <Stat
                label="Historisk afkast (geo. snit)"
                value={hist.avgPct == null ? "–" : fmtPct(hist.avgPct)}
                hint={hist.count ? `baseret på ${hist.count} år` : "ingen afkast indtastet endnu"}
                color={hist.avgPct != null ? "var(--grow)" : undefined}
              />
              <Stat
                label="Allokeret i alt"
                value={fmtPct(totalAlloc, 0)}
                hint={allocOff ? "summerer ikke til 100%" : undefined}
                color={allocOff ? "var(--amber)" : undefined}
              />
            </div>

            <div className="grid cols-2 gap-4 mb-4">
              <div>
                <DonutChart data={donutData} centerFmt={(v) => fmtPct(v, 0)} legendFmt={(v) => fmtPct(v, 0)} />
              </div>
              {chartData.length >= 2 && (
                <div>
                  <LineAreaChart data={chartData} series={chartSeries} xKey="year" xFmt={fundYearLabel} valueFmt={(v) => fmtPct(v)} height={220} />
                </div>
              )}
            </div>

            <div className="grid gap-3">
              {funds.map((f, i) => (
                <FundCard key={f.id} fund={f} returns={returnsByFund.get(f.id) ?? []} color={fundColor(i)} />
              ))}
            </div>
          </>
        )}

        <details className="mt-3">
          <summary className="btn ghost tiny" style={{ display: "inline-flex", cursor: "pointer" }}>
            + Tilføj fond
          </summary>
          <form action={formAction} className="grid gap-3 cols-2 mt-3">
            <input type="hidden" name="scheme_id" value={scheme.id} />
            <TextField label="Navn" name="name" placeholder="Fx Globale Aktier KL" required />
            <PercentField label="Andel af ordningen" name="allocation_pct" id={`fund-newalloc-${scheme.id}`} placeholder="Fx 35" />
            <div className="col-span-2">
              <TextField
                label="Link til fondens side (valgfrit)"
                name="source_url"
                placeholder="https://appension.fondliste.dk/..."
              />
            </div>
            <div className="flex items-end">
              <button className="btn" type="submit" disabled={pending}>
                {pending ? "Tilføjer…" : "+ Tilføj fond"}
              </button>
            </div>
          </form>
          {state.error && (
            <p className="text-[12px] mt-2" style={{ color: "var(--danger)" }}>
              {state.error}
            </p>
          )}
        </details>
      </div>
    </details>
  );
}
