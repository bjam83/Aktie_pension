"use client";

import { useState } from "react";

/**
 * Percentage/rate input that accepts a Danish decimal comma (fx "6,5" or "25,43"). A plain
 * `<input type="number">` silently rejects "," — the HTML spec only recognises "." as the decimal
 * separator regardless of locale — so typing "25,43" leaves the field's value empty and the form
 * submits nothing for it. This mirrors MoneyField's split: a display input that accepts what people
 * actually type, and a hidden input carrying the normalized (dot-decimal) value under `name`.
 */
export function PercentField({
  label,
  name,
  defaultValue,
  placeholder,
  id,
}: {
  label: string;
  name: string;
  defaultValue?: number | string | null;
  placeholder?: string;
  id?: string;
}) {
  const [display, setDisplay] = useState(defaultValue == null || defaultValue === "" ? "" : String(defaultValue).replace(".", ","));
  const fieldId = id ?? name;

  return (
    <div className="field">
      <label htmlFor={fieldId}>{label}</label>
      <div className="relative">
        <input type="hidden" name={name} value={display.replace(",", ".")} />
        <input
          className="input pr-9"
          id={fieldId}
          type="text"
          inputMode="decimal"
          value={display}
          placeholder={placeholder}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9,\-]/g, "");
            const comma = raw.indexOf(",");
            setDisplay(comma === -1 ? raw : raw.slice(0, comma + 1) + raw.slice(comma + 1).replace(/,/g, ""));
          }}
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px] pointer-events-none" style={{ color: "var(--faint)", fontFamily: "var(--font-display)" }}>
          %
        </span>
      </div>
    </div>
  );
}
