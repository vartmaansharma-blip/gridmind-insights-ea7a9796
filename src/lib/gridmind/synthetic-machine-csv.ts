/**
 * Local-only synthetic measurement contract preview for a conventional or
 * connected asset. Never writes to Supabase or claims valid field evidence.
 * The authoritative ingestion/service layer must repeat these validations.
 */
export const SYNTHETIC_CSV_COLUMNS = [
  "period_start",
  "period_end",
  "energy_kwh",
  "output_units",
  "operating_hours",
  "operating_state",
  "product_code",
  "source_reference",
] as const;

export const SYNTHETIC_EXAMPLE_CSV = [
  SYNTHETIC_CSV_COLUMNS.join(","),
  "2026-09-01T00:00:00+05:30,2026-09-02T00:00:00+05:30,900,100,8,running,SKU-DEMO,DEMO-METER-001",
  "2026-09-02T00:00:00+05:30,2026-09-03T00:00:00+05:30,940,100,8,running,SKU-DEMO,DEMO-METER-002",
  "2026-09-03T00:00:00+05:30,2026-09-04T00:00:00+05:30,910,100,8,running,SKU-DEMO,DEMO-METER-003",
  "2026-09-04T00:00:00+05:30,2026-09-05T00:00:00+05:30,1000,100,8,running,SKU-DEMO,DEMO-METER-004",
].join("\n");

export type PreviewIssue = {
  row: number;
  code: "format" | "header" | "empty" | "number" | "time" | "duplicate" | "overlap" | "source" | "scope";
  message: string;
};
export type PreviewPeriod = {
  start: string;
  end: string;
  energyKwh: number;
  outputUnits: number;
  operatingHours: number;
  operatingState: string;
  productCode: string;
  sourceReference: string;
  /** No field acceptance or calibration is inferred. */
  evidenceStatus: "synthetic_unverified";
  comparableNumericFields: boolean;
};
export type FormatPreview = {
  status: "format_valid_synthetic" | "format_errors" | "coverage_insufficient";
  periods: PreviewPeriod[];
  issues: PreviewIssue[];
  candidatePeriods: number;
  comparableNumericPeriods: number;
  distinctSources: number;
  notes: string[];
  readyForMachineDiagnosis: false;
  readyForProductionIngest: false;
};

/** Small RFC 4180-style parser for comma/quote/newline without external dependencies. */
function parseCsv(text: string): string[][] | null {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let insideQuotes = false;
  let afterQuote = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (insideQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { insideQuotes = false; afterQuote = true; }
      } else field += c;
      continue;
    }
    if (afterQuote) {
      if (c === ",") { row.push(field); field = ""; afterQuote = false; }
      else if (c === "\n") {
        row.push(field); rows.push(row); row = []; field = ""; afterQuote = false;
      } else if (c === "\r" && text[i + 1] === "\n") { /* CRLF: next iteration closes row */ }
      else return null;
      continue;
    }
    if (c === '"') {
      if (field) return null;
      insideQuotes = true;
    } else if (c === ",") {
      row.push(field); field = "";
    } else if (c === "\n") {
      row.push(field.replace(/\r$/, "")); rows.push(row); row = []; field = "";
    } else field += c;
  }
  if (insideQuotes) return null;
  if (field || row.length || afterQuote) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows;
}

const absoluteTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
const strictNonNegative = /^(?:\d+(?:\.\d*)?|\.\d+)$/;
const canonicalName = /^[A-Za-z0-9][A-Za-z0-9._:/ -]{0,79}$/;
const fail = (row: number, code: PreviewIssue["code"], message: string): PreviewIssue => ({ row, code, message });

export function previewSyntheticMachineCsv(text: string): FormatPreview {
  const issues: PreviewIssue[] = [];
  const notes: string[] = [];
  const empty = (): FormatPreview => ({
    status: "format_errors", periods: [], issues, candidatePeriods: 0,
    comparableNumericPeriods: 0, distinctSources: 0, notes, readyForMachineDiagnosis: false, readyForProductionIngest: false,
  });
  if (text.length > 16_384) {
    issues.push(fail(0, "format", "Maximum 16 KB of synthetic text is allowed."));
    return empty();
  }
  if (!text.trim()) {
    issues.push(fail(0, "empty", "Enter the labeled synthetic example to preview the format."));
    return empty();
  }
  // Reject NUL/control characters other than line, carriage return and tab.
  if (Array.from(text).some((c) => {
    const code = c.charCodeAt(0);
    return code < 32 && code !== 9 && code !== 10 && code !== 13;
  })) {
    issues.push(fail(0, "format", "Unexpected control character."));
    return empty();
  }
  const raw = parseCsv(text.replace(/^\uFEFF/, ""));
  if (!raw) {
    issues.push(fail(0, "format", "Malformed CSV quotation or delimiter."));
    return empty();
  }
  if (raw.length > 101) {
    issues.push(fail(0, "format", "Maximum 100 synthetic measurement periods."));
    return empty();
  }
  if (raw.length < 2 || raw[0]?.join(",") !== SYNTHETIC_CSV_COLUMNS.join(",")) {
    issues.push(fail(1, "header", "Use the exact eight-column template header and at least one row."));
    return empty();
  }
  const periods: PreviewPeriod[] = [];
  const prior = new Set<string>();
  for (let i = 1; i < raw.length; i++) {
    const row = raw[i]!;
    const line = i + 1;
    if (row.length !== 8) {
      issues.push(fail(line, "format", "Exactly eight fields are required."));
      continue;
    }
    const [start,end,kwh,output,hours,state,product,source] = row.map(x=>x.trim()) as [string,string,string,string,string,string,string,string];
    const a = Date.parse(start), z = Date.parse(end);
    if (!absoluteTime.test(start) || !absoluteTime.test(end) || !Number.isFinite(a) || !Number.isFinite(z) || z <= a) {
      issues.push(fail(line, "time", "Use distinct increasing ISO timestamps with explicit time-zone offsets."));
      continue;
    }
    if (![kwh,output,hours].every(x => strictNonNegative.test(x) && Number.isFinite(Number(x)) && Number(x) >= 0 && Number(x) <= 1e12)) {
      issues.push(fail(line, "number", "Energy, output and operating hours must be finite nonnegative numbers, with zero distinct from missing."));
      continue;
    }
    if (!canonicalName.test(state) || !canonicalName.test(product)) {
      issues.push(fail(line, "scope", "Operating state and product code require short plain-text identifiers."));
      continue;
    }
    if (!canonicalName.test(source) || /^[=+@-]/.test(source)) {
      issues.push(fail(line, "source", "Use a simple nonempty, non-formula source reference."));
      continue;
    }
    const range = `${a}:${z}`;
    if (prior.has(range)) {
      issues.push(fail(line, "duplicate", "Period boundaries are duplicated; resolve the source record."));
      continue;
    }
    prior.add(range);
    const comparableNumericFields = Number(kwh) > 0 && Number(output) > 0 && Number(hours) > 0;
    if (!comparableNumericFields) notes.push(`CSV row ${line}: zero measurement preserved, but this period is not suitable for an energy-intensity comparison without further review.`);
    periods.push({
      start, end, energyKwh: Number(kwh), outputUnits: Number(output),
      operatingHours: Number(hours), operatingState: state, productCode: product,
      sourceReference: source, evidenceStatus: "synthetic_unverified", comparableNumericFields,
    });
  }
  const sorted = [...periods].sort((a,b) => Date.parse(a.start) - Date.parse(b.start));
  for(let i=1;i<sorted.length;i++) {
    if(Date.parse(sorted[i]!.start) < Date.parse(sorted[i-1]!.end)) {
      issues.push(fail(0, "overlap", "Measurement periods overlap; a comparable time boundary has not been established."));
      break;
    }
  }
  const comparableNumericPeriods = periods.filter(x => x.comparableNumericFields).length;
  if (comparableNumericPeriods < 4)
    notes.push("At least four non-overlapping, nonzero numeric candidate periods are needed before separately validating a current-versus-historical comparison.");
  return {
    status: issues.length ? "format_errors" : comparableNumericPeriods < 4 ? "coverage_insufficient" : "format_valid_synthetic",
    periods, issues, notes,
    candidatePeriods: periods.length,
    comparableNumericPeriods,
    distinctSources: new Set(periods.map(x=>x.sourceReference)).size,
    readyForMachineDiagnosis: false,
    readyForProductionIngest: false,
  };
}
