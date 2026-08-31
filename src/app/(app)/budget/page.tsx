import { redirect } from "next/navigation";
import { getHouseholdBundle, getBudgetItems, getIncomeStreams, getAssets, getLiabilities, getPensionSchemes, getInvestmentAccounts } from "@/lib/data";
import { BudgetBody } from "./BudgetBody";

export default async function BudgetPage() {
  const bundle = await getHouseholdBundle();
  if (!bundle) redirect("/login");
  const { persons, assumptions } = bundle;
  const [budgetItems, incomeStreams, assets, liabilities, schemes, accounts] = await Promise.all([
    getBudgetItems(),
    getIncomeStreams(),
    getAssets(),
    getLiabilities(),
    getPensionSchemes(),
    getInvestmentAccounts(),
  ]);

  return (
    <BudgetBody
      persons={persons}
      assumptions={assumptions}
      budgetItems={budgetItems}
      incomeStreams={incomeStreams}
      assets={assets}
      liabilities={liabilities}
      schemes={schemes}
      accounts={accounts}
    />
  );
}
