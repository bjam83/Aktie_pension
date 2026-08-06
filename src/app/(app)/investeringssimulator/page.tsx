import { redirect } from "next/navigation";
import { getHouseholdBundle } from "@/lib/data";
import { simulateFreeFunds } from "@/lib/finance/freeFunds";
import { fmtKr } from "@/lib/finance/format";
import { Stat } from "@/components/ui/Stat";
import { LineAreaChart } from "@/components/charts/LineAreaChart";
import { DonutChart } from "@/components/charts/DonutChart";
import type { FreeFundsConfig } from "@/lib/types";
import { FreeFundsForm } from "./FreeFundsForm";

export default async function FrieMidlerPage() {
  const bundle = await getHouseholdBundle();
  if (!bundle) redirect("/login");
  const { assumptions, planningSettings } = bundle;

  const cfg = planningSettings.free_funds as unknown as FreeFundsConfig;
  const sim = simulateFreeFunds(cfg, assumptions, assumptions.inflation_rate);

  const composition = [
    { name: "Indbetalt", value: Math.max(0, sim.contributed), color: "var(--indbetalt)" },
    { name: "Afkast efter skat", value: Math.max(0, sim.finalNominal - sim.contributed), color: "var(--amber)" },
  ];

  return (
    <div className="grid gap-[18px]">
      <FreeFundsForm cfg={cfg} />

      <div className="grid stats-grid" style={{ gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        <Stat label="Formue efter periode" value={fmtKr(sim.finalNominal)} color="var(--grow)" />
        <Stat label="I nutidskroner" value={fmtKr(sim.finalReal)} color="var(--real)" />
        <Stat label="Indbetalt i alt" value={fmtKr(sim.contributed)} />
        <Stat label="Skat betalt" value={fmtKr(sim.taxPaid)} color="var(--muted)" />
      </div>

      <div className="card">
        <h3>Udvikling over tid</h3>
        <p className="cap">Nominel formue vs. indbetalt.</p>
        {sim.series.length >= 2 ? (
          <LineAreaChart
            data={sim.series as unknown as Record<string, number>[]}
            series={[
              { key: "nominal", name: "Formue", stroke: "var(--grow)", fill: "var(--grow-soft)", fillOp: 0.6 },
              { key: "contributed", name: "Indbetalt", stroke: "var(--indbetalt)", width: 2, dashed: true },
            ]}
            xKey="year"
          />
        ) : (
          <div className="empty">Sæt et antal år &gt; 0 for at se udviklingen.</div>
        )}
      </div>

      <div className="card">
        <h3>Sammensætning</h3>
        <DonutChart data={composition} />
      </div>
    </div>
  );
}
