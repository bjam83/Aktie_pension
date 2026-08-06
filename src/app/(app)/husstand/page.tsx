import { redirect } from "next/navigation";
import { getHouseholdBundle } from "@/lib/data";
import { HouseholdNameForm } from "./HouseholdNameForm";
import { PersonCard } from "./PersonCard";
import { AddPersonForm } from "./AddPersonForm";

export default async function HusstandPage() {
  const bundle = await getHouseholdBundle();
  if (!bundle) redirect("/login");
  const { persons } = bundle;

  return (
    <div className="grid gap-[18px]">
      <div className="card">
        <h3>Husstand</h3>
        <p className="cap">Navngiv husstanden og administrér hvem der bor i den.</p>
        <HouseholdNameForm defaultValue={bundle.household.household_name || ""} />
      </div>

      <div className="grid cols-2 gap-[16px]">
        {persons.map((p) => (
          <PersonCard key={p.id} person={p} canRemove={!p.is_primary} />
        ))}
      </div>

      {persons.length < 2 && <AddPersonForm />}

      <div className="note">
        Pensionsordninger, investeringskonti og aktiver kan knyttes til en bestemt person under de respektive faner. Pensionsalder og
        nuværende pensionsformue redigeres under fanen <strong>Pension</strong>.
      </div>
    </div>
  );
}
