import { describe, expect, it } from "vitest";
import {
  assessSyntheticException,
  resolveLaneSchema,
  syntheticExceptionSchema,
  SYNTHETIC_EXCEPTION_EXAMPLES,
} from "./resolve-intake";

describe("GridMind Resolve synthetic commercial intake", () => {
  it("keeps all three commercial lanes as fictional discovery-only examples", () => {
    for (const lane of resolveLaneSchema.options) {
      const result = assessSyntheticException(SYNTHETIC_EXCEPTION_EXAMPLES[lane]);
      expect(result.lane).toBe(lane);
      expect(result.readiness).toBe("synthetic_discovery_only");
      expect(result.approvedForCustomerUse).toBe(false);
      expect(result.verifiedEconomicOutcome).toBe(false);
      expect(result.nextQuestions).toHaveLength(3);
    }
  });

  it("rejects live/customer-origin data and unsupported lane identifiers", () => {
    expect(
      syntheticExceptionSchema.safeParse({
        ...SYNTHETIC_EXCEPTION_EXAMPLES.R1,
        origin: "customer",
      }).success,
    ).toBe(false);
    expect(
      syntheticExceptionSchema.safeParse({
        ...SYNTHETIC_EXCEPTION_EXAMPLES.R1,
        lane: "C2",
      }).success,
    ).toBe(false);
  });

  it("rejects surprise financial or technical claim fields", () => {
    expect(
      syntheticExceptionSchema.safeParse({
        ...SYNTHETIC_EXCEPTION_EXAMPLES.R2,
        guaranteedCollection: true,
      }).success,
    ).toBe(false);
  });

  it("never turns a fully filled fictional intake into approved customer work", () => {
    const result = assessSyntheticException({
      ...SYNTHETIC_EXCEPTION_EXAMPLES.R1,
      evidenceReferences: ["FICTIONAL-DOCUMENT-001"],
      qualifiedReviewerConfirmed: true,
      actualBuyerNextStepConfirmed: true,
    });
    expect(result.nextQuestions).toEqual([]);
    expect(result.approvedForCustomerUse).toBe(false);
    expect(result.verifiedEconomicOutcome).toBe(false);
    expect(result.readiness).toBe("synthetic_discovery_only");
  });
});
