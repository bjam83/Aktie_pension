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

// ── Budget items ─────────────────────────────────────────────────────────
export async function addBudgetItemAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Ikke logget ind." };

  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Navn må ikke være tomt." };

  const { error } = await supabase.from("budget_items").insert({
    household_id: user.id,
    group_name: String(formData.get("group_name") || "Andet").trim() || "Andet",
    name,
    direction: String(formData.get("direction") || "ud"),
    amount: num(formData, "amount"),
    frequency: String(formData.get("frequency") || "månedlig"),
    person_id: String(formData.get("person_id") || "") || null,
  });
  if (error) return { error: error.message };

  revalidatePath("/budget");
  return {};
}

export async function updateBudgetItemAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Navn må ikke være tomt." };

  const { error } = await supabase
    .from("budget_items")
    .update({
      group_name: String(formData.get("group_name") || "Andet").trim() || "Andet",
      name,
      direction: String(formData.get("direction") || "ud"),
      amount: num(formData, "amount"),
      frequency: String(formData.get("frequency") || "månedlig"),
      person_id: String(formData.get("person_id") || "") || null,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/budget");
  return {};
}

export async function removeBudgetItemAction(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  await supabase.from("budget_items").delete().eq("id", id);
  revalidatePath("/budget");
}

// ── Assets ───────────────────────────────────────────────────────────────
export async function addAssetAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Ikke logget ind." };

  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Navn må ikke være tomt." };
  const ownerId = String(formData.get("owner_id") || "");

  const { error } = await supabase.from("assets").insert({
    household_id: user.id,
    name,
    kind: String(formData.get("kind") || "andet"),
    value: num(formData, "value"),
    growth_rate_pct: num(formData, "growth_rate_pct"),
    owner_ids: ownerId ? [ownerId] : [],
  });
  if (error) return { error: error.message };

  revalidatePath("/budget");
  return {};
}

export async function updateAssetAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Navn må ikke være tomt." };
  const ownerId = String(formData.get("owner_id") || "");

  const { error } = await supabase
    .from("assets")
    .update({
      name,
      kind: String(formData.get("kind") || "andet"),
      value: num(formData, "value"),
      growth_rate_pct: num(formData, "growth_rate_pct"),
      owner_ids: ownerId ? [ownerId] : [],
    })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/budget");
  return {};
}

export async function removeAssetAction(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  await supabase.from("assets").delete().eq("id", id);
  revalidatePath("/budget");
}

// ── Liabilities ──────────────────────────────────────────────────────────
export async function addLiabilityAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Ikke logget ind." };

  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Navn må ikke være tomt." };
  const ownerId = String(formData.get("owner_id") || "");

  const { error } = await supabase.from("liabilities").insert({
    household_id: user.id,
    name,
    kind: String(formData.get("kind") || "andet"),
    remaining_debt: num(formData, "remaining_debt"),
    interest_rate_pct: formData.get("interest_rate_pct") ? num(formData, "interest_rate_pct") : null,
    owner_ids: ownerId ? [ownerId] : [],
  });
  if (error) return { error: error.message };

  revalidatePath("/budget");
  return {};
}

export async function removeLiabilityAction(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  await supabase.from("liabilities").delete().eq("id", id);
  revalidatePath("/budget");
}

// ── Income streams ───────────────────────────────────────────────────────
export async function addIncomeStreamAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Ikke logget ind." };

  const person_id = String(formData.get("person_id") || "");
  if (!person_id) return { error: "Vælg en person." };

  const { error } = await supabase.from("income_streams").insert({
    household_id: user.id,
    person_id,
    kind: String(formData.get("kind") || "løn"),
    amount: num(formData, "amount"),
    frequency: String(formData.get("frequency") || "månedlig"),
  });
  if (error) return { error: error.message };

  revalidatePath("/budget");
  return {};
}

export async function removeIncomeStreamAction(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  await supabase.from("income_streams").delete().eq("id", id);
  revalidatePath("/budget");
}
