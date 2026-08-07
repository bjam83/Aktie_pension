"use client";

import { useActionState } from "react";
import { updatePayoutConfigAction, type FormState } from "@/lib/actions/planning";
import { MoneyField } from "@/components/ui/MoneyField";
import { PercentField } from "@/components/ui/PercentField";
import type { PayoutConfig } from "@/lib/types";

const initialState: FormState = {};

export function PayoutPersonForm({ personId, cfg }: { personId: string; cfg: PayoutConfig }) {
  const [state, formAction, pending] = useActionState(updatePayoutConfigAction, initialState);

  return (
    <form action={formAction} className="grid gap-3 cols-3">
      <input type="hidden" name="person_id" value={personId} />
      <div className="field">
        <label htmlFor={`years-${personId}`}>Udbetalingsår (aldersopsparing, arbejdsmarkedspension mv.)</label>
        <input className="input" id={`years-${personId}`} name="years" type="number" defaultValue={cfg.years} />
      </div>
      <PercentField label="Forventet afkast under udbetaling" name="ret" id={`ret-${personId}`} defaultValue={cfg.ret} />
      <MoneyField label="Anden indkomst i udbetalingsårene (årligt, brutto)" name="otherIncome" defaultValue={cfg.otherIncome} />
      <div className="flex items-end">
        <button className="btn" type="submit" disabled={pending}>
          {pending ? "Gemmer…" : "Gem & genberegn"}
        </button>
      </div>
      {state.error && (
        <p className="text-[12px]" style={{ color: "var(--danger)" }}>
          {state.error}
        </p>
      )}
    </form>
  );
}
