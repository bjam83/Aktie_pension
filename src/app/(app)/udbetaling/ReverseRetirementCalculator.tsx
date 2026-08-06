"use client";

import { useState } from "react";
import { findRetirementAge, type ReverseRetirementScheme } from "@/lib/finance/pension";
import { fmtKr } from "@/lib/finance/format";
import type { Assumptions } from "@/lib/types";

interface Props {
  schemes: ReverseRetirementScheme[];
  ageNow: number;
  palRatePct: number;
  inflationRatePct: number;
  payoutYears: number;
  payoutRet: number;
  otherIncome: number;
  assumptions: Assumptions;
}

const grp = new Intl.NumberFormat("da-DK");

/** "Hvornår kan jeg gå på pension?" — omvendt beregning ud fra et ønsket månedligt beløb. */
export function ReverseRetirementCalculator({ schemes, ageNow, palRatePct, inflationRatePct, payoutYears, payoutRet, otherIncome, assumptions }: Props) {
  const [target, setTarget] = useState("20000");
  const [result, setResult] = useState<{ age: number; netMonthly: number } | null | "not-found">(null);

  const compute = () => {
    const targetNum = Number(target.replace(/[^0-9]/g, ""));
    if (!targetNum) return;
    const found = findRetirementAge(schemes, ageNow, palRatePct, inflationRatePct, payoutYears, payoutRet, otherIncome, assumptions, targetNum);
    setResult(found ? { age: found.age, netMonthly: found.netMonthly } : "not-found");
  };

  return (
    <div className="card">
      <h3>Hvornår kan jeg gå på pension?</h3>
      <p className="cap">Omvendt beregning — angiv den månedlige nettoudbetaling du ønsker, og find den tidligste pensionsalder der giver den, ud fra nuværende ordninger og indbetalinger.</p>
      <div className="flex items-end gap-2 flex-wrap">
        <div className="field" style={{ marginBottom: 0, minWidth: 180 }}>
          <label htmlFor="reverse-target">Ønsket udbetaling</label>
          <div className="relative">
            <input
              className="input pr-9"
              id="reverse-target"
              type="text"
              inputMode="numeric"
              value={grp.format(Number(target) || 0)}
              onChange={(e) => setTarget(e.target.value.replace(/[^0-9]/g, ""))}
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px] pointer-events-none" style={{ color: "var(--faint)" }}>
              kr./md.
            </span>
          </div>
        </div>
        <button className="btn" type="button" onClick={compute}>
          Beregn
        </button>
      </div>

      {result === "not-found" && (
        <div className="note mt-3">Kan ikke nå det beløb inden 85 år med de nuværende ordninger og indbetalinger — prøv et lavere beløb eller øg indbetalingerne.</div>
      )}
      {result && result !== "not-found" && (
        <div className="stat mt-3" style={{ display: "inline-block" }}>
          <div className="lab">Tidligste pensionsalder</div>
          <div className="val" style={{ color: "var(--grow)" }}>
            {result.age} år
          </div>
          <div className="hint">giver {fmtKr(result.netMonthly)}/md. netto</div>
        </div>
      )}
    </div>
  );
}
