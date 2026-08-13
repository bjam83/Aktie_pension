"use client";

import { useActionState } from "react";
import { refreshAllFundReturnsAction, type FormState } from "@/lib/actions/pensionFunds";

const initialState: FormState = {};

/** One-click refresh of every fund's return history across the whole household — avoids having
 *  to open every scheme and every fund individually just to pull in the latest numbers. */
export function RefreshAllFundsButton() {
  const [state, formAction, pending] = useActionState(refreshAllFundReturnsAction, initialState);

  return (
    <div className="card flex items-center justify-between gap-3 flex-wrap">
      <div>
        <h3 style={{ margin: 0 }}>Opdater alle fondes afkast</h3>
        <p className="cap" style={{ margin: "2px 0 0" }}>
          Henter det seneste afkast for alle fonde med et link til fondens side, på tværs af alle ordninger.
        </p>
      </div>
      <form action={formAction}>
        <button className="btn" type="submit" disabled={pending}>
          {pending ? "Opdaterer…" : "Opdater alle fondes afkast"}
        </button>
      </form>
      {state.message && <p className="cap" style={{ margin: 0, width: "100%" }}>{state.message}</p>}
      {state.error && (
        <p className="text-[12px]" style={{ margin: 0, width: "100%", color: "var(--danger)" }}>
          {state.error}
        </p>
      )}
    </div>
  );
}
