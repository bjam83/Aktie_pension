"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { fetchStooqPrice } from "@/lib/prices/stooq";

export interface FormState {
  error?: string;
}

function num(formData: FormData, key: string, fallback = 0): number {
  const n = Number(formData.get(key));
  return Number.isFinite(n) ? n : fallback;
}

// ── Accounts (depots) ───────────────────────────────────────────────────
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
  });
  if (error) return { error: error.message };

  revalidatePath("/investeringer");
  return {};
}

export async function removeAccountAction(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  await supabase.from("investment_accounts").delete().eq("id", id);
  revalidatePath("/investeringer");
}

// ── Holdings ─────────────────────────────────────────────────────────────
export async function addHoldingAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Ikke logget ind." };

  const name = String(formData.get("name") || "").trim();
  const account_id = String(formData.get("account_id") || "");
  if (!name || !account_id) return { error: "Udfyld navn og vælg konto." };

  const { error } = await supabase.from("holdings").insert({
    household_id: user.id,
    account_id,
    name,
    ticker: String(formData.get("ticker") || "") || null,
    isin: String(formData.get("isin") || "") || null,
    instrument_type: String(formData.get("instrument_type") || "aktie"),
    quantity: num(formData, "quantity"),
    avg_cost_price: num(formData, "avg_cost_price"),
    manual_price: formData.get("manual_price") ? num(formData, "manual_price") : null,
    price_source: formData.get("manual_price") ? "manual" : "auto",
  });
  if (error) return { error: error.message };

  revalidatePath("/investeringer");
  return {};
}

export async function updateHoldingAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Navn må ikke være tomt." };

  const manualRaw = formData.get("manual_price");
  const manual_price = manualRaw === "" || manualRaw == null ? null : Number(manualRaw);

  const { error } = await supabase
    .from("holdings")
    .update({
      name,
      ticker: String(formData.get("ticker") || "") || null,
      isin: String(formData.get("isin") || "") || null,
      instrument_type: String(formData.get("instrument_type") || "aktie"),
      quantity: num(formData, "quantity"),
      avg_cost_price: num(formData, "avg_cost_price"),
      manual_price,
      price_source: String(formData.get("price_source") || "auto"),
    })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/investeringer");
  return {};
}

export async function removeHoldingAction(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  await supabase.from("holdings").delete().eq("id", id);
  revalidatePath("/investeringer");
}

export interface RefreshState {
  error?: string;
  ok?: boolean;
}

/** Fetches a live quote for the holding's ticker (Stooq) and stores it as last_price. */
export async function refreshHoldingPriceAction(_prev: RefreshState, formData: FormData): Promise<RefreshState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Ikke logget ind." };

  const id = String(formData.get("id") || "");
  const { data: holding } = await supabase.from("holdings").select("ticker,household_id").eq("id", id).single();
  if (!holding?.ticker) return { error: "Ingen ticker angivet på denne post." };

  const quote = await fetchStooqPrice(holding.ticker);
  if (!quote) return { error: `Fandt ingen kurs for “${holding.ticker}”. Brug manuel kurs i stedet.` };

  const { error } = await supabase
    .from("holdings")
    .update({ last_price: quote.price, last_price_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  await supabase
    .from("holding_price_history")
    .upsert({ household_id: user.id, holding_id: id, price_date: new Date().toISOString().slice(0, 10), price: quote.price }, { onConflict: "holding_id,price_date" });

  revalidatePath("/investeringer");
  return { ok: true };
}
