import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Database } from "@/integrations/supabase/types";
import { assetMetadataFromEquipmentInput } from "../energy/equipment-metadata";
import { snapshotToFactory } from "../energy/factory-snapshot";

const { from, getSession } = vi.hoisted(() => ({ from: vi.fn(), getSession: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from, auth: { getSession } } }));

import { getAuthenticatedFactorySnapshots, getCanonicalOpportunities } from "./repository";

type Tables = Database["public"]["Tables"];
type Row<T extends keyof Tables> = Tables[T]["Row"];
const timestamp = "2026-10-01T00:00:00Z";

const opportunity = {
  id: 31,
  factory_id: 1,
  title: "Synthetic recoverable loss",
  status: "quantified",
  scope_type: "asset",
  scope_id: 7,
  deviation_id: 19,
  evidence_bundle_id: 23,
  gross_loss: 1200,
  avoidable_loss: 900,
  recoverable_opportunity: 600,
  expected_recovery: 0,
  intervention_cost: 150,
  expected_net_value: -150,
  expected_roi: null,
  expected_payback_months: null,
  measurement_confidence: 0.8,
  baseline_confidence: 0.7,
  causal_confidence: null,
  economic_confidence: 0,
  priority_score: 0,
  urgency: null,
  currency: "USD",
  economic_context_id: 5,
  description: null,
  created_at: timestamp,
  updated_at: timestamp,
} satisfies Row<"opportunities">;

const expectedOpportunity = {
  id: 31,
  factoryId: 1,
  title: "Synthetic recoverable loss",
  status: "quantified",
  scopeType: "asset",
  scopeId: 7,
  deviationId: 19,
  evidenceBundleId: 23,
  grossLoss: 1200,
  avoidableLoss: 900,
  recoverableOpportunity: 600,
  expectedRecovery: 0,
  interventionCost: 150,
  expectedNetValue: -150,
  expectedRoi: null,
  expectedPaybackMonths: null,
  measurementConfidence: 0.8,
  baselineConfidence: 0.7,
  causalConfidence: null,
  economicConfidence: 0,
  priorityScore: 0,
  urgency: null,
  currency: "USD",
};

const outcome = {
  id: 41,
  factory_id: 1,
  intervention_id: null,
  verification_run_id: 43,
  verification_status: "inconclusive",
  physical_effect: 0,
  economic_value: null,
  implementation_cost: 150,
  net_value: -150,
  currency: "USD",
  attribution_method: "synthetic controlled comparison",
  uncertainty_lower: -10,
  uncertainty_upper: 10,
  verified_at: null,
  verified_by: null,
  created_at: timestamp,
} satisfies Row<"verified_outcomes">;

const expectedOutcome = {
  id: 41,
  factoryId: 1,
  interventionId: null,
  verificationRunId: 43,
  verificationStatus: "inconclusive",
  physicalEffect: 0,
  economicValue: null,
  implementationCost: 150,
  netValue: -150,
  currency: "USD",
  attributionMethod: "synthetic controlled comparison",
  uncertaintyLower: -10,
  uncertaintyUpper: 10,
  verifiedAt: null,
  verifiedBy: null,
};

const factory = {
  id: 1,
  organization_id: 11,
  name: "Synthetic factory A",
  location: "Test location",
  industry: "Test industry",
  metadata: { timezone: "Asia/Kolkata", productUnit: "parts" },
  created_at: timestamp,
  operating_days_per_month: 22,
  shifts_per_day: 2,
} satisfies Row<"factories">;

const observation = {
  id: 51,
  factory_id: 1,
  subject_type: "factory",
  subject_id: 1,
  metric: "energy_kwh",
  value_numeric: 0,
  value_text: null,
  unit: "kWh",
  observed_at: timestamp,
  observed_until: "2026-11-01T00:00:00Z",
  data_source_id: 13,
  quality_status: "unverified",
  quality_score: null,
  is_estimated: false,
  provenance: { source_record_id: "synthetic-1" },
  metadata: { entry_key: "2026-10:kwh" },
  created_at: timestamp,
} satisfies Row<"observations">;

const equipment = { category: "compressor", quantity: 3, hoursPerMonth: 420, loadFactor: 0.65 };
const asset = {
  id: 7,
  factory_id: 1,
  name: "Synthetic compressor",
  machine_type_id: null,
  rated_power_kw: 75,
  process_role: "Compressed air",
  asset_metadata: assetMetadataFromEquipmentInput(equipment, { vendorReference: "synthetic-only" }),
};

type Response = { data: Record<string, unknown>[] | null; error: Error | null };
let responses: Record<string, Response>;

// Models projection and filters so omissions in the actual SELECT or scoping
// query affect the returned fixture. This is a read-boundary test, not live RLS proof.
function queryFor(table: string) {
  let columns = "*";
  const predicates: Array<(row: Record<string, unknown>) => boolean> = [];
  const query = {
    select: vi.fn((value: string) => {
      columns = value;
      return query;
    }),
    eq: vi.fn((key: string, value: unknown) => {
      predicates.push((row) => row[key] === value);
      return query;
    }),
    in: vi.fn((key: string, values: unknown[]) => {
      predicates.push((row) => values.includes(row[key]));
      return query;
    }),
    order: vi.fn(() => query),
    then(resolve: (response: Response) => unknown) {
      const result = responses[table];
      if (!result) throw new Error(`Unexpected table read: ${table}`);
      const data =
        result.data
          ?.filter((row) => predicates.every((predicate) => predicate(row)))
          .map((row) =>
            columns === "*"
              ? row
              : Object.fromEntries(columns.split(",").map((key) => [key, row[key]])),
          ) ?? null;
      return Promise.resolve(resolve({ data, error: result.error }));
    },
  };
  return query;
}

describe("canonical database read boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockResolvedValue({ data: { session: { user: { id: "synthetic-user" } } } });
    responses = {
      factories: { data: [factory, { ...factory, id: 2, organization_id: 12 }], error: null },
      factory_assets: {
        data: [
          asset,
          { ...asset, id: 8, asset_metadata: { lifecycle_status: "retired" } },
          { ...asset, id: 9, factory_id: 2 },
        ],
        error: null,
      },
      observations: { data: [observation, { ...observation, id: 52, factory_id: 2 }], error: null },
      opportunities: {
        data: [opportunity, { ...opportunity, id: 32, factory_id: 2 }],
        error: null,
      },
      asset_interventions: { data: [], error: null },
      verified_outcomes: { data: [outcome, { ...outcome, id: 42, factory_id: 2 }], error: null },
    };
    from.mockImplementation(queryFor);
  });

  it("maps the selected opportunity fields, currency, nulls, zero, negative net value and evidence links", async () => {
    expect(await getCanonicalOpportunities(1)).toEqual([expectedOpportunity]);
    const query = from.mock.results[0].value;
    expect(query.eq).toHaveBeenCalledWith("factory_id", 1);
    expect(query.order).toHaveBeenCalledWith("priority_score", {
      ascending: false,
      nullsFirst: false,
    });
  });

  it("uses the same opportunity mapping in snapshots and maps only stored outcome fields", async () => {
    const snapshots = await getAuthenticatedFactorySnapshots();
    expect(snapshots).toHaveLength(2);
    expect(snapshots[0].opportunities).toEqual([expectedOpportunity]);
    expect(snapshots[0].verifiedOutcomes).toEqual([expectedOutcome]);
    expect(snapshots[1].opportunities[0].factoryId).toBe(2);
    expect(snapshots[1].verifiedOutcomes[0].factoryId).toBe(2);
    expect(snapshots[0].verifiedOutcomes[0]).not.toHaveProperty("attributedEffect");
    expect(snapshots[0].verifiedOutcomes[0]).not.toHaveProperty("measurementConfidence");
  });

  it("round-trips persisted equipment metadata through the repository and actual workspace hydration", async () => {
    const [snapshot] = await getAuthenticatedFactorySnapshots();
    expect(snapshot.assets.map((value) => value.id)).toEqual([7]);
    expect(snapshot.assets[0].assetMetadata?.vendorReference).toBe("synthetic-only");
    expect(snapshotToFactory(snapshot).equipment).toEqual([
      { id: "7", name: asset.name, ratedKw: 75, ...equipment },
    ]);
    expect(snapshot.observations[0]).toMatchObject({
      valueNumeric: 0,
      qualityScore: null,
      isEstimated: false,
      dataSourceId: 13,
      provenance: observation.provenance,
    });
  });

  it("does not resurrect a cleared observation or convert missing metrics to zero on hydration", async () => {
    responses.observations.data!.push({
      ...observation,
      id: 53,
      value_numeric: null,
      quality_status: "missing",
      created_at: "2026-10-02T00:00:00Z",
    });
    const [snapshot] = await getAuthenticatedFactorySnapshots();
    const loaded = snapshotToFactory(snapshot);
    expect(Number.isNaN(loaded.months[0].kwh)).toBe(true);
    expect(Number.isNaN(loaded.months[0].production)).toBe(true);
    expect(loaded.opportunityStatus["31"]).toBe("quantified");
  });

  it("returns no factories and performs no table reads without a session", async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    expect(await getAuthenticatedFactorySnapshots()).toEqual([]);
    expect(from).not.toHaveBeenCalled();
  });

  it("does not query child tables when no factories are accessible", async () => {
    responses.factories.data = [];
    expect(await getAuthenticatedFactorySnapshots()).toEqual([]);
    expect(from).toHaveBeenCalledExactlyOnceWith("factories");
  });

  it("propagates read errors instead of presenting a partial snapshot as complete", async () => {
    const failure = new Error("Synthetic denied read");
    responses.verified_outcomes.error = failure;
    await expect(getAuthenticatedFactorySnapshots()).rejects.toThrow(failure);
    responses.opportunities.error = failure;
    await expect(getCanonicalOpportunities(1)).rejects.toThrow(failure);
  });
});
