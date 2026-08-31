"use client";

import { schemeReturnPct, estimateFolkepension } from "@/lib/finance/pension";
import { buildPersonPayout, DEFAULT_PAYOUT } from "@/lib/finance/payoutBuilder";
import { fmtKr, fmtPct } from "@/lib/finance/format";
import { personColor, personColorSoft, toMonthly } from "@/lib/constants";
import { Stat } from "@/components/ui/Stat";
import { LineAreaChart } from "@/components/charts/LineAreaChart";
import type { Assumptions, Person, PensionScheme, InvestmentAccount, IncomeStream, PayoutConfig, PlanningSettings } from "@/lib/types";
import { PayoutPersonForm } from "./PayoutPersonForm";
import { ReverseRetirementCalculator } from "./ReverseRetirementCalculator";
import { HOUSEHOLD_FILTER, usePersonFilter } from "@/components/layout/PersonFilterContext";

/** Undgår grimme "15.0 år" for hele tal, men viser decimal for fx livrentens restlevetid. */
function fmtYears(years: number): string {
  return Number.isInteger(Math.round(years * 10) / 10) ? `${Math.round(years)}` : years.toFixed(1);
}

export function UdbetalingBody({
  persons,
  assumptions,
  planningSettings,
  schemes,
  accounts,
  incomeStreams,
}: {
  persons: Person[];
  assumptions: Assumptions;
  planningSettings: PlanningSettings;
  schemes: PensionScheme[];
  accounts: InvestmentAccount[];
  incomeStreams: IncomeStream[];
}) {
  const { personId } = usePersonFilter();
  const filterPersonId = personId !== HOUSEHOLD_FILTER && persons.some((p) => p.id === personId) ? personId : null;
  const visiblePersons = filterPersonId === null ? persons : persons.filter((p) => p.id === filterPersonId);
  const colorFor = (id: string) => personColor(persons.findIndex((p) => p.id === id));

  const payoutByPerson = (planningSettings.payout as unknown as Record<string, PayoutConfig>) || {};

  // Frie midler er fælles for husstanden og lægges ind under den primære persons udbetaling —
  // "primær" bestemmes altid ud fra hele husstanden, uanset personfilteret.
  const primary = persons.find((p) => p.is_primary) ?? persons[0];

  return (
    <div className="grid gap-[18px]">
      {visiblePersons.map((p) => {
        const personSchemes = schemes.filter((s) => s.person_id === p.id);
        const cfg = payoutByPerson[p.id] ?? DEFAULT_PAYOUT;
        const isPrimary = p.id === primary?.id;

        const { ageNow, streams, frieMidlerPot, payout } = buildPersonPayout(p, personSchemes, accounts, isPrimary, cfg, assumptions);
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
              <span className="dot" style={{ background: colorFor(p.id) }} />
              <h3 style={{ margin: 0, fontFamily: "var(--font-display)" }}>{p.name} — udbetaling fra {p.retirement_age} år</h3>
            </div>

            <div className="card">
              <PayoutPersonForm personId={p.id} cfg={cfg} />
              <details className="note mt-2">
                <summary style={{ cursor: "pointer", fontWeight: 600, color: "var(--ink)" }}>Sådan beregnes udbetalingen</summary>
                <p style={{ margin: "8px 0 0" }}>
                  Ratepension bruger sin egen udbetalingslængde (sæt under fanen Pension). Livrente er livsvarig og beregnes som opsparing ÷
                  forventet restlevetid ved udbetalingsstart (unisex, fremadrettede levetidsforudsætninger, samme princip som
                  pensionsselskaberne bruger), justeret for afkast
                  {livrenteStream ? ` — ca. ${fmtYears(livrenteStream.years)} år, svarende til en forventet levealder på ${(p.retirement_age + livrenteStream.years).toFixed(1)} år` : ""}.
                  I virkeligheden stopper en livrente ikke selvom man lever længere end det — det udjævnes på tværs af alle forsikrede — men
                  her bruges restlevetiden som en realistisk tilnærmelse til den forventede udbetaling.
                  {isPrimary && frieMidlerPot > 0
                    ? " Frie midler er fælles for husstanden og er lagt ind her, udbetalt over samme antal år. De er ikke skattefri: afkastdelen af hver udbetaling beskattes løbende som aktieindkomst eller med ASK-satsen (der betales ikke PAL-skat, da det ligger uden for pensionsramme) — kun den del der stammer fra indbetalt kapital er skattefri at få udbetalt."
                    : ""}{" "}
                  Feltet &quot;Udbetalingsår&quot; herover gælder aldersopsparing, frie midler, arbejdsmarkedspension og andre ordninger.
                </p>
              </details>
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
                            {s.taxMode === "free" && <span className="chip" style={{ marginLeft: 6 }}>Skattefri</span>}
                            {(s.taxMode === "gains-ask" || s.taxMode === "gains-depot") && (
                              <span className="chip" style={{ marginLeft: 6 }}>{s.taxMode === "gains-ask" ? "ASK-skat" : "Aktieindkomstskat"}</span>
                            )}
                          </td>
                          <td>{fmtYears(s.years)} år</td>
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
