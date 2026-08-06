"use client";

import { useActionState } from "react";
import { addAccountAction, type FormState } from "@/lib/actions/investments";
import { SelectField, TextField } from "@/components/ui/Field";
import { ACCOUNT_KIND_OPTIONS } from "@/lib/constants";
import type { Person } from "@/lib/types";

const initialState: FormState = {};

export function AddAccountForm({ persons }: { persons: Person[] }) {
  const [state, formAction, pending] = useActionState(addAccountAction, initialState);

  return (
    <div className="card">
      <h3>Tilføj depot/konto</h3>
      <form action={formAction} className="grid gap-3 cols-2">
        <TextField label="Navn" name="name" placeholder="Fx “Aktiesparekonto – Nordnet”" required />
        <SelectField label="Kontotype" name="kind" defaultValue="frie_midler" options={ACCOUNT_KIND_OPTIONS} />
        <TextField label="Bank/mægler" name="broker" placeholder="Fx Nordnet" />
        <SelectField label="Ejer" name="person_id" options={[{ value: "", label: "Fælles" }, ...persons.map((p) => ({ value: p.id, label: p.name }))]} />
        <div className="flex items-end">
          <button className="btn" type="submit" disabled={pending}>
            {pending ? "Tilføjer…" : "+ Tilføj konto"}
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
