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
          approved_at: string | null
          approved_by: string | null
          asset_id: number
          causal_basis_evidence_id: number | null
          created_at: string | null
          decision_id: number | null
          dependencies: Json
          description: string | null
          event_id: number | null
          expected_effect_lower: number | null
          expected_effect_unit: string | null
          expected_effect_upper: number | null
          expected_saving_inr: number | null
          factory_id: number
          id: number
          implementation_cost: number | null
          implementation_duration: string | null
          implementation_steps: Json
          intervention_date: string | null
          implemented_at: string | null
          intervention_type: string | null
          operating_constraints: Json
          opportunity_id: number | null
          preconditions: Json
          required_resources: Json
          responsible_role: string | null
          reversibility: string | null
          risk: Json
          rollback_plan: string | null
          safety_constraints: Json
          status: string | null
          target_scope_id: number | null
          target_scope_type: string | null
          updated_at: string
          verification_method: Json
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          asset_id: number
          causal_basis_evidence_id?: number | null
          created_at?: string | null
          decision_id?: number | null
          dependencies?: Json
          description?: string | null
          event_id?: number | null
          expected_effect_lower?: number | null
          expected_effect_unit?: string | null
          expected_effect_upper?: number | null
          expected_saving_inr?: number | null
          factory_id: number
          id?: number
          implementation_cost?: number | null
          implementation_duration?: string | null
          implementation_steps?: Json
          intervention_date?: string | null
          implemented_at?: string | null
          intervention_type?: string | null
          operating_constraints?: Json
          opportunity_id?: number | null
          preconditions?: Json
          required_resources?: Json
          responsible_role?: string | null
          reversibility?: string | null
          risk?: Json
          rollback_plan?: string | null
          safety_constraints?: Json
          status?: string | null
          target_scope_id?: number | null
          target_scope_type?: string | null
          updated_at?: string
          verification_method?: Json
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          asset_id?: number
          causal_basis_evidence_id?: number | null
          created_at?: string | null
          decision_id?: number | null
          dependencies?: Json
          description?: string | null
          event_id?: number | null
          expected_effect_lower?: number | null
          expected_effect_unit?: string | null
          expected_effect_upper?: number | null
          expected_saving_inr?: number | null
          factory_id?: number
          id?: number
          implementation_cost?: number | null
          implementation_duration?: string | null
          implementation_steps?: Json
          intervention_date?: string | null
          intervention_type?: string | null
          operating_constraints?: Json
          opportunity_id?: number | null
          preconditions?: Json
          required_resources?: Json
          responsible_role?: string | null
          reversibility?: string | null
          risk?: Json
          rollback_plan?: string | null
          safety_constraints?: Json
          status?: string | null
          target_scope_id?: number | null
          target_scope_type?: string | null
          updated_at?: string
          verification_method?: Json
        }
        Relationships: [
          {
            foreignKeyName: "asset_interventions_asset_factory_fkey"
            columns: ["asset_id", "factory_id"]
            isOneToOne: false
            referencedRelation: "factory_assets"
            referencedColumns: ["id", "factory_id"]
          },
          {
            foreignKeyName: "asset_interventions_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "factory_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_interventions_causal_evidence_fkey"
            columns: ["causal_basis_evidence_id"]
            isOneToOne: false
            referencedRelation: "evidence_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_interventions_decision_factory_fkey"
            columns: ["decision_id", "factory_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id", "factory_id"]
          },
          {
            foreignKeyName: "asset_interventions_decision_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_interventions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "intelligence_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_interventions_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_interventions_opportunity_factory_fkey"
            columns: ["opportunity_id", "factory_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id", "factory_id"]
          },
          {
            foreignKeyName: "asset_interventions_opportunity_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
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
      causal_hypotheses: {
        Row: {
          alternative_causes: Json
          candidate_cause: string
          causal_confidence: number | null
          contradicting_evidence: Json
          created_at: string
          expected_direction: string | null
          expected_magnitude: number | null
          factory_id: number
          id: number
          mechanism: string | null
          observed_outcome: string
          opportunity_id: number | null
          resolved_at: string | null
          status: string
          supporting_evidence: Json
          updated_at: string
        }
        Insert: {
          alternative_causes?: Json
          candidate_cause: string
          causal_confidence?: number | null
          contradicting_evidence?: Json
          created_at?: string
          expected_direction?: string | null
          expected_magnitude?: number | null
          factory_id: number
          id?: never
          mechanism?: string | null
          observed_outcome: string
          opportunity_id?: number | null
          resolved_at?: string | null
          status?: string
          supporting_evidence?: Json
          updated_at?: string
        }
        Update: {
          alternative_causes?: Json
          candidate_cause?: string
          causal_confidence?: number | null
          contradicting_evidence?: Json
          created_at?: string
          expected_direction?: string | null
          expected_magnitude?: number | null
          factory_id?: number
          id?: never
          mechanism?: string | null
          observed_outcome?: string
          opportunity_id?: number | null
          resolved_at?: string | null
          status?: string
          supporting_evidence?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "causal_hypotheses_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "causal_hypotheses_opportunity_fk"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hypotheses_opportunity_factory_fkey"
            columns: ["opportunity_id", "factory_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id", "factory_id"]
          },
        ]
      }
      causal_tests: {
        Row: {
          actual_result: string | null
          confidence: number | null
          created_at: string
          description: string
          evidence_bundle_id: number | null
          expected_result: string | null
          factory_id: number
          hypothesis_id: number
          id: number
          result: string | null
          test_end: string | null
          test_start: string | null
          test_type: string
        }
        Insert: {
          actual_result?: string | null
          confidence?: number | null
          created_at?: string
          description: string
          evidence_bundle_id?: number | null
          expected_result?: string | null
          factory_id: number
          hypothesis_id: number
          id?: never
          result?: string | null
          test_end?: string | null
          test_start?: string | null
          test_type: string
        }
        Update: {
          actual_result?: string | null
          confidence?: number | null
          created_at?: string
          description?: string
          evidence_bundle_id?: number | null
          expected_result?: string | null
          factory_id?: number
          hypothesis_id?: number
          id?: never
          result?: string | null
          test_end?: string | null
          test_start?: string | null
          test_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "causal_tests_evidence_bundle_id_fkey"
            columns: ["evidence_bundle_id"]
            isOneToOne: false
            referencedRelation: "evidence_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "causal_tests_evidence_factory_fkey"
            columns: ["evidence_bundle_id", "factory_id"]
            isOneToOne: false
            referencedRelation: "evidence_bundles"
            referencedColumns: ["id", "factory_id"]
          },
          {
            foreignKeyName: "causal_tests_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "causal_tests_hypothesis_factory_fkey"
            columns: ["hypothesis_id", "factory_id"]
            isOneToOne: false
            referencedRelation: "causal_hypotheses"
            referencedColumns: ["id", "factory_id"]
          },
          {
            foreignKeyName: "causal_tests_hypothesis_id_fkey"
            columns: ["hypothesis_id"]
            isOneToOne: false
            referencedRelation: "causal_hypotheses"
            referencedColumns: ["id"]
          },
        ]
      }
      data_source_mappings: {
        Row: {
          asset_id: number | null
          canonical_metric: string
          confidence: number | null
          created_at: string
          data_source_id: number
          factory_id: number
          id: number
          mapping_status: string
          metadata: Json
          source_field: string
          transformation: string | null
          unit: string | null
          updated_at: string
          validated_at: string | null
          validated_by: string | null
          version: number
        }
        Insert: {
          asset_id?: number | null
          canonical_metric: string
          confidence?: number | null
          created_at?: string
          data_source_id: number
          factory_id: number
          id?: never
          mapping_status?: string
          metadata?: Json
          source_field: string
          transformation?: string | null
          unit?: string | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          version?: number
        }
        Update: {
          asset_id?: number | null
          canonical_metric?: string
          confidence?: number | null
          created_at?: string
          data_source_id?: number
          factory_id?: number
          id?: never
          mapping_status?: string
          metadata?: Json
          source_field?: string
          transformation?: string | null
          unit?: string | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "data_source_mappings_asset_factory_fkey"
            columns: ["asset_id", "factory_id"]
            isOneToOne: false
            referencedRelation: "factory_assets"
            referencedColumns: ["id", "factory_id"]
          },
          {
            foreignKeyName: "data_source_mappings_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "factory_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_source_mappings_data_source_id_fkey"
            columns: ["data_source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_source_mappings_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_source_mappings_source_factory_fkey"
            columns: ["data_source_id", "factory_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id", "factory_id"]
          },
        ]
      }
      data_sources: {
        Row: {
          configuration_version: number
          connection_status: string
          created_at: string
          factory_id: number
          id: number
          last_ingested_at: string | null
          metadata: Json
          name: string
          quality_status: string
          sampling_frequency: string | null
          source_type: string
          timezone: string
          updated_at: string
        }
        Insert: {
          configuration_version?: number
          connection_status?: string
          created_at?: string
          factory_id: number
          id?: never
          last_ingested_at?: string | null
          metadata?: Json
          name: string
          quality_status?: string
          sampling_frequency?: string | null
          source_type: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          configuration_version?: number
          connection_status?: string
          created_at?: string
          factory_id?: number
          id?: never
          last_ingested_at?: string | null
          metadata?: Json
          name?: string
          quality_status?: string
          sampling_frequency?: string | null
          source_type?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_sources_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
        ]
      }
      decisions: {
        Row: {
          alternatives: Json
          approval_status: string
          constraints: Json
          created_at: string
          decided_at: string | null
          decision_basis: Json
          decision_maker: string | null
          dependencies: Json
          expected_value: number | null
          factory_id: number
          id: number
          objective: string
          opportunity_id: number | null
          review_at: string | null
          risk: Json
          selected_option: string | null
          updated_at: string
        }
        Insert: {
          alternatives?: Json
          approval_status?: string
          constraints?: Json
          created_at?: string
          decided_at?: string | null
          decision_basis?: Json
          decision_maker?: string | null
          dependencies?: Json
          expected_value?: number | null
          factory_id: number
          id?: never
          objective: string
          opportunity_id?: number | null
          review_at?: string | null
          risk?: Json
          selected_option?: string | null
          updated_at?: string
        }
        Update: {
          alternatives?: Json
          approval_status?: string
          constraints?: Json
          created_at?: string
          decided_at?: string | null
          decision_basis?: Json
          decision_maker?: string | null
          dependencies?: Json
          expected_value?: number | null
          factory_id?: number
          id?: never
          objective?: string
          opportunity_id?: number | null
          review_at?: string | null
          risk?: Json
          selected_option?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "decisions_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_opportunity_factory_fkey"
            columns: ["opportunity_id", "factory_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id", "factory_id"]
          },
          {
            foreignKeyName: "decisions_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      derived_facts: {
        Row: {
          assumptions: Json
          created_at: string
          derived_at: string
          fact_type: string
          factory_id: number
          formula: string | null
          formula_version: string | null
          id: number
          input_references: Json
          scope_id: number | null
          scope_type: string
          uncertainty: Json
          unit: string | null
          value_numeric: number | null
        }
        Insert: {
          assumptions?: Json
          created_at?: string
          derived_at?: string
          fact_type: string
          factory_id: number
          formula?: string | null
          formula_version?: string | null
          id?: never
          input_references?: Json
          scope_id?: number | null
          scope_type: string
          uncertainty?: Json
          unit?: string | null
          value_numeric?: number | null
        }
        Update: {
          assumptions?: Json
          created_at?: string
          derived_at?: string
          fact_type?: string
          factory_id?: number
          formula?: string | null
          formula_version?: string | null
          id?: never
          input_references?: Json
          scope_id?: number | null
          scope_type?: string
          uncertainty?: Json
          unit?: string | null
          value_numeric?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "derived_facts_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
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
            referencedRelation: "machine_type_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostic_rules_machine_type_id_fkey"
            columns: ["machine_type_id"]
            isOneToOne: false
            referencedRelation: "machine_types"
            referencedColumns: ["id"]
          },
        ]
      }
      economic_contexts: {
        Row: {
          capacity_value_reference: Json
          created_at: string
          currency: string
          downtime_cost_reference: Json
          effective_from: string | null
          effective_until: string | null
          factory_id: number
          id: number
          metadata: Json
          name: string
          production_value_reference: Json
          source: string | null
          status: string
          tariff_reference: Json
          updated_at: string
        }
        Insert: {
          capacity_value_reference?: Json
          created_at?: string
          currency?: string
          downtime_cost_reference?: Json
          effective_from?: string | null
          effective_until?: string | null
          factory_id: number
          id?: never
          metadata?: Json
          name: string
          production_value_reference?: Json
          source?: string | null
          status?: string
          tariff_reference?: Json
          updated_at?: string
        }
        Update: {
          capacity_value_reference?: Json
          created_at?: string
          currency?: string
          downtime_cost_reference?: Json
          effective_from?: string | null
          effective_until?: string | null
          factory_id?: number
          id?: never
          metadata?: Json
          name?: string
          production_value_reference?: Json
          source?: string | null
          status?: string
          tariff_reference?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "economic_contexts_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_bundles: {
        Row: {
          assumptions: Json
          claim_reference_id: number | null
          claim_type: string
          confidence: number | null
          contradicting_evidence: Json
          created_at: string
          factory_id: number
          id: number
          strength: string
          supporting_evidence: Json
          uncertainty: Json
          version: number
        }
        Insert: {
          assumptions?: Json
          claim_reference_id?: number | null
          claim_type: string
          confidence?: number | null
          contradicting_evidence?: Json
          created_at?: string
          factory_id: number
          id?: never
          strength?: string
          supporting_evidence?: Json
          uncertainty?: Json
          version?: number
        }
        Update: {
          assumptions?: Json
          claim_reference_id?: number | null
          claim_type?: string
          confidence?: number | null
          contradicting_evidence?: Json
          created_at?: string
          factory_id?: number
          id?: never
          strength?: string
          supporting_evidence?: Json
          uncertainty?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "evidence_bundles_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_links: {
        Row: {
          created_at: string
          evidence_bundle_id: number
          evidence_type: string
          factory_id: number
          id: number
          relationship: string
          source_id: number | null
          source_reference: Json
          strength: number | null
        }
        Insert: {
          created_at?: string
          evidence_bundle_id: number
          evidence_type: string
          factory_id: number
          id?: never
          relationship: string
          source_id?: number | null
          source_reference?: Json
          strength?: number | null
        }
        Update: {
          created_at?: string
          evidence_bundle_id?: number
          evidence_type?: string
          factory_id?: number
          id?: never
          relationship?: string
          source_id?: number | null
          source_reference?: Json
          strength?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "evidence_links_bundle_factory_fkey"
            columns: ["evidence_bundle_id", "factory_id"]
            isOneToOne: false
            referencedRelation: "evidence_bundles"
            referencedColumns: ["id", "factory_id"]
          },
          {
            foreignKeyName: "evidence_links_evidence_bundle_id_fkey"
            columns: ["evidence_bundle_id"]
            isOneToOne: false
            referencedRelation: "evidence_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_links_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
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
          organization_id: number
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
          organization_id: number
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
          organization_id?: number
          shifts_per_day?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "factories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      factory_assets: {
        Row: {
          asset_metadata: Json | null
          calibration_status: string | null
          connectivity_mode: string | null
          created_at: string | null
          criticality: string | null
          factory_id: number
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
          factory_id: number
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
          factory_id?: number
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
            referencedRelation: "machine_type_catalog"
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
      factory_members: {
        Row: {
          created_at: string
          factory_id: number
          id: number
          organization_id: number
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          factory_id: number
          id?: never
          organization_id: number
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          factory_id?: number
          id?: never
          organization_id?: number
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "factory_members_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factory_members_factory_org_fkey"
            columns: ["factory_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "factory_members_org_user_fkey"
            columns: ["organization_id", "user_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "user_id"]
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
      intervention_outcomes: {
        Row: {
          actual_change: Json
          created_at: string
          evidence_bundle_id: number | null
          factory_id: number
          id: number
          implementation_cost: number | null
          implementation_notes: string | null
          implementation_status: string
          implemented_at: string | null
          intervention_id: number
          observed_effect: Json
        }
        Insert: {
          actual_change?: Json
          created_at?: string
          evidence_bundle_id?: number | null
          factory_id: number
          id?: never
          implementation_cost?: number | null
          implementation_notes?: string | null
          implementation_status: string
          implemented_at?: string | null
          intervention_id: number
          observed_effect?: Json
        }
        Update: {
          actual_change?: Json
          created_at?: string
          evidence_bundle_id?: number | null
          factory_id?: number
          id?: never
          implementation_cost?: number | null
          implementation_notes?: string | null
          implementation_status?: string
          implemented_at?: string | null
          intervention_id?: number
          observed_effect?: Json
        }
        Relationships: [
          {
            foreignKeyName: "intervention_outcomes_evidence_bundle_id_fkey"
            columns: ["evidence_bundle_id"]
            isOneToOne: false
            referencedRelation: "evidence_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intervention_outcomes_evidence_factory_fkey"
            columns: ["evidence_bundle_id", "factory_id"]
            isOneToOne: false
            referencedRelation: "evidence_bundles"
            referencedColumns: ["id", "factory_id"]
          },
          {
            foreignKeyName: "intervention_outcomes_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intervention_outcomes_intervention_factory_fkey"
            columns: ["intervention_id", "factory_id"]
            isOneToOne: false
            referencedRelation: "asset_interventions"
            referencedColumns: ["id", "factory_id"]
          },
          {
            foreignKeyName: "intervention_outcomes_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "asset_interventions"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_events: {
        Row: {
          affected_knowledge: Json
          confidence: number | null
          created_at: string
          evidence_bundle_id: number | null
          factory_id: number
          generalization_level: string | null
          id: number
          learning_type: string
          new_knowledge_version: string | null
          old_knowledge_version: string | null
          prediction_error: number | null
          prediction_id: number | null
          scope: Json
          source_outcome_id: number | null
          validation_status: string
        }
        Insert: {
          affected_knowledge?: Json
          confidence?: number | null
          created_at?: string
          evidence_bundle_id?: number | null
          factory_id: number
          generalization_level?: string | null
          id?: never
          learning_type: string
          new_knowledge_version?: string | null
          old_knowledge_version?: string | null
          prediction_error?: number | null
          prediction_id?: number | null
          scope?: Json
          source_outcome_id?: number | null
          validation_status?: string
        }
        Update: {
          affected_knowledge?: Json
          confidence?: number | null
          created_at?: string
          evidence_bundle_id?: number | null
          factory_id?: number
          generalization_level?: string | null
          id?: never
          learning_type?: string
          new_knowledge_version?: string | null
          old_knowledge_version?: string | null
          prediction_error?: number | null
          prediction_id?: number | null
          scope?: Json
          source_outcome_id?: number | null
          validation_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_events_evidence_bundle_id_fkey"
            columns: ["evidence_bundle_id"]
            isOneToOne: false
            referencedRelation: "evidence_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_events_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_events_source_outcome_id_fkey"
            columns: ["source_outcome_id"]
            isOneToOne: false
            referencedRelation: "verified_outcomes"
            referencedColumns: ["id"]
          },
        ]
      }
      machine_measurement_definitions: {
        Row: {
          canonical_unit: string | null
          category: string
          created_at: string
          diagnostic_uses: Json
          display_name: string
          economic_relevance: string | null
          id: number
          machine_type_id: number
          physical_meaning: string
          preferred_sources: Json
          quality_rules: Json
          requiredness: string
          signal_key: string
          updated_at: string
          why_it_matters: string | null
        }
        Insert: {
          canonical_unit?: string | null
          category: string
          created_at?: string
          diagnostic_uses?: Json
          display_name: string
          economic_relevance?: string | null
          id?: number
          machine_type_id: number
          physical_meaning: string
          preferred_sources?: Json
          quality_rules?: Json
          requiredness: string
          signal_key: string
          updated_at?: string
          why_it_matters?: string | null
        }
        Update: {
          canonical_unit?: string | null
          category?: string
          created_at?: string
          diagnostic_uses?: Json
          display_name?: string
          economic_relevance?: string | null
          id?: number
          machine_type_id?: number
          physical_meaning?: string
          preferred_sources?: Json
          quality_rules?: Json
          requiredness?: string
          signal_key?: string
          updated_at?: string
          why_it_matters?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "machine_measurement_definitions_machine_type_id_fkey"
            columns: ["machine_type_id"]
            isOneToOne: false
            referencedRelation: "machine_type_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machine_measurement_definitions_machine_type_id_fkey"
            columns: ["machine_type_id"]
            isOneToOne: false
            referencedRelation: "machine_types"
            referencedColumns: ["id"]
          },
        ]
      }
      machine_type_knowledge: {
        Row: {
          calibration: Json
          components: Json
          created_at: string
          data_sources: Json
          diagnostic_scope: Json
          economics: Json
          failure_modes: Json
          id: number
          industrial_protocols: Json
          inputs: Json
          intervention_types: Json
          knowledge_status: string
          machine_type_id: number
          measurement_requirements: Json
          operating_principle: string | null
          operating_states: Json
          outputs: Json
          performance_reference: Json
          provenance: Json
          safety: Json
          schema_version: string
          updated_at: string
          validation_status: string
        }
        Insert: {
          calibration?: Json
          components?: Json
          created_at?: string
          data_sources?: Json
          diagnostic_scope?: Json
          economics?: Json
          failure_modes?: Json
          id?: number
          industrial_protocols?: Json
          inputs?: Json
          intervention_types?: Json
          knowledge_status?: string
          machine_type_id: number
          measurement_requirements?: Json
          operating_principle?: string | null
          operating_states?: Json
          outputs?: Json
          performance_reference?: Json
          provenance?: Json
          safety?: Json
          schema_version?: string
          updated_at?: string
          validation_status?: string
        }
        Update: {
          calibration?: Json
          components?: Json
          created_at?: string
          data_sources?: Json
          diagnostic_scope?: Json
          economics?: Json
          failure_modes?: Json
          id?: number
          industrial_protocols?: Json
          inputs?: Json
          intervention_types?: Json
          knowledge_status?: string
          machine_type_id?: number
          measurement_requirements?: Json
          operating_principle?: string | null
          operating_states?: Json
          outputs?: Json
          performance_reference?: Json
          provenance?: Json
          safety?: Json
          schema_version?: string
          updated_at?: string
          validation_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "machine_type_knowledge_machine_type_id_fkey"
            columns: ["machine_type_id"]
            isOneToOne: true
            referencedRelation: "machine_type_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machine_type_knowledge_machine_type_id_fkey"
            columns: ["machine_type_id"]
            isOneToOne: true
            referencedRelation: "machine_types"
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
      observations: {
        Row: {
          created_at: string
          data_source_id: number | null
          factory_id: number
          id: number
          is_estimated: boolean
          metadata: Json
          metric: string
          observed_at: string
          observed_until: string | null
          provenance: Json
          quality_score: number | null
          quality_status: string
          subject_id: number | null
          subject_type: string
          unit: string | null
          value_numeric: number | null
          value_text: string | null
        }
        Insert: {
          created_at?: string
          data_source_id?: number | null
          factory_id: number
          id?: never
          is_estimated?: boolean
          metadata?: Json
          metric: string
          observed_at: string
          observed_until?: string | null
          provenance?: Json
          quality_score?: number | null
          quality_status?: string
          subject_id?: number | null
          subject_type: string
          unit?: string | null
          value_numeric?: number | null
          value_text?: string | null
        }
        Update: {
          created_at?: string
          data_source_id?: number | null
          factory_id?: number
          id?: never
          is_estimated?: boolean
          metadata?: Json
          metric?: string
          observed_at?: string
          observed_until?: string | null
          provenance?: Json
          quality_score?: number | null
          quality_status?: string
          subject_id?: number | null
          subject_type?: string
          unit?: string | null
          value_numeric?: number | null
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "observations_data_source_id_fkey"
            columns: ["data_source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_source_factory_fkey"
            columns: ["data_source_id", "factory_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id", "factory_id"]
          },
        ]
      }
      operating_contexts: {
        Row: {
          confidence: number | null
          context_type: string
          created_at: string
          end_time: string | null
          factory_id: number
          id: number
          metadata: Json
          scope_id: number | null
          scope_type: string
          source_id: number | null
          start_time: string
          status: string
          values: Json
        }
        Insert: {
          confidence?: number | null
          context_type: string
          created_at?: string
          end_time?: string | null
          factory_id: number
          id?: never
          metadata?: Json
          scope_id?: number | null
          scope_type: string
          source_id?: number | null
          start_time: string
          status?: string
          values?: Json
        }
        Update: {
          confidence?: number | null
          context_type?: string
          created_at?: string
          end_time?: string | null
          factory_id?: number
          id?: never
          metadata?: Json
          scope_id?: number | null
          scope_type?: string
          source_id?: number | null
          start_time?: string
          status?: string
          values?: Json
        }
        Relationships: [
          {
            foreignKeyName: "operating_contexts_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operating_contexts_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      operating_regimes: {
        Row: {
          confidence: number | null
          created_at: string
          end_time: string | null
          factory_id: number
          id: number
          metadata: Json
          method: string | null
          name: string
          regime_type: string
          scope_id: number | null
          scope_type: string
          start_time: string
          version: number
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          end_time?: string | null
          factory_id: number
          id?: never
          metadata?: Json
          method?: string | null
          name: string
          regime_type: string
          scope_id?: number | null
          scope_type: string
          start_time: string
          version?: number
        }
        Update: {
          confidence?: number | null
          created_at?: string
          end_time?: string | null
          factory_id?: number
          id?: never
          metadata?: Json
          method?: string | null
          name?: string
          regime_type?: string
          scope_id?: number | null
          scope_type?: string
          start_time?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "operating_regimes_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          avoidable_loss: number | null
          baseline_confidence: number | null
          causal_confidence: number | null
          created_at: string
          currency: string
          description: string | null
          deviation_id: number | null
          economic_confidence: number | null
          economic_context_id: number | null
          evidence_bundle_id: number | null
          expected_net_value: number | null
          expected_payback_months: number | null
          expected_recovery: number | null
          expected_roi: number | null
          factory_id: number
          gross_loss: number | null
          id: number
          intervention_cost: number | null
          measurement_confidence: number | null
          priority_score: number | null
          recoverable_opportunity: number | null
          scope_id: number | null
          scope_type: string
          status: string
          title: string
          updated_at: string
          urgency: string | null
        }
        Insert: {
          avoidable_loss?: number | null
          baseline_confidence?: number | null
          causal_confidence?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          deviation_id?: number | null
          economic_confidence?: number | null
          economic_context_id?: number | null
          evidence_bundle_id?: number | null
          expected_net_value?: number | null
          expected_payback_months?: number | null
          expected_recovery?: number | null
          expected_roi?: number | null
          factory_id: number
          gross_loss?: number | null
          id?: never
          intervention_cost?: number | null
          measurement_confidence?: number | null
          priority_score?: number | null
          recoverable_opportunity?: number | null
          scope_id?: number | null
          scope_type: string
          status?: string
          title: string
          updated_at?: string
          urgency?: string | null
        }
        Update: {
          avoidable_loss?: number | null
          baseline_confidence?: number | null
          causal_confidence?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          deviation_id?: number | null
          economic_confidence?: number | null
          economic_context_id?: number | null
          evidence_bundle_id?: number | null
          expected_net_value?: number | null
          expected_payback_months?: number | null
          expected_recovery?: number | null
          expected_roi?: number | null
          factory_id?: number
          gross_loss?: number | null
          id?: never
          intervention_cost?: number | null
          measurement_confidence?: number | null
          priority_score?: number | null
          recoverable_opportunity?: number | null
          scope_id?: number | null
          scope_type?: string
          status?: string
          title?: string
          updated_at?: string
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_deviation_factory_fkey"
            columns: ["deviation_id", "factory_id"]
            isOneToOne: false
            referencedRelation: "performance_deviations"
            referencedColumns: ["id", "factory_id"]
          },
          {
            foreignKeyName: "opportunities_deviation_id_fkey"
            columns: ["deviation_id"]
            isOneToOne: false
            referencedRelation: "performance_deviations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_economic_context_factory_fkey"
            columns: ["economic_context_id", "factory_id"]
            isOneToOne: false
            referencedRelation: "economic_contexts"
            referencedColumns: ["id", "factory_id"]
          },
          {
            foreignKeyName: "opportunities_evidence_bundle_id_fkey"
            columns: ["evidence_bundle_id"]
            isOneToOne: false
            referencedRelation: "evidence_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_evidence_factory_fkey"
            columns: ["evidence_bundle_id", "factory_id"]
            isOneToOne: false
            referencedRelation: "evidence_bundles"
            referencedColumns: ["id", "factory_id"]
          },
          {
            foreignKeyName: "opportunities_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: number
          organization_id: number
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: never
          organization_id: number
          role?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: never
          organization_id?: number
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          country: string
          created_at: string
          id: number
          industry: string | null
          legal_name: string | null
          name: string
          status: string
          timezone: string
          updated_at: string
        }
        Insert: {
          country?: string
          created_at?: string
          id?: never
          industry?: string | null
          legal_name?: string | null
          name: string
          status?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          country?: string
          created_at?: string
          id?: never
          industry?: string | null
          legal_name?: string | null
          name?: string
          status?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      performance_baselines: {
        Row: {
          assumptions: Json
          confidence: number | null
          context_variables: Json
          created_at: string
          factory_id: number
          id: number
          method: string
          metric: string
          model_reference: string | null
          scope_id: number | null
          scope_type: string
          status: string
          training_end: string | null
          training_start: string | null
          uncertainty_method: string | null
          updated_at: string
          valid_from: string | null
          valid_until: string | null
          version: number
        }
        Insert: {
          assumptions?: Json
          confidence?: number | null
          context_variables?: Json
          created_at?: string
          factory_id: number
          id?: never
          method: string
          metric: string
          model_reference?: string | null
          scope_id?: number | null
          scope_type: string
          status?: string
          training_end?: string | null
          training_start?: string | null
          uncertainty_method?: string | null
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
          version?: number
        }
        Update: {
          assumptions?: Json
          confidence?: number | null
          context_variables?: Json
          created_at?: string
          factory_id?: number
          id?: never
          method?: string
          metric?: string
          model_reference?: string | null
          scope_id?: number | null
          scope_type?: string
          status?: string
          training_end?: string | null
          training_start?: string | null
          uncertainty_method?: string | null
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "performance_baselines_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_deviations: {
        Row: {
          actual_value: number | null
          created_at: string
          deviation_percentage: number | null
          deviation_value: number | null
          direction: string
          economic_materiality: string | null
          engineering_significance: string | null
          expectation_id: number
          expected_value: number | null
          factory_id: number
          id: number
          metric: string
          observation_id: number
          persistence: string | null
          scope_id: number | null
          scope_type: string
          statistical_significance: string | null
          status: string
        }
        Insert: {
          actual_value?: number | null
          created_at?: string
          deviation_percentage?: number | null
          deviation_value?: number | null
          direction: string
          economic_materiality?: string | null
          engineering_significance?: string | null
          expectation_id: number
          expected_value?: number | null
          factory_id: number
          id?: never
          metric: string
          observation_id: number
          persistence?: string | null
          scope_id?: number | null
          scope_type: string
          statistical_significance?: string | null
          status?: string
        }
        Update: {
          actual_value?: number | null
          created_at?: string
          deviation_percentage?: number | null
          deviation_value?: number | null
          direction?: string
          economic_materiality?: string | null
          engineering_significance?: string | null
          expectation_id?: number
          expected_value?: number | null
          factory_id?: number
          id?: never
          metric?: string
          observation_id?: number
          persistence?: string | null
          scope_id?: number | null
          scope_type?: string
          statistical_significance?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "deviations_expectation_factory_fkey"
            columns: ["expectation_id", "factory_id"]
            isOneToOne: false
            referencedRelation: "performance_expectations"
            referencedColumns: ["id", "factory_id"]
          },
          {
            foreignKeyName: "deviations_observation_factory_fkey"
            columns: ["observation_id", "factory_id"]
            isOneToOne: false
            referencedRelation: "observations"
            referencedColumns: ["id", "factory_id"]
          },
          {
            foreignKeyName: "performance_deviations_expectation_id_fkey"
            columns: ["expectation_id"]
            isOneToOne: false
            referencedRelation: "performance_expectations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_deviations_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_deviations_observation_id_fkey"
            columns: ["observation_id"]
            isOneToOne: false
            referencedRelation: "observations"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_expectations: {
        Row: {
          baseline_id: number
          confidence: number | null
          context_id: number | null
          expected_value: number
          factory_id: number
          generated_at: string
          id: number
          lower_bound: number | null
          metadata: Json
          metric: string
          scope_id: number | null
          scope_type: string
          unit: string | null
          upper_bound: number | null
          valid_for_end: string | null
          valid_for_start: string | null
        }
        Insert: {
          baseline_id: number
          confidence?: number | null
          context_id?: number | null
          expected_value: number
          factory_id: number
          generated_at?: string
          id?: never
          lower_bound?: number | null
          metadata?: Json
          metric: string
          scope_id?: number | null
          scope_type: string
          unit?: string | null
          upper_bound?: number | null
          valid_for_end?: string | null
          valid_for_start?: string | null
        }
        Update: {
          baseline_id?: number
          confidence?: number | null
          context_id?: number | null
          expected_value?: number
          factory_id?: number
          generated_at?: string
          id?: never
          lower_bound?: number | null
          metadata?: Json
          metric?: string
          scope_id?: number | null
          scope_type?: string
          unit?: string | null
          upper_bound?: number | null
          valid_for_end?: string | null
          valid_for_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expectations_baseline_factory_fkey"
            columns: ["baseline_id", "factory_id"]
            isOneToOne: false
            referencedRelation: "performance_baselines"
            referencedColumns: ["id", "factory_id"]
          },
          {
            foreignKeyName: "expectations_context_factory_fkey"
            columns: ["context_id", "factory_id"]
            isOneToOne: false
            referencedRelation: "operating_contexts"
            referencedColumns: ["id", "factory_id"]
          },
          {
            foreignKeyName: "performance_expectations_baseline_id_fkey"
            columns: ["baseline_id"]
            isOneToOne: false
            referencedRelation: "performance_baselines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_expectations_context_id_fkey"
            columns: ["context_id"]
            isOneToOne: false
            referencedRelation: "operating_contexts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_expectations_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
        ]
      }
      physical_relationships: {
        Row: {
          confidence: number | null
          created_at: string
          factory_id: number
          id: number
          metadata: Json
          relationship_type: string
          source_asset_id: number
          source_id: number | null
          status: string
          target_asset_id: number
          updated_at: string
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          factory_id: number
          id?: never
          metadata?: Json
          relationship_type: string
          source_asset_id: number
          source_id?: number | null
          status?: string
          target_asset_id: number
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string
          factory_id?: number
          id?: never
          metadata?: Json
          relationship_type?: string
          source_asset_id?: number
          source_id?: number | null
          status?: string
          target_asset_id?: number
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "physical_relationships_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_relationships_source_asset_id_fkey"
            columns: ["source_asset_id"]
            isOneToOne: false
            referencedRelation: "factory_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_relationships_source_factory_fkey"
            columns: ["source_asset_id", "factory_id"]
            isOneToOne: false
            referencedRelation: "factory_assets"
            referencedColumns: ["id", "factory_id"]
          },
          {
            foreignKeyName: "physical_relationships_target_asset_id_fkey"
            columns: ["target_asset_id"]
            isOneToOne: false
            referencedRelation: "factory_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_relationships_target_factory_fkey"
            columns: ["target_asset_id", "factory_id"]
            isOneToOne: false
            referencedRelation: "factory_assets"
            referencedColumns: ["id", "factory_id"]
          },
        ]
      }
      processes: {
        Row: {
          code: string | null
          created_at: string
          factory_id: number
          id: number
          metadata: Json
          name: string
          parent_process_id: number | null
          process_type: string | null
          status: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          factory_id: number
          id?: never
          metadata?: Json
          name: string
          parent_process_id?: number | null
          process_type?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          factory_id?: number
          id?: never
          metadata?: Json
          name?: string
          parent_process_id?: number | null
          process_type?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "processes_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processes_parent_factory_fkey"
            columns: ["parent_process_id", "factory_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id", "factory_id"]
          },
          {
            foreignKeyName: "processes_parent_process_id_fkey"
            columns: ["parent_process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          code: string | null
          created_at: string
          factory_id: number
          id: number
          metadata: Json
          name: string
          status: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          factory_id: number
          id?: never
          metadata?: Json
          name: string
          status?: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          factory_id?: number
          id?: never
          metadata?: Json
          name?: string
          status?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
        ]
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
      verification_plans: {
        Row: {
          approved_at: string | null
          attribution_method: string | null
          baseline_id: number | null
          baseline_period: Json
          confounders: Json
          context_variables: Json
          counterfactual_method: string
          created_at: string
          factory_id: number
          id: number
          intervention_id: number | null
          opportunity_id: number | null
          success_criteria: Json
          target_metric: string
          verification_period: Json
          verification_window: Json
        }
        Insert: {
          approved_at?: string | null
          attribution_method?: string | null
          baseline_id?: number | null
          baseline_period?: Json
          confounders?: Json
          context_variables?: Json
          counterfactual_method: string
          created_at?: string
          factory_id: number
          id?: never
          intervention_id?: number | null
          opportunity_id?: number | null
          success_criteria?: Json
          target_metric: string
          verification_period?: Json
          verification_window?: Json
        }
        Update: {
          approved_at?: string | null
          attribution_method?: string | null
          baseline_id?: number | null
          baseline_period?: Json
          confounders?: Json
          context_variables?: Json
          counterfactual_method?: string
          created_at?: string
          factory_id?: number
          id?: never
          intervention_id?: number | null
          opportunity_id?: number | null
          success_criteria?: Json
          target_metric?: string
          verification_period?: Json
          verification_window?: Json
        }
        Relationships: [
          {
            foreignKeyName: "verification_plans_baseline_factory_fkey"
            columns: ["baseline_id", "factory_id"]
            isOneToOne: false
            referencedRelation: "performance_baselines"
            referencedColumns: ["id", "factory_id"]
          },
          {
            foreignKeyName: "verification_plans_baseline_id_fkey"
            columns: ["baseline_id"]
            isOneToOne: false
            referencedRelation: "performance_baselines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_plans_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_plans_intervention_factory_fkey"
            columns: ["intervention_id", "factory_id"]
            isOneToOne: false
            referencedRelation: "asset_interventions"
            referencedColumns: ["id", "factory_id"]
          },
          {
            foreignKeyName: "verification_plans_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "asset_interventions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_plans_opportunity_factory_fkey"
            columns: ["opportunity_id", "factory_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id", "factory_id"]
          },
          {
            foreignKeyName: "verification_plans_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_runs: {
        Row: {
          attributed_effect: number | null
          attribution_confidence: number | null
          baseline_confidence: number | null
          baseline_value: number | null
          counterfactual_value: number | null
          created_at: string
          economic_confidence: number | null
          evidence_bundle_id: number | null
          exceptions: Json
          factory_id: number
          id: number
          measurement_confidence: number | null
          observed_value: number | null
          run_end: string | null
          run_start: string | null
          status: string
          uncertainty_lower: number | null
          uncertainty_upper: number | null
          verification_plan_id: number
        }
        Insert: {
          attributed_effect?: number | null
          attribution_confidence?: number | null
          baseline_confidence?: number | null
          baseline_value?: number | null
          counterfactual_value?: number | null
          created_at?: string
          economic_confidence?: number | null
          evidence_bundle_id?: number | null
          exceptions?: Json
          factory_id: number
          id?: never
          measurement_confidence?: number | null
          observed_value?: number | null
          run_end?: string | null
          run_start?: string | null
          status?: string
          uncertainty_lower?: number | null
          uncertainty_upper?: number | null
          verification_plan_id: number
        }
        Update: {
          attributed_effect?: number | null
          attribution_confidence?: number | null
          baseline_confidence?: number | null
          baseline_value?: number | null
          counterfactual_value?: number | null
          created_at?: string
          economic_confidence?: number | null
          evidence_bundle_id?: number | null
          exceptions?: Json
          factory_id?: number
          id?: never
          measurement_confidence?: number | null
          observed_value?: number | null
          run_end?: string | null
          run_start?: string | null
          status?: string
          uncertainty_lower?: number | null
          uncertainty_upper?: number | null
          verification_plan_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "verification_runs_evidence_bundle_id_fkey"
            columns: ["evidence_bundle_id"]
            isOneToOne: false
            referencedRelation: "evidence_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_runs_evidence_factory_fkey"
            columns: ["evidence_bundle_id", "factory_id"]
            isOneToOne: false
            referencedRelation: "evidence_bundles"
            referencedColumns: ["id", "factory_id"]
          },
          {
            foreignKeyName: "verification_runs_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_runs_plan_factory_fkey"
            columns: ["verification_plan_id", "factory_id"]
            isOneToOne: false
            referencedRelation: "verification_plans"
            referencedColumns: ["id", "factory_id"]
          },
          {
            foreignKeyName: "verification_runs_verification_plan_id_fkey"
            columns: ["verification_plan_id"]
            isOneToOne: false
            referencedRelation: "verification_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      verified_outcomes: {
        Row: {
          attribution_method: string | null
          created_at: string
          currency: string
          economic_value: number | null
          factory_id: number
          id: number
          implementation_cost: number | null
          intervention_id: number | null
          net_value: number | null
          physical_effect: number | null
          uncertainty_lower: number | null
          uncertainty_upper: number | null
          verification_run_id: number
          verification_status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          attribution_method?: string | null
          created_at?: string
          currency?: string
          economic_value?: number | null
          factory_id: number
          id?: never
          implementation_cost?: number | null
          intervention_id?: number | null
          net_value?: number | null
          physical_effect?: number | null
          uncertainty_lower?: number | null
          uncertainty_upper?: number | null
          verification_run_id: number
          verification_status: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          attribution_method?: string | null
          created_at?: string
          currency?: string
          economic_value?: number | null
          factory_id?: number
          id?: never
          implementation_cost?: number | null
          intervention_id?: number | null
          net_value?: number | null
          physical_effect?: number | null
          uncertainty_lower?: number | null
          uncertainty_upper?: number | null
          verification_run_id?: number
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verified_outcomes_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verified_outcomes_intervention_factory_fkey"
            columns: ["intervention_id", "factory_id"]
            isOneToOne: false
            referencedRelation: "asset_interventions"
            referencedColumns: ["id", "factory_id"]
          },
          {
            foreignKeyName: "verified_outcomes_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "asset_interventions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verified_outcomes_run_factory_fkey"
            columns: ["verification_run_id", "factory_id"]
            isOneToOne: false
            referencedRelation: "verification_runs"
            referencedColumns: ["id", "factory_id"]
          },
          {
            foreignKeyName: "verified_outcomes_verification_run_id_fkey"
            columns: ["verification_run_id"]
            isOneToOne: false
            referencedRelation: "verification_runs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      machine_measurement_catalog: {
        Row: {
          canonical_unit: string | null
          category: string | null
          diagnostic_uses: Json | null
          display_name: string | null
          economic_relevance: string | null
          id: number | null
          machine_type: string | null
          machine_type_id: number | null
          physical_meaning: string | null
          preferred_sources: Json | null
          quality_rules: Json | null
          requiredness: string | null
          signal_key: string | null
          why_it_matters: string | null
        }
        Relationships: [
          {
            foreignKeyName: "machine_measurement_definitions_machine_type_id_fkey"
            columns: ["machine_type_id"]
            isOneToOne: false
            referencedRelation: "machine_type_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machine_measurement_definitions_machine_type_id_fkey"
            columns: ["machine_type_id"]
            isOneToOne: false
            referencedRelation: "machine_types"
            referencedColumns: ["id"]
          },
        ]
      }
      machine_type_catalog: {
        Row: {
          calibration: Json | null
          category: string | null
          components: Json | null
          data_sources: Json | null
          detection_targets: Json | null
          diagnostic_scope: Json | null
          economics: Json | null
          failure_modes: Json | null
          id: number | null
          industrial_protocols: Json | null
          inputs: Json | null
          intervention_types: Json | null
          knowledge_status: string | null
          machine_type: string | null
          measurement_requirements: Json | null
          operating_principle: string | null
          operating_states: Json | null
          optional_metrics: Json | null
          outputs: Json | null
          performance_reference: Json | null
          provenance: Json | null
          purpose: string | null
          required_metrics: Json | null
          safety: Json | null
          schema_version: string | null
          validation_status: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_factory_workspace: {
        Args: { p_industry?: string; p_location?: string; p_name: string }
        Returns: number
      }
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
