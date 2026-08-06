"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUpAction, type AuthFormState } from "@/lib/actions/auth";

const initialState: AuthFormState = {};

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signUpAction, initialState);

  if (state.info) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-[13.5px]" style={{ color: "var(--ink)" }}>
          {state.info}
        </p>
        <Link className="btn ghost" href="/login" style={{ justifyContent: "center" }}>
          Til login
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="field">
        <label htmlFor="fullName">Dit navn</label>
        <input className="input" id="fullName" name="fullName" type="text" autoComplete="name" required />
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input className="input" id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="field">
        <label htmlFor="password">Adgangskode</label>
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
        {pending ? "Opretter…" : "Opret bruger"}
      </button>
      <p className="text-[12.5px] text-center mt-1" style={{ color: "var(--muted)" }}>
        Har du allerede en bruger?{" "}
        <Link className="underline" href="/login">
          Log ind
        </Link>
      </p>
    </form>
  );
}
