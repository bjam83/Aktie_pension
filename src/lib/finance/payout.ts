import type { Assumptions } from "@/lib/types";
import { incomeTax } from "./tax";

export interface PayoutInput {
  taxablePot: number;
  taxFreePot: number;
  years: number;
  retPct: number;
  otherIncome: number;
  palRatePct: number;
  startAge: number;
}

export interface PayoutYear {
  age: number;
  remaining: number;
  cumNet: number;
  cumTax: number;
}

export interface PayoutResult {
  pot: number;
  n: number;
  grossAnnual: number;
  grossTaxable: number;
  grossFree: number;
  taxOnPayout: number;
  netAnnual: number;
  netMonthly: number;
  effRate: number;
  series: PayoutYear[];
  totalNet: number;
  totalTax: number;
  totalGross: number;
}

/** Simulerer en fast udbetalingsprofil (annuitet) fra pensionsformuen. */
export function simulatePayout(input: PayoutInput, a: Assumptions): PayoutResult {
  const { taxablePot, taxFreePot, years, retPct, otherIncome, palRatePct, startAge } = input;
  const n = Math.max(1, Math.round(years) || 1);
  const r = (retPct / 100) * (1 - palRatePct / 100);
  const annuity = (pv: number) => (pv <= 0 ? 0 : Math.abs(r) < 1e-9 ? pv / n : (pv * r) / (1 - Math.pow(1 + r, -n)));

  const grossTaxable = annuity(taxablePot);
  const grossFree = annuity(taxFreePot);
  const taxOnPayout = incomeTax(otherIncome + grossTaxable, a) - incomeTax(otherIncome, a);
  const netAnnual = grossTaxable - taxOnPayout + grossFree;

  let balT = taxablePot;
  let balF = taxFreePot;
  let cumNet = 0;
  let cumTax = 0;
  const series: PayoutYear[] = [{ age: startAge, remaining: Math.round(taxablePot + taxFreePot), cumNet: 0, cumTax: 0 }];
  for (let y = 1; y <= n; y++) {
    balT = balT * (1 + r) - grossTaxable;
    balF = balF * (1 + r) - grossFree;
    cumNet += netAnnual;
    cumTax += taxOnPayout;
    series.push({ age: startAge + y, remaining: Math.max(0, Math.round(balT + balF)), cumNet: Math.round(cumNet), cumTax: Math.round(cumTax) });
  }

  return {
    pot: taxablePot + taxFreePot,
    n,
    grossAnnual: grossTaxable + grossFree,
    grossTaxable,
    grossFree,
    taxOnPayout,
    netAnnual,
    netMonthly: netAnnual / 12,
    effRate: grossTaxable > 0 ? taxOnPayout / grossTaxable : 0,
    series,
    totalNet: netAnnual * n,
    totalTax: taxOnPayout * n,
    totalGross: (grossTaxable + grossFree) * n,
  };
}

// ── Multi-stream payout (per pension scheme, own duration) ───────────────

export interface PayoutStreamInput {
  key: string;
  label: string;
  pot: number;
  /** Udbetalingsår for netop denne ordning — ratepension har sin egen (10-25), livrente bruger forventet restlevetid. */
  years: number;
  taxFree: boolean;
}

export interface PayoutStreamResult extends PayoutStreamInput {
  grossAnnual: number;
}

export interface MultiPayoutResult {
  streams: PayoutStreamResult[];
  pot: number;
  grossAnnual: number;
  grossTaxableTotal: number;
  grossFreeTotal: number;
  taxOnPayout: number;
  netAnnual: number;
  netMonthly: number;
  effRate: number;
  series: PayoutYear[];
  /** Årlig (ikke-akkumuleret) nettoudbetaling pr. ordning — til at vise hvor pengene kommer fra. */
  breakdown: ({ age: number } & Record<string, number>)[];
  totalNet: number;
}

function annuityPayment(pv: number, years: number, r: number): number {
  const n = Math.max(1, Math.round(years) || 1);
  if (pv <= 0) return 0;
  return Math.abs(r) < 1e-9 ? pv / n : (pv * r) / (1 - Math.pow(1 + r, -n));
}

/**
 * Udbetaler hver ordning over sin egen periode i stedet for én fælles pulje — så en
 * ratepension der stopper efter fx 15 år kan ses adskilt fra en livrente der fortsætter
 * langt længere. Effektiv skattesats beregnes ud fra det samlede skattepligtige beløb i
 * år 1 og holdes fast år for år (en rimelig forenkling, da præcis progressiv genberegning
 * hvert år kræver at kende al anden fremtidig indkomst).
 */
export function simulateMultiPayout(streamsIn: PayoutStreamInput[], retPct: number, otherIncome: number, palRatePct: number, startAge: number, a: Assumptions): MultiPayoutResult {
  const r = (retPct / 100) * (1 - palRatePct / 100);
  const streams: PayoutStreamResult[] = streamsIn.map((s) => ({ ...s, grossAnnual: annuityPayment(s.pot, s.years, r) }));

  const grossTaxableTotal = streams.filter((s) => !s.taxFree).reduce((sum, s) => sum + s.grossAnnual, 0);
  const grossFreeTotal = streams.filter((s) => s.taxFree).reduce((sum, s) => sum + s.grossAnnual, 0);
  const taxOnPayout = incomeTax(otherIncome + grossTaxableTotal, a) - incomeTax(otherIncome, a);
  const netAnnual = grossTaxableTotal - taxOnPayout + grossFreeTotal;
  const effRate = grossTaxableTotal > 0 ? taxOnPayout / grossTaxableTotal : 0;

  const maxYears = Math.max(1, ...streams.map((s) => Math.round(s.years)));
  let balances = streams.map((s) => s.pot);
  let cumNet = 0;
  let cumTax = 0;
  const series: PayoutYear[] = [{ age: startAge, remaining: Math.round(balances.reduce((sum, b) => sum + b, 0)), cumNet: 0, cumTax: 0 }];
  const zeroRow: Record<string, number> = {};
  streams.forEach((s) => (zeroRow[s.key] = 0));
  const breakdown: ({ age: number } & Record<string, number>)[] = [{ age: startAge, ...zeroRow }];

  for (let y = 1; y <= maxYears; y++) {
    let yearNet = 0;
    let yearTax = 0;
    const row: Record<string, number> = {};
    balances = balances.map((bal, i) => {
      const s = streams[i];
      const n = Math.max(1, Math.round(s.years));
      if (y > n) {
        row[s.key] = 0;
        return 0;
      }
      const net = s.taxFree ? s.grossAnnual : s.grossAnnual * (1 - effRate);
      row[s.key] = Math.round(net);
      yearNet += net;
      if (!s.taxFree) yearTax += s.grossAnnual * effRate;
      return Math.max(0, bal * (1 + r) - s.grossAnnual);
    });
    cumNet += yearNet;
    cumTax += yearTax;
    series.push({ age: startAge + y, remaining: Math.round(balances.reduce((sum, b) => sum + b, 0)), cumNet: Math.round(cumNet), cumTax: Math.round(cumTax) });
    breakdown.push({ age: startAge + y, ...row });
  }

  return {
    streams,
    pot: streams.reduce((sum, s) => sum + s.pot, 0),
    grossAnnual: grossTaxableTotal + grossFreeTotal,
    grossTaxableTotal,
    grossFreeTotal,
    taxOnPayout,
    netAnnual,
    netMonthly: netAnnual / 12,
    effRate,
    series,
    breakdown,
    totalNet: cumNet,
  };
}
