"use client";

import { useActionState, useState } from "react";
import { updateSchemeAction, removeSchemeAction, type FormState } from "@/lib/actions/pensionSchemes";
import { SelectField, TextField } from "@/components/ui/Field";
import { MoneyField } from "@/components/ui/MoneyField";
import { SCHEME_TYPE_OPTIONS, RETURN_BASIS_OPTIONS } from "@/lib/constants";
import { fmtPct } from "@/lib/finance/format";
import { schemeReturnPct } from "@/lib/finance/pension";
import type { PensionScheme, Person } from "@/lib/types";

const initialState: FormState = {};

export function SchemeCard({ scheme, persons, color }: { scheme: PensionScheme; persons: Person[]; color: string }) {
  const [state, formAction, pending] = useActionState(updateSchemeAction, initialState);
  const [schemeType, setSchemeType] = useState(scheme.scheme_type);
  const eff = schemeReturnPct(scheme);
  const hasYtd = scheme.fetched_return_pct != null;

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3">
        <span className="dot" style={{ background: color }} />
        <h3 style={{ margin: 0, flex: 1 }}>{scheme.name}</h3>
        <span className="text-[12.5px]" style={{ color: "var(--muted)" }}>
          bruges {fmtPct(eff)}
        </span>
      </div>
      <form action={formAction} className="grid gap-3 cols-2">
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
        <div className="field">
          <label htmlFor={`ret-${scheme.id}`}>Historisk/forventet årligt afkast</label>
          <div className="relative">
            <input
              className="input pr-9"
              id={`ret-${scheme.id}`}
              name="expected_return_pct"
              type="number"
              step={0.1}
              defaultValue={scheme.expected_return_pct}
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px] pointer-events-none" style={{ color: "var(--faint)" }}>
              %
            </span>
          </div>
        </div>
        <div className="field">
          <label htmlFor={`fet-${scheme.id}`}>Årets faktiske afkast (valgfrit)</label>
          <div className="relative">
            <input
              className="input pr-9"
              id={`fet-${scheme.id}`}
              name="fetched_return_pct"
              type="number"
              step={0.1}
              defaultValue={scheme.fetched_return_pct ?? ""}
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px] pointer-events-none" style={{ color: "var(--faint)" }}>
              %
            </span>
          </div>
        </div>
        <SelectField label="Fremskriv med" name="return_basis" defaultValue={scheme.return_basis} options={hasYtd ? RETURN_BASIS_OPTIONS : [RETURN_BASIS_OPTIONS[0]]} />
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
      </form>
      {state.error && (
        <p className="text-[12px] mt-2" style={{ color: "var(--danger)" }}>
          {state.error}
        </p>
      )}
    </div>
  );
}
