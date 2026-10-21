import { describe, expect, it } from "vitest";
import { createSampleWorkspace } from "./workspace";
import { sampleRecordIndex, searchSampleRecords, rememberRecord } from "./record-search";
describe("sample record discovery", () => {
  it("finds exact identifiers and multiword labels within type filters", () => {
    const s = createSampleWorkspace();
    const press = sampleRecordIndex(s).find((r) => r.id === "press")!;
    expect(searchSampleRecords(s, " PRESS ", "resource")).toContainEqual(press);
    expect(searchSampleRecords(s, press.label, "resource")).toContainEqual(press);
    expect(searchSampleRecords(s, "press", "order")).not.toContainEqual(press);
    expect(searchSampleRecords(s, "nonexistent record")).toEqual([]);
  });
  it("bounds recency, removes deleted records and never accepts foreign IDs", () => {
    const allowed = new Set(Array.from({ length: 12 }, (_, i) => `r${i}`));
    expect(rememberRecord(["r1", "r2", "deleted"], "r2", allowed)).toEqual(["r2", "r1"]);
    expect(rememberRecord(["r1"], "foreign", allowed)).toEqual(["r1"]);
    expect(rememberRecord([...allowed], "r11", allowed)).toHaveLength(8);
  });
});
