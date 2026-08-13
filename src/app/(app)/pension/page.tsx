import { redirect } from "next/navigation";
import { getHouseholdBundle, getPensionSchemes, getPensionMeasurements, getPensionSchemeFunds, getPensionFundReturns } from "@/lib/data";
import { ageFromBirthDate, projectHousehold, schemeReturnPct, type SchemeCalcInput } from "@/lib/finance/pension";
import { fmtKr } from "@/lib/finance/format";
import { personColor, personColorSoft } from "@/lib/constants";
import { Stat } from "@/components/ui/Stat";
import { LineAreaChart } from "@/components/charts/LineAreaChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { SchemeCard } from "./SchemeCard";
import { AddSchemeForm } from "./AddSchemeForm";
import { PersonPensionHeader } from "./PersonPensionHeader";
import { PensionHistoryCard } from "./PensionHistoryCard";
import { FundAllocationCard } from "./FundAllocationCard";
import { RefreshAllFundsButton } from "./RefreshAllFundsButton";
import type { PensionFundReturn } from "@/lib/types";

export default async function PensionPage() {
  const bundle = await getHouseholdBundle();
  if (!bundle) redirect("/login");
  const { persons, assumptions } = bundle;
  const [schemes, measurements, schemeFunds, fundReturns] = await Promise.all([
    getPensionSchemes(),
    getPensionMeasurements(),
    getPensionSchemeFunds(),
    getPensionFundReturns(),
  ]);

  const fundsByScheme = new Map<string, typeof schemeFunds>();
  schemeFunds.forEach((f) => {
    const list = fundsByScheme.get(f.scheme_id) ?? [];
    list.push(f);
    fundsByScheme.set(f.scheme_id, list);
  });
  const returnsByFund = new Map<string, PensionFundReturn[]>();
  fundReturns.forEach((r) => {
    const list = returnsByFund.get(r.fund_id) ?? [];
    list.push(r);
    returnsByFund.set(r.fund_id, list);
  });

  const calcInputs: SchemeCalcInput[] = schemes.map((s) => {
    const person = persons.find((p) => p.id === s.person_id);
    return {
      id: s.id,
      personId: s.person_id,
      name: s.name,
      currentValue: Number(s.current_value),
      monthlyContribution: Number(s.monthly_contribution),
      returnPct: schemeReturnPct(s),
      ageNow: person ? ageFromBirthDate(person.birth_date, 40) : 40,
      ageRetire: person?.retirement_age ?? 68,
    };
  });

  const proj = calcInputs.length ? projectHousehold(calcInputs, assumptions.pal_rate, assumptions.inflation_rate) : null;

  const chartData = proj
    ? proj.series.map((y) => {
        const row: Record<string, number> = { year: y.year, real: y.real };
        persons.forEach((p) => (row[p.id] = y.byPerson[p.id] || 0));
        return row;
      })
    : [];
  const chartSeries = [
    ...persons.map((p, i) => ({ key: p.id, name: p.name, stroke: personColor(i), fill: personColorSoft(i), fillOp: 0.85 })),
    { key: "real", name: "Nutidsværdi", stroke: "var(--real)", width: 2.4, dashed: true },
  ];

  const composition = proj
    ? [
        { name: "Startværdi + indbetalinger", value: Math.max(0, proj.totals.totalPrincipal), color: "var(--indbetalt)" },
        { name: "Afkast efter PAL", value: Math.max(0, proj.totals.totalReturn), color: "var(--grow)" },
      ]
    : [];

  const schemesByPerson = new Map<string, typeof schemes>();
  schemes.forEach((s) => {
    const list = schemesByPerson.get(s.person_id) ?? [];
    list.push(s);
    schemesByPerson.set(s.person_id, list);
  });

  return (
    <div className="grid gap-[18px]">
      {proj && (
        <>
          <div className="grid stats-grid" style={{ gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
            <Stat label="Formue ved pension" value={fmtKr(proj.totals.finalNominal)} hint="nominelt, samlet husstand" color="var(--grow)" />
            <Stat label="I nutidskroner" value={fmtKr(proj.totals.finalReal)} hint="købekraft i dag" color="var(--real)" />
            <Stat label="Samlet afkast efter PAL" value={fmtKr(proj.totals.totalReturn)} hint={`over ${proj.horizonYears} år`} />
            <Stat label="Betalt PAL-skat" value={fmtKr(proj.totals.palPaid)} hint="akkumuleret" color="var(--muted)" />
          </div>

          <div className="card">
            <h3>Fremskrivning til pension</h3>
            <p className="cap">Areal = værdi pr. person (nominelt) · stiplet linje = samlet nutidsværdi efter inflation.</p>
            {chartData.length >= 2 ? (
              <LineAreaChart data={chartData} series={chartSeries} xKey="year" height={300} />
            ) : (
              <div className="empty">Tilføj mindst én ordning med indbetaling for at se fremskrivningen.</div>
            )}
          </div>

          <div className="card">
            <h3>Hvad formuen består af</h3>
            <p className="cap">Ved pension — egne indbetalinger vs. rente-på-rente efter PAL-skat.</p>
            <DonutChart data={composition} />
          </div>
        </>
      )}

      {schemeFunds.length > 0 && <RefreshAllFundsButton />}

      {persons.map((p, i) => {
        const list = schemesByPerson.get(p.id) ?? [];
        const pensionNow = list.reduce((s, sc) => s + Number(sc.current_value), 0);
        return (
          <div key={p.id} className="grid gap-3">
            <PersonPensionHeader person={p} pensionNow={pensionNow} color={personColor(i)} />
            {list.length === 0 && <div className="empty">Ingen ordninger endnu.</div>}
            <div className="grid cols-2 gap-[16px]">
              {list.map((s) => (
                <SchemeCard key={s.id} scheme={s} persons={persons} color={personColor(i)} />
              ))}
            </div>
            {list.map((s) => (
              <FundAllocationCard key={s.id} scheme={s} funds={fundsByScheme.get(s.id) ?? []} returnsByFund={returnsByFund} />
            ))}
            <PensionHistoryCard
              personId={p.id}
              personName={p.name}
              measurements={measurements.filter((m) => m.person_id === p.id)}
              color={personColor(i)}
            />
          </div>
        );
      })}

      <AddSchemeForm persons={persons} />
    </div>
  );
}
