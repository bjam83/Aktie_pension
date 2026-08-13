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

export async function addFundAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Ikke logget ind." };

  const scheme_id = String(formData.get("scheme_id") || "");
  const name = String(formData.get("name") || "").trim();
  if (!scheme_id || !name) return { error: "Udfyld navn på fonden." };

  const { error } = await supabase.from("pension_scheme_funds").insert({
    household_id: user.id,
    scheme_id,
    name,
    allocation_pct: num(formData, "allocation_pct"),
  });
  if (error) return { error: error.message };

  revalidatePath("/pension");
  return {};
}

export async function updateFundAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  if (!id || !name) return { error: "Udfyld navn på fonden." };

  const { error } = await supabase
    .from("pension_scheme_funds")
    .update({
      name,
      allocation_pct: num(formData, "allocation_pct"),
    })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/pension");
  return {};
}

export async function removeFundAction(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  await supabase.from("pension_scheme_funds").delete().eq("id", id);
  revalidatePath("/pension");
}

export async function addFundReturnAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Ikke logget ind." };

  const fund_id = String(formData.get("fund_id") || "");
  const year = Number(formData.get("year"));
  const returnRaw = formData.get("return_pct");
  const return_pct = returnRaw == null ? NaN : Number(returnRaw);
  if (!fund_id || !Number.isFinite(year) || !Number.isFinite(return_pct)) {
    return { error: "Udfyld år og afkast." };
  }

  const { error } = await supabase.from("pension_fund_returns").insert({
    household_id: user.id,
    fund_id,
    year,
    return_pct,
  });
  if (error) {
    return { error: error.code === "23505" ? "Der er allerede indtastet et afkast for dette år for denne fond." : error.message };
  }

  revalidatePath("/pension");
  return {};
}

export async function updateFundReturnAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  const year = Number(formData.get("year"));
  const returnRaw = formData.get("return_pct");
  const return_pct = returnRaw == null ? NaN : Number(returnRaw);
  if (!id || !Number.isFinite(year) || !Number.isFinite(return_pct)) {
    return { error: "Udfyld år og afkast." };
  }

  const { error } = await supabase
    .from("pension_fund_returns")
    .update({ year, return_pct })
    .eq("id", id);
  if (error) {
    return { error: error.code === "23505" ? "Der er allerede indtastet et afkast for dette år for denne fond." : error.message };
  }

  revalidatePath("/pension");
  return {};
}

export async function removeFundReturnAction(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  await supabase.from("pension_fund_returns").delete().eq("id", id);
  revalidatePath("/pension");
}
