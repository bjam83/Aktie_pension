import type { AssetKind } from "@/lib/types";

export interface AssetGrowthInput {
  kind: AssetKind;
  value: number;
  growthRatePct: number;
}

export interface NetWorthYear {
  year: number;
  pension: number;
  frieMidler: number;
  ejendomme: number;
  biler: number;
  andre: number;
  netWorth: number;
}

/**
 * Bygger husstandens samlede nettoformue år for år, sammensat af pension, frie midler
 * og aktiver der hver især vokser (eller falder) med deres egen sats — så man kan se
 * hvad formuen faktisk består af over tid, ikke kun et samlet tal.
 */
export function projectNetWorth(
  pensionSeries: { year: number; total: number }[],
  freeFundsSeries: { year: number; nominal: number }[],
  assets: AssetGrowthInput[],
  liabilitiesTotal: number,
  horizonYears: number
): NetWorthYear[] {
  const currentYear = new Date().getFullYear();
  const out: NetWorthYear[] = [];

  for (let k = 0; k <= horizonYears; k++) {
    const pension = pensionSeries.length ? pensionSeries[Math.min(k, pensionSeries.length - 1)].total : 0;
    const frieMidler = freeFundsSeries.length ? freeFundsSeries[Math.min(k, freeFundsSeries.length - 1)].nominal : 0;

    let ejendomme = 0;
    let biler = 0;
    let andre = 0;
    assets.forEach((a) => {
      const projected = a.value * Math.pow(1 + a.growthRatePct / 100, k);
      if (a.kind === "bolig") ejendomme += projected;
      else if (a.kind === "bil") biler += projected;
      else andre += projected;
    });

    const netWorth = pension + frieMidler + ejendomme + biler + andre - liabilitiesTotal;
    out.push({ year: currentYear + k, pension, frieMidler, ejendomme, biler, andre, netWorth });
  }

  return out;
}
