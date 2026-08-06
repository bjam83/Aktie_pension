import { redirect } from "next/navigation";
import { getHouseholdBundle, getUser } from "@/lib/data";
import { Shell } from "@/components/layout/Shell";
import { signOutAction } from "@/lib/actions/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const bundle = await getHouseholdBundle();

  if (!bundle) {
    // Not signed in at all — safe to bounce to /login (proxy won't loop this back).
    const user = await getUser();
    if (!user) redirect("/login");

    // Signed in, but the household row wasn't provisioned (should be automatic on
    // signup) — render an explicit error instead of redirecting to /login, since
    // the proxy would immediately bounce an authenticated user back to "/" and
    // create an infinite redirect loop.
    return (
      <div className="min-h-screen flex items-center justify-center p-5" style={{ background: "var(--paper)" }}>
        <div className="card max-w-[420px] text-center">
          <h3>Kunne ikke indlæse din husstand</h3>
          <p className="cap">Din konto er logget ind, men vi kunne ikke finde husstandsdata. Prøv at genindlæse siden.</p>
          <form action={signOutAction}>
            <button className="btn ghost" type="submit" style={{ justifyContent: "center", width: "100%" }}>
              Log ud og prøv igen
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <Shell householdName={bundle.household.household_name || "Husstand"}>{children}</Shell>;
}
