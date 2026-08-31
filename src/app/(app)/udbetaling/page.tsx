import { redirect } from "next/navigation";
import { getHouseholdBundle, getPensionSchemes, getInvestmentAccounts, getIncomeStreams } from "@/lib/data";
import { UdbetalingBody } from "./UdbetalingBody";

export default async function UdbetalingPage() {
  const bundle = await getHouseholdBundle();
  if (!bundle) redirect("/login");
  const { persons, assumptions, planningSettings } = bundle;
  const [schemes, accounts, incomeStreams] = await Promise.all([getPensionSchemes(), getInvestmentAccounts(), getIncomeStreams()]);

  return (
    <UdbetalingBody
      persons={persons}
      assumptions={assumptions}
      planningSettings={planningSettings}
      schemes={schemes}
      accounts={accounts}
      incomeStreams={incomeStreams}
    />
  );
}
