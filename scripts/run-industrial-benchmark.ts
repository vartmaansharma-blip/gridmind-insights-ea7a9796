import { runSyntheticParityBenchmark, publicDatasetCandidates } from "../src/lib/industrial-core/benchmark";
import { auditMetroptPublicFaultWindows } from "../src/lib/industrial-core/public-failure-windows";

/** Run with: bun scripts/run-industrial-benchmark.ts
 * No network, industrial connectors, keys, files or customer data are read.
 */
const synthetic = runSyntheticParityBenchmark();
const publicFaultReport = auditMetroptPublicFaultWindows();
const report = {
  benchmarkVersion: "gm-mvp-004/v1",
  executedAt: null, // exact fixtures only; no non-reproducible wallclock claim
  synthetic,
  publicFaultReport,
  publicDatasetCandidates,
  caveat: "Engineering fixture parity plus public fault-report metadata only. NOT a comparison with real Excel/ERP, actual factory performance or paid customer demand.",
};
console.log(JSON.stringify(report, null, 2));
if (synthetic.verdict !== "synthetic_parity_only") process.exitCode = 1;
