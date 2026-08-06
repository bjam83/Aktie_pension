import { redirect } from "next/navigation";
import { getHouseholdBundle, getInvestmentAccounts } from "@/lib/data";
import { fmtKr } from "@/lib/finance/format";
import { simulateFreeFunds, type FreeFundsResult } from "@/lib/finance/freeFunds";
import { personColor, personColorSoft } from "@/lib/constants";
import { Stat } from "@/components/ui/Stat";
import { LineAreaChart } from "@/components/charts/LineAreaChart";
import { AddAccountForm } from "./AddAccountForm";
import { AccountRow } from "./AccountRow";

export default async function FrieMidlerPage() {
  const bundle = await getHouseholdBundle();
  if (!bundle) redirect("/login");
  const { persons, assumptions } = bundle;
  const accounts = await getInvestmentAccounts();

  const personName = (id: string | null) => persons.find((p) => p.id === id)?.name;

  const accountSims: { account: (typeof accounts)[number]; sim: FreeFundsResult }[] = accounts.map((acc) => ({
    account: acc,
    sim: simulateFreeFunds(
      {
        lump: Number(acc.current_value),
        monthly: Number(acc.monthly_contribution),
        ret: Number(acc.expected_return_pct),
        years: Number(acc.projection_years),
        tax: acc.kind === "aktiesparekonto" ? "ask" : "depot",
      },
      assumptions,
      assumptions.inflation_rate
    ),
  }));

  const totalCurrentValue = accounts.reduce((s, a) => s + Number(a.current_value), 0);
  const totalProjected = accountSims.reduce((s, a) => s + a.sim.finalNominal, 0);
  const totalTax = accountSims.reduce((s, a) => s + a.sim.taxPaid, 0);

  const horizonYears = Math.max(0, ...accountSims.map((a) => a.sim.years));
  const currentYear = new Date().getFullYear();
  const combinedChartData =
    horizonYears >= 1
      ? Array.from({ length: horizonYears + 1 }, (_, k) => {
          const row: Record<string, number> = { year: currentYear + k };
          accountSims.forEach((a) => {
            const idx = Math.min(k, a.sim.series.length - 1);
            row[a.account.id] = a.sim.series[idx]?.nominal ?? a.sim.finalNominal;
          });
          return row;
        })
      : [];
  const combinedChartSeries = accountSims.map((a, i) => ({
    key: a.account.id,
    name: a.account.name,
    stroke: personColor(i),
    fill: personColorSoft(i),
    fillOp: 0.85,
  }));

  return (
    <div className="grid gap-[18px]">
      <div className="note">
        Opret flere konti efter behov — fx en aktiesparekonto (flad ASK-skat, loft på indskud) og en klassisk beskattet depot
        (aktieindkomstskat, progressiv). Hver konto fremskrives simpelt ud fra startværdi, månedlig indbetaling og forventet afkast —
        uden opslag mod faktiske kurser.
      </div>

      {accounts.length > 0 && (
        <>
          <div className="grid stats-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
            <Stat label="Samlet startværdi" value={fmtKr(totalCurrentValue)} color="var(--grow)" />
            <Stat label="Forventet værdi (fremskrevet)" value={fmtKr(totalProjected)} color="var(--real)" />
            <Stat label="Skat undervejs" value={fmtKr(totalTax)} color="var(--muted)" />
          </div>

          {combinedChartData.length >= 2 && (
            <div className="card">
              <h3>Udvikling pr. konto</h3>
              <p className="cap">Hver konto fremskrives med sin egen indbetaling, afkast og beskatning.</p>
              <LineAreaChart data={combinedChartData} series={combinedChartSeries} xKey="year" height={300} />
            </div>
          )}
        </>
      )}

      {accounts.length === 0 && <div className="empty">Ingen konti endnu — tilføj den første nedenfor.</div>}

      {accountSims.map(({ account: acc, sim }) => {
        const owner = personName(acc.person_id);
        return (
          <div key={acc.id} className="card">
            <AccountRow account={acc} persons={persons} owner={owner} />
            <div className="grid stats-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
              <Stat label="Startværdi" value={fmtKr(acc.current_value)} color="var(--grow)" />
              <Stat label={`Om ${acc.projection_years} år`} value={fmtKr(sim.finalNominal)} color="var(--real)" />
              <Stat label="Skat undervejs" value={fmtKr(sim.taxPaid)} color="var(--muted)" />
            </div>
          </div>
        );
      })}

      <AddAccountForm persons={persons} />
    </div>
  );
}
