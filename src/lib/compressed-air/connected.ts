import { z } from "zod";
import { importCompressedAirCsv, datasetSchema, analyzeCompressedAir } from "./investigation";
import type { CaseStore } from "../investigation/connected-contract";
import { CaseError, stableJson } from "../investigation/connected-service";

const uuid = z.string().uuid();
const digest = z.string().regex(/^[a-f0-9]{64}$/);
const note = z.string().trim().min(10).max(4000);
const revision = z.number().int().nonnegative().max(2_147_483_647);
const common = { caseId: uuid, expectedRevision: revision, requestKey: z.string().min(1).max(200) };
export const airCommandSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("scope"), caseId: uuid }).strict(),
  z.object({ action: z.literal("load"), caseId: uuid, revision: revision.optional() }).strict(),
  z
    .object({
      action: z.literal("import"),
      ...common,
      assetId: z.number().int().positive().safe(),
      sourceName: z.string().trim().min(1).max(120),
      csv: z.string().min(1).max(2_000_000),
    })
    .strict(),
  z
    .object({
      action: z.literal("review"),
      ...common,
      datasetHash: digest,
      decision: z.enum(["accept", "revise", "reject"]),
      competence: note,
      rationale: note,
      confounders: note,
      findings: z
        .array(
          z
            .object({
              statement: note,
              sourceLines: z.array(z.number().int().min(2)).min(1).max(100),
              uncertainty: note,
            })
            .strict(),
        )
        .max(100),
    })
    .strict(),
  z
    .object({
      action: z.literal("propose"),
      ...common,
      datasetHash: digest,
      id: uuid,
      owner: note,
      description: note,
    })
    .strict(),
  z
    .object({
      action: z.literal("approve"),
      ...common,
      datasetHash: digest,
      id: uuid,
      customerApproval: note,
    })
    .strict(),
  z
    .object({
      action: z.literal("complete"),
      ...common,
      datasetHash: digest,
      id: uuid,
      completionEvidence: note,
    })
    .strict(),
  z
    .object({
      action: z.literal("verifyOutcome"),
      ...common,
      datasetHash: digest,
      confounders: note,
      rationale: note,
    })
    .strict(),
  z.object({ action: z.literal("export"), ...common }).strict(),
]);
export type AirCommand = z.infer<typeof airCommandSchema>;
const reviewSchema = z
  .object({
    actorId: uuid,
    at: z.string().datetime(),
    simulated: z.literal(true),
    datasetHash: digest,
    decision: z.enum(["accept", "revise", "reject"]),
    competence: note,
    rationale: note,
    confounders: note,
    findings: z.array(
      z
        .object({ statement: note, sourceLines: z.array(z.number().int()), uncertainty: note })
        .strict(),
    ),
  })
  .strict();
const actionSchema = z
  .object({
    id: uuid,
    owner: note,
    description: note,
    status: z.enum(["proposed", "approved", "completed"]),
    proposedBy: uuid,
    customerApproval: note.optional(),
    approvedBy: uuid.optional(),
    completionEvidence: note.optional(),
    completedBy: uuid.optional(),
  })
  .strict();
const verificationSchema = z
  .object({
    actorId: uuid,
    at: z.string().datetime(),
    datasetHash: digest,
    confounders: note,
    rationale: note,
    outcome: z.literal("inconclusive"),
    descriptiveEvidence: z.enum([
      "matched_intervals_available",
      "insufficient_comparable_intervals",
    ]),
    sourceLines: z.array(z.number().int().min(2)),
  })
  .strict()
  .nullable();

export const airSnapshotSchema = z
  .object({
    method: z.literal("compressed-air-context-envelope-v1"),
    origin: z.literal("synthetic"),
    dataset: datasetSchema,
    csv: z.string().max(2_000_000),
    datasetHash: digest,
    importedBy: uuid,
    importedAt: z.string().datetime(),
    importRevision: revision,
    review: reviewSchema.nullable(),
    actions: z.array(actionSchema).max(100),
    verification: verificationSchema,
  })
  .strict();
export type AirSnapshot = z.infer<typeof airSnapshotSchema>;
// Saved export payload is validated structurally, then bound to its immutable snapshot below.
const airReportSchema = z.object({
  caseId: uuid,
  revision,
  snapshotSha256: digest,
  exportedBy: uuid,
  exportedAt: z.string().datetime({ offset: true }),
  dataset: datasetSchema,
  originalCsv: z.string().max(2_000_000),
  datasetHash: digest,
  importRevision: revision,
  importedBy: uuid,
  importedAt: z.string().datetime(),
  analysis: z.record(z.unknown()),
  engineerReview: reviewSchema.nullable(),
  actions: z.array(actionSchema).max(100),
  outcomeVerification: verificationSchema,
  reviewStatus: z.enum(["simulated_review_only", "unreviewed"]),
  verifiedSavings: z.null(),
  approvedForCustomerDelivery: z.literal(false),
});
export const airStoredSchema = z.object({
  caseId: uuid,
  revision,
  headRevision: revision,
  role: z.enum(["manager", "investigator", "reviewer"]),
  snapshot: airSnapshotSchema.nullable(),
  snapshotSha256: digest.nullable(),
  actorId: uuid.nullable(),
  at: z.string().nullable(),
  replayed: z.boolean().optional(),
  report: airReportSchema.nullable().optional(),
  reportSha256: digest.nullable().optional(),
});
export type AirStored = z.infer<typeof airStoredSchema>;
export async function airHash(value: unknown) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(stableJson(value)));
  return Array.from(new Uint8Array(bytes), (v) => v.toString(16).padStart(2, "0")).join("");
}

// Reparse original bytes on every read/export. A normalized-payload or source alteration fails closed.
async function checked(raw: unknown): Promise<AirStored> {
  const stored = airStoredSchema.parse(raw);
  const s = stored.snapshot;
  if (s) {
    const parsed = await importCompressedAirCsv(s.csv, s.dataset.scope, s.dataset.sourceName).catch(
      () => {
        throw new CaseError("AIR_SOURCE_INTEGRITY_FAILED", 409);
      },
    );
    if (stableJson(parsed) !== stableJson(s.dataset) || (await airHash(parsed)) !== s.datasetHash)
      throw new CaseError("AIR_SOURCE_INTEGRITY_FAILED", 409);
    if (
      s.review &&
      (s.review.datasetHash !== s.datasetHash ||
        s.review.actorId === s.importedBy ||
        s.review.findings.some((f) =>
          f.sourceLines.some((line) => !s.dataset.samples.some((p) => p.sourceLine === line)),
        ))
    )
      throw new CaseError("AIR_REVIEW_INTEGRITY_FAILED", 409);
    if (
      new Set(s.actions.map((a) => a.id)).size !== s.actions.length ||
      (s.actions.length > 0 && s.review?.decision !== "accept") ||
      s.actions.some(
        (a) =>
          (a.status !== "proposed" && (!a.customerApproval || !a.approvedBy)) ||
          (a.status === "completed" && (!a.completionEvidence || !a.completedBy)),
      ) ||
      (s.verification &&
        (s.verification.datasetHash !== s.datasetHash ||
          !s.actions.some((a) => a.status === "completed") ||
          s.verification.sourceLines.some(
            (line) => !s.dataset.samples.some((p) => p.sourceLine === line),
          )))
    )
      throw new CaseError("AIR_WORKFLOW_INTEGRITY_FAILED", 409);
    if (stored.report) {
      const r = stored.report;
      if (
        !stored.reportSha256 ||
        r.caseId !== stored.caseId ||
        r.revision !== stored.revision ||
        r.snapshotSha256 !== stored.snapshotSha256 ||
        r.exportedBy !== stored.actorId ||
        r.exportedAt !== stored.at ||
        r.datasetHash !== s.datasetHash ||
        stableJson(r.dataset) !== stableJson(s.dataset) ||
        r.originalCsv !== s.csv ||
        r.importRevision !== s.importRevision ||
        r.importedBy !== s.importedBy ||
        r.importedAt !== s.importedAt ||
        stableJson(r.engineerReview) !== stableJson(s.review) ||
        stableJson(r.actions) !== stableJson(s.actions) ||
        stableJson(r.outcomeVerification) !== stableJson(s.verification)
      )
        throw new CaseError("AIR_REPORT_INTEGRITY_FAILED", 409);
    }
  }
  return stored;
}

/** Internal method attachment: existing case/membership/assignment identities stay authoritative.
 * Never modifies C1/C4 inputs, evaluations, publications or the parent case revision. */
export async function executeAirCommand(
  store: CaseStore,
  actor: string,
  raw: unknown,
  now = new Date().toISOString(),
) {
  uuid.parse(actor);
  const cmd = airCommandSchema.parse(raw);
  const base = { _actor: actor, _case: cmd.caseId };
  if (cmd.action === "scope") return store.call({ ...base, _op: "scope" });
  if (cmd.action === "load")
    return checked(await store.call({ ...base, _op: "read", _expected: cmd.revision ?? null }));
  const fingerprint = await airHash({ actor, command: cmd });
  const receipt = await store.call({
    ...base,
    _op: "receipt",
    _key: cmd.requestKey,
    _fingerprint: fingerprint,
  });
  if (receipt && typeof receipt === "object" && "snapshot" in receipt) {
    const replay = await checked(receipt);
    return cmd.action === "export" ? withReport(replay) : replay;
  }
  const current = await checked(await store.call({ ...base, _op: "read" }));
  if (current.revision !== cmd.expectedRevision) throw new CaseError("STALE_CASE_REVISION", 409);
  let next = current.snapshot && structuredClone(current.snapshot);
  if (cmd.action === "import") {
    if (current.role === "reviewer") throw new CaseError("CASE_EDIT_DENIED", 403);
    // Client cannot supply organization/site identifiers. Resolve through the authorized parent case.
    const scope = z
      .object({
        organizationId: z.string(),
        siteId: z.string(),
        assets: z.array(z.object({ id: z.number(), name: z.string() })),
      })
      .parse(await store.call({ ...base, _op: "scope" }));
    if (!scope.assets.some((a) => a.id === cmd.assetId))
      throw new CaseError("CASE_ACCESS_DENIED", 403);
    const dataset = await importCompressedAirCsv(
      cmd.csv,
      { organizationId: scope.organizationId, siteId: scope.siteId, assetId: String(cmd.assetId) },
      cmd.sourceName,
    ).catch(() => {
      throw new CaseError("AIR_INVALID_CSV");
    });
    if (dataset.samples.length > 1000) throw new CaseError("AIR_INVALID_CSV");
    next = {
      method: "compressed-air-context-envelope-v1",
      origin: "synthetic",
      csv: cmd.csv,
      dataset,
      datasetHash: await airHash(dataset),
      importedBy: actor,
      importedAt: now,
      importRevision: current.revision + 1,
      review: null,
      actions: [],
      verification: null,
    };
  } else {
    if (!next) throw new CaseError("AIR_IMPORT_REQUIRED", 409);
    if ("datasetHash" in cmd && cmd.datasetHash !== next.datasetHash)
      throw new CaseError("AIR_STALE_REVIEW", 409);
    if (cmd.action === "review") {
      if (actor === next.importedBy) throw new CaseError("INDEPENDENT_REVIEWER_REQUIRED", 403);
      if (
        cmd.findings.some((f) =>
          f.sourceLines.some((line) => !next!.dataset.samples.some((s) => s.sourceLine === line)),
        )
      )
        throw new CaseError("AIR_UNRESOLVED_SOURCE_LINE");
      next.review = {
        actorId: actor,
        at: now,
        simulated: true,
        datasetHash: next.datasetHash,
        decision: cmd.decision,
        competence: cmd.competence,
        rationale: cmd.rationale,
        confounders: cmd.confounders,
        findings: cmd.findings,
      };
      // A new review never silently carries approvals from an earlier decision.
      next.actions = [];
      next.verification = null;
    } else if (cmd.action === "verifyOutcome") {
      if (current.role === "reviewer") throw new CaseError("CASE_EDIT_DENIED", 403);
      if (next.review?.decision !== "accept" || !next.actions.some((a) => a.status === "completed"))
        throw new CaseError("AIR_COMPLETED_ACTION_REQUIRED", 409);
      const analysis = analyzeCompressedAir(next.dataset);
      const paired = analysis.verificationPairs.filter((p) => p.state === "descriptive_only");
      next.verification = {
        actorId: actor,
        at: now,
        datasetHash: next.datasetHash,
        confounders: cmd.confounders,
        rationale: cmd.rationale,
        outcome: "inconclusive",
        descriptiveEvidence:
          paired.length > 0 && paired.length === analysis.verificationPairs.length
            ? "matched_intervals_available"
            : "insufficient_comparable_intervals",
        sourceLines: [...new Set(paired.flatMap((p) => [p.beforeLine!, p.afterLine]))],
      };
    } else if (cmd.action !== "export") {
      if (current.role === "reviewer") throw new CaseError("CASE_EDIT_DENIED", 403);
      if (next.review?.decision !== "accept")
        throw new CaseError("AIR_ACCEPTED_REVIEW_REQUIRED", 409);
      next.verification = null;
      if (cmd.action === "propose") {
        if (next.actions.some((a) => a.id === cmd.id))
          throw new CaseError("AIR_ACTION_EXISTS", 409);
        next.actions.push({
          id: cmd.id,
          owner: cmd.owner,
          description: cmd.description,
          status: "proposed",
          proposedBy: actor,
        });
      } else {
        const action = next.actions.find((a) => a.id === cmd.id);
        if (!action) throw new CaseError("AIR_ACTION_MISSING", 409);
        if (cmd.action === "approve") {
          if (current.role !== "manager") throw new CaseError("CASE_ASSIGN_DENIED", 403);
          if (action.status !== "proposed") throw new CaseError("AIR_ACTION_TRANSITION", 409);
          Object.assign(action, {
            status: "approved",
            customerApproval: cmd.customerApproval,
            approvedBy: actor,
          });
        } else {
          if (action.status !== "approved") throw new CaseError("AIR_APPROVAL_REQUIRED", 409);
          Object.assign(action, {
            status: "completed",
            completionEvidence: cmd.completionEvidence,
            completedBy: actor,
          });
        }
      }
    }
  }
  const result = await checked(
    await store.call({
      ...base,
      _op: "append",
      _expected: current.revision,
      _key: cmd.requestKey,
      _fingerprint: fingerprint,
      _snapshot: airSnapshotSchema.parse(next),
      _event: {
        kind: cmd.action,
        ...(cmd.action === "export" ? { report: reportPayload(current) } : {}),
      },
    }),
  );
  return cmd.action === "export" ? withReport(result) : result;
}

function withReport(stored: AirStored) {
  if (!stored.report || !stored.reportSha256) throw new CaseError("AIR_REPORT_MISSING", 409);
  return { ...stored, report: { ...stored.report, reportSha256: stored.reportSha256 } };
}

// Computed once before the export append. PostgreSQL adds authoritative custody
// fields and hashes/persists the report in the same immutable revision transaction.
function reportPayload(stored: AirStored) {
  const s = stored.snapshot!;
  return {
    dataset: s.dataset,
    originalCsv: s.csv,
    datasetHash: s.datasetHash,
    importRevision: s.importRevision,
    importedBy: s.importedBy,
    importedAt: s.importedAt,
    analysis: analyzeCompressedAir(s.dataset),
    engineerReview: s.review,
    actions: s.actions,
    outcomeVerification: s.verification,
    reviewStatus: s.review ? "simulated_review_only" : "unreviewed",
    verifiedSavings: null,
    approvedForCustomerDelivery: false,
  };
}
