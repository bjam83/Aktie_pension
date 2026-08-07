"use client";

import { useActionState } from "react";
import {
  addBudgetItemAction,
  addAssetAction,
  addLiabilityAction,
  addIncomeStreamAction,
  type FormState,
} from "@/lib/actions/budget";
import { SelectField, TextField } from "@/components/ui/Field";
import { MoneyField } from "@/components/ui/MoneyField";
import { PercentField } from "@/components/ui/PercentField";
import {
  BUDGET_DIRECTION_OPTIONS,
  BUDGET_FREQUENCY_OPTIONS,
  ASSET_KIND_OPTIONS,
  LIABILITY_KIND_OPTIONS,
  INCOME_KIND_OPTIONS,
  INCOME_FREQUENCY_OPTIONS,
} from "@/lib/constants";
import type { Person } from "@/lib/types";

const initialState: FormState = {};

export function AddBudgetItemForm() {
  const [state, formAction, pending] = useActionState(addBudgetItemAction, initialState);
  return (
    <details className="mt-3">
      <summary className="btn ghost tiny" style={{ display: "inline-flex", cursor: "pointer" }}>
        + Tilføj post
      </summary>
      <form action={formAction} className="grid gap-3 cols-2 mt-3">
        <TextField label="Navn" name="name" placeholder="Fx “Netflix”" required />
        <SelectField label="Retning" name="direction" defaultValue="ud" options={BUDGET_DIRECTION_OPTIONS} />
        <SelectField label="Hyppighed" name="frequency" defaultValue="månedlig" options={BUDGET_FREQUENCY_OPTIONS} />
        <MoneyField label="Beløb" name="amount" defaultValue={0} />
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

export function AddAssetForm({ persons }: { persons: Person[] }) {
  const [state, formAction, pending] = useActionState(addAssetAction, initialState);
  return (
    <details className="mt-3">
      <summary className="btn ghost tiny" style={{ display: "inline-flex", cursor: "pointer" }}>
        + Tilføj aktiv
      </summary>
      <form action={formAction} className="grid gap-3 cols-2 mt-3">
        <TextField label="Navn" name="name" placeholder="Fx “Lejlighed”" required />
        <SelectField label="Type" name="kind" defaultValue="andet" options={ASSET_KIND_OPTIONS} />
        <MoneyField label="Værdi" name="value" defaultValue={0} />
        <PercentField label="Årlig værdiudvikling" name="growth_rate_pct" id="new-asset-growth" defaultValue={0} />
        <SelectField label="Ejer" name="owner_id" options={[{ value: "", label: "Fælles" }, ...persons.map((p) => ({ value: p.id, label: p.name }))]} />
        <div className="flex items-end">
          <button className="btn" type="submit" disabled={pending}>
            {pending ? "Tilføjer…" : "Tilføj"}
          </button>
        </div>
      </form>
      <p className="note mt-2">Fx 2-3% for boligpriser, 0% for bankindestående, eller negativt for en bil der falder i værdi (fx -15%).</p>
      {state.error && (
        <p className="text-[12px] mt-2" style={{ color: "var(--danger)" }}>
          {state.error}
        </p>
      )}
    </details>
  );
}

export function AddLiabilityForm({ persons }: { persons: Person[] }) {
  const [state, formAction, pending] = useActionState(addLiabilityAction, initialState);
  return (
    <details className="mt-3">
      <summary className="btn ghost tiny" style={{ display: "inline-flex", cursor: "pointer" }}>
        + Tilføj gæld
      </summary>
      <form action={formAction} className="grid gap-3 cols-2 mt-3">
        <TextField label="Navn" name="name" placeholder="Fx “Billån”" required />
        <SelectField label="Type" name="kind" defaultValue="andet" options={LIABILITY_KIND_OPTIONS} />
        <MoneyField label="Restgæld" name="remaining_debt" defaultValue={0} />
        <PercentField label="Rente" name="interest_rate_pct" id="liab-rate" />
        <SelectField label="Ejer" name="owner_id" options={[{ value: "", label: "Fælles" }, ...persons.map((p) => ({ value: p.id, label: p.name }))]} />
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

export function AddIncomeStreamForm({ persons }: { persons: Person[] }) {
  const [state, formAction, pending] = useActionState(addIncomeStreamAction, initialState);
  return (
    <details className="mt-3">
      <summary className="btn ghost tiny" style={{ display: "inline-flex", cursor: "pointer" }}>
        + Tilføj indkomst
      </summary>
      <form action={formAction} className="grid gap-3 cols-2 mt-3">
        <SelectField label="Person" name="person_id" options={persons.map((p) => ({ value: p.id, label: p.name }))} />
        <SelectField label="Type" name="kind" defaultValue="løn" options={INCOME_KIND_OPTIONS} />
        <MoneyField label="Beløb (netto, efter skat)" name="amount" defaultValue={0} />
        <SelectField label="Hyppighed" name="frequency" defaultValue="månedlig" options={INCOME_FREQUENCY_OPTIONS} />
        <div className="flex items-end">
          <button className="btn" type="submit" disabled={pending}>
            {pending ? "Tilføjer…" : "Tilføj"}
          </button>
        </div>
      </form>
      <p className="note mt-2">Indtast beløb som nettoløn/netto — dvs. det beløb der reelt indsættes på kontoen efter skat. Budgettets over-/underskud regner videre i netto-kroner.</p>
      {state.error && (
        <p className="text-[12px] mt-2" style={{ color: "var(--danger)" }}>
          {state.error}
        </p>
      )}
    </details>
  );
}
