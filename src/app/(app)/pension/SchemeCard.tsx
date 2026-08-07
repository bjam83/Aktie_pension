"use client";

import { useActionState, useState } from "react";
import { updateSchemeAction, removeSchemeAction, type FormState } from "@/lib/actions/pensionSchemes";
import { SelectField, TextField } from "@/components/ui/Field";
import { MoneyField } from "@/components/ui/MoneyField";
import { PercentField } from "@/components/ui/PercentField";
import { SCHEME_TYPE_OPTIONS, labelFor } from "@/lib/constants";
import { fmtKr, fmtPct } from "@/lib/finance/format";
import { schemeReturnPct } from "@/lib/finance/pension";
import type { PensionScheme, Person } from "@/lib/types";

const initialState: FormState = {};

export function SchemeCard({ scheme, persons, color }: { scheme: PensionScheme; persons: Person[]; color: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(updateSchemeAction, initialState);
  const [schemeType, setSchemeType] = useState(scheme.scheme_type);
  const owner = persons.find((p) => p.id === scheme.person_id)?.name;

  return (
    <div className="card">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="dot" style={{ background: color }} />
          <div>
            <h3 style={{ margin: 0 }}>{scheme.name}</h3>
            <p className="cap" style={{ margin: "2px 0 0" }}>
              {labelFor(SCHEME_TYPE_OPTIONS, scheme.scheme_type)}
              {owner ? ` · ${owner}` : ""} · {fmtKr(scheme.current_value)} · {fmtPct(schemeReturnPct(scheme))}
            </p>
          </div>
        </div>
        <button className="btn ghost tiny" onClick={() => setOpen((v) => !v)} type="button">
          {open ? "Luk" : "Rediger"}
        </button>
      </div>

      {open && (
        <form action={formAction} className="grid gap-3 cols-2 mt-3">
          <input type="hidden" name="id" value={scheme.id} />
          <TextField label="Navn" name="name" defaultValue={scheme.name} required />
          <div className="field">
            <label htmlFor={`type-${scheme.id}`}>Type</label>
            <select className="input" id={`type-${scheme.id}`} name="scheme_type" value={schemeType} onChange={(e) => setSchemeType(e.target.value)}>
              {SCHEME_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <SelectField
            label="Ejer"
            name="person_id"
            defaultValue={scheme.person_id}
            options={persons.map((p) => ({ value: p.id, label: p.name }))}
          />
          <TextField label="Udbyder" name="provider" defaultValue={scheme.provider} placeholder="Fx AP Pension" />
          <MoneyField label="Nuværende værdi" name="current_value" defaultValue={scheme.current_value} />
          <MoneyField label="Månedlig indbetaling" name="monthly_contribution" defaultValue={scheme.monthly_contribution} />
          <PercentField label="Forventet årligt afkast" name="expected_return_pct" id={`ret-${scheme.id}`} defaultValue={scheme.expected_return_pct} />
          {schemeType === "ratepension" && (
            <div className="field">
              <label htmlFor={`payout-years-${scheme.id}`}>Udbetalingslængde</label>
              <div className="relative">
                <input
                  className="input pr-9"
                  id={`payout-years-${scheme.id}`}
                  name="payout_years"
                  type="number"
                  min={10}
                  max={25}
                  defaultValue={scheme.payout_years ?? 15}
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px] pointer-events-none" style={{ color: "var(--faint)" }}>
                  år
                </span>
              </div>
            </div>
          )}
          <TextField label="Note" name="notes" defaultValue={scheme.notes} />
          <div className="flex items-end gap-2 col-span-2">
            <button className="btn" type="submit" disabled={pending}>
              {pending ? "Gemmer…" : "Gem"}
            </button>
            <button
              className="btn ghost danger"
              formAction={removeSchemeAction}
              type="submit"
              onClick={(e) => {
                if (!confirm(`Slet ordningen “${scheme.name}”?`)) e.preventDefault();
              }}
            >
              Slet
            </button>
          </div>
          {state.error && (
            <p className="text-[12px] col-span-2" style={{ color: "var(--danger)" }}>
              {state.error}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
