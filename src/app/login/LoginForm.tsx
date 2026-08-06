"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInAction, type AuthFormState } from "@/lib/actions/auth";

const initialState: AuthFormState = {};

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="next" value={next} />
      <div className="field">
        <label htmlFor="email">Email</label>
        <input className="input" id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="field">
        <label htmlFor="password">Adgangskode</label>
        <input className="input" id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {state.error && (
        <p className="text-[12.5px]" style={{ color: "var(--danger)" }}>
          {state.error}
        </p>
      )}
      <button className="btn" type="submit" disabled={pending} style={{ justifyContent: "center", marginTop: 6 }}>
        {pending ? "Logger ind…" : "Log ind"}
      </button>
      <div className="flex justify-between text-[12.5px] mt-1" style={{ color: "var(--muted)" }}>
        <Link className="underline" href="/glemt-kodeord">
          Glemt adgangskode?
        </Link>
        <Link className="underline" href="/signup">
          Opret bruger
        </Link>
      </div>
    </form>
  );
}
