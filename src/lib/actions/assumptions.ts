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

export async function updateAssumptionsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Ikke logget ind." };

  const { error } = await supabase
    .from("assumptions")
    .update({
      pal_rate: num(formData, "pal_rate", 15.3),
      inflation_rate: num(formData, "inflation_rate", 2),
      ask_rate: num(formData, "ask_rate", 17),
      ask_loft: num(formData, "ask_loft", 174200),
      aktie_lav_rate: num(formData, "aktie_lav_rate", 27),
      aktie_hoej_rate: num(formData, "aktie_hoej_rate", 42),
      aktie_graense: num(formData, "aktie_graense", 79400),
      personfradrag: num(formData, "personfradrag", 54100),
      bundskat_rate: num(formData, "bundskat_rate", 37),
      mellemskat_bund: num(formData, "mellemskat_bund", 641200),
      mellemskat_rate: num(formData, "mellemskat_rate", 7.5),
      topskat_bund: num(formData, "topskat_bund", 777900),
      topskat_rate: num(formData, "topskat_rate", 7.5),
    })
    .eq("household_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}
