import * as cheerio from "cheerio";

export interface ScrapedReturn {
  year: number;
  returnPct: number;
}

const YEAR_MIN = 2000;
const YEAR_MAX = 2100;
const MAX_DEPTH = 12;

function parseDanishPct(raw: string): number | null {
  const cleaned = raw.trim().replace(/%/g, "").replace(/\s/g, "").replace(",", ".");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function parseDecimal(raw: string): number | null {
  const n = Number(raw.trim());
  return Number.isFinite(n) ? n : null;
}

function extractYear(text: string): number | null {
  const m = text.match(/(?<!\d)(\d{4})(?!\d)/);
  if (!m) return null;
  const n = Number(m[1]);
  return n >= YEAR_MIN && n <= YEAR_MAX ? n : null;
}

/** Best-effort JSON.parse: if the whole string isn't valid JSON (e.g. a `<script>` with a
 *  `window.__DATA__ = {...};` assignment around it), retry on the slice between the first
 *  `{`/`[` and the matching last `}`/`]`. */
function tryParseJson(text: string): unknown | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    const firstObj = trimmed.indexOf("{");
    const firstArr = trimmed.indexOf("[");
    const candidates = [firstObj, firstArr].filter((i) => i !== -1);
    if (!candidates.length) return null;
    const start = Math.min(...candidates);
    const openChar = trimmed[start];
    const closeChar = openChar === "{" ? "}" : "]";
    const end = trimmed.lastIndexOf(closeChar);
    if (end === -1 || end <= start) return null;
    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

/** Site's confirmed "attribute record" shape (seen for ytd/threeYearAnnual rolling returns):
 *  { attributeId, attributeName, value: "10,85%", rawValue: "10.85", ... }. Requires `value` to
 *  actually look like a percentage before trusting `rawValue` as a source, so unrelated numeric
 *  fields (a date's raw epoch value, etc.) can't be mistaken for a return figure. */
function extractPercentFromObject(obj: Record<string, unknown>): number | null {
  if (typeof obj.value !== "string" || !obj.value.includes("%")) return null;
  if (typeof obj.rawValue === "string" || typeof obj.rawValue === "number") {
    const n = parseDecimal(String(obj.rawValue));
    if (n != null) return n;
  }
  return parseDanishPct(obj.value);
}

/** Looks for a bare 4-digit year on any OTHER field of the same object (attributeId,
 *  attributeName, label, period, …) — deliberately not tied to a specific key name, since we
 *  don't know what the annual-return records are actually called. */
function extractYearFromObject(obj: Record<string, unknown>): number | null {
  for (const [key, v] of Object.entries(obj)) {
    if (key === "value" || key === "rawValue" || key === "rebatedValue") continue;
    if (typeof v === "string" || typeof v === "number") {
      const y = extractYear(String(v));
      if (y != null) return y;
    }
  }
  return null;
}

interface Collected {
  results: ScrapedReturn[];
  yearArrays: number[][];
  valueArrays: number[][];
}

/** Classifies an array as entirely year-like, entirely numeric/percentage-like, or neither.
 *  Checked in that order so a years array (whose elements also happen to parse as plain numbers)
 *  is never double-counted as a values array too. */
function classifyArray(arr: unknown[]): "years" | "values" | null {
  if (arr.length < 2) return null;
  const asYears = arr.map((v) => (typeof v === "string" || typeof v === "number" ? extractYear(String(v)) : null));
  if (asYears.every((y) => y != null)) return "years";
  const asValues = arr.map((v) => {
    if (typeof v === "number") return v;
    if (typeof v === "string") return parseDanishPct(v) ?? parseDecimal(v);
    return null;
  });
  if (asValues.every((v) => v != null)) return "values";
  return null;
}

/**
 * Recursively walks a parsed JSON tree (also unwrapping strings that are themselves JSON, one
 * level deep wherever found — the site's data is doubly-escaped: a JSON string embedded inside
 * JSON), collecting two independent shapes a per-year return figure might take:
 *
 * Pattern A — attribute record: an object with a percentage `value`/`rawValue` plus a
 * 4-digit-year-bearing field elsewhere on the same object. Matched directly here.
 *
 * Pattern B — parallel arrays: a year-like array (e.g. chart categories/labels) and a
 * same-length numeric/percentage array (e.g. a chart series' data) somewhere else in the tree —
 * not necessarily siblings on the same object, since real chart configs often nest the values a
 * level deeper (`series: [{ data: [...] }]`) than the categories. Every qualifying array is
 * collected here; pairing by matching length happens once the whole tree has been walked.
 */
function collectFromNode(node: unknown, depth: number, collected: Collected): void {
  if (depth > MAX_DEPTH || node == null) return;

  if (typeof node === "string") {
    const trimmed = node.trim();
    if (trimmed.length > 1 && (trimmed[0] === "{" || trimmed[0] === "[")) {
      const parsed = tryParseJson(trimmed);
      if (parsed != null && typeof parsed === "object") collectFromNode(parsed, depth + 1, collected);
    }
    return;
  }

  if (Array.isArray(node)) {
    const kind = classifyArray(node);
    if (kind === "years") {
      collected.yearArrays.push(node.map((v) => extractYear(String(v))) as number[]);
    } else if (kind === "values") {
      collected.valueArrays.push(
        node.map((v) => (typeof v === "number" ? v : parseDanishPct(String(v)) ?? parseDecimal(String(v)))) as number[]
      );
    }
    node.forEach((item) => collectFromNode(item, depth + 1, collected));
    return;
  }

  if (typeof node === "object") {
    const obj = node as Record<string, unknown>;

    const pct = extractPercentFromObject(obj);
    if (pct != null) {
      const year = extractYearFromObject(obj);
      if (year != null) collected.results.push({ year, returnPct: pct });
    }

    for (const v of Object.values(obj)) collectFromNode(v, depth + 1, collected);
  }
}

/**
 * Fetches a pension fund's detail page (e.g. from AP Pension's fondliste) and extracts its
 * annual-return history. The figures aren't in rendered HTML text — they're in JSON embedded in
 * a `<script>` tag (a framework hydration payload) — so this parses every script's JSON content
 * rather than looking at the visible page text.
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

  const collected: Collected = { results: [], yearArrays: [], valueArrays: [] };
  $("script").each((_, el) => {
    const text = $(el).text();
    if (!text || text.length < 20) return;
    const parsed = tryParseJson(text);
    if (parsed != null && typeof parsed === "object") collectFromNode(parsed, 0, collected);
  });

  for (const years of collected.yearArrays) {
    const match = collected.valueArrays.find((v) => v.length === years.length);
    if (match) years.forEach((y, i) => collected.results.push({ year: y, returnPct: match[i] }));
  }

  const byYear = new Map<number, number>();
  for (const r of collected.results) {
    if (!byYear.has(r.year)) byYear.set(r.year, r.returnPct);
  }
  const deduped = Array.from(byYear, ([year, returnPct]) => ({ year, returnPct })).sort((a, b) => a.year - b.year);

  if (!deduped.length) {
    throw new Error("Kunne ikke finde årlige afkast på siden — tjek linket, eller indtast manuelt.");
  }
  return deduped;
}
