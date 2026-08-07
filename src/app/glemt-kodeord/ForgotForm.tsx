"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordResetAction, type AuthFormState } from "@/lib/actions/auth";

const initialState: AuthFormState = {};

export function ForgotForm() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, initialState);

  if (state.info) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-[13px]">{state.info}</p>
        <Link className="btn ghost" href="/login" style={{ justifyContent: "center" }}>
          Til login
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="field">
        <label htmlFor="email">Email</label>
        <input className="input" id="email" name="email" type="email" autoComplete="email" required />
      </div>
      {state.error && (
        <p className="text-[12px]" style={{ color: "var(--danger)" }}>
          {state.error}
        </p>
      )}
      <button className="btn" type="submit" disabled={pending} style={{ justifyContent: "center", marginTop: 6 }}>
        {pending ? "Sender…" : "Send nulstillingslink"}
      </button>
      <p className="text-[12px] text-center mt-1" style={{ color: "var(--muted)" }}>
        <Link className="underline" href="/login">
          Tilbage til login
        </Link>
      </p>
    </form>
  );
}
