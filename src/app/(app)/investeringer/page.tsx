import { redirect } from "next/navigation";
import { getHouseholdBundle, getInvestmentAccounts, getHoldings } from "@/lib/data";
import { fmtKr, fmtPct } from "@/lib/finance/format";
import { portfolioReturn } from "@/lib/finance/holdings";
import { ACCOUNT_KIND_OPTIONS, labelFor } from "@/lib/constants";
import { Stat } from "@/components/ui/Stat";
import { HoldingRow } from "./HoldingRow";
import { AddHoldingForm } from "./AddHoldingForm";
import { AddAccountForm } from "./AddAccountForm";
import { RemoveAccountButton } from "./RemoveAccountButton";

export default async function InvesteringerPage() {
  const bundle = await getHouseholdBundle();
  if (!bundle) redirect("/login");
  const { persons } = bundle;
  const [accounts, holdings] = await Promise.all([getInvestmentAccounts(), getHoldings()]);

  const holdingsByAccount = new Map<string, typeof holdings>();
  holdings.forEach((h) => {
    const list = holdingsByAccount.get(h.account_id) ?? [];
    list.push(h);
    holdingsByAccount.set(h.account_id, list);
  });

  const total = portfolioReturn(holdings);
  const personName = (id: string | null) => persons.find((p) => p.id === id)?.name;

  return (
    <div className="grid gap-[18px]">
      <div className="grid stats-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        <Stat label="Samlet værdi" value={fmtKr(total.marketValue)} color="var(--grow)" />
        <Stat label="Anskaffelsessum" value={fmtKr(total.costBasis)} color="var(--muted)" />
        <Stat
          label="Afkast"
          value={total.gainPct == null ? "–" : `${total.gain >= 0 ? "+" : ""}${fmtKr(total.gain)}`}
          hint={total.gainPct == null ? undefined : fmtPct(total.gainPct)}
          color={total.gain >= 0 ? "var(--grow)" : "var(--real)"}
        />
      </div>

      <div className="note">
        Kurser hentes automatisk fra Stooq når tickeren er i Stooq-format (fx <strong>AAPL.US</strong>, <strong>NOVO-B.DK</strong>). Virker
        tickeren ikke, så brug en manuel kurs i stedet — det fungerer altid.
      </div>

      {accounts.length === 0 && <div className="empty">Ingen depoter/konti endnu — tilføj det første nedenfor.</div>}

      {accounts.map((acc) => {
        const accHoldings = holdingsByAccount.get(acc.id) ?? [];
        const accReturn = portfolioReturn(accHoldings);
        const owner = personName(acc.person_id);
        return (
          <div key={acc.id} className="card">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h3 style={{ margin: 0 }}>{acc.name}</h3>
                <p className="cap" style={{ margin: "2px 0 0" }}>
                  {labelFor(ACCOUNT_KIND_OPTIONS, acc.kind)}
                  {acc.broker ? ` · ${acc.broker}` : ""}
                  {owner ? ` · ${owner}` : " · Fælles"}
                </p>
              </div>
              <RemoveAccountButton accountId={acc.id} accountName={acc.name} />
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
