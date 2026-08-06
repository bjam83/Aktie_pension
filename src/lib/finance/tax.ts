import type { Assumptions } from "@/lib/types";

/** Dansk indkomstskat: personfradrag, bundskat, mellemskat, topskat. */
export function incomeTax(income: number, a: Assumptions): number {
  if (income <= 0) return 0;
  const base = Math.max(0, income - a.personfradrag) * (a.bundskat_rate / 100);
  const mellem = income > a.mellemskat_bund ? (income - a.mellemskat_bund) * (a.mellemskat_rate / 100) : 0;
  const top = income > a.topskat_bund ? (income - a.topskat_bund) * (a.topskat_rate / 100) : 0;
  return base + mellem + top;
}

/** Beskatning af gevinst i en aktiesparekonto/ASK-lignende ordning (flad sats op til loft). */
export function askTax(gain: number, a: Assumptions): number {
  if (gain <= 0) return 0;
  return Math.min(gain, a.ask_loft) * (a.ask_rate / 100) + Math.max(0, gain - a.ask_loft) * (a.ask_rate / 100);
}

/** Aktieindkomstskat (frie midler / aktiedepot): progressiv sats over grænsen. */
export function aktieIndkomstTax(gain: number, a: Assumptions): number {
  if (gain <= 0) return 0;
  return (
    Math.min(gain, a.aktie_graense) * (a.aktie_lav_rate / 100) +
    Math.max(0, gain - a.aktie_graense) * (a.aktie_hoej_rate / 100)
  );
}
