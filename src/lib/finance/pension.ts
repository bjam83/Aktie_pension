import type { Assumptions, PensionScheme } from "@/lib/types";
import { simulatePayout } from "./payout";

/** Alder ud fra fødselsdato (i dag). */
export function ageFromBirthDate(birthDate: string | null, fallback = 40): number {
  if (!birthDate) return fallback;
  const today = new Date();
  const bd = new Date(birthDate);
  let age = today.getFullYear() - bd.getFullYear();
  const m = today.getMonth() - bd.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
  return age;
}

/** Det forventede årlige afkast en ordning fremskrives med. */
export function schemeReturnPct(s: Pick<PensionScheme, "expected_return_pct">): number {
  return Number(s.expected_return_pct) || 0;
}

export interface SchemeCalcInput {
  id: string;
  personId: string;
  name: string;
  currentValue: number;
  monthlyContribution: number;
  returnPct: number;
  ageNow: number;
  ageRetire: number;
}

export interface SchemeProjection {
  id: string;
  years: number;
  yearlyNominal: number[];
  finalNominal: number;
  finalReal: number;
  totalPrincipal: number;
  totalReturn: number;
  palPaid: number;
}

/** Fremskriver én ordning måned-for-måned til ejerens pensionsalder, med PAL-skat på afkastet. */
export function projectScheme(s: SchemeCalcInput, palRatePct: number, inflationRatePct: number): SchemeProjection {
  const years = Math.max(0, Math.round(s.ageRetire - s.ageNow));
  const pal = palRatePct / 100;
  const infl = inflationRatePct / 100;
  let bal = s.currentValue;
  let principal = s.currentValue;
  let palPaid = 0;
  const yearlyNominal: number[] = [bal];
  const rm = Math.pow(1 + s.returnPct / 100, 1 / 12) - 1;
  for (let y = 1; y <= years; y++) {
    for (let m = 0; m < 12; m++) {
      const gain = bal * rm;
      const tax = gain > 0 ? gain * pal : 0;
      palPaid += tax;
      bal += gain - tax + s.monthlyContribution;
      principal += s.monthlyContribution;
    }
    yearlyNominal.push(bal);
  }
  const finalNominal = bal;
  const finalReal = finalNominal / Math.pow(1 + infl, years);
  return { id: s.id, years, yearlyNominal, finalNominal, finalReal, totalPrincipal: principal, totalReturn: finalNominal - principal, palPaid };
}

export interface HouseholdProjectionYear {
  year: number;
  age: number | null;
  byScheme: Record<string, number>;
  byPerson: Record<string, number>;
  total: number;
  real: number;
}

export interface HouseholdProjection {
  perScheme: SchemeProjection[];
  series: HouseholdProjectionYear[];
  horizonYears: number;
  totals: {
    finalNominal: number;
    finalReal: number;
    totalPrincipal: number;
    totalReturn: number;
    palPaid: number;
  };
}

/**
 * Fremskriver hele husstandens ordninger på en fælles kalenderårs-akse.
 * Hver ordning stopper indbetaling og holder sin værdi flad, når ejeren når sin egen pensionsalder,
 * indtil den sidste person i husstanden når sin.
 */
export function projectHousehold(schemes: SchemeCalcInput[], palRatePct: number, inflationRatePct: number): HouseholdProjection {
  const perScheme = schemes.map((s) => projectScheme(s, palRatePct, inflationRatePct));
  const horizonYears = perScheme.reduce((m, p) => Math.max(m, p.years), 0);
  const currentYear = new Date().getFullYear();

  const series: HouseholdProjectionYear[] = [];
  for (let k = 0; k <= horizonYears; k++) {
    const byScheme: Record<string, number> = {};
    const byPerson: Record<string, number> = {};
    let total = 0;
    schemes.forEach((s, i) => {
      const p = perScheme[i];
      const idx = Math.min(k, p.years);
      const val = p.yearlyNominal[idx] ?? p.finalNominal;
      byScheme[s.id] = val;
      byPerson[s.personId] = (byPerson[s.personId] || 0) + val;
      total += val;
    });
    series.push({
      year: currentYear + k,
      age: null,
      byScheme,
      byPerson,
      total,
      real: total / Math.pow(1 + inflationRatePct / 100, k),
    });
  }

  const totals = {
    finalNominal: perScheme.reduce((s, p) => s + p.finalNominal, 0),
    totalPrincipal: perScheme.reduce((s, p) => s + p.totalPrincipal, 0),
    totalReturn: perScheme.reduce((s, p) => s + p.totalReturn, 0),
    palPaid: perScheme.reduce((s, p) => s + p.palPaid, 0),
    finalReal: series.length ? series[series.length - 1].real : 0,
  };

  return { perScheme, series, horizonYears, totals };
}

export interface ReverseRetirementScheme {
  currentValue: number;
  monthlyContribution: number;
  returnPct: number;
  isTaxFree: boolean;
}

export interface ReverseRetirementResult {
  age: number;
  netMonthly: number;
  pot: number;
}

/**
 * Omvendt beregning: finder den tidligste pensionsalder hvor den månedlige nettoudbetaling
 * når et ønsket mål, ved at prøve hvert år fra i dag+1 til `maxAge`.
 */
export function findRetirementAge(
  schemes: ReverseRetirementScheme[],
  ageNow: number,
  palRatePct: number,
  inflationRatePct: number,
  payoutYears: number,
  payoutRet: number,
  otherIncome: number,
  assumptions: Assumptions,
  targetMonthlyNet: number,
  maxAge = 85
): ReverseRetirementResult | null {
  const startAge = Math.max(Math.ceil(ageNow) + 1, 50);
  for (let age = startAge; age <= maxAge; age++) {
    let taxablePot = 0;
    let taxFreePot = 0;
    schemes.forEach((s) => {
      const proj = projectScheme(
        { id: "x", personId: "x", name: "", currentValue: s.currentValue, monthlyContribution: s.monthlyContribution, returnPct: s.returnPct, ageNow, ageRetire: age },
        palRatePct,
        inflationRatePct
      );
      if (s.isTaxFree) taxFreePot += proj.finalNominal;
      else taxablePot += proj.finalNominal;
    });
    const payout = simulatePayout({ taxablePot, taxFreePot, years: payoutYears, retPct: payoutRet, otherIncome, palRatePct, startAge: age }, assumptions);
    if (payout.netMonthly >= targetMonthlyNet) {
      return { age, netMonthly: payout.netMonthly, pot: payout.pot };
    }
  }
  return null;
}

export interface HistoricalReturnStat {
  avgPct: number | null;
  count: number;
}

/**
 * Geometrisk gennemsnit af selvindtastede afkastmålinger (fx aflæst fra pensionsselskabets egen
 * app/opgørelse) — mere retvisende end et simpelt aritmetisk snit når afkastet svinger år for år,
 * samme princip som CAGR. Bruges som pejlemærke for hvad man kan forvente at sætte som "forventet
 * årligt afkast" i fremskrivningen.
 */
export function historicalAverageReturn(returns: (number | null | undefined)[]): HistoricalReturnStat {
  const valid = returns.filter((r): r is number => r != null && Number.isFinite(r));
  if (!valid.length) return { avgPct: null, count: 0 };
  const product = valid.reduce((p, r) => p * (1 + r / 100), 1);
  const geoMean = Math.pow(product, 1 / valid.length) - 1;
  return { avgPct: geoMean * 100, count: valid.length };
}

/** Estimeret folkepension (grundbeløb) — 2026-niveau, ikke-indkomstprøvet grundbeløb. */
export function estimateFolkepension(ageRetire: number, residenceYears = 40, folkepensionsalder = 67) {
  if (ageRetire < folkepensionsalder) {
    return { gross: 0, net: 0, tillaeg: 0, note: `Under folkepensionsalderen (${folkepensionsalder} år)` };
  }
  const frac = Math.min(residenceYears, 40) / 40;
  const grundbeloeb = Math.round(8516 * frac);
  const tillaeg = Math.round(8448 * frac);
  const bruttoSkat = grundbeloeb * 0.37 * 0.88;
  const net = Math.round(grundbeloeb - bruttoSkat);
  return {
    gross: grundbeloeb,
    net,
    tillaeg,
    note: `Grundbeløb før skat (2026-niveau). Pensionstillæg på op til ${tillaeg.toLocaleString("da-DK")} kr./md. er indkomstprøvet og ikke medregnet.`,
  };
}
