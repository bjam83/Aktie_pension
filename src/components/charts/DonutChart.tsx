import { fmtKr, fmtAxis } from "@/lib/finance/format";

export interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

function px(n: number) {
  return n.toFixed(1);
}

function arcSeg(cx: number, cy: number, ir: number, or_: number, a1: number, a2: number) {
  const c = Math.cos;
  const s = Math.sin;
  const lg = a2 - a1 > Math.PI ? 1 : 0;
  return `M${px(cx + or_ * c(a1))} ${px(cy + or_ * s(a1))} A${or_} ${or_} 0 ${lg} 1 ${px(cx + or_ * c(a2))} ${px(cy + or_ * s(a2))} L${px(
    cx + ir * c(a2)
  )} ${px(cy + ir * s(a2))} A${ir} ${ir} 0 ${lg} 0 ${px(cx + ir * c(a1))} ${px(cy + ir * s(a1))} Z`;
}

/** Turns slice values into SVG arc paths without mutating any variable in place. */
function computeSlices(data: DonutSlice[], cx: number, cy: number, ir: number, outer: number, total: number) {
  return data.reduce<{ acc: (DonutSlice & { path: string | null })[]; angle: number }>(
    (state, d) => {
      const da = (Math.max(0, d.value || 0) / total) * Math.PI * 2;
      const gap = da > 0.06 ? 0.015 : 0;
      const path = da > 0 ? arcSeg(cx, cy, ir, outer, state.angle + gap, state.angle + da - gap) : null;
      return { acc: [...state.acc, { ...d, path }], angle: state.angle + da };
    },
    { acc: [], angle: -Math.PI / 2 }
  ).acc;
}

export function DonutChart({ data, size = 200, ir = 52, or: outer = 80 }: { data: DonutSlice[]; size?: number; ir?: number; or?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const total = data.reduce((s, d) => s + Math.max(0, d.value || 0), 0);

  if (!total) return <div className="empty">Ingen data</div>;

  const slices = computeSlices(data, cx, cy, ir, outer, total);

  return (
    <div>
      <div style={{ position: "relative", width: size, margin: "0 auto" }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
          {slices.filter((s) => s.path).map((s, i) => (
            <path key={i} d={s.path!} fill={s.color} strokeLinejoin="round" />
          ))}
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "var(--fs-lg)", color: "var(--ink)" }}>
            {fmtAxis(total)}
          </span>
          <span className="eyebrow" style={{ fontSize: 9.5, marginTop: 2 }}>
            I alt
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-3.5 mt-2 justify-center text-[12px]" style={{ color: "var(--muted)" }}>
        {data.map((e, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span className="dot" style={{ background: e.color }} />
            {e.name} · {fmtKr(e.value)}
          </span>
        ))}
      </div>
    </div>
  );
}
