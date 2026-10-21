import { describe, expect, it } from "vitest";
import fixture from "../../../data/synthetic-finishing/comparison.json";
import { compareFinishing, reopenFinishing } from "./finishing-comparison";
import { evaluateSyntheticResolveCase } from "./resolve-workflow";

const scope = fixture.scope;
const source = JSON.stringify(fixture);
const changed = (edit: (value: typeof fixture) => void) => {
  const value = structuredClone(fixture);
  edit(value);
  return JSON.stringify(value);
};
describe("offline synthetic finishing comparison", () => {
  it("retains exact source and separates required work from repeat work without inventing loss", async () => {
    const r = await compareFinishing(source, scope);
    expect(r.sourceText).toBe(source);
    expect(r.sourceSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(r.metrics[0].sourcePointer).toBe("/batches/0");
    expect(r.metrics[0].requiredPersonMinutes).toBe(100);
    expect(r.metrics[0].personMinutesPerAcceptedPart).toBeCloseTo(150 / 95);
    expect(r.personMinutesPerAcceptedPartChange).toBeCloseTo(-30 / 95);
    expect(r.rootCause).toBeNull();
    expect(r.verifiedSavings).toBeNull();
    expect(r.approvedForCustomerUse).toBe(false);
    expect(evaluateSyntheticResolveCase(r.caseDraft).stage).toBe("simulated_review_needed");
  });
  it.each(["organizationId", "factoryId"] as const)("rejects a different %s", async (key) => {
    await expect(compareFinishing(source, { ...scope, [key]: "SYN-OTHER" })).rejects.toThrow(
      "scope mismatch",
    );
  });
  it("rejects real origin and unknown input fields", async () => {
    await expect(
      compareFinishing(source.replace('"synthetic"', '"customer"'), scope),
    ).rejects.toThrow();
    await expect(
      compareFinishing(JSON.stringify({ ...fixture, verifiedSavings: 100 }), scope),
    ).rejects.toThrow();
  });
  it("rejects disposition double counting", async () => {
    await expect(
      compareFinishing(
        changed((d) => {
          d.batches[0].accepted = 100;
        }),
        scope,
      ),
    ).rejects.toThrow("reconcile");
  });
  it("rejects negative time, ambiguous time units and unsupported repeat classification", async () => {
    await expect(
      compareFinishing(
        changed((d) => {
          d.batches[0].repeatPersonMinutes = -1;
        }),
        scope,
      ),
    ).rejects.toThrow();
    await expect(
      compareFinishing(source.replace('"person_minutes"', '"elapsed_minutes"'), scope),
    ).rejects.toThrow();
    const d = JSON.parse(source);
    d.batches[0].classificationReference = null;
    await expect(compareFinishing(JSON.stringify(d), scope)).rejects.toThrow(
      "classification reference",
    );
  });
  it.each([
    "part",
    "operation",
    "drawingRevision",
    "materialGrade",
    "routeRevision",
    "shift",
  ] as const)("withholds comparison for unmatched %s", async (field) => {
    const r = await compareFinishing(
      changed((d) => {
        d.batches[1][field] = "different";
      }),
      scope,
    );
    expect(r.comparisonState).toBe("inconclusive");
    expect(r.personMinutesPerAcceptedPartChange).toBeNull();
    expect(evaluateSyntheticResolveCase(r.caseDraft).stage).toBe("source_conflict");
  });
  it("withholds comparison for unclassified time, held output or zero accepted denominator", async () => {
    for (const edit of [
      (d: typeof fixture) => {
        d.batches[0].unclassifiedPersonMinutes = 10;
      },
      (d: typeof fixture) => {
        d.batches[0].accepted = 0;
        d.batches[0].rejected = 100;
      },
      (d: typeof fixture) => {
        d.batches[0].accepted = 90;
        d.batches[0].held = 5;
      },
    ]) {
      const r = await compareFinishing(changed(edit), scope);
      expect(r.personMinutesPerAcceptedPartChange).toBeNull();
      expect(r.verifiedSavings).toBeNull();
    }
  });
  it("rejects duplicate batches or phases", async () => {
    await expect(
      compareFinishing(
        changed((d) => {
          d.batches[1].id = d.batches[0].id;
        }),
        scope,
      ),
    ).rejects.toThrow("distinct");
    await expect(
      compareFinishing(
        changed((d) => {
          d.batches[1].phase = "baseline";
        }),
        scope,
      ),
    ).rejects.toThrow("distinct");
  });
  it("preserves exact bytes on reopen and rejects changed source", async () => {
    const r = await compareFinishing(source, scope);
    expect((await reopenFinishing(source, r.sourceSha256, scope)).metrics).toEqual(r.metrics);
    await expect(reopenFinishing(source + "\n", r.sourceSha256, scope)).rejects.toThrow(
      "digest mismatch",
    );
  });
  it("handles reversed array order using phases and bounds source size", async () => {
    const r = await compareFinishing(
      changed((d) => {
        d.batches.reverse();
      }),
      scope,
    );
    expect(r.personMinutesPerAcceptedPartChange).toBeCloseTo(-30 / 95);
    await expect(compareFinishing(" ".repeat(100001), scope)).rejects.toThrow("Oversized");
  });
});
