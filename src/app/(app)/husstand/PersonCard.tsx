"use client";

import { useActionState } from "react";
import { updatePersonAction, removePersonAction, type FormState } from "@/lib/actions/persons";
import type { Person } from "@/lib/types";
import { ageFromBirthDate } from "@/lib/finance/pension";

const initialState: FormState = {};

export function PersonCard({ person, canRemove }: { person: Person; canRemove: boolean }) {
  const [state, formAction, pending] = useActionState(updatePersonAction, initialState);
  const age = ageFromBirthDate(person.birth_date, NaN);

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3">
        <span className="dot" style={{ background: person.is_primary ? "var(--grow)" : "var(--s2)" }} />
        <h3 style={{ margin: 0 }}>{person.name || "Unavngivet"}</h3>
        {person.is_primary && <span className="chip">Dig</span>}
        {!Number.isNaN(age) && <span className="text-[12px]" style={{ color: "var(--muted)" }}>· {age} år</span>}
      </div>
      <form action={formAction} className="grid gap-3 cols-2">
        <input type="hidden" name="id" value={person.id} />
        <div className="field">
          <label htmlFor={`name-${person.id}`}>Navn</label>
          <input className="input" id={`name-${person.id}`} name="name" defaultValue={person.name} required />
        </div>
        <div className="field">
          <label htmlFor={`birth-${person.id}`}>Fødselsdato</label>
          <input className="input" id={`birth-${person.id}`} name="birth_date" type="date" defaultValue={person.birth_date ?? ""} />
        </div>
        <div className="field">
          <label htmlFor={`retire-${person.id}`}>Forventet pensionsalder</label>
          <input className="input" id={`retire-${person.id}`} name="retirement_age" type="number" defaultValue={person.retirement_age} min={50} max={80} />
        </div>
        <div className="flex items-end gap-2">
          <button className="btn" type="submit" disabled={pending}>
            {pending ? "Gemmer…" : "Gem"}
          </button>
          {canRemove && (
            <button
              className="btn ghost danger"
              formAction={removePersonAction}
              type="submit"
              onClick={(e) => {
                if (!confirm(`Fjern ${person.name} fra husstanden? Alle ordninger/konti knyttet til personen slettes også.`)) e.preventDefault();
              }}
            >
              Fjern
            </button>
          )}
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
