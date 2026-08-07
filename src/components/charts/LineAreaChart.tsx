"use client";

import { useRef, useState } from "react";
import { fmtAxis, fmtKr } from "@/lib/finance/format";

export interface ChartSeries {
  key: string;
  name?: string;
  stroke: string;
  width?: number;
  dashed?: boolean;
  fill?: string;
  fillOp?: number;
  baseKey?: string;
}

interface Props {
  data: Record<string, number>[];
  series: ChartSeries[];
  xKey: string;
  height?: number;
  xFmt?: (v: number) => string;
}

/** Zero-dependency responsive SVG line/area chart with hover tooltip. Ported from the original app. */
export function LineAreaChart({ data, series, xKey, height = 280, xFmt }: Props) {
  const [tip, setTip] = useState<Record<string, number> | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  if (!data || data.length < 2) return null;

  const W = 700;
  const H = height;
  const PAD = { t: 10, r: 14, b: 26, l: 58 };
  const cw = W - PAD.l - PAD.r;
  const ch = H - PAD.t - PAD.b;

  const xVals = data.map((d) => d[xKey]);
  const xMin = xVals[0];
  const xMax = xVals[xVals.length - 1];
  const xR = xMax - xMin || 1;
  const xS = (v: number) => PAD.l + ((v - xMin) / xR) * cw;

  const stacked: Record<string, number[]> = {};
  const stackKeys = series.filter((s) => s.fill && s.baseKey === undefined).map((s) => s.key);
  if (stackKeys.length) {
    data.forEach((d, i) => {
      let c = 0;
      stackKeys.forEach((k) => {
        c += d[k] || 0;
        if (!stacked[k]) stacked[k] = [];
        stacked[k][i] = c;
      });
    });
  }
  const getY = (d: Record<string, number>, i: number, k: string) => (stacked[k] !== undefined ? stacked[k][i] : d[k] || 0);

  const allY = data.flatMap((d, i) => series.map((s) => getY(d, i, s.key)));
  const yMax = Math.max(...allY, 1) * 1.05;
  const yS = (v: number) => PAD.t + ch * (1 - Math.max(0, v) / yMax);
  const yBot = PAD.t + ch;

  const mag = Math.pow(10, Math.floor(Math.log10(yMax || 1)));
  const nice = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((m) => yMax / m >= 3 && yMax / m <= 7) || mag * 5;
  const yTicks: number[] = [];
  for (let v = 0; v <= yMax + nice * 0.5; v += nice) yTicks.push(v);

  const xStep = Math.max(1, Math.ceil(data.length / 6));
  const xTicks = data.filter((_, i) => i === 0 || i === data.length - 1 || i % xStep === 0);

  const fillEls: React.ReactNode[] = [];
  series
    .filter((s) => s.fill)
    .forEach((s) => {
      const pts = data.map((d, i) => [xS(d[xKey]), yS(getY(d, i, s.key))] as const);
      const bY = s.baseKey ? data.map((d, i) => yS(getY(d, i, s.baseKey!))) : null;
      const path = bY
        ? pts.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ") +
          " " +
          [...data.map((_, i) => [xS(data[i][xKey]), bY[i]] as const)]
            .reverse()
            .map((p) => "L" + p[0].toFixed(1) + " " + p[1].toFixed(1))
            .join(" ") +
          " Z"
        : pts.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ") +
          ` L${pts[pts.length - 1][0].toFixed(1)} ${yBot.toFixed(1)} L${pts[0][0].toFixed(1)} ${yBot.toFixed(1)} Z`;
      fillEls.push(<path key={"f" + s.key} d={path} fill={s.fill} fillOpacity={s.fillOp ?? 0.7} stroke="none" />);
    });

  const lineEls = series.flatMap((s) => {
    const pts = data.map((d, i) => [xS(d[xKey]), yS(getY(d, i, s.key))] as const);
    const path = pts.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    const last = pts[pts.length - 1];
    return [
      <path
        key={"l" + s.key}
        d={path}
        fill="none"
        stroke={s.stroke}
        strokeWidth={s.width ?? 2}
        strokeDasharray={s.dashed ? "5 4" : undefined}
        strokeLinecap="round"
        strokeLinejoin="round"
      />,
      !s.dashed && (
        <circle key={"end" + s.key} cx={last[0]} cy={last[1]} r={3.5} fill={s.stroke} stroke="var(--surface)" strokeWidth={1.5} />
      ),
    ];
  });

  const tipIdx = tip ? data.indexOf(tip) : -1;
  const tipEls: React.ReactNode[] = [];
  if (tip && tipIdx >= 0) {
    const tx = xS(tip[xKey]);
    tipEls.push(<line key="tl" x1={tx} y1={PAD.t} x2={tx} y2={yBot} stroke="var(--muted)" strokeWidth={1} strokeDasharray="3 3" />);
    series
      .filter((s) => !s.dashed)
      .forEach((s) =>
        tipEls.push(
          <circle key={"tc" + s.key} cx={tx} cy={yS(getY(tip, tipIdx, s.key))} r={4} fill={s.stroke} stroke="#fff" strokeWidth={2} />
        )
      );
  }

  const onMove = (clientX: number) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = clientX - rect.left;
    const dx = xMin + ((cx - (PAD.l * rect.width) / W) / ((rect.width * cw) / W || 1)) * xR;
    let best = data[0];
    for (const d of data) if (Math.abs(d[xKey] - dx) < Math.abs(best[xKey] - dx)) best = d;
    setTip(best);
  };

  const tipPct = tip ? Math.min(88, Math.max(12, (xS(tip[xKey]) / W) * 100)) + "%" : "50%";

  return (
    <div>
    <div
      ref={ref}
      style={{ position: "relative", userSelect: "none" }}
      onMouseMove={(e) => onMove(e.clientX)}
      onMouseLeave={() => setTip(null)}
      onTouchMove={(e) => onMove(e.touches[0].clientX)}
      onTouchEnd={() => setTip(null)}
    >
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block", overflow: "visible", cursor: "crosshair" }}>
        {yTicks.map((v) => (
          <line key={"g" + v} x1={PAD.l} y1={yS(v)} x2={W - PAD.r} y2={yS(v)} stroke="var(--line)" strokeWidth={1} />
        ))}
        <clipPath id="chart-clip">
          <rect x={PAD.l} y={PAD.t} width={cw} height={ch + 2} />
        </clipPath>
        <g clipPath="url(#chart-clip)">
          {fillEls}
          {lineEls}
          {tipEls}
        </g>
        {yTicks.map((v) => (
          <text key={"yt" + v} x={PAD.l - 8} y={yS(v) + 4} textAnchor="end" fontSize={11} fill="var(--muted)" fontFamily="var(--font-display)">
            {fmtAxis(v)}
          </text>
        ))}
        {xTicks.map((d) => (
          <text key={"xt" + d[xKey]} x={xS(d[xKey])} y={H - 6} textAnchor="middle" fontSize={11} fill="var(--muted)" fontFamily="var(--font-display)">
            {xFmt ? xFmt(d[xKey]) : d[xKey]}
          </text>
        ))}
      </svg>
      {tip && (
        <div
          className="card"
          style={{
            position: "absolute",
            top: 8,
            left: tipPct,
            transform: "translateX(-50%)",
            pointerEvents: "none",
            zIndex: 20,
            minWidth: 148,
            padding: "10px 12px",
            borderRadius: 10,
            boxShadow: "var(--shadow-pop)",
          }}
        >
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, marginBottom: 6, fontSize: "var(--fs-base)" }}>
            {xFmt ? xFmt(tip[xKey]) : tip[xKey]}
          </div>
          {series
            .filter((s) => !s.dashed)
            .map((s) => (
              <div
                key={s.key}
                style={{ display: "flex", justifyContent: "space-between", gap: 18, fontFamily: "var(--font-display)", fontSize: "var(--fs-sm)" }}
              >
                <span style={{ color: s.stroke }}>{s.name || s.key}</span>
                <span className="num">{fmtKr(tip[s.key] || 0)}</span>
              </div>
            ))}
        </div>
      )}
    </div>
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2.5 text-[12px]" style={{ color: "var(--muted)" }}>
      {series.map((s) => (
        <span key={s.key} className="flex items-center gap-1.5">
          <span
            aria-hidden
            style={
              s.dashed
                ? { width: 14, height: 0, borderTop: `2px dashed ${s.stroke}`, display: "inline-block" }
                : { width: 9, height: 9, borderRadius: 3, background: s.stroke, display: "inline-block", flexShrink: 0 }
            }
          />
          {s.name || s.key}
        </span>
      ))}
    </div>
    </div>
  );
}
