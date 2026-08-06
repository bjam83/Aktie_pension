"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface FormState {
  error?: string;
}

function num(formData: FormData, key: string, fallback = 0): number {
  const n = Number(formData.get(key));
  return Number.isFinite(n) ? n : fallback;
}

// ── Accounts (frie midler) ────────────────────────────────────────────────
export async function addAccountAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Ikke logget ind." };

  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Navn må ikke være tomt." };
  const person_id = String(formData.get("person_id") || "") || null;

  const { error } = await supabase.from("investment_accounts").insert({
    household_id: user.id,
    name,
    kind: String(formData.get("kind") || "frie_midler"),
    broker: String(formData.get("broker") || "") || null,
    person_id,
    current_value: num(formData, "current_value"),
    monthly_contribution: num(formData, "monthly_contribution"),
    expected_return_pct: num(formData, "expected_return_pct", 6),
    projection_years: num(formData, "projection_years", 15),
  });
  if (error) return { error: error.message };

  revalidatePath("/frie-midler");
  revalidatePath("/", "layout");
  return {};
}

export async function updateAccountAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Navn må ikke være tomt." };
  const person_id = String(formData.get("person_id") || "") || null;

  const { error } = await supabase
    .from("investment_accounts")
    .update({
      name,
      kind: String(formData.get("kind") || "frie_midler"),
      broker: String(formData.get("broker") || "") || null,
      person_id,
      current_value: num(formData, "current_value"),
      monthly_contribution: num(formData, "monthly_contribution"),
      expected_return_pct: num(formData, "expected_return_pct", 6),
      projection_years: num(formData, "projection_years", 15),
    })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/frie-midler");
  revalidatePath("/", "layout");
  return {};
}

export async function removeAccountAction(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  await supabase.from("investment_accounts").delete().eq("id", id);
  revalidatePath("/frie-midler");
  revalidatePath("/", "layout");
}
