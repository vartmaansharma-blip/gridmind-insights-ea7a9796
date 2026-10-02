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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      asset_calibration_profiles: {
        Row: {
          asset_id: number | null
          baseline_window_days: number | null
          calibrated_at: string | null
          expected_ranges: Json
          id: number
          model_version: string | null
        }
        Insert: {
          asset_id?: number | null
          baseline_window_days?: number | null
          calibrated_at?: string | null
          expected_ranges: Json
          id?: number
          model_version?: string | null
        }
        Update: {
          asset_id?: number | null
          baseline_window_days?: number | null
          calibrated_at?: string | null
          expected_ranges?: Json
          id?: number
          model_version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_calibration_profiles_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: true
            referencedRelation: "factory_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_integration_profiles: {
        Row: {
          asset_id: number
          communication_interface: string | null
          controller_available: boolean | null
          coverage_score: number | null
          created_at: string | null
          gateway_required: boolean | null
          id: number
          indirect_inference_allowed: boolean | null
          integration_mode: string
          manual_data_allowed: boolean | null
          notes: string | null
          plc_available: boolean | null
          retrofit_required: boolean | null
        }
        Insert: {
          asset_id: number
          communication_interface?: string | null
          controller_available?: boolean | null
          coverage_score?: number | null
          created_at?: string | null
          gateway_required?: boolean | null
          id?: number
          indirect_inference_allowed?: boolean | null
          integration_mode: string
          manual_data_allowed?: boolean | null
          notes?: string | null
          plc_available?: boolean | null
          retrofit_required?: boolean | null
        }
        Update: {
          asset_id?: number
          communication_interface?: string | null
          controller_available?: boolean | null
          coverage_score?: number | null
          created_at?: string | null
          gateway_required?: boolean | null
          id?: number
          indirect_inference_allowed?: boolean | null
          integration_mode?: string
          manual_data_allowed?: boolean | null
          notes?: string | null
          plc_available?: boolean | null
          retrofit_required?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_integration_profiles_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: true
            referencedRelation: "factory_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_interventions: {
        Row: {
          asset_id: number
          created_at: string | null
          description: string | null
          event_id: number | null
          expected_saving_inr: number | null
          id: number
          intervention_date: string | null
          intervention_type: string | null
          status: string | null
        }
        Insert: {
          asset_id: number
          created_at?: string | null
          description?: string | null
          event_id?: number | null
          expected_saving_inr?: number | null
          id?: number
          intervention_date?: string | null
          intervention_type?: string | null
          status?: string | null
        }
        Update: {
          asset_id?: number
          created_at?: string | null
          description?: string | null
          event_id?: number | null
          expected_saving_inr?: number | null
          id?: number
          intervention_date?: string | null
          intervention_type?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_interventions_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "factory_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_interventions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "intelligence_events"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_measurements: {
        Row: {
          asset_id: number | null
          created_at: string | null
          id: number
          measured_at: string
          metrics: Json
          source: string
        }
        Insert: {
          asset_id?: number | null
          created_at?: string | null
          id?: number
          measured_at: string
          metrics: Json
          source?: string
        }
        Update: {
          asset_id?: number | null
          created_at?: string | null
          id?: number
          measured_at?: string
          metrics?: Json
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_measurements_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "factory_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_sensor_mappings: {
        Row: {
          asset_id: number
          available: boolean | null
          created_at: string | null
          diagnostic_value: string | null
          id: number
          installation_status: string | null
          measurement_class: string
          metric_name: string
          required: boolean | null
          sensor_type: string | null
          source_type: string | null
          unit: string | null
        }
        Insert: {
          asset_id: number
          available?: boolean | null
          created_at?: string | null
          diagnostic_value?: string | null
          id?: number
          installation_status?: string | null
          measurement_class: string
          metric_name: string
          required?: boolean | null
          sensor_type?: string | null
          source_type?: string | null
          unit?: string | null
        }
        Update: {
          asset_id?: number
          available?: boolean | null
          created_at?: string | null
          diagnostic_value?: string | null
          id?: number
          installation_status?: string | null
          measurement_class?: string
          metric_name?: string
          required?: boolean | null
          sensor_type?: string | null
          source_type?: string | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_sensor_mappings_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "factory_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostic_rules: {
        Row: {
          confidence_method: string | null
          created_at: string | null
          evidence_text: string
          financial_method: string | null
          id: number
          logic: Json
          machine_type_id: number | null
          possible_causes: Json
          problem_code: string
          problem_name: string
          recommended_checks: Json
          required_metrics: Json
          severity: string
        }
        Insert: {
          confidence_method?: string | null
          created_at?: string | null
          evidence_text: string
          financial_method?: string | null
          id?: number
          logic: Json
          machine_type_id?: number | null
          possible_causes: Json
          problem_code: string
          problem_name: string
          recommended_checks: Json
          required_metrics: Json
          severity?: string
        }
        Update: {
          confidence_method?: string | null
          created_at?: string | null
          evidence_text?: string
          financial_method?: string | null
          id?: number
          logic?: Json
          machine_type_id?: number | null
          possible_causes?: Json
          problem_code?: string
          problem_name?: string
          recommended_checks?: Json
          required_metrics?: Json
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_rules_machine_type_id_fkey"
            columns: ["machine_type_id"]
            isOneToOne: false
            referencedRelation: "machine_types"
            referencedColumns: ["id"]
          },
        ]
      }
      factories: {
        Row: {
          created_at: string | null
          id: number
          industry: string | null
          location: string | null
          metadata: Json | null
          name: string
          operating_days_per_month: number | null
          shifts_per_day: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          industry?: string | null
          location?: string | null
          metadata?: Json | null
          name: string
          operating_days_per_month?: number | null
          shifts_per_day?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          industry?: string | null
          location?: string | null
          metadata?: Json | null
          name?: string
          operating_days_per_month?: number | null
          shifts_per_day?: number | null
        }
        Relationships: []
      }
      factory_assets: {
        Row: {
          asset_metadata: Json | null
          calibration_status: string | null
          connectivity_mode: string | null
          created_at: string | null
          criticality: string | null
          factory_id: number | null
          id: number
          installation_year: number | null
          machine_type_id: number | null
          manufacturer: string | null
          model: string | null
          name: string
          process_role: string | null
          rated_capacity: string | null
          rated_power_kw: number | null
          retrofit_priority: string | null
          sensor_coverage_pct: number | null
        }
        Insert: {
          asset_metadata?: Json | null
          calibration_status?: string | null
          connectivity_mode?: string | null
          created_at?: string | null
          criticality?: string | null
          factory_id?: number | null
          id?: number
          installation_year?: number | null
          machine_type_id?: number | null
          manufacturer?: string | null
          model?: string | null
          name: string
          process_role?: string | null
          rated_capacity?: string | null
          rated_power_kw?: number | null
          retrofit_priority?: string | null
          sensor_coverage_pct?: number | null
        }
        Update: {
          asset_metadata?: Json | null
          calibration_status?: string | null
          connectivity_mode?: string | null
          created_at?: string | null
          criticality?: string | null
          factory_id?: number | null
          id?: number
          installation_year?: number | null
          machine_type_id?: number | null
          manufacturer?: string | null
          model?: string | null
          name?: string
          process_role?: string | null
          rated_capacity?: string | null
          rated_power_kw?: number | null
          retrofit_priority?: string | null
          sensor_coverage_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "factory_assets_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factory_assets_machine_type_id_fkey"
            columns: ["machine_type_id"]
            isOneToOne: false
            referencedRelation: "machine_types"
            referencedColumns: ["id"]
          },
        ]
      }
      intelligence_events: {
        Row: {
          asset_id: number | null
          confidence: number | null
          created_at: string | null
          estimated_impact_inr: number | null
          event_type: string
          evidence: Json
          id: number
          recommended_action: string | null
          severity: string
          status: string
        }
        Insert: {
          asset_id?: number | null
          confidence?: number | null
          created_at?: string | null
          estimated_impact_inr?: number | null
          event_type: string
          evidence: Json
          id?: number
          recommended_action?: string | null
          severity: string
          status?: string
        }
        Update: {
          asset_id?: number | null
          confidence?: number | null
          created_at?: string | null
          estimated_impact_inr?: number | null
          event_type?: string
          evidence?: Json
          id?: number
          recommended_action?: string | null
          severity?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "intelligence_events_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "factory_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      machine_types: {
        Row: {
          category: string
          created_at: string | null
          detection_targets: Json
          id: number
          machine_type: string
          optional_metrics: Json
          purpose: string
          required_metrics: Json
        }
        Insert: {
          category: string
          created_at?: string | null
          detection_targets: Json
          id?: number
          machine_type: string
          optional_metrics: Json
          purpose: string
          required_metrics: Json
        }
        Update: {
          category?: string
          created_at?: string | null
          detection_targets?: Json
          id?: number
          machine_type?: string
          optional_metrics?: Json
          purpose?: string
          required_metrics?: Json
        }
        Relationships: []
      }
      retrofit_assessments: {
        Row: {
          annual_downtime_cost_inr: number | null
          annual_energy_cost_inr: number | null
          asset_id: number
          created_at: string | null
          criticality_score: number | null
          decision: string | null
          diagnostic_value_score: number | null
          estimated_opportunity_inr: number | null
          expected_payback_months: number | null
          id: number
          instrumentation_cost_inr: number | null
          rationale: string | null
          retrofit_priority: string | null
        }
        Insert: {
          annual_downtime_cost_inr?: number | null
          annual_energy_cost_inr?: number | null
          asset_id: number
          created_at?: string | null
          criticality_score?: number | null
          decision?: string | null
          diagnostic_value_score?: number | null
          estimated_opportunity_inr?: number | null
          expected_payback_months?: number | null
          id?: number
          instrumentation_cost_inr?: number | null
          rationale?: string | null
          retrofit_priority?: string | null
        }
        Update: {
          annual_downtime_cost_inr?: number | null
          annual_energy_cost_inr?: number | null
          asset_id?: number
          created_at?: string | null
          criticality_score?: number | null
          decision?: string | null
          diagnostic_value_score?: number | null
          estimated_opportunity_inr?: number | null
          expected_payback_months?: number | null
          id?: number
          instrumentation_cost_inr?: number | null
          rationale?: string | null
          retrofit_priority?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "retrofit_assessments_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: true
            referencedRelation: "factory_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      savings_verifications: {
        Row: {
          asset_id: number | null
          baseline_end: string | null
          baseline_intensity: number | null
          baseline_start: string | null
          confidence: string | null
          created_at: string | null
          id: number
          intervention_id: number | null
          methodology: Json | null
          post_end: string | null
          post_intensity: number | null
          post_start: string | null
          production_normalized_saving: number | null
          status: string | null
          verified_saving_inr: number | null
        }
        Insert: {
          asset_id?: number | null
          baseline_end?: string | null
          baseline_intensity?: number | null
          baseline_start?: string | null
          confidence?: string | null
          created_at?: string | null
          id?: number
          intervention_id?: number | null
          methodology?: Json | null
          post_end?: string | null
          post_intensity?: number | null
          post_start?: string | null
          production_normalized_saving?: number | null
          status?: string | null
          verified_saving_inr?: number | null
        }
        Update: {
          asset_id?: number | null
          baseline_end?: string | null
          baseline_intensity?: number | null
          baseline_start?: string | null
          confidence?: string | null
          created_at?: string | null
          id?: number
          intervention_id?: number | null
          methodology?: Json | null
          post_end?: string | null
          post_intensity?: number | null
          post_start?: string | null
          production_normalized_saving?: number | null
          status?: string | null
          verified_saving_inr?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "savings_verifications_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "factory_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "savings_verifications_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "asset_interventions"
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
