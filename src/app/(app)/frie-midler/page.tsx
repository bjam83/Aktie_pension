import { redirect } from "next/navigation";
import { getHouseholdBundle, getInvestmentAccounts, getHoldings } from "@/lib/data";
import { fmtKr, fmtPct } from "@/lib/finance/format";
import { portfolioReturn } from "@/lib/finance/holdings";
import { simulateFreeFunds, type FreeFundsResult } from "@/lib/finance/freeFunds";
import { personColor, personColorSoft } from "@/lib/constants";
import { Stat } from "@/components/ui/Stat";
import { LineAreaChart } from "@/components/charts/LineAreaChart";
import { HoldingRow } from "./HoldingRow";
import { AddHoldingForm } from "./AddHoldingForm";
import { AddAccountForm } from "./AddAccountForm";
import { AccountRow } from "./AccountRow";

export default async function FrieMidlerPage() {
  const bundle = await getHouseholdBundle();
  if (!bundle) redirect("/login");
  const { persons, assumptions } = bundle;
  const [accounts, holdings] = await Promise.all([getInvestmentAccounts(), getHoldings()]);

  const holdingsByAccount = new Map<string, typeof holdings>();
  holdings.forEach((h) => {
    const list = holdingsByAccount.get(h.account_id) ?? [];
    list.push(h);
    holdingsByAccount.set(h.account_id, list);
  });

  const personName = (id: string | null) => persons.find((p) => p.id === id)?.name;

  const accountSims: { account: (typeof accounts)[number]; currentValue: number; sim: FreeFundsResult }[] = accounts.map((acc) => {
    const accHoldings = holdingsByAccount.get(acc.id) ?? [];
    const currentValue = portfolioReturn(accHoldings).marketValue;
    const sim = simulateFreeFunds(
      {
        lump: currentValue,
        monthly: Number(acc.monthly_contribution),
        ret: Number(acc.expected_return_pct),
        years: Number(acc.projection_years),
        tax: acc.kind === "aktiesparekonto" ? "ask" : "depot",
      },
      assumptions,
      assumptions.inflation_rate
    );
    return { account: acc, currentValue, sim };
  });

  const totalCurrentValue = accountSims.reduce((s, a) => s + a.currentValue, 0);
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
        (aktieindkomstskat, progressiv). Hver konto fremskrives med sin egen forventede indbetaling og afkast. Kurser på
        aktier/fonde hentes automatisk fra Stooq når tickeren er i Stooq-format (fx <strong>AAPL.US</strong>,{" "}
        <strong>NOVO-B.DK</strong>), ellers bruges en manuel kurs.
      </div>

      {accounts.length > 0 && (
        <>
          <div className="grid stats-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
            <Stat label="Samlet værdi i dag" value={fmtKr(totalCurrentValue)} color="var(--grow)" />
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

      {accountSims.map(({ account: acc, currentValue, sim }) => {
        const accHoldings = holdingsByAccount.get(acc.id) ?? [];
        const accReturn = portfolioReturn(accHoldings);
        const owner = personName(acc.person_id);
        return (
          <div key={acc.id} className="card">
            <AccountRow account={acc} persons={persons} owner={owner} />

            <div className="grid stats-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 14 }}>
              <Stat label="Nuværende værdi" value={fmtKr(currentValue)} color="var(--grow)" />
              <Stat label={`Om ${acc.projection_years} år`} value={fmtKr(sim.finalNominal)} color="var(--real)" />
              <Stat
                label="Afkast (nuværende beholdninger)"
                value={accReturn.gainPct == null ? "–" : `${accReturn.gain >= 0 ? "+" : ""}${fmtKr(accReturn.gain)}`}
                hint={accReturn.gainPct == null ? undefined : fmtPct(accReturn.gainPct)}
                color={accReturn.gain >= 0 ? "var(--grow)" : "var(--real)"}
              />
            </div>

            {accHoldings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Navn</th>
                      <th>Antal</th>
                      <th>Kurs</th>
                      <th>Værdi</th>
                      <th>Afkast</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accHoldings.map((h) => (
                      <HoldingRow key={h.id} holding={h} />
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4} style={{ fontWeight: 600 }}>
                        I alt
                      </td>
                      <td style={{ fontWeight: 600 }}>{fmtKr(accReturn.marketValue)}</td>
                      <td style={{ fontWeight: 600, color: accReturn.gain >= 0 ? "var(--grow)" : "var(--real)" }}>
                        {accReturn.gainPct == null ? "–" : `${accReturn.gain >= 0 ? "+" : ""}${fmtKr(accReturn.gain)} (${fmtPct(accReturn.gainPct)})`}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="empty">Ingen aktier/fonde i denne konto endnu.</div>
            )}

            <AddHoldingForm accountId={acc.id} />
          </div>
        );
      })}

      <AddAccountForm persons={persons} />
    </div>
  );
}
