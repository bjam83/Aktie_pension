import type { Assumptions, InvestmentAccount, PayoutConfig, PensionScheme, Person } from "@/lib/types";
import { ageFromBirthDate, projectScheme, schemeReturnPct } from "./pension";
import { remainingLifeExpectancy } from "./lifeExpectancy";
import { simulateFreeFunds } from "./freeFunds";
import { simulateMultiPayout, type MultiPayoutResult, type PayoutStreamInput } from "./payout";

export const DEFAULT_PAYOUT: PayoutConfig = { years: 15, ret: 3, otherIncome: 0 };

/** Udbetalingslængde pr. ordningstype: ratepension har sin egen (10-25 år), livrente er livsvarig
 *  og bruger forventet restlevetid ved udbetalingsstart (se lifeExpectancy.ts), resten falder
 *  tilbage til personens generelle valg. */
export function streamYears(schemeType: string, payoutYears: number | null, retirementAge: number, fallbackYears: number): number {
  if (schemeType === "ratepension") return Math.min(25, Math.max(10, payoutYears ?? 15));
  if (schemeType === "livrente") return remainingLifeExpectancy(retirementAge);
  return fallbackYears;
}

export interface PersonPayoutResult {
  ageNow: number;
  streams: PayoutStreamInput[];
  frieMidlerPot: number;
  payout: MultiPayoutResult | null;
}

/**
 * Bygger en persons udbetalingsstrømme (pensionsordninger + evt. frie midler for den primære
 * person) og simulerer udbetalingen — samme beregning som bruges på Udbetaling-siden, udtrukket
 * hertil så andre sider (fx oversigten) kan bruge præcis det samme tal uden at duplikere logikken.
 */
export function buildPersonPayout(
  person: Pick<Person, "birth_date" | "retirement_age">,
  personSchemes: PensionScheme[],
  accounts: InvestmentAccount[],
  isPrimary: boolean,
  cfg: PayoutConfig,
  assumptions: Assumptions
): PersonPayoutResult {
  const ageNow = ageFromBirthDate(person.birth_date, 40);

  const streams: PayoutStreamInput[] = personSchemes.map((s) => {
    const proj = projectScheme(
      {
        id: s.id,
        personId: s.person_id,
        name: s.name,
        currentValue: Number(s.current_value),
        monthlyContribution: Number(s.monthly_contribution),
        returnPct: schemeReturnPct(s),
        ageNow,
        ageRetire: person.retirement_age,
      },
      assumptions.pal_rate,
      assumptions.inflation_rate
    );
    return {
      key: s.id,
      label: s.name,
      pot: proj.finalNominal,
      years: streamYears(s.scheme_type, s.payout_years, person.retirement_age, cfg.years),
      taxMode: s.scheme_type === "aldersopsparing" ? "free" : "income",
    };
  });

  // Frie midler ligger uden for pensionsramme: ingen PAL, men afkastdelen af hver udbetaling
  // beskattes løbende som aktieindkomst (depot) eller med ASK-satsen — det er ikke skattefrit
  // bare fordi kontoen er fremskrevet frem til pensionsalderen. Grupperes pr. beskatningsform,
  // da de to har forskellige satser. Fælles for husstanden, så kun lagt ind hos den primære person.
  let frieMidlerPot = 0;
  if (isPrimary && accounts.length > 0) {
    const yearsToRetirement = Math.max(0, person.retirement_age - ageNow);
    const groups: Record<"depot" | "ask", { pot: number; contributed: number }> = {
      depot: { pot: 0, contributed: 0 },
      ask: { pot: 0, contributed: 0 },
    };
    accounts.forEach((acc) => {
      const kind: "depot" | "ask" = acc.kind === "aktiesparekonto" ? "ask" : "depot";
      const sim = simulateFreeFunds(
        {
          lump: Number(acc.current_value),
          monthly: Number(acc.monthly_contribution),
          ret: Number(acc.expected_return_pct),
          years: yearsToRetirement,
          tax: kind,
        },
        assumptions,
        assumptions.inflation_rate
      );
      groups[kind].pot += sim.finalNominal;
      groups[kind].contributed += sim.contributed;
    });
    frieMidlerPot = groups.depot.pot + groups.ask.pot;

    (["depot", "ask"] as const).forEach((kind) => {
      const g = groups[kind];
      if (g.pot <= 0) return;
      const gainSharePct = Math.max(0, Math.min(1, (g.pot - g.contributed) / g.pot));
      streams.push({
        key: `frie-midler-${kind}`,
        label: kind === "ask" ? "Frie midler (aktiesparekonto)" : "Frie midler (depot)",
        pot: g.pot,
        years: cfg.years,
        taxMode: kind === "ask" ? "gains-ask" : "gains-depot",
        gainSharePct,
      });
    });
  }

  const payout = streams.length ? simulateMultiPayout(streams, cfg.ret, cfg.otherIncome, assumptions.pal_rate, person.retirement_age, assumptions) : null;

  return { ageNow, streams, frieMidlerPot, payout };
}
