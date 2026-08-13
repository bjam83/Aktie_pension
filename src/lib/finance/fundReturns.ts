import { historicalAverageReturn, type HistoricalReturnStat } from "./pension";

export interface FundAllocation {
  id: string;
  name: string;
  allocationPct: number;
}

export interface FundYearReturn {
  fundId: string;
  year: number;
  returnPct: number;
}

export interface WeightedYear {
  year: number;
  weightedReturnPct: number;
  fundsCounted: number;
}

/**
 * Vægtet gennemsnitsafkast pr. år, vægtet efter allocation_pct, og renormaliseret over kun de
 * fonde der faktisk har et registreret afkast for det år — så et hul i én fonds historik ikke
 * bliver behandlet som 0% og trækker det samlede afkast forkert ned. År uden data, eller hvor de
 * medregnede fondes allokering summerer til 0, udelades helt (ikke 0/NaN).
 */
export function weightedFundReturns(funds: FundAllocation[], returns: FundYearReturn[]): WeightedYear[] {
  const allocById = new Map(funds.map((f) => [f.id, f.allocationPct]));
  const byYear = new Map<number, FundYearReturn[]>();
  for (const r of returns) {
    if (!allocById.has(r.fundId)) continue;
    const list = byYear.get(r.year) ?? [];
    list.push(r);
    byYear.set(r.year, list);
  }

  const result: WeightedYear[] = [];
  for (const [year, entries] of byYear) {
    const totalWeight = entries.reduce((s, e) => s + (allocById.get(e.fundId) ?? 0), 0);
    if (totalWeight <= 0) continue;
    const weightedSum = entries.reduce((s, e) => s + (allocById.get(e.fundId) ?? 0) * e.returnPct, 0);
    result.push({ year, weightedReturnPct: weightedSum / totalWeight, fundsCounted: entries.length });
  }
  return result.sort((a, b) => a.year - b.year);
}

/** Geometrisk gennemsnit (CAGR-stil) af den samlede vægtede serie — genbruger person-niveau helperen. */
export function historicalWeightedAverage(weighted: WeightedYear[]): HistoricalReturnStat {
  return historicalAverageReturn(weighted.map((w) => w.weightedReturnPct));
}

export function isYtd(year: number): boolean {
  return year === new Date().getFullYear();
}

export function fundYearLabel(year: number): string {
  return isYtd(year) ? `${year} (år til dato)` : `${year}`;
}

export function ytdWeightedReturn(weighted: WeightedYear[]): number | null {
  const row = weighted.find((w) => isYtd(w.year));
  return row ? row.weightedReturnPct : null;
}

export function totalAllocationPct(funds: FundAllocation[]): number {
  return funds.reduce((s, f) => s + f.allocationPct, 0);
}
