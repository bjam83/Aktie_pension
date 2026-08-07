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

export async function addMeasurementAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Ikke logget ind." };

  const person_id = String(formData.get("person_id") || "");
  const measured_on = String(formData.get("measured_on") || "");
  if (!person_id || !measured_on) return { error: "Vælg person og dato." };

  const returnRaw = formData.get("return_pct");
  const return_pct = returnRaw === "" || returnRaw == null ? null : Number(returnRaw);

  const { error } = await supabase.from("pension_measurements").insert({
    household_id: user.id,
    person_id,
    measured_on,
    total_value: num(formData, "total_value"),
    return_pct,
  });
  if (error) {
    return { error: error.code === "23505" ? "Der findes allerede en måling for denne person på den dato." : error.message };
  }

  revalidatePath("/pension");
  return {};
}

export async function updateMeasurementAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  const measured_on = String(formData.get("measured_on") || "");
  if (!id || !measured_on) return { error: "Vælg en dato." };

  const returnRaw = formData.get("return_pct");
  const return_pct = returnRaw === "" || returnRaw == null ? null : Number(returnRaw);

  const { error } = await supabase
    .from("pension_measurements")
    .update({
      measured_on,
      total_value: num(formData, "total_value"),
      return_pct,
    })
    .eq("id", id);
  if (error) {
    return { error: error.code === "23505" ? "Der findes allerede en måling for denne person på den dato." : error.message };
  }

  revalidatePath("/pension");
  return {};
}

export async function removeMeasurementAction(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  await supabase.from("pension_measurements").delete().eq("id", id);
  revalidatePath("/pension");
}
