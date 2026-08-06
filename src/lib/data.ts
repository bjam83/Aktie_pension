import { createClient } from "@/lib/supabase/server";
import type {
  Household,
  Person,
  Assumptions,
  PlanningSettings,
  PensionScheme,
  InvestmentAccount,
  Asset,
  Liability,
  IncomeStream,
  BudgetItem,
} from "@/lib/types";

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export interface HouseholdBundle {
  household: Household;
  persons: Person[];
  assumptions: Assumptions;
  planningSettings: PlanningSettings;
}

/** Fetches the core household context needed on every page. RLS scopes everything to the signed-in user. */
export async function getHouseholdBundle(): Promise<HouseholdBundle | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: household }, { data: persons }, { data: assumptions }, { data: planningSettings }] = await Promise.all([
    supabase.from("households").select("*").eq("id", user.id).single(),
    supabase.from("persons").select("*").order("is_primary", { ascending: false }).order("created_at"),
    supabase.from("assumptions").select("*").eq("household_id", user.id).single(),
    supabase.from("planning_settings").select("*").eq("household_id", user.id).single(),
  ]);

  if (!household || !assumptions || !planningSettings) return null;

  return { household, persons: persons ?? [], assumptions, planningSettings };
}

export async function getPensionSchemes(): Promise<PensionScheme[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("pension_schemes").select("*").order("created_at");
  return data ?? [];
}

export async function getInvestmentAccounts(): Promise<InvestmentAccount[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("investment_accounts").select("*").order("created_at");
  return data ?? [];
}

export async function getAssets(): Promise<Asset[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("assets").select("*").order("created_at");
  return data ?? [];
}

export async function getLiabilities(): Promise<Liability[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("liabilities").select("*").order("created_at");
  return data ?? [];
}

export async function getIncomeStreams(): Promise<IncomeStream[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("income_streams").select("*").order("created_at");
  return data ?? [];
}

export async function getBudgetItems(): Promise<BudgetItem[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("budget_items").select("*").order("group_name").order("name");
  return data ?? [];
}
