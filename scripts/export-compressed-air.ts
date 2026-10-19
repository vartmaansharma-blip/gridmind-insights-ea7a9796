import { readFile, writeFile } from "node:fs/promises";
import {
  importCompressedAirCsv,
  exportCompressedAirReport,
} from "../src/lib/compressed-air/investigation";
const [input, output] = process.argv.slice(2);
if (!input || !output)
  throw new Error("Usage: bun scripts/export-compressed-air.ts synthetic.csv report.json");
const dataset = await importCompressedAirCsv(
  await readFile(input, "utf8"),
  {
    organizationId: "synthetic-organization",
    siteId: "synthetic-site",
    assetId: "synthetic-compressor",
  },
  input,
);
await writeFile(output, exportCompressedAirReport(dataset), { flag: "wx" });
console.log(`Synthetic, unreviewed report written to ${output}`);
