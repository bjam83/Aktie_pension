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
