const dkk = new Intl.NumberFormat("da-DK", { style: "currency", currency: "DKK", maximumFractionDigits: 0 });
const grp = new Intl.NumberFormat("da-DK");

export function fmtKr(v: number | null | undefined): string {
  return dkk.format(Math.round(v || 0));
}

export function fmtNum(v: number | null | undefined): string {
  return grp.format(Math.round(v || 0));
}

export function fmtAxis(v: number): string {
  const a = Math.abs(v);
  if (a >= 1e6) return (v / 1e6).toLocaleString("da-DK", { maximumFractionDigits: 1 }) + " mio.";
  if (a >= 1e3) return Math.round(v / 1e3) + "k";
  return Math.round(v).toString();
}

export function fmtPct(v: number | null | undefined, d = 1): string {
  return v == null ? "–" : v.toLocaleString("da-DK", { maximumFractionDigits: d }) + "%";
}

export function fmtDate(v: string | Date): string {
  const d = typeof v === "string" ? new Date(v) : v;
  return d.toLocaleDateString("da-DK");
}
