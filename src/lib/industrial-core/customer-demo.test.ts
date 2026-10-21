import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { customerDemo } from "./customer-demo";
import { inputSchema } from "./model";
import { evaluate, stable } from "./engine";

describe("customer sample evidence and presentation", () => {
  it("exports a reproducible schema-valid dataset and the actual bounded engine result", async () => {
    const sample = await customerDemo("A");
    expect(sample.origin).toBe("synthetic");
    expect(inputSchema.safeParse(sample.input).success).toBe(true);
    expect(sample.decision).toEqual(evaluate(sample.input, sample.replayAt));
    expect(sample.inputSha256).toBe(
      createHash("sha256").update(stable(sample.input)).digest("hex"),
    );
    expect(
      JSON.parse(
        readFileSync(
          new URL("../../../data/industrial-core/customer-demo-A-SYNTHETIC.json", import.meta.url),
          "utf8",
        ),
      ),
    ).toEqual(sample);
    expect(sample.decision.recommendation).toBe("produce-approved");
    expect(sample.operatingSummary).toMatchObject({
      requiredMaterial: 100,
      unreservedQuantity: 150,
      calendarMinutes: 360,
      requiredMinutes: 120,
    });
    expect(sample.workflow).toEqual({
      phase: "awaiting_approval",
      execution: "not_executed",
      outcome: "unverified",
    });
    expect(sample.decision.verifiedSavings).toBeNull();
  });
  it("withholds a trade recommendation and economics where qualification and retain value are missing", async () => {
    const sample = await customerDemo("B");
    expect(sample.conclusion.status).toBe("requires_review");
    expect(sample.opportunity!.reasons).toContain("BUYER_DEMAND_NOT_VERIFIED");
    expect(sample.economics!.status).toBe("insufficient_information");
    expect(sample.opportunity!.quantity).toBeNull();
  });
  it("distinguishes calendar minutes from an unavailable press and traces affected orders", async () => {
    const sample = await customerDemo("C");
    expect(sample.operatingSummary.calendarMinutes).toBe(360);
    expect(sample.operatingSummary.resourceAvailable).toBe(false);
    expect(sample.decision.recommendation).toBeNull();
    expect(sample.decision.disruptionImpacts[0].affected).toContainEqual({
      id: "order",
      kind: "order",
    });
  });
  it("explains that price cannot waive the prohibited producer", async () => {
    const sample = await customerDemo("D");
    expect(sample.conclusion.status).toBe("prohibited");
    expect(sample.conclusion.next).toContain("lower price cannot waive");
    expect(sample.checks[0].checks.find((c) => c.ruleId === "approved-steel")!.status).toBe(
      "prohibited",
    );
  });
});
