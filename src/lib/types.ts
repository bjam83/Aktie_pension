export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      assets: {
        Row: {
          created_at: string
          growth_rate_pct: number
          household_id: string
          id: string
          kind: string
          name: string
          notes: string | null
          owner_ids: string[]
          updated_at: string
          value: number
        }
        Insert: {
          created_at?: string
          growth_rate_pct?: number
          household_id: string
          id?: string
          kind: string
          name: string
          notes?: string | null
          owner_ids?: string[]
          updated_at?: string
          value?: number
        }
        Update: {
          created_at?: string
          growth_rate_pct?: number
          household_id?: string
          id?: string
          kind?: string
          name?: string
          notes?: string | null
          owner_ids?: string[]
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "assets_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      assumptions: {
        Row: {
          aktie_graense: number
          aktie_hoej_rate: number
          aktie_lav_rate: number
          ask_loft: number
          ask_rate: number
          bundskat_rate: number
          household_id: string
          inflation_rate: number
          mellemskat_bund: number
          mellemskat_rate: number
          pal_rate: number
          personfradrag: number
          topskat_bund: number
          topskat_rate: number
          updated_at: string
        }
        Insert: {
          aktie_graense?: number
          aktie_hoej_rate?: number
          aktie_lav_rate?: number
          ask_loft?: number
          ask_rate?: number
          bundskat_rate?: number
          household_id: string
          inflation_rate?: number
          mellemskat_bund?: number
          mellemskat_rate?: number
          pal_rate?: number
          personfradrag?: number
          topskat_bund?: number
          topskat_rate?: number
          updated_at?: string
        }
        Update: {
          aktie_graense?: number
          aktie_hoej_rate?: number
          aktie_lav_rate?: number
          ask_loft?: number
          ask_rate?: number
          bundskat_rate?: number
          household_id?: string
          inflation_rate?: number
          mellemskat_bund?: number
          mellemskat_rate?: number
          pal_rate?: number
          personfradrag?: number
          topskat_bund?: number
          topskat_rate?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assumptions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: true
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_items: {
        Row: {
          amount: number
          created_at: string
          direction: string
          frequency: string
          group_name: string
          household_id: string
          id: string
          name: string
          person_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          direction?: string
          frequency?: string
          group_name?: string
          household_id: string
          id?: string
          name: string
          person_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          direction?: string
          frequency?: string
          group_name?: string
          household_id?: string
          id?: string
          name?: string
          person_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_items_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
        ]
      }
      holding_price_history: {
        Row: {
          created_at: string
          holding_id: string
          household_id: string
          id: string
          price: number
          price_date: string
        }
        Insert: {
          created_at?: string
          holding_id: string
          household_id: string
          id?: string
          price: number
          price_date: string
        }
        Update: {
          created_at?: string
          holding_id?: string
          household_id?: string
          id?: string
          price?: number
          price_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "holding_price_history_holding_id_fkey"
            columns: ["holding_id"]
            isOneToOne: false
            referencedRelation: "holdings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "holding_price_history_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      holdings: {
        Row: {
          account_id: string
          avg_cost_price: number
          created_at: string
          currency: string
          household_id: string
          id: string
          instrument_type: string
          isin: string | null
          last_price: number | null
          last_price_at: string | null
          manual_price: number | null
          name: string
          price_source: string
          quantity: number
          ticker: string | null
          updated_at: string
        }
        Insert: {
          account_id: string
          avg_cost_price?: number
          created_at?: string
          currency?: string
          household_id: string
          id?: string
          instrument_type?: string
          isin?: string | null
          last_price?: number | null
          last_price_at?: string | null
          manual_price?: number | null
          name: string
          price_source?: string
          quantity?: number
          ticker?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          avg_cost_price?: number
          created_at?: string
          currency?: string
          household_id?: string
          id?: string
          instrument_type?: string
          isin?: string | null
          last_price?: number | null
          last_price_at?: string | null
          manual_price?: number | null
          name?: string
          price_source?: string
          quantity?: number
          ticker?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "holdings_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "investment_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "holdings_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          created_at: string
          currency: string
          household_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          household_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          household_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      income_streams: {
        Row: {
          amount: number
          created_at: string
          frequency: string
          household_id: string
          id: string
          kind: string
          person_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          frequency?: string
          household_id: string
          id?: string
          kind: string
          person_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          frequency?: string
          household_id?: string
          id?: string
          kind?: string
          person_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "income_streams_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_streams_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_accounts: {
        Row: {
          broker: string | null
          created_at: string
          household_id: string
          id: string
          kind: string
          name: string
          person_id: string | null
        }
        Insert: {
          broker?: string | null
          created_at?: string
          household_id: string
          id?: string
          kind?: string
          name: string
          person_id?: string | null
        }
        Update: {
          broker?: string | null
          created_at?: string
          household_id?: string
          id?: string
          kind?: string
          name?: string
          person_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investment_accounts_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investment_accounts_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
        ]
      }
      liabilities: {
        Row: {
          created_at: string
          household_id: string
          id: string
          interest_rate_pct: number | null
          kind: string
          name: string
          owner_ids: string[]
          remaining_debt: number
          term_years: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          household_id: string
          id?: string
          interest_rate_pct?: number | null
          kind: string
          name: string
          owner_ids?: string[]
          remaining_debt?: number
          term_years?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          household_id?: string
          id?: string
          interest_rate_pct?: number | null
          kind?: string
          name?: string
          owner_ids?: string[]
          remaining_debt?: number
          term_years?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "liabilities_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      pension_measurements: {
        Row: {
          created_at: string
          household_id: string
          id: string
          measured_on: string
          total_value: number
        }
        Insert: {
          created_at?: string
          household_id: string
          id?: string
          measured_on: string
          total_value: number
        }
        Update: {
          created_at?: string
          household_id?: string
          id?: string
          measured_on?: string
          total_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "pension_measurements_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      pension_schemes: {
        Row: {
          created_at: string
          current_value: number
          expected_return_pct: number
          fetched_return_pct: number | null
          household_id: string
          id: string
          monthly_contribution: number
          name: string
          notes: string | null
          payout_start_age: number | null
          person_id: string
          provider: string | null
          return_basis: string
          scheme_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_value?: number
          expected_return_pct?: number
          fetched_return_pct?: number | null
          household_id: string
          id?: string
          monthly_contribution?: number
          name: string
          notes?: string | null
          payout_start_age?: number | null
          person_id: string
          provider?: string | null
          return_basis?: string
          scheme_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_value?: number
          expected_return_pct?: number
          fetched_return_pct?: number | null
          household_id?: string
          id?: string
          monthly_contribution?: number
          name?: string
          notes?: string | null
          payout_start_age?: number | null
          person_id?: string
          provider?: string | null
          return_basis?: string
          scheme_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pension_schemes_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pension_schemes_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
        ]
      }
      persons: {
        Row: {
          birth_date: string | null
          created_at: string
          household_id: string
          id: string
          is_primary: boolean
          name: string
          retirement_age: number
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          household_id: string
          id?: string
          is_primary?: boolean
          name: string
          retirement_age?: number
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          household_id?: string
          id?: string
          is_primary?: boolean
          name?: string
          retirement_age?: number
        }
        Relationships: [
          {
            foreignKeyName: "persons_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      planning_settings: {
        Row: {
          free_funds: Json
          household_id: string
          payout: Json
          updated_at: string
        }
        Insert: {
          free_funds?: Json
          household_id: string
          payout?: Json
          updated_at?: string
        }
        Update: {
          free_funds?: Json
          household_id?: string
          payout?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "planning_settings_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: true
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database["public"]

export type Tables<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Update"]

// ── Ergonomic aliases ────────────────────────────────────────────────────
export type Household = Tables<"households">
export type Person = Tables<"persons">
export type Assumptions = Tables<"assumptions">
export type PensionScheme = Tables<"pension_schemes">
export type InvestmentAccount = Tables<"investment_accounts">
export type Holding = Tables<"holdings">
export type HoldingPriceHistory = Tables<"holding_price_history">
export type Asset = Tables<"assets">
export type Liability = Tables<"liabilities">
export type IncomeStream = Tables<"income_streams">
export type BudgetItem = Tables<"budget_items">
export type PlanningSettings = Tables<"planning_settings">
export type PensionMeasurement = Tables<"pension_measurements">

export type SchemeType = "arbejdsmarkedspension" | "ratepension" | "livrente" | "aldersopsparing" | "andet"
export type ReturnBasis = "historical" | "ytd" | "blend"
export type AccountKind = "frie_midler" | "aktiesparekonto" | "pensionsdepot"
export type InstrumentType =
  | "aktie"
  | "investeringsforening_aktiebaseret"
  | "investeringsforening_obligationsbaseret"
  | "obligation"
  | "kontant"
export type PriceSource = "auto" | "manual"
export type AssetKind = "bolig" | "bil" | "bankindestaaende" | "andet"
export type LiabilityKind = "realkredit" | "billaan" | "studielaan" | "andet"
export type IncomeKind = "løn" | "folkepension" | "atp" | "efterløn" | "andet"
export type BudgetDirection = "ind" | "ud"
export type BudgetFrequency = "månedlig" | "kvartalsvis" | "halvårligt" | "årlig" | "engangs"

export interface FreeFundsConfig {
  lump: number
  monthly: number
  ret: number
  years: number
  tax: "ask" | "depot"
}

export interface PayoutConfig {
  potOverride: number | null
  years: number
  ret: number
  otherIncome: number
}
