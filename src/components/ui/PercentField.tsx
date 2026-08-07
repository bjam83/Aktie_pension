"use client";

import { useState } from "react";

/**
 * Percentage/rate input that accepts a Danish decimal comma (fx "6,5" or "25,43") and negative
 * values (fx "-7,34" for a year the return was negative). A plain `<input type="number">` silently
 * rejects "," — the HTML spec only recognises "." as the decimal separator regardless of locale —
 * so typing "25,43" leaves the field's value empty and the form submits nothing for it. This
 * mirrors MoneyField's split: a display input that accepts what people actually type, and a hidden
 * input carrying the normalized (dot-decimal) value under `name`.
 *
 * The minus sign also gets its own toggle button: iOS and Android's decimal-mode keypad
 * (inputMode="decimal") has no "-" key at all, so on a phone there's otherwise no way to type a
 * negative value even though the field itself would happily accept one.
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

  const sanitize = (raw: string) => {
    const kept = raw.replace(/[^0-9,\-]/g, "");
    const negative = kept.includes("-");
    const digits = kept.replace(/-/g, "");
    const comma = digits.indexOf(",");
    const rest = comma === -1 ? digits : digits.slice(0, comma + 1) + digits.slice(comma + 1).replace(/,/g, "");
    return (negative ? "-" : "") + rest;
  };

  return (
    <div className="field">
      <label htmlFor={fieldId}>{label}</label>
      <div className="relative">
        <input type="hidden" name={name} value={display.replace(",", ".")} />
        <button
          type="button"
          tabIndex={-1}
          aria-label="Skift fortegn (positiv/negativ)"
          onClick={() => setDisplay((d) => (d.startsWith("-") ? d.slice(1) : d ? "-" + d : "-"))}
          className="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center"
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            border: "1px solid var(--line)",
            background: "var(--paper)",
            color: "var(--muted)",
            fontSize: 13,
            lineHeight: 1,
            cursor: "pointer",
          }}
        >
          ±
        </button>
        <input
          className="input pr-9"
          id={fieldId}
          type="text"
          inputMode="decimal"
          value={display}
          placeholder={placeholder}
          style={{ paddingLeft: 34 }}
          onChange={(e) => setDisplay(sanitize(e.target.value))}
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px] pointer-events-none" style={{ color: "var(--faint)", fontFamily: "var(--font-display)" }}>
          %
        </span>
      </div>
    </div>
  );
}
