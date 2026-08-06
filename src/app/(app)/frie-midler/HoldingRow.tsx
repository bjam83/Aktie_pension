"use client";

import { useActionState, useState } from "react";
import { updateHoldingAction, removeHoldingAction, refreshHoldingPriceAction, type FormState, type RefreshState } from "@/lib/actions/investments";
import { SelectField, TextField } from "@/components/ui/Field";
import { MoneyField } from "@/components/ui/MoneyField";
import { INSTRUMENT_TYPE_OPTIONS, labelFor } from "@/lib/constants";
import { fmtKr, fmtPct, fmtDate } from "@/lib/finance/format";
import { holdingPrice, holdingReturn } from "@/lib/finance/holdings";
import type { Holding } from "@/lib/types";

const initialForm: FormState = {};
const initialRefresh: RefreshState = {};

export function HoldingRow({ holding }: { holding: Holding }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(updateHoldingAction, initialForm);
  const [refreshState, refreshAction, refreshing] = useActionState(refreshHoldingPriceAction, initialRefresh);

  const price = holdingPrice(holding);
  const ret = holdingReturn(holding);

  return (
    <>
      <tr>
        <td>
          <button className="btn ghost tiny" onClick={() => setOpen((v) => !v)} type="button">
            {open ? "Luk" : "Rediger"}
          </button>
        </td>
        <td>
          <div>{holding.name}</div>
          <div className="text-[11px]" style={{ color: "var(--faint)" }}>
            {labelFor(INSTRUMENT_TYPE_OPTIONS, holding.instrument_type)}
            {holding.ticker ? ` · ${holding.ticker}` : ""}
          </div>
        </td>
        <td>{holding.quantity}</td>
        <td>{fmtKr(price)}{holding.price_source === "manual" && <span className="text-[10px]" style={{ color: "var(--faint)" }}> (manuel)</span>}</td>
        <td>{fmtKr(ret.marketValue)}</td>
        <td style={{ color: ret.gain >= 0 ? "var(--grow)" : "var(--real)", fontWeight: 600 }}>
          {ret.gainPct == null ? "–" : `${ret.gain >= 0 ? "+" : ""}${fmtKr(ret.gain)} (${fmtPct(ret.gainPct)})`}
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={6}>
            <div className="card" style={{ background: "var(--paper)" }}>
              <form action={formAction} className="grid gap-3 cols-2">
                <input type="hidden" name="id" value={holding.id} />
                <TextField label="Navn" name="name" defaultValue={holding.name} required />
                <SelectField label="Type" name="instrument_type" defaultValue={holding.instrument_type} options={INSTRUMENT_TYPE_OPTIONS} />
                <TextField label="Ticker (Stooq-format, fx AAPL.US)" name="ticker" defaultValue={holding.ticker} placeholder="AAPL.US" />
                <TextField label="ISIN" name="isin" defaultValue={holding.isin} />
                <Field label="Antal" name="quantity" defaultValue={holding.quantity} step={0.0001} />
                <MoneyField label="Gns. kostpris pr. stk." name="avg_cost_price" defaultValue={holding.avg_cost_price} />
                <MoneyField label="Manuel kurs pr. stk. (fallback)" name="manual_price" defaultValue={holding.manual_price ?? ""} />
                <SelectField
                  label="Kursvalg"
                  name="price_source"
                  defaultValue={holding.price_source}
                  options={[
                    { value: "auto", label: "Automatisk hentet kurs" },
                    { value: "manual", label: "Manuel kurs" },
                  ]}
                />
                <div className="flex items-end gap-2 col-span-2">
                  <button className="btn" type="submit" disabled={pending}>
                    {pending ? "Gemmer…" : "Gem"}
                  </button>
                  <button className="btn ghost" formAction={refreshAction} type="submit" disabled={refreshing || !holding.ticker}>
                    {refreshing ? "Henter kurs…" : "Opdater kurs"}
                  </button>
                  <button
                    className="btn ghost danger"
                    formAction={removeHoldingAction}
                    type="submit"
                    onClick={(e) => {
                      if (!confirm(`Slet “${holding.name}”?`)) e.preventDefault();
                    }}
                  >
                    Slet
                  </button>
                </div>
              </form>
              {state.error && (
                <p className="text-[12px] mt-2" style={{ color: "var(--danger)" }}>
                  {state.error}
                </p>
              )}
              {refreshState.error && (
                <p className="text-[12px] mt-2" style={{ color: "var(--danger)" }}>
                  {refreshState.error}
                </p>
              )}
              {refreshState.ok && (
                <p className="text-[12px] mt-2" style={{ color: "var(--grow)" }}>
                  Kurs opdateret.
                </p>
              )}
              {holding.last_price_at && (
                <p className="text-[11px] mt-2" style={{ color: "var(--faint)" }}>
                  Senest hentet kurs: {fmtKr(holding.last_price)} ({fmtDate(holding.last_price_at)})
                </p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// local minimal numeric field (kept out of shared Field to allow step=0.0001 without prop bloat)
function Field({ label, name, defaultValue, step }: { label: string; name: string; defaultValue?: number | string | null; step?: number }) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input className="input" id={name} name={name} type="number" step={step ?? 1} defaultValue={defaultValue ?? undefined} />
    </div>
  );
}
