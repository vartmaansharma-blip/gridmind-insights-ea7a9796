/**
 * Public-source metadata audit, deliberately separate from fictional factory
 * decisions. Source: UCI MetroPT-3 failure reports, CC BY 4.0,
 * https://archive.ics.uci.edu/dataset/791/metropt+3+dataset
 * DOI: 10.24432/C5VW3R (retrieved 21 Oct 2026).
 *
 * The original site describes an operational metro-train compressor, NOT
 * a component-manufacturing production line. It publishes fault intervals;
 * no raw telemetry was downloaded, fitted, or classified in this module.
 * Original report times do not state a timezone: preserve wall-clock text.
 */
export const publicMetroptFaultReports = [
  { report: "1", startLocal: "2020-04-18T00:00", endLocal: "2020-04-18T23:59", label: "air_leak" },
  { report: "2", startLocal: "2020-05-29T23:30", endLocal: "2020-05-30T06:00", label: "air_leak" },
  { report: "3", startLocal: "2020-06-05T10:00", endLocal: "2020-06-07T14:30", label: "air_leak" },
  { report: "4", startLocal: "2020-07-15T14:30", endLocal: "2020-07-15T19:00", label: "air_leak" },
] as const;

/** Parse published local timestamp digits only; do not assume a UTC offset. */
function wallMinutes(value: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!m) throw new Error("INVALID_PUBLIC_REPORT_TIMESTAMP");
  const [year, month, day, hour, minute] = m.slice(1).map(Number);
  const utc = Date.UTC(year, month - 1, day, hour, minute);
  if (!Number.isFinite(utc) ||
    new Date(utc).getUTCFullYear() !== year ||
    new Date(utc).getUTCMonth() !== month - 1 ||
    new Date(utc).getUTCDate() !== day ||
    hour > 23 || minute > 59
  ) throw new Error("INVALID_PUBLIC_REPORT_CALENDAR");
  return utc / 60000;
}

export function auditMetroptPublicFaultWindows() {
  const intervals = publicMetroptFaultReports.map((r) => {
    const startMinute = wallMinutes(r.startLocal);
    const endMinute = wallMinutes(r.endLocal);
    if (endMinute <= startMinute) throw new Error("PUBLIC_REPORT_WINDOW_INVALID");
    return {
      report: r.report,
      sourceTimeConvention: "original_wall_clock_timezone_unspecified" as const,
      reportedFailure: r.label,
      startLocal: r.startLocal,
      endLocal: r.endLocal,
      elapsedWallClockMinutes: endMinute - startMinute,
      evidenceClass: "published_operator_report_not_reanalyzed_telemetry" as const,
      machineToOrderLink: null,
      alternativeRoutingEligibility: null,
    };
  });
  return {
    dataset: "UCI MetroPT-3",
    sourceUrl: "https://archive.ics.uci.edu/dataset/791/metropt+3+dataset",
    sourceDoi: "10.24432/C5VW3R",
    sourceLicense: "CC BY 4.0",
    sourceCategory: "real_public_equipment_fault_report_metadata" as const,
    processedPublicReportedWindows: intervals.length,
    processedSensorRows: 0,
    intervals,
    verifiedManufacturingOrderImpact: null,
    verifiedOwnerDecision: null,
    relativeTimeToDetection: null,
    compressorFailurePredictionEvaluated: false as const,
    customerValueEvaluated: false as const,
    claim: "Documented real-world equipment failure intervals only; no order-impact, detection speed, or customer benefit conclusion.",
  };
}
