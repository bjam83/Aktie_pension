import * as cheerio from "cheerio";

export interface ScrapedReturn {
  year: number;
  returnPct: number;
}

const YEAR_MIN = 2000;
const YEAR_MAX = 2100;

function parseDanishPct(raw: string): number | null {
  const cleaned = raw.trim().replace(/%/g, "").replace(/\s/g, "").replace(",", ".");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function parseYear(raw: string): number | null {
  const cleaned = raw.trim();
  if (!/^\d{4}$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return n >= YEAR_MIN && n <= YEAR_MAX ? n : null;
}

/**
 * Strategy 1: look for an actual <table> whose rows pair a bare 4-digit year cell with a
 * percentage cell — this is how a real "Periode/Afkast" grid is most likely marked up. Rows for
 * aggregates like "Periode Gns." or "5 år" have no cell that's a *bare* 4-digit year, so they're
 * excluded automatically without needing to special-case those labels. Picks the table with the
 * most matching rows, since an unrelated table elsewhere on the page (holdings, risk figures)
 * could coincidentally have a year-shaped or percent-shaped cell but won't have several of both
 * paired in the same rows the way a real annual-return table does.
 */
function extractFromTables($: cheerio.CheerioAPI): ScrapedReturn[] {
  let best: ScrapedReturn[] = [];
  $("table").each((_, table) => {
    const rowResults: ScrapedReturn[] = [];
    $(table)
      .find("tr")
      .each((_, tr) => {
        const cells = $(tr)
          .find("td, th")
          .map((_, c) => $(c).text().trim())
          .get();
        if (cells.length < 2) return;
        let year: number | null = null;
        let pct: number | null = null;
        for (const cell of cells) {
          const y = parseYear(cell);
          if (y != null) year = y;
          if (cell.includes("%")) {
            const p = parseDanishPct(cell);
            if (p != null) pct = p;
          }
        }
        if (year != null && pct != null) rowResults.push({ year, returnPct: pct });
      });
    if (rowResults.length > best.length) best = rowResults;
  });
  return best;
}

/**
 * Strategy 2 (fallback, used only if no table qualifies): scan the page's flattened text
 * starting at the "Årligt afkast" heading for year/percentage pairs, stopping before any
 * "Periode Gns."-style aggregate row so those don't get picked up as if they were a year.
 */
function extractFromText(pageText: string): ScrapedReturn[] {
  const heading = pageText.toLowerCase().indexOf("årligt afkast");
  if (heading === -1) return [];
  const windowText = pageText.slice(heading, heading + 1000);
  const stopAt = windowText.search(/periode\s*gns/i);
  const scanText = stopAt === -1 ? windowText : windowText.slice(0, stopAt);

  const re = /(?<!\d)(\d{4})(?!\d)\D{0,4}(-?\d{1,3},\d{1,2})\s?%/g;
  const results: ScrapedReturn[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(scanText))) {
    const year = parseYear(m[1]);
    const pct = parseDanishPct(m[2]);
    if (year != null && pct != null) results.push({ year, returnPct: pct });
  }
  return results;
}

/**
 * Fetches a pension fund's detail page (e.g. from AP Pension's fondliste) and extracts its
 * "Årligt afkast" (annual return) history. Text-based rather than tied to specific CSS
 * selectors/class names, since the exact markup of third-party sites isn't something we control
 * or can verify ahead of time.
 */
export async function fetchAnnualReturns(url: string): Promise<ScrapedReturn[]> {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "da-DK,da;q=0.9,en;q=0.8",
      },
    });
  } catch {
    throw new Error("Kunne ikke hente siden — tjek at linket er korrekt og prøv igen.");
  }
  if (!res.ok) {
    throw new Error(`Kunne ikke hente siden (status ${res.status}) — tjek linket.`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  let results = extractFromTables($);
  if (!results.length) {
    const pageText = $("body").text().replace(/\s+/g, " ").trim();
    results = extractFromText(pageText);
  }

  const byYear = new Map<number, number>();
  for (const r of results) {
    if (!byYear.has(r.year)) byYear.set(r.year, r.returnPct);
  }
  const deduped = Array.from(byYear, ([year, returnPct]) => ({ year, returnPct })).sort((a, b) => a.year - b.year);

  if (!deduped.length) {
    throw new Error("Kunne ikke finde årlige afkast på siden — tjek linket, eller indtast manuelt.");
  }
  return deduped;
}
