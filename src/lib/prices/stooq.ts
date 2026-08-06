export interface FetchedPrice {
  price: number;
  currency: string;
  asOf: string;
}

/**
 * Fetches the latest close price from Stooq's free CSV endpoint — no API key required.
 * Ticker format follows Stooq's convention, e.g. "AAPL.US", "NOVO-B.DK", "^SPX".
 * Returns null if the symbol isn't recognised or has no quote (caller should fall back to manual entry).
 */
export async function fetchStooqPrice(ticker: string): Promise<FetchedPrice | null> {
  const symbol = ticker.trim();
  if (!symbol) return null;

  const url = `https://stooq.com/q/l/?s=${encodeURIComponent(symbol)}&f=sd2t2ohlcv&h&e=csv`;
  const res = await fetch(url, { cache: "no-store", headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) return null;

  const text = await res.text();
  const lines = text.trim().split("\n");
  if (lines.length < 2) return null;

  const cols = lines[1].split(",");
  // Symbol,Date,Time,Open,High,Low,Close,Volume
  if (cols.length < 7) return null;
  const date = cols[1];
  const close = parseFloat(cols[6]);
  if (date === "N/D" || !Number.isFinite(close) || close <= 0) return null;

  return { price: close, currency: "auto", asOf: date };
}
