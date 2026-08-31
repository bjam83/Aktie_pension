import { redirect } from "next/navigation";
import { getHouseholdBundle, getInvestmentAccounts } from "@/lib/data";
import { FrieMidlerBody } from "./FrieMidlerBody";

export default async function FrieMidlerPage() {
  const bundle = await getHouseholdBundle();
  if (!bundle) redirect("/login");
  const { persons, assumptions } = bundle;
  const accounts = await getInvestmentAccounts();

  return <FrieMidlerBody persons={persons} assumptions={assumptions} accounts={accounts} />;
}
