import { redirect } from "next/navigation";
import {
  getHouseholdBundle,
  getPensionSchemes,
  getInvestmentAccounts,
  getBudgetItems,
  getIncomeStreams,
  getAssets,
  getLiabilities,
} from "@/lib/data";
import { OverblikBody } from "./OverblikBody";

export default async function DashboardPage() {
  const bundle = await getHouseholdBundle();
  if (!bundle) redirect("/login");
  const { persons, assumptions, planningSettings } = bundle;

  const [schemes, accounts, budgetItems, incomeStreams, assets, liabilities] = await Promise.all([
    getPensionSchemes(),
    getInvestmentAccounts(),
    getBudgetItems(),
    getIncomeStreams(),
    getAssets(),
    getLiabilities(),
  ]);

  return (
    <OverblikBody
      persons={persons}
      assumptions={assumptions}
      planningSettings={planningSettings}
      schemes={schemes}
      accounts={accounts}
      budgetItems={budgetItems}
      incomeStreams={incomeStreams}
      assets={assets}
      liabilities={liabilities}
    />
  );
}
