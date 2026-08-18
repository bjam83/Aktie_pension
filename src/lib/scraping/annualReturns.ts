export interface ScrapedReturn {
  year: number;
  returnPct: number;
}

const YEAR_MIN = 2000;
const YEAR_MAX = 2100;

// Detail-page URL shape the user pastes into a fund's source_url, e.g.
// https://appension.fondliste.dk/da/1/details/F0GBR054T7 — the "1" and "F0GBR054T7" segments
// are exactly the webid/securityId the annual-return API expects.
const DETAIL_URL_RE = /\/da\/(\d+)\/details\/([A-Za-z0-9._-]+)/i;

interface ArBarChartEntry {
  id?: string;
  name?: string;
  dataType?: string;
  value?: unknown;
}

interface AnnualReturnApiResponse {
  ar_bar_chart?: ArBarChartEntry[];
}

function isYear(name: string | undefined): number | null {
  if (!name || !/^\d{4}$/.test(name)) return null;
  const n = Number(name);
  return n >= YEAR_MIN && n <= YEAR_MAX ? n : null;
}

/**
 * Fetches a pension fund's annual-return history from the provider's underlying data API
 * (reverse-engineered from the fund detail page's own network traffic — the page itself renders
 * this via client-side JS, so scraping its HTML doesn't work, but the API behind it returns
 * clean JSON). The API URL is derived from the fund detail-page URL the user already has saved
 * as source_url — no separate field needed.
 */
export async function fetchAnnualReturns(sourceUrl: string): Promise<ScrapedReturn[]> {
  const match = sourceUrl.match(DETAIL_URL_RE);
  let origin: string;
  let hostname: string;
  try {
    ({ origin, hostname } = new URL(sourceUrl));
  } catch {
    origin = "";
    hostname = "";
  }
  if (!match || !origin) {
    throw new Error(
      "Linket ser ikke ud til at være en fondsside — det skal ligne https://appension.fondliste.dk/da/1/details/..."
    );
  }
  const [, webid, securityId] = match;
  const apiUrl = `https://portal-be.auxality-portal.com/lookup/annual-return?webid=${encodeURIComponent(webid)}&securityId=${encodeURIComponent(securityId)}`;

  // The backend is a shared, white-labelled service behind multiple pension providers'
  // *.fondliste.dk sites — it 401s without headers that scope the request to the right tenant.
  // These match exactly what the real site's own page sends (captured via the browser's network
  // tab): a custom X-Domain header naming the tenant site, plus Origin/Referer matching its
  // Referrer-Policy (strict-origin-when-cross-origin strips the path on cross-origin requests).
  let res: Response;
  try {
    res = await fetch(apiUrl, {
      headers: {
        Accept: "*/*",
        "Accept-Language": "da",
        Origin: origin,
        Referer: `${origin}/`,
        "X-Domain": hostname,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
  } catch {
    throw new Error("Kunne ikke hente afkast — tjek at linket er korrekt og prøv igen.");
  }
  if (!res.ok) {
    throw new Error(`Kunne ikke hente afkast (status ${res.status}) — tjek linket.`);
  }

  let body: AnnualReturnApiResponse;
  try {
    body = await res.json();
  } catch {
    throw new Error("Kunne ikke læse svaret fra fondens side — prøv igen senere.");
  }

  const byYear = new Map<number, number>();
  for (const entry of body.ar_bar_chart ?? []) {
    if (entry.dataType !== "DECIMAL") continue;
    const year = isYear(entry.name);
    if (year == null) continue;
    // entry.value is null for years the fund has no data for (e.g. before it existed) — a
    // "no data" sentinel, not a real 0% return. Number(null) === 0, so this must be checked
    // explicitly rather than coerced, or those years would silently become fake zero returns.
    if (typeof entry.value !== "number" || !Number.isFinite(entry.value)) continue;
    if (!byYear.has(year)) byYear.set(year, entry.value);
  }

  const results = Array.from(byYear, ([year, returnPct]) => ({ year, returnPct })).sort((a, b) => a.year - b.year);

  if (!results.length) {
    throw new Error("Kunne ikke finde årlige afkast på siden — tjek linket, eller indtast manuelt.");
  }
  return results;
}
