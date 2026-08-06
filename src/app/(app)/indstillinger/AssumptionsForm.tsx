"use client";

import { useActionState } from "react";
import { updateAssumptionsAction, type FormState } from "@/lib/actions/assumptions";
import type { Assumptions } from "@/lib/types";

const initialState: FormState = {};

function PctField({ id, name, label, defaultValue, step = 0.1 }: { id: string; name: string; label: string; defaultValue: number; step?: number }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="relative">
        <input className="input pr-9" id={id} name={name} type="number" step={step} defaultValue={defaultValue} />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px] pointer-events-none" style={{ color: "var(--faint)" }}>
          %
        </span>
      </div>
    </div>
  );
}

function KrField({ id, name, label, defaultValue }: { id: string; name: string; label: string; defaultValue: number }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="relative">
        <input className="input pr-9" id={id} name={name} type="number" defaultValue={defaultValue} />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px] pointer-events-none" style={{ color: "var(--faint)" }}>
          kr.
        </span>
      </div>
    </div>
  );
}

export function AssumptionsForm({ a }: { a: Assumptions }) {
  const [state, formAction, pending] = useActionState(updateAssumptionsAction, initialState);

  return (
    <form action={formAction} className="grid gap-[18px]">
      <div className="card">
        <h3>Grundantagelser</h3>
        <div className="grid gap-3 cols-2">
          <PctField id="pal_rate" name="pal_rate" label="PAL-skat" defaultValue={a.pal_rate} />
          <PctField id="inflation_rate" name="inflation_rate" label="Inflation" defaultValue={a.inflation_rate} />
        </div>
      </div>

      <div className="card">
        <h3>Indkomstskat</h3>
        <div className="grid gap-3 cols-2">
          <KrField id="personfradrag" name="personfradrag" label="Personfradrag (årligt)" defaultValue={a.personfradrag} />
          <PctField id="bundskat_rate" name="bundskat_rate" label="Bundskat mv. (samlet sats)" defaultValue={a.bundskat_rate} />
          <KrField id="mellemskat_bund" name="mellemskat_bund" label="Mellemskattegrænse" defaultValue={a.mellemskat_bund} />
          <PctField id="mellemskat_rate" name="mellemskat_rate" label="Mellemskat" defaultValue={a.mellemskat_rate} />
          <KrField id="topskat_bund" name="topskat_bund" label="Topskattegrænse" defaultValue={a.topskat_bund} />
          <PctField id="topskat_rate" name="topskat_rate" label="Topskat" defaultValue={a.topskat_rate} />
        </div>
      </div>

      <div className="card">
        <h3>Frie midler</h3>
        <div className="grid gap-3 cols-2">
          <PctField id="ask_rate" name="ask_rate" label="Aktiesparekonto-skat" defaultValue={a.ask_rate} />
          <KrField id="ask_loft" name="ask_loft" label="ASK-loft" defaultValue={a.ask_loft} />
          <PctField id="aktie_lav_rate" name="aktie_lav_rate" label="Aktieindkomstskat, lav sats" defaultValue={a.aktie_lav_rate} />
          <PctField id="aktie_hoej_rate" name="aktie_hoej_rate" label="Aktieindkomstskat, høj sats" defaultValue={a.aktie_hoej_rate} />
          <KrField id="aktie_graense" name="aktie_graense" label="Progressionsgrænse (aktieindkomst)" defaultValue={a.aktie_graense} />
        </div>
      </div>

      <div>
        <button className="btn" type="submit" disabled={pending}>
          {pending ? "Gemmer…" : "Gem indstillinger"}
        </button>
        {state.error && (
          <p className="text-[12px] mt-2" style={{ color: "var(--danger)" }}>
            {state.error}
          </p>
        )}
      </div>
    </form>
  );
}
