"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export interface AuthFormState {
  error?: string;
  info?: string;
}

async function origin() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  return `${proto}://${host}`;
}

export async function signInAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/");

  if (!email || !password) return { error: "Udfyld email og adgangskode." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message === "Invalid login credentials" ? "Forkert email eller adgangskode." : error.message };

  redirect(next || "/");
}

export async function signUpAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const passwordConfirm = String(formData.get("passwordConfirm") || "");
  const fullName = String(formData.get("fullName") || "").trim();

  if (!email || !password) return { error: "Udfyld email og adgangskode." };
  if (password.length < 8) return { error: "Adgangskoden skal være mindst 8 tegn." };
  if (password !== passwordConfirm) return { error: "Adgangskoderne matcher ikke." };

  const supabase = await createClient();
  const site = await origin();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: fullName ? { full_name: fullName } : undefined,
      emailRedirectTo: `${site}/auth/confirmed`,
    },
  });
  if (error) return { error: error.message };

  // If email confirmation is disabled in the project, Supabase returns a session immediately.
  if (data.session) redirect("/");

  return { info: "Tjek din indbakke — vi har sendt dig en bekræftelseslink for at aktivere din konto." };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordResetAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") || "").trim();
  if (!email) return { error: "Udfyld din email." };

  const supabase = await createClient();
  const site = await origin();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${site}/nyt-kodeord`,
  });
  if (error) return { error: error.message };
  return { info: "Hvis emailen findes hos os, har vi sendt et link til at nulstille adgangskoden." };
}

export async function updatePasswordAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const password = String(formData.get("password") || "");
  const passwordConfirm = String(formData.get("passwordConfirm") || "");
  if (password.length < 8) return { error: "Adgangskoden skal være mindst 8 tegn." };
  if (password !== passwordConfirm) return { error: "Adgangskoderne matcher ikke." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  redirect("/");
}
