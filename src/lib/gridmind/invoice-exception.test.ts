import { describe, it, expect } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  importInvoiceCsv,
  reconcileInvoice,
  startInvoiceExperiment,
  reviewInvoiceExperiment,
  recordInvoiceAction,
  recordInvoiceOutcome,
  exportInvoiceExperiment,
} from "./invoice-exception";
import {
  INVOICE_DEMO_CSV as csv,
  INVOICE_DEMO_SCOPE as scope,
  INVOICE_NEGATIVE_CSV,
  INVOICE_CONFLICT_CSV,
  INVOICE_REVIEW_DEMO as review,
  INVOICE_ACTION_DEMO as action,
} from "./invoice-fixtures";

const dataset = () => importInvoiceCsv(csv, scope, "fiction.csv");
const state = async () => startInvoiceExperiment(await dataset());
const accepted = async () => reviewInvoiceExperiment(await state(), scope, review);

describe("synthetic invoice documentary reconciliation", () => {
  it("preserves original bytes, physical source lines, source digest and explicit unknown payment", async () => {
    const d = await dataset();
    expect(d.rawCsv).toBe(csv);
    expect(d.records[2].sourceLine).toBe(4);
    const a = await reconcileInvoice(d, scope);
    expect(a.status).toBe("documentary_exception");
    expect(a.issues.some((v) => v.sourceLines.includes(4))).toBe(true);
    expect(a.unknowns.join(" ")).toContain("unpaid status");
    expect(a.invoiceFaceValuePaise).toBe(100000);
    expect(a.verifiedSavings).toBeNull();
    expect(a.paymentRecovery).toBeNull();
  });
  it("does not sell an accepted equal-quantity invoice as a documentary exception or infer non-payment", async () => {
    const d = await importInvoiceCsv(INVOICE_NEGATIVE_CSV, scope, "negative.csv");
    const a = await reconcileInvoice(d, scope);
    expect(a.status).toBe("no_documentary_exception_established");
    await expect(
      reviewInvoiceExperiment(startInvoiceExperiment(d), scope, review),
    ).rejects.toThrow();
  });
  it("retains conflicting versions without selecting or summing", async () => {
    const a = await reconcileInvoice(
      await importInvoiceCsv(INVOICE_CONFLICT_CSV, scope, "conflict.csv"),
      scope,
    );
    expect(a.status).toBe("conflict");
    expect(a.issues[0].code).toBe("ambiguous_document");
    expect(a.issues[0].sourceLines).toEqual([6, 7]);
  });
  it.each([
    ["header", csv.replace("amount_paise", "amount_rupees")],
    ["currency", csv.replace(",INR,", ",USD,")],
    ["decimal pieces", csv.replace(",100,", ",100.5,")],
    ["negative money", csv.replace(",100000,", ",-1,")],
    ["unsafe money", csv.replace(",100000,", ",9007199254740993,")],
    ["scientific number", csv.replace(",100000,", ",1e5,")],
    ["invalid calendar", csv.replace("2026-01-01", "2026-02-30")],
    ["quoted CSV", csv + '"'],
    ["embedded blank row", csv.replace("\nSYN-R", "\n\nSYN-R")],
    ["duplicate ID", csv.replace("SYN-D,", "SYN-O,")],
    ["scope mismatch", csv.replace("SYN-PART,A", "OTHER-PART,A")],
  ])("rejects %s before analysis", async (_name, bad) => {
    await expect(importInvoiceCsv(bad, scope, "bad.csv")).rejects.toThrow();
  });
  it("rejects unsupported real origin and over-limit inputs", async () => {
    await expect(importInvoiceCsv(csv, { ...scope, origin: "real" }, "x.csv")).rejects.toThrow();
    await expect(importInvoiceCsv(csv + "x".repeat(2_000_001), scope, "x.csv")).rejects.toThrow();
    await expect(
      importInvoiceCsv(csv + Array(501).fill(csv.split("\n")[1]).join("\n"), scope, "x.csv"),
    ).rejects.toThrow();
  });
  it("preserves BOM/CRLF source digest and physical lines", async () => {
    const raw = "\uFEFF" + csv.replaceAll("\n", "\r\n");
    const d = await importInvoiceCsv(raw, scope, "crlf.csv");
    expect(d.records[0].sourceLine).toBe(2);
    expect(d.rawCsv).toBe(raw);
    expect(d.sourceSha256).not.toBe((await dataset()).sourceSha256);
  });
  it("keeps missing quantities distinct from zero", async () => {
    const missing = await importInvoiceCsv(csv.replace(",90,,", ",,,"), scope, "missing.csv");
    expect((await reconcileInvoice(missing, scope)).status).toBe("inconclusive");
    const zero = await importInvoiceCsv(csv.replaceAll(",90,,", ",0,,"), scope, "zero.csv");
    expect((await reconcileInvoice(zero, scope)).status).toBe("documentary_exception");
  });
  it("flags missing acceptance and reversed chronology without guessing a cause", async () => {
    const missing = csv
      .split("\n")
      .filter((l) => !l.startsWith("SYN-A,"))
      .join("\n");
    expect(
      (await reconcileInvoice(await importInvoiceCsv(missing, scope, "x.csv"), scope)).status,
    ).toBe("inconclusive");
    const reversed = csv.replace("2026-01-03,90", "2025-12-31,90");
    expect(
      (await reconcileInvoice(await importInvoiceCsv(reversed, scope, "x.csv"), scope)).status,
    ).toBe("conflict");
  });
  it.each([
    "organizationId",
    "factoryId",
    "caseId",
    "orderId",
    "invoiceId",
    "partId",
    "revision",
    "analystId",
  ] as const)(
    "rejects a different expected %s (offline scope, not live tenant security)",
    async (key) => {
      await expect(reconcileInvoice(await dataset(), { ...scope, [key]: "other" })).rejects.toThrow(
        "Scope mismatch",
      );
    },
  );
  it("rejects modified raw evidence, digest and normalized values", async () => {
    const d = await dataset();
    for (const changed of [
      { ...d, rawCsv: d.rawCsv + "\n" },
      { ...d, sourceSha256: "0".repeat(64) },
      { ...d, records: d.records.map((r, i) => (i ? r : { ...r, quantityPieces: 999 })) },
    ])
      await expect(reconcileInvoice(changed, scope)).rejects.toThrow();
  });
  it("requires distinct reviewer, valid decision time and accepted review before action", async () => {
    for (const reviewerId of [scope.analystId, scope.customerActorId])
      await expect(
        reviewInvoiceExperiment(await state(), scope, { ...review, reviewerId }),
      ).rejects.toThrow("distinct");
    await expect(
      reviewInvoiceExperiment(await state(), scope, { ...review, at: "2025-12-01T00:00:00Z" }),
    ).rejects.toThrow("predates");
    await expect(recordInvoiceAction(await state(), scope, action)).rejects.toThrow("blocked");
    const rejected = await reviewInvoiceExperiment(await state(), scope, {
      ...review,
      decision: "reject",
    });
    await expect(recordInvoiceAction(rejected, scope, action)).rejects.toThrow("blocked");
  });
  it("rejects stale review even after a source was correctly re-imported and rehashed", async () => {
    const s = await accepted();
    const changed = await importInvoiceCsv(
      csv.replace("Reason for difference unknown", "A revised fictional note"),
      scope,
      "fiction.csv",
    );
    await expect(exportInvoiceExperiment({ ...s, dataset: changed }, scope)).rejects.toThrow(
      "Stale",
    );
  });
  it("requires declared customer owner and source evidence for completion", async () => {
    for (const changed of [
      { ...action, ownerId: scope.analystId },
      { ...action, completionEvidenceLines: [] },
      { ...action, completionEvidenceLines: [999] },
      { ...action, completionEvidenceLines: [4, 4] },
      { ...action, customerAuthorization: "not_recorded" },
    ])
      await expect(recordInvoiceAction(await accepted(), scope, changed)).rejects.toThrow();
  });
  it("completes review/action/outcome/export/reopen while refusing a verified outcome", async () => {
    const s = await recordInvoiceAction(await accepted(), scope, action);
    const outcome = {
      status: "inconclusive",
      observation: "Fictional response recorded",
      confounders: "No counterfactual",
      sourceLines: [4, 5],
    };
    const finished = await recordInvoiceOutcome(s, scope, outcome);
    const report = await exportInvoiceExperiment(JSON.parse(JSON.stringify(finished)), scope);
    expect(report.workflow.stage).toBe("measurement_missing");
    expect(report.approvedForCustomerUse).toBe(false);
    expect(report.verifiedSavings).toBeNull();
    expect(report.learning.observation).toContain("Fictional response");
    await expect(
      recordInvoiceOutcome(s, scope, { ...outcome, status: "verified" }),
    ).rejects.toThrow();
    await expect(recordInvoiceOutcome(await accepted(), scope, outcome)).rejects.toThrow(
      "completed",
    );
  });
  it("retains prior simulated reviewer decisions and does not erase action history", async () => {
    const rejected = await reviewInvoiceExperiment(await state(), scope, {
      ...review,
      decision: "reject",
    });
    const next = await reviewInvoiceExperiment(rejected, scope, review);
    expect(next.reviewHistory[0].decision).toBe("reject");
    const acted = await recordInvoiceAction(next, scope, action);
    await expect(reviewInvoiceExperiment(acted, scope, review)).rejects.toThrow("history");
  });
  it("uses the same invented CSV in the UI and CLI", () => {
    expect(
      readFileSync(resolve("data/synthetic-invoice-exception/quantity-difference.csv"), "utf8"),
    ).toBe(csv);
  });
  it("keeps untrusted source instructions inert text", async () => {
    const text = csv.replace("Invented records only", "<script>steal()</script>");
    const report = await exportInvoiceExperiment(
      startInvoiceExperiment(await importInvoiceCsv(text, scope, "untrusted.csv")),
      scope,
    );
    expect(report.state.dataset.records[0].note).toBe("<script>steal()</script>");
    expect(report.customerValidated).toBe(false);
  });
});

describe("offline CLI evidence-to-follow-up round trip", () => {
  it("inspects, reviews, records authorised action/outcome, reopens and never overwrites", () => {
    const dir = mkdtempSync(join(tmpdir(), "gm-invoice-"));
    const root = resolve("data/synthetic-invoice-exception");
    const bun = process.env.GRIDMIND_TEST_BUN || "bun";
    const script = resolve("scripts/invoice-exception.ts");
    const run = (...args: string[]) => execFileSync(bun, [script, ...args], { encoding: "utf8" });
    try {
      const a = join(dir, "a.json"),
        b = join(dir, "b.json"),
        c = join(dir, "c.json"),
        d = join(dir, "d.json");
      run("inspect", join(root, "quantity-difference.csv"), join(root, "scope.json"), a);
      run("review", a, join(root, "review.json"), b);
      run("action", b, join(root, "action.json"), c);
      run("outcome", c, join(root, "outcome.json"), d);
      expect(run("reopen", d, join(root, "scope.json"))).toContain("documentary_exception");
      expect(JSON.parse(readFileSync(a, "utf8")).state.review).toBeNull();
      const final = JSON.parse(readFileSync(d, "utf8"));
      expect(final.verifiedSavings).toBeNull();
      const result = spawnSync(bun, [
        script,
        "inspect",
        join(root, "quantity-difference.csv"),
        join(root, "scope.json"),
        a,
      ]);
      expect(result.status).not.toBe(0);
      expect(JSON.parse(readFileSync(a, "utf8")).state.review).toBeNull();
      final.state.dataset.records[0].quantityPieces = 999;
      const tampered = join(dir, "tampered.json");
      writeFileSync(tampered, JSON.stringify(final));
      expect(
        spawnSync(bun, [script, "reopen", tampered, join(root, "scope.json")]).status,
      ).not.toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
