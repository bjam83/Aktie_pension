import { redirect } from "next/navigation";
import { getHouseholdBundle } from "@/lib/data";
import { Shell } from "@/components/layout/Shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const bundle = await getHouseholdBundle();
  if (!bundle) redirect("/login");

  return <Shell householdName={bundle.household.household_name || "Husstand"}>{children}</Shell>;
}
