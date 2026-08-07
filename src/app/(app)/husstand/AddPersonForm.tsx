"use client";

import { useActionState } from "react";
import { addPersonAction, type FormState } from "@/lib/actions/persons";

const initialState: FormState = {};

export function AddPersonForm() {
  const [state, formAction, pending] = useActionState(addPersonAction, initialState);

  return (
    <details className="card">
      <summary style={{ cursor: "pointer" }}>
        <h3 style={{ display: "inline" }}>+ Tilføj person #2</h3>
      </summary>
      <p className="cap mt-2">Default er kun én person i husstanden. Tilføj en mere for at fordele pension, konti og aktiver mellem jer.</p>
      <form action={formAction} className="flex items-end gap-2">
        <div className="field flex-1" style={{ marginBottom: 0 }}>
          <label htmlFor="add-person-name">Navn</label>
          <input className="input" id="add-person-name" name="name" placeholder="Fx “Ida”" required />
        </div>
        <button className="btn" type="submit" disabled={pending}>
          {pending ? "Tilføjer…" : "+ Tilføj person"}
        </button>
      </form>
      {state.error && (
        <p className="text-[12px] mt-2" style={{ color: "var(--danger)" }}>
          {state.error}
        </p>
      )}
    </details>
  );
}
