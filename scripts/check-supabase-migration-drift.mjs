// Read-only inventory comparison. Never repairs history or applies SQL.
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const logicalName = (name) => name.replace(/^\d{14}_/, "");
export function compareMigrationInventory(files, applied) {
  const versions = new Set();
  for (const row of applied) {
    if (
      !/^\d{14}$/.test(row.version) ||
      typeof row.name !== "string" ||
      versions.has(row.version)
    ) {
      throw new Error("Invalid or duplicate applied migration identity");
    }
    versions.add(row.version);
  }
  const source = files
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .map((file) => {
      const match = /^(\d{14})_(.+)\.sql$/.exec(file);
      if (!match) throw new Error(`Invalid migration filename: ${file}`);
      return { file, version: match[1], name: match[2] };
    });
  if (new Set(source.map((row) => row.version)).size !== source.length) {
    throw new Error("Duplicate source migration version");
  }
  const findings = source.flatMap((migration) => {
    const exact = applied.find((row) => row.version === migration.version);
    if (exact)
      return logicalName(exact.name) === logicalName(migration.name)
        ? []
        : [{ status: "version_name_conflict", ...migration, applied: exact }];
    const candidates = applied.filter(
      (row) => logicalName(row.name) === logicalName(migration.name),
    );
    return [
      {
        status: candidates.length ? "possible_version_alias_review_sql" : "unrecorded_source",
        ...migration,
        candidates,
      },
    ];
  });
  const knownNames = new Set(source.map((row) => logicalName(row.name)));
  findings.push(
    ...applied
      .filter(
        (row) =>
          !source.some((local) => local.version === row.version) &&
          !knownNames.has(logicalName(row.name)),
      )
      .map((row) => ({ status: "remote_only", ...row })),
  );
  return {
    sourceCount: source.length,
    appliedCount: applied.length,
    aligned: findings.length === 0,
    findings,
    limitation:
      "Identity comparison only. Matching names/versions do not prove matching SQL or live objects. No changes were applied.",
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const inventoryPath = process.argv[2];
    if (!inventoryPath)
      throw new Error("Usage: node scripts/check-supabase-migration-drift.mjs <inventory.json>");
    const data = JSON.parse(await readFile(inventoryPath, "utf8"));
    const rows = Array.isArray(data) ? data : data.migrations;
    if (!Array.isArray(rows))
      throw new Error("Inventory must be an array or { migrations: [...] }");
    const files = await readdir(new URL("../supabase/migrations/", import.meta.url));
    const report = compareMigrationInventory(files, rows);
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = report.aligned ? 0 : 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}
