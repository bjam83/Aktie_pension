"use client";

import { useActionState, useState } from "react";
import { updateAccountAction, removeAccountAction, type FormState } from "@/lib/actions/investments";
import { SelectField, TextField } from "@/components/ui/Field";
import { ACCOUNT_KIND_OPTIONS, labelFor } from "@/lib/constants";
import type { InvestmentAccount, Person } from "@/lib/types";

const initialState: FormState = {};

export function AccountRow({ account, persons, owner }: { account: InvestmentAccount; persons: Person[]; owner?: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(updateAccountAction, initialState);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <h3 style={{ margin: 0 }}>{account.name}</h3>
          <p className="cap" style={{ margin: "2px 0 0" }}>
            {labelFor(ACCOUNT_KIND_OPTIONS, account.kind)}
            {account.broker ? ` · ${account.broker}` : ""}
            {owner ? ` · ${owner}` : " · Fælles"}
          </p>
        </div>
        <button className="btn ghost tiny" onClick={() => setOpen((v) => !v)} type="button">
          {open ? "Luk" : "Rediger konto"}
        </button>
      </div>

      {open && (
        <div className="card" style={{ background: "var(--paper)", marginBottom: 12 }}>
          <form action={formAction} className="grid gap-3 cols-2">
            <input type="hidden" name="id" value={account.id} />
            <TextField label="Navn" name="name" defaultValue={account.name} required />
            <SelectField label="Kontotype" name="kind" defaultValue={account.kind} options={ACCOUNT_KIND_OPTIONS} />
            <TextField label="Bank/mægler" name="broker" defaultValue={account.broker} />
            <SelectField
              label="Ejer"
              name="person_id"
              defaultValue={account.person_id ?? ""}
              options={[{ value: "", label: "Fælles" }, ...persons.map((p) => ({ value: p.id, label: p.name }))]}
            />
            <div className="field">
              <label htmlFor={`acc-monthly-${account.id}`}>Månedlig indbetaling</label>
              <input className="input" id={`acc-monthly-${account.id}`} name="monthly_contribution" type="number" defaultValue={account.monthly_contribution} />
            </div>
            <div className="field">
              <label htmlFor={`acc-ret-${account.id}`}>Forventet årligt afkast</label>
              <div className="relative">
                <input className="input pr-9" id={`acc-ret-${account.id}`} name="expected_return_pct" type="number" step={0.1} defaultValue={account.expected_return_pct} />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px] pointer-events-none" style={{ color: "var(--faint)" }}>
                  %
                </span>
              </div>
            </div>
            <div className="field">
              <label htmlFor={`acc-years-${account.id}`}>Fremskriv over</label>
              <div className="relative">
                <input className="input pr-9" id={`acc-years-${account.id}`} name="projection_years" type="number" defaultValue={account.projection_years} />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px] pointer-events-none" style={{ color: "var(--faint)" }}>
                  år
                </span>
              </div>
            </div>
            <div className="flex items-end gap-2 col-span-2">
              <button className="btn" type="submit" disabled={pending}>
                {pending ? "Gemmer…" : "Gem"}
              </button>
              <button
                className="btn ghost danger"
                formAction={removeAccountAction}
                type="submit"
                onClick={(e) => {
                  if (!confirm(`Slet “${account.name}” og alle poster i den?`)) e.preventDefault();
                }}
              >
                Slet konto
              </button>
            </div>
            {state.error && (
              <p className="text-[12px] col-span-2" style={{ color: "var(--danger)" }}>
                {state.error}
              </p>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
