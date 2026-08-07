"use client";

import { useActionState, useState } from "react";
import { updateMeasurementAction, removeMeasurementAction, type FormState } from "@/lib/actions/pensionMeasurements";
import { MoneyField } from "@/components/ui/MoneyField";
import { fmtKr, fmtPct, fmtDate } from "@/lib/finance/format";
import type { PensionMeasurement } from "@/lib/types";

const initialState: FormState = {};
const today = () => new Date().toISOString().slice(0, 10);

export function MeasurementRow({ measurement }: { measurement: PensionMeasurement }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(updateMeasurementAction, initialState);

  if (open) {
    return (
      <tr>
        <td colSpan={4}>
          <form action={formAction} className="grid gap-3 cols-2 my-2">
            <input type="hidden" name="id" value={measurement.id} />
            <div className="field">
              <label htmlFor={`meas-date-${measurement.id}`}>Dato</label>
              <input
                className="input"
                id={`meas-date-${measurement.id}`}
                name="measured_on"
                type="date"
                defaultValue={measurement.measured_on}
                max={today()}
                required
              />
            </div>
            <MoneyField label="Samlet pensionsværdi" name="total_value" defaultValue={measurement.total_value} />
            <div className="field">
              <label htmlFor={`meas-ret-${measurement.id}`}>Opnået afkast (valgfrit)</label>
              <div className="relative">
                <input
                  className="input pr-9"
                  id={`meas-ret-${measurement.id}`}
                  name="return_pct"
                  type="number"
                  step={0.1}
                  defaultValue={measurement.return_pct ?? ""}
                  placeholder="Fx 6,2"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px] pointer-events-none" style={{ color: "var(--faint)" }}>
                  %
                </span>
              </div>
            </div>
            <div className="flex items-end gap-2">
              <button className="btn" type="submit" disabled={pending}>
                {pending ? "Gemmer…" : "Gem"}
              </button>
              <button className="btn ghost" type="button" onClick={() => setOpen(false)}>
                Annuller
              </button>
            </div>
            {state.error && (
              <p className="text-[12px] col-span-2" style={{ color: "var(--danger)" }}>
                {state.error}
              </p>
            )}
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td>{fmtDate(measurement.measured_on)}</td>
      <td className="num">{fmtKr(measurement.total_value)}</td>
      <td className="num">{measurement.return_pct == null ? "–" : fmtPct(measurement.return_pct)}</td>
      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
        <button className="btn ghost tiny" type="button" onClick={() => setOpen(true)}>
          Rediger
        </button>{" "}
        <form action={removeMeasurementAction} style={{ display: "inline" }}>
          <input type="hidden" name="id" value={measurement.id} />
          <button
            className="btn ghost danger tiny"
            type="submit"
            onClick={(e) => {
              if (!confirm(`Slet målingen fra ${fmtDate(measurement.measured_on)}?`)) e.preventDefault();
            }}
          >
            Slet
          </button>
        </form>
      </td>
    </tr>
  );
}
