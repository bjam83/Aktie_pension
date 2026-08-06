"use client";

import { useActionState } from "react";
import { addAccountAction, type FormState } from "@/lib/actions/investments";
import { SelectField, TextField } from "@/components/ui/Field";
import { ACCOUNT_KIND_OPTIONS } from "@/lib/constants";
import type { Person } from "@/lib/types";

const initialState: FormState = {};

export function AddAccountForm({ persons }: { persons: Person[] }) {
  const [state, formAction, pending] = useActionState(addAccountAction, initialState);

  return (
    <div className="card">
      <h3>Tilføj konto</h3>
      <p className="cap">Opret så mange konti I har brug for — fx én aktiesparekonto (flad ASK-skat) og én klassisk beskattet depot (aktieindkomstskat).</p>
      <form action={formAction} className="grid gap-3 cols-2">
        <TextField label="Navn" name="name" placeholder="Fx “Aktiesparekonto – Nordnet”" required />
        <SelectField label="Kontotype" name="kind" defaultValue="frie_midler" options={ACCOUNT_KIND_OPTIONS} />
        <TextField label="Bank/mægler" name="broker" placeholder="Fx Nordnet" />
        <SelectField label="Ejer" name="person_id" options={[{ value: "", label: "Fælles" }, ...persons.map((p) => ({ value: p.id, label: p.name }))]} />
        <div className="field">
          <label htmlFor="new-acc-monthly">Månedlig indbetaling</label>
          <input className="input" id="new-acc-monthly" name="monthly_contribution" type="number" defaultValue={0} />
        </div>
        <div className="field">
          <label htmlFor="new-acc-ret">Forventet årligt afkast</label>
          <div className="relative">
            <input className="input pr-9" id="new-acc-ret" name="expected_return_pct" type="number" step={0.1} defaultValue={6} />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px] pointer-events-none" style={{ color: "var(--faint)" }}>
              %
            </span>
          </div>
        </div>
        <div className="field">
          <label htmlFor="new-acc-years">Fremskriv over</label>
          <div className="relative">
            <input className="input pr-9" id="new-acc-years" name="projection_years" type="number" defaultValue={15} />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px] pointer-events-none" style={{ color: "var(--faint)" }}>
              år
            </span>
          </div>
        </div>
        <div className="flex items-end">
          <button className="btn" type="submit" disabled={pending}>
            {pending ? "Tilføjer…" : "+ Tilføj konto"}
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
