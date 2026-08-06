"use client";

import { useState } from "react";

const grp = new Intl.NumberFormat("da-DK");

/** A `kr.`-suffixed number input that shows thousands separators while unfocused, still posts a plain numeric value. */
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
        <input
          className="input pr-9"
          id={name}
          name={name}
          type="text"
          inputMode="decimal"
          value={shown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => setValue(e.target.value.replace(/[^0-9.,]/g, "").replace(",", "."))}
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px] pointer-events-none" style={{ color: "var(--faint)", fontFamily: "var(--font-display)" }}>
          {suffix}
        </span>
      </div>
    </div>
  );
}
