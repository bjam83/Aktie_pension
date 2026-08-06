"use client";

import { useActionState } from "react";
import { updateRetirementAgeAction, type FormState } from "@/lib/actions/persons";
import { fmtKr } from "@/lib/finance/format";
import type { Person } from "@/lib/types";

const initialState: FormState = {};

export function PersonPensionHeader({ person, pensionNow, color }: { person: Person; pensionNow: number; color: string }) {
  const [state, formAction, pending] = useActionState(updateRetirementAgeAction, initialState);

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3">
        <span className="dot" style={{ background: color }} />
        <h3 style={{ margin: 0 }}>{person.name}</h3>
      </div>
      <div className="flex items-end gap-4 flex-wrap">
        <form action={formAction} className="flex items-end gap-2">
          <input type="hidden" name="id" value={person.id} />
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor={`retire-${person.id}`}>Forventet pensionsalder</label>
            <input className="input" id={`retire-${person.id}`} name="retirement_age" type="number" defaultValue={person.retirement_age} min={50} max={80} style={{ width: 90 }} />
          </div>
          <button className="btn ghost tiny" type="submit" disabled={pending}>
            {pending ? "Gemmer…" : "Gem"}
          </button>
        </form>
        <div className="stat" style={{ minWidth: 160 }}>
          <div className="lab">Nuværende pensionsformue</div>
          <div className="val">{fmtKr(pensionNow)}</div>
        </div>
      </div>
      {state.error && (
        <p className="text-[12px] mt-2" style={{ color: "var(--danger)" }}>
          {state.error}
        </p>
      )}
    </div>
  );
}
