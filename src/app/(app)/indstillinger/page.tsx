import { redirect } from "next/navigation";
import { getHouseholdBundle } from "@/lib/data";
import { AssumptionsForm } from "./AssumptionsForm";

export default async function IndstillingerPage() {
  const bundle = await getHouseholdBundle();
  if (!bundle) redirect("/login");

  return (
    <div className="grid gap-[18px]">
      <div className="note">
        Disse satser bruges i alle beregninger på tværs af appen — pension, udbetaling og frie midler. Standardværdierne følger dansk lovgivning
        (2026-niveau), men du kan justere dem hvis I har særlige forhold.
      </div>
      <AssumptionsForm a={bundle.assumptions} />
    </div>
  );
}
