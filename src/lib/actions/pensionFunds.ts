"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { fetchAnnualReturns } from "@/lib/scraping/annualReturns";

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

  const source_url = String(formData.get("source_url") || "").trim();

  const { error } = await supabase.from("pension_scheme_funds").insert({
    household_id: user.id,
    scheme_id,
    name,
    allocation_pct: num(formData, "allocation_pct"),
    source_url: source_url || null,
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

  const source_url = String(formData.get("source_url") || "").trim();

  const { error } = await supabase
    .from("pension_scheme_funds")
    .update({
      name,
      allocation_pct: num(formData, "allocation_pct"),
      source_url: source_url || null,
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

/**
 * Reads the fund's yearly return history off its provider page (e.g. AP Pension's fondliste,
 * saved as source_url) and upserts it — deliberately overwrites whatever's already stored for the
 * years found there, since the whole point is a "refresh with the official numbers" action, unlike
 * addFundReturnAction's insert-only behavior for a single manually-typed year.
 */
export async function fetchFundReturnsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Ikke logget ind." };

  const fund_id = String(formData.get("fund_id") || "");
  if (!fund_id) return { error: "Mangler fond." };

  const { data: fund } = await supabase.from("pension_scheme_funds").select("source_url").eq("id", fund_id).single();
  if (!fund?.source_url) return { error: "Tilføj et link til fondens side under 'Rediger' først." };

  let results;
  try {
    results = await fetchAnnualReturns(fund.source_url);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kunne ikke hente afkast." };
  }

  const { error } = await supabase
    .from("pension_fund_returns")
    .upsert(
      results.map((r) => ({ household_id: user.id, fund_id, year: r.year, return_pct: r.returnPct })),
      { onConflict: "fund_id,year" }
    );
  if (error) return { error: error.message };

  revalidatePath("/pension");
  return {};
}
