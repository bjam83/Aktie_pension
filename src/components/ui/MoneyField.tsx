"use client";

import { useState } from "react";

const grp = new Intl.NumberFormat("da-DK");

/**
 * A `kr.`-suffixed number input that shows thousands separators while unfocused.
 * The visible input is display-only (no `name`) — a hidden input carries the raw
 * numeric value under `name`, so the formatted "530.000" text is never what gets
 * submitted (which would otherwise be parsed as 530 — "." read as a decimal point).
 */
export function MoneyField({
  label,
  name,
  defaultValue,
  suffix = "kr.",
}: {
  label: string;
  name: string;
  defaultValue?: number | string | null;
  suffix?: string;
}) {
  const [value, setValue] = useState(defaultValue == null || defaultValue === "" ? "" : String(defaultValue));
  const [focused, setFocused] = useState(false);
  const shown = value === "" ? "" : focused ? value : grp.format(Number(value) || 0);

  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <div className="relative">
        <input type="hidden" name={name} value={value} />
        <input
          className="input pr-9"
          id={name}
          type="text"
          inputMode="decimal"
          value={shown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => {
            const raw = e.target.value.replace(",", ".").replace(/[^0-9.]/g, "");
            const dot = raw.indexOf(".");
            setValue(dot === -1 ? raw : raw.slice(0, dot + 1) + raw.slice(dot + 1).replace(/\./g, ""));
          }}
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px] pointer-events-none" style={{ color: "var(--faint)", fontFamily: "var(--font-display)" }}>
          {suffix}
        </span>
      </div>
    </div>
  );
}
