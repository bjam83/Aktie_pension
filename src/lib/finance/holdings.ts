import type { Holding } from "@/lib/types";

/** Den kurs der bruges til værdiansættelse: manuel override hvis valgt, ellers senest hentede kurs. */
export function holdingPrice(h: Pick<Holding, "price_source" | "manual_price" | "last_price">): number {
  if (h.price_source === "manual") return Number(h.manual_price) || Number(h.last_price) || 0;
  return Number(h.last_price) || Number(h.manual_price) || 0;
}

export interface HoldingReturn {
  marketValue: number;
  costBasis: number;
  gain: number;
  gainPct: number | null;
}

export function holdingReturn(h: Pick<Holding, "quantity" | "avg_cost_price" | "price_source" | "manual_price" | "last_price">): HoldingReturn {
  const price = holdingPrice(h);
  const marketValue = (Number(h.quantity) || 0) * price;
  const costBasis = (Number(h.quantity) || 0) * (Number(h.avg_cost_price) || 0);
  const gain = marketValue - costBasis;
  const gainPct = costBasis > 0 ? (gain / costBasis) * 100 : null;
  return { marketValue, costBasis, gain, gainPct };
}

export function portfolioReturn(holdings: Holding[]): HoldingReturn {
  return holdings.reduce<HoldingReturn>(
    (acc, h) => {
      const r = holdingReturn(h);
      const marketValue = acc.marketValue + r.marketValue;
      const costBasis = acc.costBasis + r.costBasis;
      const gain = marketValue - costBasis;
      return { marketValue, costBasis, gain, gainPct: costBasis > 0 ? (gain / costBasis) * 100 : null };
    },
    { marketValue: 0, costBasis: 0, gain: 0, gainPct: null }
  );
}
