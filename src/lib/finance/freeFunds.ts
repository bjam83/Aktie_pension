import type { Assumptions, FreeFundsConfig } from "@/lib/types";
import { askTax, aktieIndkomstTax } from "./tax";

export interface FreeFundsYear {
  year: number;
  nominal: number;
  contributed: number;
  real: number;
}

export interface FreeFundsResult {
  series: FreeFundsYear[];
  years: number;
  finalNominal: number;
  finalReal: number;
  contributed: number;
  grossReturn: number;
  taxPaid: number;
}

/** Simulerer opsparing i frie midler — enten løbende ASK-beskatning eller lagerbeskatning ved aktiedepot. */
export function simulateFreeFunds(cfg: FreeFundsConfig, a: Assumptions, inflationRatePct: number): FreeFundsResult {
  const years = Math.max(0, Math.round(Number(cfg.years) || 0));
  const infl = inflationRatePct / 100;
  const rm = Math.pow(1 + (Number(cfg.ret) || 0) / 100, 1 / 12) - 1;
  let bal = Number(cfg.lump) || 0;
  let contributed = Number(cfg.lump) || 0;
  let taxPaid = 0;
  let yearGain = 0;
  const series: FreeFundsYear[] = [
    { year: new Date().getFullYear(), nominal: Math.round(bal), contributed: Math.round(contributed), real: Math.round(bal) },
  ];
  for (let y = 1; y <= years; y++) {
    for (let m = 0; m < 12; m++) {
      const gain = bal * rm;
      bal += gain;
      yearGain += gain;
      bal += Number(cfg.monthly) || 0;
      contributed += Number(cfg.monthly) || 0;
    }
    if (cfg.tax === "ask") {
      const t = askTax(yearGain, a);
      bal -= t;
      taxPaid += t;
      yearGain = 0;
    }
    series.push({
      year: new Date().getFullYear() + y,
      nominal: Math.round(bal),
      contributed: Math.round(contributed),
      real: Math.round(bal / Math.pow(1 + infl, y)),
    });
  }
  if (cfg.tax === "depot") {
    const gain = bal - contributed;
    const t = aktieIndkomstTax(gain, a);
    bal -= t;
    taxPaid += t;
    const last = series[series.length - 1];
    last.nominal = Math.round(bal);
    last.real = Math.round(bal / Math.pow(1 + infl, years));
  }
  return {
    series,
    years,
    finalNominal: bal,
    finalReal: bal / Math.pow(1 + infl, years),
    contributed,
    grossReturn: bal + taxPaid - contributed,
    taxPaid,
  };
}

/**
 * Lægger flere kontoprognoser sammen på en fælles kalenderårs-akse — hver konto holder sin
 * værdi flad efter sin egen fremskrivningsperiode, ligesom pensionsordninger.
 */
export function combineFreeFunds(results: FreeFundsResult[]): { series: { year: number; nominal: number }[]; finalNominal: number; years: number } {
  const currentYear = new Date().getFullYear();
  const years = Math.max(0, ...results.map((r) => r.years));
  const series: { year: number; nominal: number }[] = [];
  for (let k = 0; k <= years; k++) {
    let nominal = 0;
    results.forEach((r) => {
      const idx = Math.min(k, r.series.length - 1);
      nominal += r.series[idx]?.nominal ?? r.finalNominal;
    });
    series.push({ year: currentYear + k, nominal });
  }
  return { series, finalNominal: results.reduce((s, r) => s + r.finalNominal, 0), years };
}
