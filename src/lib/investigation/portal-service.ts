import { z } from "zod";
import { caseSchema } from "./schema";
import { evaluateCase, METHOD_VERSION } from "./engine";
import { syntheticCase } from "./fixtures";
import { CaseError, stableJson } from "./connected-service";
import type { CaseStore } from "./connected-contract";
import { customerBrief } from "./customer-brief";
import { intakeSchema, portalCommandSchema, type PortalCase } from "./portal-contract";

const bundleSchema = z.object({
  snapshot: caseSchema,
  role: z.enum(["customer", "manager", "investigator", "reviewer"]),
  lastEditor: z.string().uuid(),
  snapshotSha256: z.string(),
  integrityValid: z.literal(true),
  publication: z
    .object({
      id: z.string().uuid(),
      revision: z.number(),
      created_at: z.string(),
      projection: z.object({ brief: z.string() }),
    })
    .nullable(),
  communications: z.array(
    z.object({
      id: z.string(),
      role: z.string(),
      kind: z.string(),
      payload: z.record(z.string()),
      at: z.string(),
    }),
  ),
});
export function projectCustomerCase(raw: unknown): PortalCase {
  const b = bundleSchema.parse(raw),
    c = b.snapshot,
    e = evaluateCase(c);
  return {
    id: c.id,
    revision: c.revision,
    title: c.title,
    site: c.scope.site,
    question: c.scope.question,
    boundary: c.scope.boundary,
    from: c.scope.from,
    to: c.scope.to,
    role: b.role,
    stage: c.stopped
      ? "Paused"
      : b.publication
        ? "Brief available"
        : e.issues.length
          ? "Evidence needed"
          : "In review",
    evidence: c.evidence.map((v) => ({ id: v.id, name: v.reference, verified: v.checked })),
    publication: b.publication
      ? {
          id: b.publication.id,
          revision: b.publication.revision,
          at: b.publication.created_at,
          brief: b.publication.projection.brief,
        }
      : null,
    communications: b.communications.map((v) => ({
      id: v.id,
      role: v.role,
      kind: v.kind,
      payload: { ...v.payload },
      at: v.at,
    })),
  };
}
export async function executePortalCommand(
  store: CaseStore,
  actor: string,
  raw: unknown,
  organizationId?: number,
) {
  const cmd = portalCommandSchema.parse(raw);
  const call = (op: string, args: Record<string, unknown> = {}) =>
    store.call({ _actor: actor, _op: op, _args: args });
  if (cmd.action === "principal") return call("principal");
  if (cmd.action === "list") return call("list");
  if (cmd.action === "intakeList") return call("intake_list");
  if (cmd.action === "load")
    return projectCustomerCase(await call("bundle", { caseId: cmd.caseId }));
  const hash = Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(stableJson({ actor, cmd }))),
    ),
  )
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
  if (cmd.action === "submit") {
    if (!organizationId || !Number.isSafeInteger(organizationId))
      throw new CaseError("INTAKE_NOT_CONFIGURED", 503);
    const parsedDates = caseSchema.shape.scope.shape.from.safeParse(cmd.payload.from);
    if (
      !parsedDates.success ||
      !caseSchema.shape.scope.shape.to.safeParse(cmd.payload.to).success ||
      cmd.payload.from > cmd.payload.to
    )
      throw new CaseError("INVALID_SCOPE_WINDOW");
    return call("intake_submit", {
      id: cmd.id,
      organizationId,
      payload: cmd.payload,
      fingerprint: hash,
    });
  }
  if (cmd.action === "accept") {
    const intake = z
      .object({ payload: intakeSchema })
      .parse(await call("intake_read", { id: cmd.id }));
    const c = syntheticCase(intake.payload.candidate, cmd.caseId);
    c.title = intake.payload.title;
    // Keep the strict domain shape: intake fields are mapped explicitly.
    c.scope = {
      question: intake.payload.question,
      site: intake.payload.site,
      from: intake.payload.from,
      to: intake.payload.to,
      owner: "Customer decision owner to confirm",
      boundary: "Scope acceptance required: " + intake.payload.site,
      exclusions: c.scope.exclusions,
      acceptance: c.scope.acceptance,
      stopRules: c.scope.stopRules,
      alternative: c.scope.alternative,
      residualGap: c.scope.residualGap,
    };
    c.evidence = c.evidence.map((v) => ({ ...v, checked: false }));
    return call("accept", {
      id: cmd.id,
      caseId: cmd.caseId,
      factoryId: cmd.factoryId,
      autoPublish: cmd.autoPublish,
      snapshot: caseSchema.parse(c),
      fingerprint: hash,
    });
  }
  if (cmd.action === "grant") return call("grant", cmd);
  if (cmd.action === "publish") {
    const b = bundleSchema.parse(await call("bundle", { caseId: cmd.caseId }));
    if (b.role !== "manager") throw new CaseError("PUBLISH_DENIED", 403);
    if (b.snapshot.revision !== cmd.expectedRevision)
      throw new CaseError("STALE_CASE_REVISION", 409);
    const e = evaluateCase(b.snapshot);
    if (e.status !== "synthetic_review_complete" || !e.review?.actorId || !e.reviewCurrent)
      throw new CaseError("CURRENT_INDEPENDENT_REVIEW_REQUIRED");
    return call("publish", {
      ...cmd,
      projection: { brief: customerBrief(b.snapshot) },
      reviewerId: e.review.actorId,
      snapshotSha256: b.snapshotSha256,
      methodVersion: METHOD_VERSION,
      fingerprint: hash,
    });
  }
  const { action, id, caseId, ...payload } = cmd;
  return call("communicate", { id, caseId, kind: action, payload, fingerprint: hash });
}
