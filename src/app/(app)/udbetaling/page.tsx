import { redirect } from "next/navigation";
import { getHouseholdBundle, getPensionSchemes, getInvestmentAccounts, getIncomeStreams } from "@/lib/data";
import { ageFromBirthDate, projectScheme, schemeReturnPct, estimateFolkepension } from "@/lib/finance/pension";
import { simulateMultiPayout, type PayoutStreamInput } from "@/lib/finance/payout";
import { simulateFreeFunds } from "@/lib/finance/freeFunds";
import { fmtKr, fmtPct } from "@/lib/finance/format";
import { personColor, personColorSoft, toMonthly } from "@/lib/constants";
import { Stat } from "@/components/ui/Stat";
import { LineAreaChart } from "@/components/charts/LineAreaChart";
import type { PayoutConfig } from "@/lib/types";
import { PayoutPersonForm } from "./PayoutPersonForm";
import { ReverseRetirementCalculator } from "./ReverseRetirementCalculator";

const DEFAULT_PAYOUT: PayoutConfig = { years: 15, ret: 3, otherIncome: 0 };

/** Udbetalingslængde pr. ordningstype: ratepension har sin egen (10-25 år), livrente er livsvarig
 *  (forenklet som 80 år minus udbetalingsstart), resten falder tilbage til personens generelle valg. */
function streamYears(schemeType: string, payoutYears: number | null, retirementAge: number, fallbackYears: number): number {
  if (schemeType === "ratepension") return Math.min(25, Math.max(10, payoutYears ?? 15));
  if (schemeType === "livrente") return Math.max(1, 80 - retirementAge);
  return fallbackYears;
}

export default async function UdbetalingPage() {
  const bundle = await getHouseholdBundle();
  if (!bundle) redirect("/login");
  const { persons, assumptions, planningSettings } = bundle;
  const [schemes, accounts, incomeStreams] = await Promise.all([getPensionSchemes(), getInvestmentAccounts(), getIncomeStreams()]);
  const payoutByPerson = (planningSettings.payout as unknown as Record<string, PayoutConfig>) || {};

  // Frie midler er fælles for husstanden og lægges ind under den primære persons udbetaling.
  const primary = persons.find((p) => p.is_primary) ?? persons[0];

  return (
    <div className="grid gap-[18px]">
      {persons.map((p, i) => {
        const personSchemes = schemes.filter((s) => s.person_id === p.id);
        const ageNow = ageFromBirthDate(p.birth_date, 40);
        const cfg = payoutByPerson[p.id] ?? DEFAULT_PAYOUT;
        const isPrimary = p.id === primary?.id;

        const streams: PayoutStreamInput[] = personSchemes.map((s) => {
          const proj = projectScheme(
            { id: s.id, personId: p.id, name: s.name, currentValue: Number(s.current_value), monthlyContribution: Number(s.monthly_contribution), returnPct: schemeReturnPct(s), ageNow, ageRetire: p.retirement_age },
            assumptions.pal_rate,
            assumptions.inflation_rate
          );
          return {
            key: s.id,
            label: s.name,
            pot: proj.finalNominal,
            years: streamYears(s.scheme_type, s.payout_years, p.retirement_age, cfg.years),
            taxFree: s.scheme_type === "aldersopsparing",
          };
        });

        let frieMidlerPot = 0;
        if (isPrimary && accounts.length > 0) {
          const yearsToRetirement = Math.max(0, p.retirement_age - ageNow);
          frieMidlerPot = accounts.reduce((sum, acc) => {
            const sim = simulateFreeFunds(
              {
                lump: Number(acc.current_value),
                monthly: Number(acc.monthly_contribution),
                ret: Number(acc.expected_return_pct),
                years: yearsToRetirement,
                tax: acc.kind === "aktiesparekonto" ? "ask" : "depot",
              },
              assumptions,
              assumptions.inflation_rate
            );
            return sum + sim.finalNominal;
          }, 0);
          if (frieMidlerPot > 0) {
            streams.push({ key: "frie-midler", label: "Frie midler", pot: frieMidlerPot, years: cfg.years, taxFree: true });
          }
        }

        const payout = streams.length ? simulateMultiPayout(streams, cfg.ret, cfg.otherIncome, assumptions.pal_rate, p.retirement_age, assumptions) : null;
        const fp = estimateFolkepension(p.retirement_age);
        const livrenteStream = streams.find((s) => personSchemes.find((sc) => sc.id === s.key)?.scheme_type === "livrente");

        const nettoLoenMonthly = incomeStreams
          .filter((inc) => inc.person_id === p.id && inc.kind === "løn")
          .reduce((s, inc) => s + toMonthly(Number(inc.amount), inc.frequency), 0);
        const payoutVsLoen = nettoLoenMonthly > 0 && payout ? (payout.netMonthly / nettoLoenMonthly) * 100 : null;

        const breakdownSeries = payout
          ? payout.streams.map((s, idx) => ({ key: s.key, name: s.label, stroke: personColor(idx), fill: personColorSoft(idx), fillOp: 0.85 }))
          : [];

        return (
          <div key={p.id} className="grid gap-3">
            <div className="flex items-center gap-2">
              <span className="dot" style={{ background: personColor(i) }} />
              <h3 style={{ margin: 0, fontFamily: "var(--font-display)" }}>{p.name} — udbetaling fra {p.retirement_age} år</h3>
            </div>

            <div className="card">
              <PayoutPersonForm personId={p.id} cfg={cfg} />
              <p className="note mt-2">
                Ratepension bruger sin egen udbetalingslængde (sæt under fanen Pension). Livrente er livsvarig og beregnes som opsparing ÷
                (80 år − udbetalingsstart), justeret for afkast{livrenteStream ? ` — i alt ${livrenteStream.years} år` : ""}.
                {isPrimary && frieMidlerPot > 0 ? " Frie midler er fælles for husstanden og er lagt ind her, udbetalt over samme antal år." : ""}{" "}
                Feltet &quot;Udbetalingsår&quot; herover gælder aldersopsparing, frie midler, arbejdsmarkedspension og andre ordninger.
              </p>
            </div>

            {!payout ? (
              <div className="empty">Ingen pensionsordninger eller frie midler for {p.name} endnu.</div>
            ) : (
              <>
                <div className="grid stats-grid" style={{ gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                  <Stat label="Formue til udbetaling" value={fmtKr(payout.pot)} color="var(--grow)" />
                  <Stat label="Månedlig udbetaling (netto)" value={fmtKr(payout.netMonthly)} color="var(--real)" />
                  <Stat label="Skat af udbetaling" value={fmtKr(payout.taxOnPayout)} hint={`${(payout.effRate * 100).toFixed(1)}% effektiv`} />
                  <Stat label="Folkepension (netto est.)" value={fmtKr(fp.net)} hint={fp.note} color="var(--muted)" />
                </div>

                <div className="card">
                  <h3>Sammenlignet med nuværende nettoløn</h3>
                  {nettoLoenMonthly > 0 ? (
                    <div className="grid cols-3 gap-3">
                      <Stat label="Nuværende nettoløn" value={fmtKr(nettoLoenMonthly)} hint="pr. måned, fra Budget" />
                      <Stat label="Forventet udbetaling" value={fmtKr(payout.netMonthly)} hint="netto pr. måned, ved pension" color="var(--real)" />
                      <Stat
                        label="Andel af nuværende løn"
                        value={payoutVsLoen == null ? "–" : fmtPct(payoutVsLoen, 0)}
                        color={payoutVsLoen != null && payoutVsLoen >= 80 ? "var(--grow)" : "var(--amber)"}
                      />
                    </div>
                  ) : (
                    <div className="empty">Registrér {p.name}s nettoløn under Budget → Indkomstkilder for at se sammenligningen.</div>
                  )}
                </div>

                <div className="card">
                  <h3>Årlig udbetaling pr. kilde</h3>
                  <p className="cap">Nettobeløb pr. år — viser hvor udbetalingen kommer fra, og hvordan den ændrer sig når kortere ordninger stopper.</p>
                  <LineAreaChart data={payout.breakdown as unknown as Record<string, number>[]} series={breakdownSeries} xKey="age" height={280} />
                </div>

                <div className="card">
                  <h3>Udbetaling pr. ordning (år 1)</h3>
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Ordning</th>
                        <th>Varighed</th>
                        <th>Årlig bruttoudbetaling</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payout.streams.map((s) => (
                        <tr key={s.key}>
                          <td>
                            {s.label}
                            {s.taxFree && <span className="chip" style={{ marginLeft: 6 }}>Skattefri</span>}
                          </td>
                          <td>{s.years} år</td>
                          <td>{fmtKr(s.grossAnnual)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="card">
                  <h3>Udbetalingsforløb</h3>
                  <p className="cap">Resterende formue vs. akkumuleret nettoudbetaling — ordninger med kortere varighed stopper undervejs.</p>
                  <LineAreaChart
                    data={payout.series as unknown as Record<string, number>[]}
                    series={[
                      { key: "remaining", name: "Resterende formue", stroke: "var(--grow)", fill: "var(--grow-soft)", fillOp: 0.6 },
                      { key: "cumNet", name: "Udbetalt (netto, akkumuleret)", stroke: "var(--real)", width: 2.2 },
                    ]}
                    xKey="age"
                  />
                </div>

                <ReverseRetirementCalculator
                  schemes={personSchemes.map((s) => ({
                    currentValue: Number(s.current_value),
                    monthlyContribution: Number(s.monthly_contribution),
                    returnPct: schemeReturnPct(s),
                    isTaxFree: s.scheme_type === "aldersopsparing",
                  }))}
                  ageNow={ageNow}
                  palRatePct={assumptions.pal_rate}
                  inflationRatePct={assumptions.inflation_rate}
                  payoutYears={cfg.years}
                  payoutRet={cfg.ret}
                  otherIncome={cfg.otherIncome}
                  assumptions={assumptions}
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
