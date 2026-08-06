"use client";

import { useActionState } from "react";
import { updateFreeFundsAction, type FormState } from "@/lib/actions/planning";
import { SelectField } from "@/components/ui/Field";
import { MoneyField } from "@/components/ui/MoneyField";
import type { FreeFundsConfig } from "@/lib/types";

const initialState: FormState = {};

export function FreeFundsForm({ cfg }: { cfg: FreeFundsConfig }) {
  const [state, formAction, pending] = useActionState(updateFreeFundsAction, initialState);

  return (
    <div className="card">
      <h3>Simulér frie midler</h3>
      <p className="cap">Månedsopsparing uden for pension — vælg beskatningsform for at se afkastet efter skat.</p>
      <form action={formAction} className="grid gap-3 cols-3">
        <MoneyField label="Startbeløb" name="lump" defaultValue={cfg.lump} />
        <MoneyField label="Månedlig indbetaling" name="monthly" defaultValue={cfg.monthly} />
        <div className="field">
          <label htmlFor="ff-ret">Forventet årligt afkast</label>
          <div className="relative">
            <input className="input pr-9" id="ff-ret" name="ret" type="number" step={0.1} defaultValue={cfg.ret} />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px] pointer-events-none" style={{ color: "var(--faint)" }}>
              %
            </span>
          </div>
        </div>
        <div className="field">
          <label htmlFor="ff-years">Antal år</label>
          <input className="input" id="ff-years" name="years" type="number" defaultValue={cfg.years} />
        </div>
        <SelectField
          label="Beskatning"
          name="tax"
          defaultValue={cfg.tax}
          options={[
            { value: "ask", label: "Aktiesparekonto (løbende, flad sats)" },
            { value: "depot", label: "Aktiedepot (lagerbeskatning ved slut)" },
          ]}
        />
        <div className="flex items-end">
          <button className="btn" type="submit" disabled={pending}>
            {pending ? "Gemmer…" : "Gem & genberegn"}
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
