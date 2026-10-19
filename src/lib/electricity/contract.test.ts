import { describe, expect, it } from "vitest";
import { commandSchema } from "./contract";
const create = {
  action: "create",
  id: "11111111-1111-4111-8111-111111111111",
  factoryId: 1,
  investigatorId: "22222222-2222-4222-8222-222222222222",
  utility: "Unknown",
  from: "2026-09-01",
  to: "2026-09-30",
  issue: "Synthetic billing question",
};
describe("electricity intake validation", () => {
  it("allows unknown utility without inventing a tariff", () =>
    expect(commandSchema.parse(create)).toEqual(create));
  it.each([
    { from: "2026-02-30" },
    { to: "2026-08-30" },
    { to: "2028-01-01" },
    { utility: "generic Jharkhand" },
    { issue: "" },
    { factoryId: -1 },
    { actorId: create.id },
  ])("rejects invalid input %j", (patch) =>
    expect(commandSchema.safeParse({ ...create, ...patch }).success).toBe(false),
  );
  it.each([
    { mime: "text/html" },
    { bytes: 10485761 },
    { filename: "../bill.pdf" },
    { filename: "bad\nname.pdf" },
    { bytes: 0 },
  ])("rejects unsafe upload metadata %j", (patch) =>
    expect(
      commandSchema.safeParse({
        action: "reserve",
        caseId: create.id,
        id: create.investigatorId,
        filename: "synthetic.pdf",
        mime: "application/pdf",
        bytes: 20,
        ...patch,
      }).success,
    ).toBe(false),
  );
  it("does not offer a certification state", () =>
    expect(
      commandSchema.safeParse({
        action: "status",
        caseId: create.id,
        revision: 1,
        status: "certified",
      }).success,
    ).toBe(false));
});
