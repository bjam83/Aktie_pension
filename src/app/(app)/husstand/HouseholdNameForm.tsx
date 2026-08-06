"use client";

import { useActionState } from "react";
import { updateHouseholdAction, type FormState } from "@/lib/actions/persons";

const initialState: FormState = {};

export function HouseholdNameForm({ defaultValue }: { defaultValue: string }) {
  const [state, formAction, pending] = useActionState(updateHouseholdAction, initialState);

  return (
    <form action={formAction} className="flex items-end gap-2">
      <div className="field flex-1" style={{ marginBottom: 0 }}>
        <label htmlFor="household_name">Husstandens navn</label>
        <input className="input" id="household_name" name="household_name" defaultValue={defaultValue} placeholder="Fx “Familien Jensen”" />
      </div>
      <button className="btn ghost" type="submit" disabled={pending}>
        {pending ? "Gemmer…" : "Gem"}
      </button>
      {state.error && (
        <p className="text-[12px]" style={{ color: "var(--danger)" }}>
          {state.error}
        </p>
      )}
    </form>
  );
}
