"use client";

import { useActionState } from "react";
import { addMeasurementAction, removeMeasurementAction, type FormState } from "@/lib/actions/pensionMeasurements";
import { MoneyField } from "@/components/ui/MoneyField";
import { historicalAverageReturn } from "@/lib/finance/pension";
import { fmtKr, fmtPct, fmtDate } from "@/lib/finance/format";
import { LineAreaChart } from "@/components/charts/LineAreaChart";
import { Stat } from "@/components/ui/Stat";
import type { PensionMeasurement } from "@/lib/types";

const initialState: FormState = {};
const today = () => new Date().toISOString().slice(0, 10);

function axisDate(ts: number) {
  return new Date(ts).toLocaleDateString("da-DK", { month: "short", year: "2-digit" });
}

export function PensionHistoryCard({ personId, personName, measurements, color }: { personId: string; personName: string; measurements: PensionMeasurement[]; color: string }) {
  const [state, formAction, pending] = useActionState(addMeasurementAction, initialState);
  const sorted = [...measurements].sort((a, b) => a.measured_on.localeCompare(b.measured_on));
  const hist = historicalAverageReturn(sorted.map((m) => m.return_pct));
  const latest = sorted[sorted.length - 1];

  const chartData = sorted.map((m) => ({ ts: new Date(m.measured_on).getTime(), value: Number(m.total_value) }));

  return (
    <div className="card">
      <h3>Historik — {personName}</h3>
      <p className="cap">Løbende målinger af pensionsformuen og det opnåede afkast, aflæst fra pensionsselskabets egen opgørelse.</p>

      {sorted.length === 0 ? (
        <div className="empty">Ingen målinger endnu for {personName}.</div>
      ) : (
        <>
          <div className="grid cols-3 gap-3 mb-4">
            <Stat label="Seneste måling" value={fmtKr(latest.total_value)} hint={fmtDate(latest.measured_on)} />
            <Stat
              label="Historisk afkast (geo. snit)"
              value={hist.avgPct == null ? "–" : fmtPct(hist.avgPct)}
              hint={hist.count ? `baseret på ${hist.count} måling${hist.count === 1 ? "" : "er"}` : "ingen afkast indtastet endnu"}
              color={hist.avgPct != null ? "var(--grow)" : undefined}
            />
            <Stat label="Antal målinger" value={String(sorted.length)} />
          </div>

          {chartData.length >= 2 && (
            <div className="mb-4">
              <LineAreaChart
                data={chartData as unknown as Record<string, number>[]}
                series={[{ key: "value", name: "Pensionsværdi", stroke: color, fill: color, fillOp: 0.16 }]}
                xKey="ts"
                xFmt={axisDate}
                height={220}
              />
            </div>
          )}

          {hist.avgPct != null && (
            <p className="note mb-4">
              I gennemsnit har {personName} historisk fået {fmtPct(hist.avgPct)} i årligt afkast. Det kan bruges som pejlemærke for
              &quot;Forventet årligt afkast&quot; på ordningerne herover — men husk at fortiden ikke er en garanti for fremtiden.
            </p>
          )}

          <table className="tbl mb-3">
            <thead>
              <tr>
                <th>Dato</th>
                <th>Pensionsværdi</th>
                <th>Afkast</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {[...sorted].reverse().map((m) => (
                <tr key={m.id}>
                  <td>{fmtDate(m.measured_on)}</td>
                  <td className="num">{fmtKr(m.total_value)}</td>
                  <td className="num">{m.return_pct == null ? "–" : fmtPct(m.return_pct)}</td>
                  <td style={{ textAlign: "right" }}>
                    <form action={removeMeasurementAction} style={{ display: "inline" }}>
                      <input type="hidden" name="id" value={m.id} />
                      <button
                        className="btn ghost danger tiny"
                        type="submit"
                        onClick={(e) => {
                          if (!confirm(`Slet målingen fra ${fmtDate(m.measured_on)}?`)) e.preventDefault();
                        }}
                      >
                        Slet
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <details>
        <summary className="btn ghost tiny" style={{ display: "inline-flex", cursor: "pointer" }}>
          + Tilføj måling
        </summary>
        <form action={formAction} className="grid gap-3 cols-2 mt-3">
          <input type="hidden" name="person_id" value={personId} />
          <div className="field">
            <label htmlFor={`meas-date-${personId}`}>Dato</label>
            <input className="input" id={`meas-date-${personId}`} name="measured_on" type="date" defaultValue={today()} max={today()} required />
          </div>
          <MoneyField label="Samlet pensionsværdi" name="total_value" defaultValue={0} />
          <div className="field">
            <label htmlFor={`meas-ret-${personId}`}>Opnået afkast (valgfrit)</label>
            <div className="relative">
              <input className="input pr-9" id={`meas-ret-${personId}`} name="return_pct" type="number" step={0.1} placeholder="Fx 6,2" />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px] pointer-events-none" style={{ color: "var(--faint)" }}>
                %
              </span>
            </div>
          </div>
          <div className="flex items-end">
            <button className="btn" type="submit" disabled={pending}>
              {pending ? "Tilføjer…" : "+ Tilføj måling"}
            </button>
          </div>
        </form>
        <p className="note mt-2">
          Afkastet er det din pensionsudbyder selv rapporterer (fx &quot;afkast i år: 6,2%&quot; i deres app) — ikke noget appen udregner
          ud fra værdiændringen, da det ikke kan skelnes fra nye indbetalinger.
        </p>
        {state.error && (
          <p className="text-[12px] mt-2" style={{ color: "var(--danger)" }}>
            {state.error}
          </p>
        )}
      </details>
    </div>
  );
}
