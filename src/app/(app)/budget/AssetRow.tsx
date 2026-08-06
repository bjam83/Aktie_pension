"use client";

import { useActionState, useState } from "react";
import { updateAssetAction, removeAssetAction, type FormState } from "@/lib/actions/budget";
import { SelectField, TextField } from "@/components/ui/Field";
import { MoneyField } from "@/components/ui/MoneyField";
import { ASSET_KIND_OPTIONS, labelFor } from "@/lib/constants";
import { fmtKr, fmtPct } from "@/lib/finance/format";
import type { Asset, Person } from "@/lib/types";

const initialState: FormState = {};

export function AssetRow({ asset, persons }: { asset: Asset; persons: Person[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(updateAssetAction, initialState);

  return (
    <div style={{ borderBottom: "1px solid var(--line)", padding: "8px 0" }}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px]">
          {asset.name} <span style={{ color: "var(--faint)" }}>· {labelFor(ASSET_KIND_OPTIONS, asset.kind)}</span>
          {asset.growth_rate_pct !== 0 && (
            <span style={{ color: asset.growth_rate_pct > 0 ? "var(--grow)" : "var(--real)" }}> · {fmtPct(asset.growth_rate_pct)}/år</span>
          )}
        </span>
        <div className="flex items-center gap-2">
          <span className="num text-[13px]">{fmtKr(asset.value)}</span>
          <button className="btn ghost tiny" onClick={() => setOpen((v) => !v)} type="button">
            {open ? "Luk" : "Rediger"}
          </button>
        </div>
      </div>
      {open && (
        <form action={formAction} className="grid gap-3 cols-2 mt-3">
          <input type="hidden" name="id" value={asset.id} />
          <TextField label="Navn" name="name" defaultValue={asset.name} required />
          <SelectField label="Type" name="kind" defaultValue={asset.kind} options={ASSET_KIND_OPTIONS} />
          <MoneyField label="Værdi" name="value" defaultValue={asset.value} />
          <div className="field">
            <label htmlFor={`growth-${asset.id}`}>Årlig værdiudvikling</label>
            <div className="relative">
              <input className="input pr-9" id={`growth-${asset.id}`} name="growth_rate_pct" type="number" step={0.1} defaultValue={asset.growth_rate_pct} />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px] pointer-events-none" style={{ color: "var(--faint)" }}>
                %
              </span>
            </div>
          </div>
          <SelectField
            label="Ejer"
            name="owner_id"
            defaultValue={asset.owner_ids?.[0] ?? ""}
            options={[{ value: "", label: "Fælles" }, ...persons.map((p) => ({ value: p.id, label: p.name }))]}
          />
          <div className="flex items-end gap-2 col-span-2">
            <button className="btn" type="submit" disabled={pending}>
              {pending ? "Gemmer…" : "Gem"}
            </button>
            <button
              className="btn ghost danger"
              formAction={removeAssetAction}
              type="submit"
              onClick={(e) => {
                if (!confirm(`Slet “${asset.name}”?`)) e.preventDefault();
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
