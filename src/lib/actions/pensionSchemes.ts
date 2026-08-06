"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface FormState {
  error?: string;
}

function num(formData: FormData, key: string, fallback = 0): number {
  const raw = formData.get(key);
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

/** Udbetalingslængde er kun relevant for ratepension, og skal ligge mellem 10 og 25 år. */
function payoutYears(formData: FormData, schemeType: string): number | null {
  if (schemeType !== "ratepension") return null;
  const raw = Number(formData.get("payout_years"));
  const n = Number.isFinite(raw) && raw > 0 ? Math.round(raw) : 15;
  return Math.min(25, Math.max(10, n));
}

export async function addSchemeAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Ikke logget ind." };

  const name = String(formData.get("name") || "").trim();
  const person_id = String(formData.get("person_id") || "");
  if (!name || !person_id) return { error: "Udfyld navn og vælg person." };
  const scheme_type = String(formData.get("scheme_type") || "ratepension");

  const { error } = await supabase.from("pension_schemes").insert({
    household_id: user.id,
    person_id,
    name,
    scheme_type,
    provider: String(formData.get("provider") || "") || null,
    current_value: num(formData, "current_value"),
    monthly_contribution: num(formData, "monthly_contribution"),
    expected_return_pct: num(formData, "expected_return_pct", 6),
    payout_years: payoutYears(formData, scheme_type),
  });
  if (error) return { error: error.message };

  revalidatePath("/pension");
  revalidatePath("/udbetaling");
  revalidatePath("/", "layout");
  return {};
}

export async function updateSchemeAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const person_id = String(formData.get("person_id") || "");
  if (!name || !person_id) return { error: "Udfyld navn og vælg person." };

  const fetchedRaw = formData.get("fetched_return_pct");
  const fetched_return_pct = fetchedRaw === "" || fetchedRaw == null ? null : Number(fetchedRaw);
  const scheme_type = String(formData.get("scheme_type") || "ratepension");

  const { error } = await supabase
    .from("pension_schemes")
    .update({
      name,
      person_id,
      scheme_type,
      provider: String(formData.get("provider") || "") || null,
      current_value: num(formData, "current_value"),
      monthly_contribution: num(formData, "monthly_contribution"),
      expected_return_pct: num(formData, "expected_return_pct", 6),
      fetched_return_pct,
      return_basis: String(formData.get("return_basis") || "historical"),
      payout_years: payoutYears(formData, scheme_type),
      notes: String(formData.get("notes") || "") || null,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/pension");
  revalidatePath("/udbetaling");
  revalidatePath("/", "layout");
  return {};
}

export async function removeSchemeAction(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  await supabase.from("pension_schemes").delete().eq("id", id);
  revalidatePath("/pension");
  revalidatePath("/", "layout");
}
