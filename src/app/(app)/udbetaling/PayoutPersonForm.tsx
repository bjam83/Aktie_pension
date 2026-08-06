"use client";

import { useActionState } from "react";
import { updatePayoutConfigAction, type FormState } from "@/lib/actions/planning";
import { MoneyField } from "@/components/ui/MoneyField";
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
      <div className="field">
        <label htmlFor={`ret-${personId}`}>Forventet afkast under udbetaling</label>
        <div className="relative">
          <input className="input pr-9" id={`ret-${personId}`} name="ret" type="number" step={0.1} defaultValue={cfg.ret} />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px] pointer-events-none" style={{ color: "var(--faint)" }}>
            %
          </span>
        </div>
      </div>
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
