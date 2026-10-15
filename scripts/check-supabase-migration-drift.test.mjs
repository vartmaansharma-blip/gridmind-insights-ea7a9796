import { test } from "vitest";
import assert from "node:assert/strict";
import { compareMigrationInventory as compare } from "./check-supabase-migration-drift.mjs";
const file = "20261010100000_restore_privileges.sql";
test("exact identities align", () =>
  assert.equal(
    compare([file], [{ version: "20261010100000", name: "restore_privileges" }]).aligned,
    true,
  ));
test("renamed versions remain unresolved even when names match", () =>
  assert.equal(
    compare([file], [{ version: "20261010081740", name: "restore_privileges" }]).findings[0].status,
    "possible_version_alias_review_sql",
  ));
test("embedded original timestamp is only an alias candidate", () =>
  assert.equal(
    compare(
      ["20261009130000_analysis.sql"],
      [{ version: "20261010075630", name: "20261009130000_analysis" }],
    ).findings[0].status,
    "possible_version_alias_review_sql",
  ));
test("missing sources and remote-only entries fail alignment", () => {
  const r = compare([file], [{ version: "20261011000000", name: "unknown" }]);
  assert.deepEqual(
    r.findings.map((x) => x.status),
    ["unrecorded_source", "remote_only"],
  );
});
test("same-version name conflict is detected", () =>
  assert.equal(
    compare([file], [{ version: "20261010100000", name: "different" }]).findings[0].status,
    "version_name_conflict",
  ));
test("duplicate applied identities fail closed", () =>
  assert.throws(() =>
    compare(
      [file],
      [
        { version: "20261010100000", name: "restore_privileges" },
        { version: "20261010100000", name: "restore_privileges" },
      ],
    ),
  ));
