import { redirect } from "next/navigation";
import { getHouseholdBundle, getPensionSchemes } from "@/lib/data";
import { fmtKr } from "@/lib/finance/format";
import { HouseholdNameForm } from "./HouseholdNameForm";
import { PersonCard } from "./PersonCard";
import { AddPersonForm } from "./AddPersonForm";

export default async function HusstandPage() {
  const bundle = await getHouseholdBundle();
  if (!bundle) redirect("/login");
  const { persons } = bundle;
  const schemes = await getPensionSchemes();

  const pensionByPerson = new Map<string, number>();
  schemes.forEach((s) => pensionByPerson.set(s.person_id, (pensionByPerson.get(s.person_id) || 0) + Number(s.current_value)));

  return (
    <div className="grid gap-[18px]">
      <div className="card">
        <h3>Husstand</h3>
        <p className="cap">Navngiv husstanden og administrér hvem der bor i den.</p>
        <HouseholdNameForm defaultValue={bundle.household.household_name || ""} />
      </div>

      <div className="grid cols-2 gap-[16px]">
        {persons.map((p) => (
          <div key={p.id} className="grid gap-2">
            <PersonCard person={p} canRemove={!p.is_primary} />
            <div className="stat">
              <div className="lab">Samlet pension</div>
              <div className="val">{fmtKr(pensionByPerson.get(p.id) || 0)}</div>
            </div>
          </div>
        ))}
      </div>

      {persons.length < 2 && <AddPersonForm />}

      <div className="note">
        Pensionsordninger, investeringskonti og aktiver kan knyttes til en bestemt person under de respektive faner — det giver et samlet
        husstandsoverblik, men også en fordeling pr. person.
      </div>
    </div>
  );
}
