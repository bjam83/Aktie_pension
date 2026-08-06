"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface FormState {
  error?: string;
}

export async function updateHouseholdAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Ikke logget ind." };

  const household_name = String(formData.get("household_name") || "").trim();
  const { error } = await supabase.from("households").update({ household_name }).eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}

export async function updatePersonAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const birth_date = String(formData.get("birth_date") || "") || null;
  const retirement_age = Number(formData.get("retirement_age")) || 68;

  if (!name) return { error: "Navn må ikke være tomt." };

  const { error } = await supabase.from("persons").update({ name, birth_date, retirement_age }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}

export async function addPersonAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Ikke logget ind." };

  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Navn må ikke være tomt." };

  const { error } = await supabase.from("persons").insert({ household_id: user.id, name, is_primary: false });
  if (error) return { error: error.message.includes("maksimalt") ? error.message : "Kunne ikke oprette person: " + error.message };

  revalidatePath("/", "layout");
  return {};
}

export async function removePersonAction(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  await supabase.from("persons").delete().eq("id", id);
  revalidatePath("/", "layout");
}
