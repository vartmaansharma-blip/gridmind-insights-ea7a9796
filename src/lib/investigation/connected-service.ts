import { z } from "zod";
import { addReview, evaluateCase } from "./engine";
import { decisionBrief } from "./brief";
import { customerBrief } from "./customer-brief";
import { METHOD_VERSION } from "./engine";
import { caseSchema, type Investigation } from "./schema";
import { syntheticCase } from "./fixtures";
import {
  caseCommandSchema,
  storedCaseSchema,
  type CaseCommand,
  type CaseStore,
  type StoredCase,
} from "./connected-contract";

export class CaseError extends Error {
  constructor(
    public code: string,
    public status = 400,
  ) {
    super(code);
  }
}
export function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value !== null && typeof value === "object")
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${stableJson(v)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
async function sha256(value: unknown): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(stableJson(value)));
  return Array.from(new Uint8Array(bytes), (v) => v.toString(16).padStart(2, "0")).join("");
}
function sourceContent(c: Investigation, evidenceId: string): string {
  const evidence = c.evidence.find((e) => e.id === evidenceId);
  if (!evidence) return "";
  const { checked: _checked, verification: _verification, ...source } = evidence;
  return stableJson({
    source,
    periods: c.periods.filter((p) => p.evidenceId === evidenceId),
    events: c.events.filter((e) => e.evidenceId === evidenceId),
  });
}
const response = (stored: StoredCase) => ({
  ...stored,
  evaluation: evaluateCase(stored.snapshot),
  brief: decisionBrief(stored.snapshot),
  approvedForCustomerDelivery: false as const,
});

/** All mutations use verified actor identity, server-controlled transitions and atomic DB CAS. */
export async function executeCaseCommand(
  store: CaseStore,
  actor: string,
  raw: unknown,
  now = new Date().toISOString(),
) {
  z.string().uuid().parse(actor);
  const cmd: CaseCommand = caseCommandSchema.parse(raw);
  const base = { _actor: actor };
  if (cmd.action === "list")
    return store.call({ ...base, _op: "list", _factory: cmd.factoryId ?? null });
  if (cmd.action === "load")
    return response(
      storedCaseSchema.parse(
        await store.call({
          ...base,
          _op: "read",
          _case: cmd.caseId,
          _expected: cmd.revision ?? null,
        }),
      ),
    );
  const fingerprint = await sha256({ actor, command: cmd });
  if (cmd.action === "create") {
    const snapshot = syntheticCase(cmd.candidate, cmd.caseId);
    snapshot.evidence = snapshot.evidence.map(({ verification: _proof, ...e }) => ({
      ...e,
      checked: false,
    }));
    return response(
      storedCaseSchema.parse(
        await store.call({
          ...base,
          _op: "create",
          _case: cmd.caseId,
          _factory: cmd.factoryId,
          _expected: 0,
          _key: cmd.requestKey,
          _fingerprint: fingerprint,
          _snapshot: snapshot,
          _event: { kind: "edit", reason: "Created invented case" },
        }),
      ),
    );
  }
  const receipt = await store.call({
    ...base,
    _op: "receipt",
    _case: cmd.caseId,
    _key: cmd.requestKey,
    _fingerprint: fingerprint,
  });
  if (typeof receipt === "object" && receipt !== null && "snapshot" in receipt)
    return response(storedCaseSchema.parse(receipt));
  const current = storedCaseSchema.parse(
    await store.call({ ...base, _op: "read_internal", _case: cmd.caseId }),
  );
  if (current.revision !== cmd.expectedRevision) throw new CaseError("STALE_CASE_REVISION", 409);
  let next = structuredClone(current.snapshot);
  let event: Record<string, unknown>;
  if (cmd.action === "assign") {
    if (current.role !== "manager") throw new CaseError("CASE_ASSIGN_DENIED", 403);
    event = {
      kind: "assign",
      userId: cmd.userId,
      role: cmd.role,
      active: cmd.active,
      expiresAt: cmd.expiresAt,
    };
  } else if (cmd.action === "save") {
    if (current.role === "reviewer") throw new CaseError("CASE_EDIT_DENIED", 403);
    next = caseSchema.parse(cmd.snapshot);
    if (
      next.id !== current.caseId ||
      next.origin !== "synthetic" ||
      next.candidate !== current.snapshot.candidate ||
      next.revision !== current.revision
    )
      throw new CaseError("CASE_IDENTITY_IMMUTABLE");
    if (stableJson(next.reviews) !== stableJson(current.snapshot.reviews))
      throw new CaseError("REVIEW_COMMAND_REQUIRED");
    next.evidence = next.evidence.map((e) => {
      const old = current.snapshot.evidence.find((v) => v.id === e.id);
      if (
        (e.checked && !old?.checked) ||
        stableJson(e.verification ?? null) !== stableJson(old?.verification ?? null)
      )
        throw new CaseError("SOURCE_VERIFICATION_COMMAND_REQUIRED");
      if (
        !old ||
        sourceContent(next, e.id) !== sourceContent(current.snapshot, e.id) ||
        !e.checked
      ) {
        const { verification: _proof, ...rawSource } = e;
        return { ...rawSource, checked: false };
      }
      return { ...e, checked: old.checked, verification: old.verification };
    });
    event = { kind: "edit", reason: cmd.reason };
  } else if (cmd.action === "verify") {
    const e = next.evidence.find((v) => v.id === cmd.evidenceId);
    if (
      !e ||
      !e.permitted ||
      e.conflict.trim() ||
      !e.owner.trim() ||
      !e.reference.trim() ||
      !e.retention.trim()
    )
      throw new CaseError("SOURCE_NOT_VERIFIABLE");
    e.checked = true;
    e.verification = { actorId: actor, at: now, basis: cmd.basis };
    event = { kind: "verify", evidenceId: e.id, basis: cmd.basis };
  } else {
    if (current.lastEditor === actor) throw new CaseError("INDEPENDENT_REVIEWER_REQUIRED", 403);
    if (cmd.decision === "accept" && (evaluateCase(next).issues.length || cmd.dissent.trim()))
      throw new CaseError("CASE_REVIEW_BLOCKED");
    next = addReview(next, {
      id: crypto.randomUUID(),
      reviewer: cmd.reviewer,
      competence: cmd.competence,
      scope: cmd.scope,
      decision: cmd.decision,
      rationale: cmd.rationale,
      dissent: cmd.dissent,
      at: now,
      actorId: actor,
    });
    event = {
      kind: "review",
      decision: cmd.decision,
      reviewedRevision: current.revision,
      ...(cmd.decision === "accept"
        ? {
            publicationId: next.reviews.at(-1)!.id,
            customerPublication: {
              brief: customerBrief({ ...next, revision: current.revision + 1 }),
            },
            methodVersion: METHOD_VERSION,
          }
        : {}),
    };
  }
  next.revision = current.revision + 1;
  return response(
    storedCaseSchema.parse(
      await store.call({
        ...base,
        _op: "append",
        _case: cmd.caseId,
        _expected: current.revision,
        _key: cmd.requestKey,
        _fingerprint: fingerprint,
        _snapshot: next,
        _event: event,
      }),
    ),
  );
}
