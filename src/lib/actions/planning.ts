"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Json, PayoutConfig } from "@/lib/types";

export interface FormState {
  error?: string;
}

function num(formData: FormData, key: string, fallback = 0): number {
  const n = Number(formData.get(key));
  return Number.isFinite(n) ? n : fallback;
}

export async function updatePayoutConfigAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Ikke logget ind." };

  const personId = String(formData.get("person_id") || "");
  if (!personId) return { error: "Mangler person." };

  const cfg: PayoutConfig = {
    years: num(formData, "years", 15),
    ret: num(formData, "ret", 3),
    otherIncome: num(formData, "otherIncome"),
  };

  const { data: current } = await supabase.from("planning_settings").select("payout").eq("household_id", user.id).single();
  const payout = { ...((current?.payout as unknown as Record<string, PayoutConfig>) || {}), [personId]: cfg };

  const { error } = await supabase
    .from("planning_settings")
    .update({ payout: payout as unknown as Json })
    .eq("household_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/udbetaling");
  return {};
}
