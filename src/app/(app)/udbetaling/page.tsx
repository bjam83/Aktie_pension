import { redirect } from "next/navigation";
import { getHouseholdBundle, getPensionSchemes } from "@/lib/data";
import { ageFromBirthDate, projectScheme, schemeReturnPct, estimateFolkepension } from "@/lib/finance/pension";
import { simulatePayout } from "@/lib/finance/payout";
import { fmtKr } from "@/lib/finance/format";
import { personColor } from "@/lib/constants";
import { Stat } from "@/components/ui/Stat";
import { LineAreaChart } from "@/components/charts/LineAreaChart";
import type { PayoutConfig } from "@/lib/types";
import { PayoutPersonForm } from "./PayoutPersonForm";

const DEFAULT_PAYOUT: PayoutConfig = { potOverride: null, years: 15, ret: 3, otherIncome: 0 };

export default async function UdbetalingPage() {
  const bundle = await getHouseholdBundle();
  if (!bundle) redirect("/login");
  const { persons, assumptions, planningSettings } = bundle;
  const schemes = await getPensionSchemes();
  const payoutByPerson = (planningSettings.payout as unknown as Record<string, PayoutConfig>) || {};

  return (
    <div className="grid gap-[18px]">
      {persons.map((p, i) => {
        const personSchemes = schemes.filter((s) => s.person_id === p.id);
        const ageNow = ageFromBirthDate(p.birth_date, 40);
        let taxablePot = 0;
        let taxFreePot = 0;
        personSchemes.forEach((s) => {
          const proj = projectScheme(
            { id: s.id, personId: p.id, name: s.name, currentValue: Number(s.current_value), monthlyContribution: Number(s.monthly_contribution), returnPct: schemeReturnPct(s), ageNow, ageRetire: p.retirement_age },
            assumptions.pal_rate,
            assumptions.inflation_rate
          );
          if (s.scheme_type === "aldersopsparing") taxFreePot += proj.finalNominal;
          else taxablePot += proj.finalNominal;
        });

        const cfg = payoutByPerson[p.id] ?? DEFAULT_PAYOUT;
        const effectiveTaxable = cfg.potOverride != null ? cfg.potOverride : taxablePot;
        const payout = simulatePayout(
          { taxablePot: effectiveTaxable, taxFreePot, years: cfg.years, retPct: cfg.ret, otherIncome: cfg.otherIncome, palRatePct: assumptions.pal_rate, startAge: p.retirement_age },
          assumptions
        );
        const fp = estimateFolkepension(p.retirement_age);

        return (
          <div key={p.id} className="grid gap-3">
            <div className="flex items-center gap-2">
              <span className="dot" style={{ background: personColor(i) }} />
              <h3 style={{ margin: 0, fontFamily: "var(--font-display)" }}>{p.name} — udbetaling fra {p.retirement_age} år</h3>
            </div>

            <div className="card">
              <PayoutPersonForm personId={p.id} cfg={cfg} />
            </div>

            {personSchemes.length === 0 ? (
              <div className="empty">Ingen pensionsordninger for {p.name} endnu.</div>
            ) : (
              <>
                <div className="grid stats-grid" style={{ gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                  <Stat label="Formue til udbetaling" value={fmtKr(payout.pot)} color="var(--grow)" />
                  <Stat label="Månedlig udbetaling (netto)" value={fmtKr(payout.netMonthly)} color="var(--real)" />
                  <Stat label="Skat af udbetaling" value={fmtKr(payout.taxOnPayout)} hint={`${(payout.effRate * 100).toFixed(1)}% effektiv`} />
                  <Stat label="Folkepension (netto est.)" value={fmtKr(fp.net)} hint={fp.note} color="var(--muted)" />
                </div>

                <div className="card">
                  <h3>Udbetalingsforløb</h3>
                  <p className="cap">Resterende formue vs. akkumuleret nettoudbetaling.</p>
                  <LineAreaChart
                    data={payout.series as unknown as Record<string, number>[]}
                    series={[
                      { key: "remaining", name: "Resterende formue", stroke: "var(--grow)", fill: "var(--grow-soft)", fillOp: 0.6 },
                      { key: "cumNet", name: "Udbetalt (netto, akkumuleret)", stroke: "var(--real)", width: 2.2 },
                    ]}
                    xKey="age"
                  />
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
