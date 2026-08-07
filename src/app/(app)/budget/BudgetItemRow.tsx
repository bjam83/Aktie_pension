"use client";

import { useActionState, useState } from "react";
import { updateBudgetItemAction, removeBudgetItemAction, type FormState } from "@/lib/actions/budget";
import { SelectField, TextField } from "@/components/ui/Field";
import { MoneyField } from "@/components/ui/MoneyField";
import { BUDGET_DIRECTION_OPTIONS, BUDGET_FREQUENCY_OPTIONS, toMonthly } from "@/lib/constants";
import { fmtKr } from "@/lib/finance/format";
import type { BudgetItem, Person } from "@/lib/types";

const initialState: FormState = {};

export function BudgetItemRow({ item, persons }: { item: BudgetItem; persons: Person[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(updateBudgetItemAction, initialState);
  const monthly = toMonthly(Number(item.amount), item.frequency) * (item.direction === "ud" ? -1 : 1);

  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    if (!state.error) setOpen(false);
  }

  return (
    <div style={{ borderBottom: "1px solid var(--line)", padding: "8px 0" }}>
      <div className="flex items-center gap-2">
        <span className="flex-1 text-[13px]">{item.name}</span>
        <span className="num text-[13px]" style={{ color: monthly < 0 ? "var(--real)" : "var(--grow)", minWidth: 100, textAlign: "right" }}>
          {monthly < 0 ? "-" : "+"}
          {fmtKr(Math.abs(monthly))}/md.
        </span>
        <button className="btn ghost tiny" onClick={() => setOpen((v) => !v)} type="button">
          {open ? "Luk" : "Rediger"}
        </button>
      </div>
      {open && (
        <form action={formAction} className="grid gap-3 cols-2 mt-3">
          <input type="hidden" name="id" value={item.id} />
          <TextField label="Navn" name="name" defaultValue={item.name} required />
          <SelectField label="Retning" name="direction" defaultValue={item.direction} options={BUDGET_DIRECTION_OPTIONS} />
          <SelectField label="Hyppighed" name="frequency" defaultValue={item.frequency} options={BUDGET_FREQUENCY_OPTIONS} />
          <MoneyField label="Beløb" name="amount" defaultValue={item.amount} />
          <SelectField
            label="Person"
            name="person_id"
            defaultValue={item.person_id ?? ""}
            options={[{ value: "", label: "Fælles" }, ...persons.map((p) => ({ value: p.id, label: p.name }))]}
          />
          <div className="flex items-end gap-2 col-span-2">
            <button className="btn" type="submit" disabled={pending}>
              {pending ? "Gemmer…" : "Gem"}
            </button>
            <button
              className="btn ghost danger"
              formAction={removeBudgetItemAction}
              type="submit"
              onClick={(e) => {
                if (!confirm(`Slet “${item.name}”?`)) e.preventDefault();
              }}
            >
              Slet
            </button>
          </div>
          {state.error && (
            <p className="text-[12px] col-span-2" style={{ color: "var(--danger)" }}>
              {state.error}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
