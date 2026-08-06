export function Stat({ label, value, hint, color }: { label: string; value: string; hint?: string; color?: string }) {
  return (
    <div className="stat">
      <div className="lab">
        {color && <span className="dot" style={{ background: color }} />}
        {label}
      </div>
      <div className="val" style={{ color: color || "var(--ink)" }}>
        {value}
      </div>
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}
