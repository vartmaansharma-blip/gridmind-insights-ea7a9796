import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CANONICAL_OPPORTUNITY_STATUSES, isCanonicalOpportunityStatus } from "./opportunity-status";

describe("canonical opportunity lifecycle contract", () => {
  it("offers exactly the states permitted by the persisted database constraint", () => {
    const directory = new URL("../../../supabase/migrations/", import.meta.url);
    const filename = readdirSync(directory).find((name) =>
      name.endsWith("_gridmind_intelligence_decision_verification_v1.sql"),
    );
    expect(filename).toBeDefined();
    const migration = readFileSync(new URL(filename!, directory), "utf8");
    const table = migration
      .split("create table if not exists public.opportunities (")[1]
      ?.split("create table if not exists public.decisions (")[0];
    const constraint = table?.match(/check \(status in \(([^)]+)\)\)/)?.[1];
    expect(constraint).toBeDefined();
    const persisted = [...constraint!.matchAll(/'([^']+)'/g)].map((match) => match[1]);
    expect([...CANONICAL_OPPORTUNITY_STATUSES].sort()).toEqual(persisted.sort());
  });

  it("rejects legacy screening states and the unsupported UI materiality value", () => {
    for (const value of [
      "open",
      "planned",
      "implemented",
      "not_economically_material",
      "",
      "VERIFIED",
    ]) {
      expect(isCanonicalOpportunityStatus(value)).toBe(false);
    }
    expect(isCanonicalOpportunityStatus("not_material")).toBe(true);
  });
});
