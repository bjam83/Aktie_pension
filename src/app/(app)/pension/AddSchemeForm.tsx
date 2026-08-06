"use client";

import { useActionState, useState } from "react";
import { addSchemeAction, type FormState } from "@/lib/actions/pensionSchemes";
import { SelectField, TextField } from "@/components/ui/Field";
import { MoneyField } from "@/components/ui/MoneyField";
import { SCHEME_TYPE_OPTIONS } from "@/lib/constants";
import type { Person } from "@/lib/types";

const initialState: FormState = {};

export function AddSchemeForm({ persons }: { persons: Person[] }) {
  const [state, formAction, pending] = useActionState(addSchemeAction, initialState);
  const [schemeType, setSchemeType] = useState("ratepension");

  return (
    <div className="card">
      <h3>Tilføj pensionsordning</h3>
      <p className="cap">Knyt ordningen til en person i husstanden.</p>
      <form action={formAction} className="grid gap-3 cols-2">
        <TextField label="Navn" name="name" placeholder="Fx “Arbejdsmarkedspension”" required />
        <div className="field">
          <label htmlFor="new-scheme-type">Type</label>
          <select className="input" id="new-scheme-type" name="scheme_type" value={schemeType} onChange={(e) => setSchemeType(e.target.value)}>
            {SCHEME_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <SelectField label="Ejer" name="person_id" options={persons.map((p) => ({ value: p.id, label: p.name }))} />
        <TextField label="Udbyder" name="provider" placeholder="Fx AP Pension" />
        <MoneyField label="Nuværende værdi" name="current_value" defaultValue={0} />
        <MoneyField label="Månedlig indbetaling" name="monthly_contribution" defaultValue={0} />
        <div className="field">
          <label htmlFor="new-ret">Forventet årligt afkast</label>
          <div className="relative">
            <input className="input pr-9" id="new-ret" name="expected_return_pct" type="number" step={0.1} defaultValue={6} />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px] pointer-events-none" style={{ color: "var(--faint)" }}>
              %
            </span>
          </div>
        </div>
        {schemeType === "ratepension" && (
          <div className="field">
            <label htmlFor="new-payout-years">Udbetalingslængde</label>
            <div className="relative">
              <input className="input pr-9" id="new-payout-years" name="payout_years" type="number" min={10} max={25} defaultValue={15} />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px] pointer-events-none" style={{ color: "var(--faint)" }}>
                år
              </span>
            </div>
          </div>
        )}
        <div className="flex items-end">
          <button className="btn" type="submit" disabled={pending}>
            {pending ? "Tilføjer…" : "+ Tilføj ordning"}
          </button>
        </div>
      </form>
      {state.error && (
        <p className="text-[12px] mt-2" style={{ color: "var(--danger)" }}>
          {state.error}
        </p>
      )}
    </div>
  );
}
