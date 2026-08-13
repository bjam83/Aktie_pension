"use client";

import { useActionState, useState } from "react";
import { updateFundReturnAction, removeFundReturnAction, type FormState } from "@/lib/actions/pensionFunds";
import { PercentField } from "@/components/ui/PercentField";
import { fmtPct } from "@/lib/finance/format";
import { fundYearLabel } from "@/lib/finance/fundReturns";
import type { PensionFundReturn } from "@/lib/types";

const initialState: FormState = {};

export function FundReturnRow({ fundReturn }: { fundReturn: PensionFundReturn }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(updateFundReturnAction, initialState);

  // Adjusted during render, not in an effect — see MeasurementRow.tsx for the same pattern.
  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    if (!state.error) setOpen(false);
  }

  if (open) {
    return (
      <tr>
        <td colSpan={3}>
          <form action={formAction} className="grid gap-3 cols-2 my-2">
            <input type="hidden" name="id" value={fundReturn.id} />
            <div className="field">
              <label htmlFor={`fundret-year-${fundReturn.id}`}>År</label>
              <input
                className="input"
                id={`fundret-year-${fundReturn.id}`}
                name="year"
                type="number"
                min={2000}
                max={2100}
                defaultValue={fundReturn.year}
                required
              />
            </div>
            <PercentField label="Afkast" name="return_pct" id={`fundret-pct-${fundReturn.id}`} defaultValue={fundReturn.return_pct} />
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
      <td>{fundYearLabel(fundReturn.year)}</td>
      <td className="num">{fmtPct(fundReturn.return_pct)}</td>
      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
        <button className="btn ghost tiny" type="button" onClick={() => setOpen(true)}>
          Rediger
        </button>{" "}
        <form action={removeFundReturnAction} style={{ display: "inline" }}>
          <input type="hidden" name="id" value={fundReturn.id} />
          <button
            className="btn ghost danger tiny"
            type="submit"
            onClick={(e) => {
              if (!confirm(`Slet afkastet for ${fundYearLabel(fundReturn.year)}?`)) e.preventDefault();
            }}
          >
            Slet
          </button>
        </form>
      </td>
    </tr>
  );
}
