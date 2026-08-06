"use client";

import { useActionState, useEffect, useState } from "react";
import { updatePasswordAction, type AuthFormState } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/client";

const initialState: AuthFormState = {};

export function UpdatePasswordForm() {
  const [state, formAction, pending] = useActionState(updatePasswordAction, initialState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // The recovery link lands with the session tokens in the URL hash — the
    // browser client picks these up and establishes the recovery session.
    const supabase = createClient();
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
  }, []);

  if (!ready) {
    return <p className="text-[13.5px]" style={{ color: "var(--muted)" }}>Bekræfter link…</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="field">
        <label htmlFor="password">Ny adgangskode</label>
        <input className="input" id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      <div className="field">
        <label htmlFor="passwordConfirm">Gentag adgangskode</label>
        <input className="input" id="passwordConfirm" name="passwordConfirm" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      {state.error && (
        <p className="text-[12.5px]" style={{ color: "var(--danger)" }}>
          {state.error}
        </p>
      )}
      <button className="btn" type="submit" disabled={pending} style={{ justifyContent: "center", marginTop: 6 }}>
        {pending ? "Gemmer…" : "Gem ny adgangskode"}
      </button>
    </form>
  );
}
