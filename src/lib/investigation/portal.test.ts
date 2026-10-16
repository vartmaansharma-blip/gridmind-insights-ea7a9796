import { describe, it, expect } from "vitest";
import { syntheticCase } from "./fixtures";
import { projectCustomerCase } from "./portal-service";
import { customerBrief } from "./customer-brief";
import { portalCommandSchema } from "./portal-contract";
describe("customer projection and commands", () => {
  it("does not expose internal economics, source custody, open hypotheses, raw snapshots or reviewer deliberations", () => {
    const c = syntheticCase("C4", "10000000-0000-4000-8000-000000000001");
    c.expenses = [{ id: "secret", category: "other", reference: "PRIVATE MARGIN", amount: 321 }];
    c.evidence[0].retention = "PRIVATE CUSTODY";
    c.findings.push({
      id: "private",
      type: "hypothesis",
      statement: "PRIVATE HYPOTHESIS",
      evidenceIds: ["E01"],
      counterEvidence: "PRIVATE CHALLENGE",
      uncertainty: "Private",
      nextCheck: "Private",
      disposition: "open",
    });
    const brief = customerBrief(c);
    expect(brief).not.toMatch(/PRIVATE/);
    const dto = projectCustomerCase({
      snapshot: c,
      role: "customer",
      lastEditor: "11111111-1111-4111-8111-111111111111",
      snapshotSha256: "a".repeat(64),
      integrityValid: true,
      publication: null,
      communications: [],
    });
    expect(dto.publication).toBeNull();
    expect(JSON.stringify(dto)).not.toMatch(/PRIVATE/);
    expect(dto).not.toHaveProperty("snapshot");
    expect(dto).not.toHaveProperty("expenses");
    expect(dto).not.toHaveProperty("reviews");
  });
  it("fails closed to stored integrity failure", () => {
    expect(() =>
      projectCustomerCase({
        snapshot: syntheticCase("C4"),
        role: "customer",
        lastEditor: "11111111-1111-4111-8111-111111111111",
        snapshotSha256: "a".repeat(64),
        integrityValid: false,
        publication: null,
        communications: [],
      }),
    ).toThrow();
  });
  it("rejects role/factory injection and unknown customer commands", () => {
    expect(
      portalCommandSchema.safeParse({
        action: "submit",
        id: crypto.randomUUID(),
        factoryId: 1,
        payload: {
          title: "Sample",
          question: "Sample question",
          site: "Sample site",
          candidate: "C4",
          from: "2026-01-01",
          to: "2026-03-31",
        },
      }).success,
    ).toBe(false);
    expect(
      portalCommandSchema.safeParse({
        action: "verify",
        caseId: crypto.randomUUID(),
        role: "manager",
      }).success,
    ).toBe(false);
  });
});
