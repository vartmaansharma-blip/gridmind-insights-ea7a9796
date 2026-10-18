import { describe, expect, it } from "vitest";
import {
  evaluateSyntheticResolveCase,
  fictionalResolutionScenario,
  syntheticResolveCaseSchema,
} from "./resolve-workflow";

describe("GridMind Resolve: synthetic decision boundaries", () => {
  it("keeps every discovery lane fictional and blocked before technical review", () => {
    for (const lane of ["R1", "R2", "R3"] as const) {
      const result = evaluateSyntheticResolveCase(fictionalResolutionScenario(lane));
      expect(result.stage).toBe("simulated_review_needed");
      expect(result.realProfessionalReview).toBe(false);
      expect(result.approvedForCustomerUse).toBe(false);
      expect(result.verifiedEconomicOutcome).toBe(false);
    }
  });

  it("rejects real origin and unexpected authority fields", () => {
    const scenario = fictionalResolutionScenario("R1");
    expect(syntheticResolveCaseSchema.safeParse({ ...scenario, origin: "customer" }).success).toBe(
      false,
    );
    expect(syntheticResolveCaseSchema.safeParse({ ...scenario, liveApproval: true }).success).toBe(
      false,
    );
  });

  it("fails closed when source rights or verification are missing", () => {
    const scene = fictionalResolutionScenario("R2");
    const source = scene.sources[0]!;
    const noRight = { ...scene, sources: [{ ...source, permission: "unknown" }] };
    expect(evaluateSyntheticResolveCase(noRight).stage).toBe("source_permission_needed");
    const unchecked = { ...scene, sources: [{ ...source, check: "unknown" }] };
    expect(evaluateSyntheticResolveCase(unchecked).stage).toBe("source_check_needed");
    const disputed = { ...scene, sources: [{ ...source, conflict: "source mismatch" }] };
    expect(evaluateSyntheticResolveCase(disputed).stage).toBe("source_conflict");
  });

  it("never treats a previous revision as a current review", () => {
    const scene = fictionalResolutionScenario("R3");
    expect(
      evaluateSyntheticResolveCase({
        ...scene,
        caseRevision: 2,
        simulatedReview: { revision: 1, decision: "accept", simulated: true },
      }).stage,
    ).toBe("revision_changed");
  });

  it("separates simulated reviewer and customer action decisions", () => {
    const scene = fictionalResolutionScenario("R1");
    const reviewed = {
      ...scene,
      simulatedReview: { revision: 1, decision: "accept", simulated: true },
    };
    expect(evaluateSyntheticResolveCase(reviewed).stage).toBe("customer_action_needed");
    const followup = {
      ...reviewed,
      actions: [
        {
          ownerRole: "fictional site lead",
          nextStep: "fictional follow-up",
          status: "planned",
          customerAuthorization: "fictionally_authorized",
        },
      ],
    };
    expect(evaluateSyntheticResolveCase(followup).stage).toBe("action_followup_needed");
  });

  it("simulated completion never verifies a real economic outcome", () => {
    const scene = fictionalResolutionScenario("R1");
    const outcome = evaluateSyntheticResolveCase({
      ...scene,
      simulatedReview: { revision: 1, decision: "accept", simulated: true },
      actions: [
        {
          ownerRole: "imaginary owner",
          nextStep: "fictional action",
          status: "fictionally_completed",
          customerAuthorization: "fictionally_authorized",
        },
      ],
      fictionalOutcome: {
        baseline: 8,
        observed: 5,
        unit: "fictional cases",
        limitation: "Fictional numbers cannot establish cause or economic value.",
      },
    });
    expect(outcome.stage).toBe("fictional_process_complete");
    expect(outcome.approvedForCustomerUse).toBe(false);
    expect(outcome.verifiedEconomicOutcome).toBe(false);
  });

  it("fails safe with duplicate sources", () => {
    const scene = fictionalResolutionScenario("R1");
    expect(
      evaluateSyntheticResolveCase({
        ...scene,
        sources: [scene.sources[0], scene.sources[0]],
      }).stage,
    ).toBe("source_conflict");
  });
  it("stops at missing sources, rejected reviews and missing measurements", () => {
    const scene = fictionalResolutionScenario("R3");
    expect(evaluateSyntheticResolveCase({ ...scene, sources: [] }).stage).toBe("source_needed");
    for (const [decision, expected] of [
      ["revise", "simulated_revision_requested"],
      ["reject", "simulated_review_rejected"],
    ]) {
      expect(
        evaluateSyntheticResolveCase({
          ...scene,
          simulatedReview: { revision: 1, decision, simulated: true },
        }).stage,
      ).toBe(expected);
    }
    expect(
      evaluateSyntheticResolveCase({
        ...scene,
        simulatedReview: { revision: 1, decision: "accept", simulated: true },
        actions: [
          {
            ownerRole: "Fictional owner",
            nextStep: "Fictional action",
            status: "fictionally_completed",
            customerAuthorization: "fictionally_authorized",
          },
        ],
      }).stage,
    ).toBe("measurement_missing");
  });
});
