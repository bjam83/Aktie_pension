"use client";

import { useActionState, useState } from "react";
import { updateFundAction, removeFundAction, addFundReturnAction, fetchFundReturnsAction, type FormState } from "@/lib/actions/pensionFunds";
import { TextField } from "@/components/ui/Field";
import { PercentField } from "@/components/ui/PercentField";
import { fmtPct } from "@/lib/finance/format";
import { FundReturnRow } from "./FundReturnRow";
import type { PensionFundReturn, PensionSchemeFund } from "@/lib/types";

const initialState: FormState = {};
const currentYear = new Date().getFullYear();

export function FundCard({ fund, returns, color }: { fund: PensionSchemeFund; returns: PensionFundReturn[]; color: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(updateFundAction, initialState);
  const [addState, addFormAction, addPending] = useActionState(addFundReturnAction, initialState);
  const [fetchState, fetchFormAction, fetchPending] = useActionState(fetchFundReturnsAction, initialState);

  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    if (!state.error) setOpen(false);
  }

  const sorted = [...returns].sort((a, b) => b.year - a.year);

  return (
    <div className="card">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="dot" style={{ background: color }} />
          <div>
            <h3 style={{ margin: 0 }}>{fund.name}</h3>
            <p className="cap" style={{ margin: "2px 0 0" }}>{fmtPct(fund.allocation_pct, 0)} af ordningen</p>
          </div>
        </div>
        <button className="btn ghost tiny" onClick={() => setOpen((v) => !v)} type="button">
          {open ? "Luk" : "Rediger"}
        </button>
      </div>

      {open && (
        <form action={formAction} className="grid gap-3 cols-2 mt-3">
          <input type="hidden" name="id" value={fund.id} />
          <TextField label="Navn" name="name" defaultValue={fund.name} required />
          <PercentField label="Andel af ordningen" name="allocation_pct" id={`fund-alloc-${fund.id}`} defaultValue={fund.allocation_pct} />
          <div className="col-span-2">
            <TextField
              label="Link til fondens side (valgfrit)"
              name="source_url"
              defaultValue={fund.source_url}
              placeholder="https://appension.fondliste.dk/..."
            />
          </div>
          <div className="flex items-end gap-2 col-span-2">
            <button className="btn" type="submit" disabled={pending}>
              {pending ? "Gemmer…" : "Gem"}
            </button>
            <button
              className="btn ghost danger"
              formAction={removeFundAction}
              type="submit"
              onClick={(e) => {
                if (!confirm(`Slet fonden “${fund.name}”?`)) e.preventDefault();
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

      {sorted.length === 0 ? (
        <div className="empty mt-3">Ingen afkast indtastet endnu for {fund.name}.</div>
      ) : (
        <table className="tbl mt-3">
          <thead>
            <tr>
              <th>År</th>
              <th>Afkast</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <FundReturnRow key={r.id} fundReturn={r} />
            ))}
          </tbody>
        </table>
      )}

      <div className="mt-2">
        {fund.source_url ? (
          <form action={fetchFormAction} style={{ display: "inline" }}>
            <input type="hidden" name="fund_id" value={fund.id} />
            <button className="btn ghost tiny" type="submit" disabled={fetchPending}>
              {fetchPending ? "Henter…" : "Hent afkast"}
            </button>
          </form>
        ) : (
          <p className="cap" style={{ margin: 0 }}>Tilføj et link til fondens side under Rediger for at hente afkast automatisk.</p>
        )}
        {fund.source_url && <p className="cap" style={{ margin: "4px 0 0" }}>Overskriver eksisterende tal for de år der findes på siden.</p>}
        {fetchState.error && (
          <p className="text-[12px] mt-2" style={{ color: "var(--danger)" }}>
            {fetchState.error}
          </p>
        )}
      </div>

      <details className="mt-2">
        <summary className="btn ghost tiny" style={{ display: "inline-flex", cursor: "pointer" }}>
          + Tilføj afkast
        </summary>
        <form action={addFormAction} className="grid gap-3 cols-2 mt-3">
          <input type="hidden" name="fund_id" value={fund.id} />
          <div className="field">
            <label htmlFor={`fund-newret-year-${fund.id}`}>År</label>
            <input
              className="input"
              id={`fund-newret-year-${fund.id}`}
              name="year"
              type="number"
              min={2000}
              max={2100}
              defaultValue={currentYear}
              required
            />
          </div>
          <PercentField label="Afkast" name="return_pct" id={`fund-newret-pct-${fund.id}`} placeholder="Fx 6,2" />
          <div className="flex items-end">
            <button className="btn" type="submit" disabled={addPending}>
              {addPending ? "Tilføjer…" : "+ Tilføj afkast"}
            </button>
          </div>
        </form>
        {addState.error && (
          <p className="text-[12px] mt-2" style={{ color: "var(--danger)" }}>
            {addState.error}
          </p>
        )}
      </details>
    </div>
  );
}
