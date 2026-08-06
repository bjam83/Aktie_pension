"use client";

import { useActionState } from "react";
import { addHoldingAction, type FormState } from "@/lib/actions/investments";
import { SelectField, TextField } from "@/components/ui/Field";
import { MoneyField } from "@/components/ui/MoneyField";
import { INSTRUMENT_TYPE_OPTIONS } from "@/lib/constants";

const initialState: FormState = {};

export function AddHoldingForm({ accountId }: { accountId: string }) {
  const [state, formAction, pending] = useActionState(addHoldingAction, initialState);

  return (
    <details className="mt-2">
      <summary className="btn ghost tiny" style={{ display: "inline-flex", cursor: "pointer" }}>
        + Tilføj aktie/fond
      </summary>
      <form action={formAction} className="grid gap-3 cols-2 mt-3">
        <input type="hidden" name="account_id" value={accountId} />
        <TextField label="Navn" name="name" placeholder="Fx “Novo Nordisk”" required />
        <SelectField label="Type" name="instrument_type" defaultValue="aktie" options={INSTRUMENT_TYPE_OPTIONS} />
        <TextField label="Ticker (Stooq-format, fx AAPL.US)" name="ticker" placeholder="AAPL.US" />
        <TextField label="ISIN" name="isin" />
        <div className="field">
          <label htmlFor={`qty-${accountId}`}>Antal</label>
          <input className="input" id={`qty-${accountId}`} name="quantity" type="number" step={0.0001} defaultValue={0} />
        </div>
        <MoneyField label="Gns. kostpris pr. stk." name="avg_cost_price" defaultValue={0} />
        <MoneyField label="Manuel kurs pr. stk. (valgfrit)" name="manual_price" />
        <div className="flex items-end">
          <button className="btn" type="submit" disabled={pending}>
            {pending ? "Tilføjer…" : "Tilføj"}
          </button>
        </div>
      </form>
      {state.error && (
        <p className="text-[12px] mt-2" style={{ color: "var(--danger)" }}>
          {state.error}
        </p>
      )}
    </details>
  );
}
