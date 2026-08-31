import { redirect } from "next/navigation";
import { getHouseholdBundle, getPensionSchemes, getPensionMeasurements, getPensionSchemeFunds, getPensionFundReturns } from "@/lib/data";
import { PensionBody } from "./PensionBody";

export default async function PensionPage() {
  const bundle = await getHouseholdBundle();
  if (!bundle) redirect("/login");
  const { persons, assumptions } = bundle;
  const [schemes, measurements, schemeFunds, fundReturns] = await Promise.all([
    getPensionSchemes(),
    getPensionMeasurements(),
    getPensionSchemeFunds(),
    getPensionFundReturns(),
  ]);

  return (
    <PensionBody
      persons={persons}
      assumptions={assumptions}
      schemes={schemes}
      measurements={measurements}
      schemeFunds={schemeFunds}
      fundReturns={fundReturns}
    />
  );
}
