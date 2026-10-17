import { describe, expect, it } from "vitest";
import { previewSyntheticMachineCsv, SYNTHETIC_EXAMPLE_CSV } from "./synthetic-machine-csv";

const change = (rows: string[], row: number, col: number, value: string) => {
  const columns = rows[row]!.split(",");
  columns[col] = value;
  rows[row] = columns.join(",");
  return rows.join("\n");
};

describe("strict synthetic meter+production CSV format preview", () => {
  it("accepts source-linked fictional periods as format candidates, never physical evidence", () => {
    const result = previewSyntheticMachineCsv(SYNTHETIC_EXAMPLE_CSV);
    expect(result.status).toBe("format_valid_synthetic");
    expect(result.candidatePeriods).toBe(4);
    expect(result.distinctSources).toBe(4);
    expect(result.periods.every(p=>p.evidenceStatus==="synthetic_unverified")).toBe(true);
    expect(result.readyForMachineDiagnosis).toBe(false);
    expect(result.readyForProductionIngest).toBe(false);
  });
  it("refuses empty, malformed headers and improper timezone-less windows", () => {
    expect(previewSyntheticMachineCsv("").issues[0]?.code).toBe("empty");
    expect(previewSyntheticMachineCsv("time,energy\nfoo,123").issues[0]?.code).toBe("header");
    const bad=change(SYNTHETIC_EXAMPLE_CSV.split("\n"),1,0,"2026-09-01T00:00:00");
    expect(previewSyntheticMachineCsv(bad).issues.some(x=>x.code==="time")).toBe(true);
  });
  it("flags duplicated periods, overlapping periods and insufficient baseline sample count", () => {
    const lines=SYNTHETIC_EXAMPLE_CSV.split("\n");
    lines[2]=lines[1]!.replace("DEMO-METER-001","DEMO-METER-002");
    const duplicate=previewSyntheticMachineCsv(lines.join("\n"));
    expect(duplicate.issues.some(x=>x.code==="duplicate")).toBe(true);
    const overlap=change(SYNTHETIC_EXAMPLE_CSV.split("\n"),2,0,"2026-09-01T08:00:00+05:30");
    expect(previewSyntheticMachineCsv(overlap).issues.some(x=>x.code==="overlap")).toBe(true);
    expect(previewSyntheticMachineCsv(SYNTHETIC_EXAMPLE_CSV.split("\n").slice(0,3).join("\n")).issues.some(x=>x.code==="scope")).toBe(true);
  });
  it("rejects estimated or invalid numeric formats, formula-like reference text and column misalignment", () => {
    expect(previewSyntheticMachineCsv(change(SYNTHETIC_EXAMPLE_CSV.split("\n"),1,2,"NaN")).issues.some(x=>x.code==="number")).toBe(true);
    expect(previewSyntheticMachineCsv(change(SYNTHETIC_EXAMPLE_CSV.split("\n"),1,2,"-10")).issues.some(x=>x.code==="number")).toBe(true);
    expect(previewSyntheticMachineCsv(change(SYNTHETIC_EXAMPLE_CSV.split("\n"),1,7,"=SUM(A1:A2)")).issues.some(x=>x.code==="source")).toBe(true);
    expect(previewSyntheticMachineCsv(SYNTHETIC_EXAMPLE_CSV+"\n2026-09-05").issues.some(x=>x.code==="format")).toBe(true);
  });
  it("bounds the synthetic in-browser test input and refuses malformed quoting/control characters", () => {
    expect(previewSyntheticMachineCsv("x".repeat(16385)).issues[0]?.code).toBe("format");
    expect(previewSyntheticMachineCsv(SYNTHETIC_EXAMPLE_CSV.replace("DEMO-METER-001",'"unclosed')).issues[0]?.code).toBe("format");
    expect(previewSyntheticMachineCsv(SYNTHETIC_EXAMPLE_CSV+"\0").issues[0]?.code).toBe("format");
  });
});
