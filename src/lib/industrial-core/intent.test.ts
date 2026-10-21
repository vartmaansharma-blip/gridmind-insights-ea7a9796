import { describe, expect, it } from "vitest";
import { fixture, REPLAY_AT, UNTIL } from "./fixtures";
import { inputSchema } from "./model";
import { evaluate, digest } from "./engine";
import { executeCoreCommand, type CoreStore } from "./service";

function withIntent(source: "owner_stated" | "inferred", preference: "favor" | "avoid", target="produce-approved") {
  const s=fixture("A");
  s.ownerIntents=[{
    id:"owner-goal", ownerOrganizationId:s.organizationId, statement:"Preserve an important commercial relationship",
    goal:"relationship", preference, source, status:source==="owner_stated"?"confirmed":"proposed",
    confirmedBy:source==="owner_stated"?"synthetic-owner":null,
    counterpartyId:"buyer", relatedActionIds:[target],
    evidenceIds:["source"], effectiveFrom:s.asOf, expiresAt:UNTIL
  }];
  return s;
}
describe("owner intent conflicts remain advisory and verifiable",()=>{
  it("preserves original behavior without intentions",()=>{
    expect(evaluate(fixture("A"),REPLAY_AT).recommendation).toBe("produce-approved");
  });
  it("flags an explicitly confirmed avoidance of an otherwise eligible action",()=>{
    const e=evaluate(withIntent("owner_stated","avoid"),REPLAY_AT);
    expect(e.ownerIntentAssessment?.conflicts[0].reason).toBe("OWNER_AVOIDED_ELIGIBLE_ACTION");
    expect(e.recommendation).toBeNull();
    expect(e.disposition).toBe("owner_intent_conflict_requires_review");
    expect(e.alternatives.find(x=>x.actionId==="produce-approved")?.status).toBe("eligible");
  });
  it("does not treat inferred relationships or preferences as confirmed",()=>{
    const e=evaluate(withIntent("inferred","avoid"),REPLAY_AT);
    expect(e.ownerIntentAssessment?.inferredGoalsRequireConfirmation).toEqual(["owner-goal"]);
    expect(e.ownerIntentAssessment?.conflicts).toHaveLength(0);
    expect(e.recommendation).toBe("produce-approved");
  });
  it("does not permit owner intent to override a contract prohibition",()=>{
    const s=withIntent("owner_stated","favor","buy-alternative");
    const e=evaluate(s,REPLAY_AT);
    expect(e.alternatives.find(a=>a.actionId==="buy-alternative")?.status).toBe("prohibited");
    expect(e.ownerIntentAssessment?.conflicts[0].reason).toBe("OWNER_FAVORED_ACTION_NOT_ELIGIBLE");
    expect(e.recommendation).toBeNull();
  });
  it("rejects foreign-owner intents and fabricated inferred confirmation",()=>{
    const bad=withIntent("owner_stated","avoid");
    bad.ownerIntents![0].ownerOrganizationId=99;
    expect(inputSchema.safeParse(bad).success).toBe(false);
    const claimed=withIntent("inferred","avoid");
    claimed.ownerIntents![0].status="confirmed";
    claimed.ownerIntents![0].confirmedBy="synthetic-owner";
    expect(inputSchema.safeParse(claimed).success).toBe(false);
  });
  it("rejects approval of a fallback action while an owner-favored prohibited option is unresolved", async () => {
    const input = withIntent("owner_stated", "favor", "buy-alternative");
    const evaluation = evaluate(input, REPLAY_AT);
    const inputDigest = await digest(input);
    const decisionDigest = await digest(evaluation);
    const actorId = "10000000-0000-4000-8000-000000000002";
    const store: CoreStore = {
      async call(args) {
        switch (args._op) {
          case "context":
            return {
              organizationId: 1,
              factoryId: 1,
              actorId,
              capabilities: ["read", "edit", "commercial", "safety"],
              approverCapabilities: ["commercial", "safety"],
              at: REPLAY_AT,
            };
          case "load":
            return {
              revision: 1,
              snapshot: {
                origin: "synthetic",
                input,
                inputEditor: "10000000-0000-4000-8000-000000000003",
                inputDigest,
                evaluation,
                decisionDigest,
                workflow: null,
              },
              snapshotSha256: null,
              integrityValid: true,
              audit: [],
            };
          case "receipt":
            return null;
          default:
            throw new Error("UNEXPECTED_STORAGE_MUTATION");
        }
      },
    };
    await expect(
      executeCoreCommand(store, actorId, "10000000-0000-4000-8000-000000000004", {
        action: "request_approval",
        workspaceId: "10000000-0000-4000-8000-000000000005",
        factoryId: 1,
        expectedRevision: 1,
        requestKey: "intent-conflict-protection",
        actionId: "produce-approved",
        kind: "order_acceptance",
      }),
    ).rejects.toThrow("CORE_OWNER_INTENT_CONFLICT_REQUIRES_REVIEW");
  });
  it("does not discard an owner's avoided action merely because it requires an exception", () => {
    const s = withIntent("owner_stated", "avoid");
    const approved = s.actions.find((a) => a.id === "produce-approved")!;
    approved.facts.processReady!.basis = "estimate";
    const assessed = evaluate(s, REPLAY_AT);
    expect(assessed.alternatives.find((a) => a.actionId === "produce-approved")?.status).toBe("conditional");
    expect(assessed.ownerIntentAssessment?.conflicts[0].reason).toBe("OWNER_AVOIDED_ELIGIBLE_ACTION");
    expect(assessed.recommendation).toBeNull();
  });
  it("remains unknown for unverified owner evidence",()=>{
    const s=withIntent("owner_stated","avoid");
    s.evidence[0].verification="unverified";
    const e=evaluate(s,REPLAY_AT);
    expect(e.ownerIntentAssessment?.summaries[0].state).toBe("stale");
    expect(e.ownerIntentAssessment?.conflicts).toHaveLength(0);
  });
});
