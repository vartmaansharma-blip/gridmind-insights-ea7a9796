import { z } from "zod";
import {
  id,
  inputSchema,
  capability,
  instant,
  ruleAuthority,
  type CoreInput,
  type Context,
  type Capability,
} from "./model";
import {
  evaluate,
  digest,
  stable,
  applyDisruption,
  evidenceReady,
  type Evaluation,
} from "./engine";
import { instantiateFixture, scenarioIds } from "./fixtures";
import {
  approveWorkflow,
  executeWorkflow,
  requireCapabilities,
  transactionKind,
  authorityFor,
  workflowSchema,
  type Workflow,
  type InternalExecutionProvider,
} from "./workflow";

import { operatingPlanSchema, planOperations, type PlanningResult, type OperatingPlan } from "./planning";
import { instantiatePlanningFixture, planningScenarioIds } from "./planning-fixtures";

const operationsStateSchema = z.object({
  specification: operatingPlanSchema,
  basedOnInputDigest: z.string().regex(/^[a-f0-9]{64}$/),
  evaluation: z.unknown().nullable(),
}).strict();

const uuid = z.string().uuid(),
  expected = z.number().int().nonnegative().max(2147483646);
const common = { workspaceId: uuid, factoryId: z.number().int().positive() };
const write = { ...common, expectedRevision: expected, requestKey: id };
export const commandSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("load"), ...common }).strict(),
  z.object({ action: z.literal("create"), ...write, scenario: z.enum(scenarioIds) }).strict(),
  z.object({ action: z.literal("replace_input"), ...write, input: inputSchema }).strict(),
  z.object({ action: z.literal("create_operations"), ...write, scenario: z.enum(planningScenarioIds) }).strict(),
  z.object({ action: z.literal("plan_operations"), ...write, specification: operatingPlanSchema }).strict(),
  z.object({ action: z.literal("verify_input"), ...write }).strict(),
  z.object({ action: z.literal("evaluate"), ...write }).strict(),
  z
    .object({
      action: z.literal("approve_exception"),
      ...write,
      ruleId: id,
      actionId: id,
      expiresAt: instant,
      evidenceIds: z.array(id).min(1).max(10),
    })
    .strict(),
  z.object({ action: z.literal("disruption"), ...write, eventId: id }).strict(),
  z
    .object({
      action: z.literal("request_approval"),
      ...write,
      actionId: id,
      kind: transactionKind,
    })
    .strict(),
  z.object({ action: z.literal("approve"), ...write }).strict(),
  z.object({ action: z.literal("execute"), ...write }).strict(),
  z.object({ action: z.literal("cancel"), ...write }).strict(),
  z.object({ action: z.literal("record_outcome"), ...write, evidenceId: id }).strict(),
]);
export type Command = z.infer<typeof commandSchema>;
export type CoreState = {
  origin: "synthetic";
  input: CoreInput;
  inputEditor: string;
  inputDigest: string;
  evaluation: Evaluation | null;
  decisionDigest: string | null;
  workflow: Workflow | null;
  operations?: { specification: OperatingPlan; basedOnInputDigest: string; evaluation: PlanningResult | null };
};
export interface CoreStore {
  call(args: Record<string, unknown>): Promise<unknown>;
}
const contextSchema = z.object({
  organizationId: z.number().int().positive(),
  factoryId: z.number().int().positive(),
  actorId: uuid,
  capabilities: z.array(capability),
  at: instant,
  approverCapabilities: z.array(capability).default([]),
});
const storedSchema = z.object({
  revision: expected,
  snapshot: z.unknown().nullable(),
  snapshotSha256: z
    .string()
    .regex(/^[a-f0-9]{64}$/)
    .nullable(),
  integrityValid: z.literal(true),
  replayed: z.boolean().optional(),
  audit: z
    .array(
      z.object({
        revision: z.number().int().positive(),
        actorId: uuid,
        at: instant,
        event: z.record(z.unknown()),
        snapshotSha256: z.string(),
      }),
    )
    .max(200),
});
export async function parseState(raw: unknown): Promise<CoreState> {
  const s = z
    .object({
      origin: z.literal("synthetic"),
      input: inputSchema,
      inputEditor: uuid,
      inputDigest: z.string().length(64),
      evaluation: z.unknown().nullable(),
      decisionDigest: z.string().length(64).nullable(),
      workflow: workflowSchema.nullable(),
      operations: operationsStateSchema.optional(),
    })
    .strict()
    .parse(raw);
  if ((await digest(s.input)) !== s.inputDigest) throw new Error("CORE_INPUT_INTEGRITY_FAILED");
  if (s.evaluation) {
    const evaluated = s.evaluation as Evaluation;
    if (
      evaluated.algorithmVersion !== "gm-core-003/constraints-v1" ||
      stable(evaluated.inputSnapshot) !== stable(s.input) ||
      (await digest(evaluated)) !== s.decisionDigest
    )
      throw new Error("CORE_DECISION_INTEGRITY_FAILED");
  } else if (s.decisionDigest || s.workflow) throw new Error("CORE_DECISION_MISSING");
  if (
    s.workflow &&
    (s.workflow.inputDigest !== s.inputDigest || s.workflow.decisionDigest !== s.decisionDigest)
  )
    throw new Error("CORE_STALE_APPROVAL");
  if (s.operations && s.operations.evaluation !== null) {
    const previous = z.object({ evaluatedAt: instant }).passthrough().parse(s.operations.evaluation);
    const replay = await planOperations(s.input, s.operations.specification, previous.evaluatedAt);
    if (s.operations.basedOnInputDigest !== s.inputDigest || stable(replay) !== stable(s.operations.evaluation))
      throw new Error("CORE_OPERATING_PLAN_INTEGRITY_FAILED");
  }
  return s as CoreState;
}
const authorizable = (
  a: Evaluation["alternatives"][number] | undefined,
): a is Evaluation["alternatives"][number] =>
  !!a &&
  (a.status === "eligible" ||
    (a.status === "conditional" &&
      a.checks.every(
        (c) =>
          c.status === "eligible" ||
          c.reason === "EXPLICIT_APPROVED_EXCEPTION_REQUIRES_ACTION_AUTHORIZATION",
      )));
const internalProvider: InternalExecutionProvider = {
  mode: "internal-synthetic-only",
  async execute(key) {
    return { reference: `synthetic-internal:${key}` };
  },
};
export async function executeCoreCommand(
  store: CoreStore,
  actorId: string,
  sessionId: string,
  raw: unknown,
  provider: InternalExecutionProvider = internalProvider,
) {
  const cmd = commandSchema.parse(raw);
  const context = contextSchema.parse(
    await store.call({
      _op: "context",
      _actor: actorId,
      _session: sessionId,
      _factory: cmd.factoryId,
      _workspace: cmd.workspaceId,
    }),
  );
  if (context.actorId !== actorId || context.factoryId !== cmd.factoryId)
    throw new Error("CORE_SCOPE_DENIED");
  const ctx: Context = { actorId, capabilities: context.capabilities, now: context.at };
  requireCapabilities(ctx, ["read"]);
  const args = {
    _actor: actorId,
    _session: sessionId,
    _factory: cmd.factoryId,
    _workspace: cmd.workspaceId,
  };
  const loaded = storedSchema.parse(await store.call({ ...args, _op: "load" }));
  const decode = async (data: unknown) => {
    const row = storedSchema.parse(data);
    const snapshot = row.snapshot === null ? null : await parseState(row.snapshot);
    return { ...row, snapshot };
  };
  if (cmd.action === "load") return decode(loaded);
  requireCapabilities(ctx, cmd.action === "approve" ? ["read"] : ["edit"]);
  const fingerprint = await digest({ actorId, command: cmd });
  // Resolve retries only after fresh membership/session/authority checks; lookup has no side effects.
  const replay = await store.call({
    ...args,
    _op: "receipt",
    _key: cmd.requestKey,
    _fingerprint: fingerprint,
  });
  if (replay) return decode(replay);
  if (loaded.revision !== cmd.expectedRevision) throw new Error("CORE_VERSION_CONFLICT");
  let next: CoreState;
  if (cmd.action === "create" || cmd.action === "create_operations") {
    if (loaded.snapshot || cmd.expectedRevision !== 0) throw new Error("CORE_WORKSPACE_EXISTS");
    const operating = cmd.action === "create_operations"
      ? instantiatePlanningFixture(cmd.scenario, context.organizationId, context.factoryId, context.at) : null;
    const input = operating?.input ?? instantiateFixture(
      cmd.action === "create" ? cmd.scenario : "A", context.organizationId, context.factoryId, context.at,
    );
    // Bundled content does not certify user-provided sources or grant authority.
    for (const e of input.evidence) e.verification = "unverified";
    for (const r of input.constraints) {
      r.verification = "proposed";
      r.verifiedBy = null;
      r.exception = null;
      r.authority = ruleAuthority(r.category);
    }
    for (const e of input.entities)
      if (e.kind === "capability") e.attributes.verification = "proposed";
    next = {
      origin: "synthetic",
      input,
      inputEditor: actorId,
      inputDigest: await digest(input),
      evaluation: null,
      decisionDigest: null,
      workflow: null,
      ...(operating ? { operations: { specification: operating.plan, basedOnInputDigest: await digest(input), evaluation: null } } : {}),
    };
  } else {
    if (!loaded.snapshot) throw new Error("CORE_WORKSPACE_MISSING");
    next = await parseState(loaded.snapshot);
    if (cmd.action === "replace_input") {
      if (
        cmd.input.organizationId !== context.organizationId ||
        cmd.input.factoryId !== context.factoryId
      )
        throw new Error("CORE_SCOPE_DENIED");
      const input = structuredClone(cmd.input);
      // Imported document extraction NEVER establishes binding rules, sharing or qualifications.
      // Imported claims cannot confirm the owner's objectives or authorize preferred actions.
      for (const intent of input.ownerIntents ?? []) {
        intent.status = "proposed";
        intent.confirmedBy = null;
      }
      for (const e of input.evidence) e.verification = "unverified";
      for (const r of input.constraints) {
        r.verification = "proposed";
        r.verifiedBy = null;
        r.exception = null;
        r.authority = ruleAuthority(r.category);
      }
      for (const e of input.entities)
        if (e.kind === "capability") e.attributes.verification = "proposed";
      for (const e of input.entities) {
        const previous = next.input.entities.find((p) => p.id === e.id);
        if (previous)
          e.version =
            stable({ ...e, version: 0 }) === stable({ ...previous, version: 0 })
              ? previous.version
              : previous.version + 1;
      }
      for (const r of input.constraints) {
        const previous = next.input.constraints.find((p) => p.id === r.id);
        if (previous) {
          const semantic = (v: typeof r) => ({
            ...v,
            version: 0,
            verification: null,
            verifiedBy: null,
            exception: null,
          });
          r.version =
            stable(semantic(r)) === stable(semantic(previous))
              ? previous.version
              : previous.version + 1;
        }
      }
      next = {
        origin: "synthetic",
        input,
        inputEditor: actorId,
        inputDigest: await digest(input),
        evaluation: null,
        decisionDigest: null,
        workflow: null,
      };
    } else if (cmd.action === "plan_operations") {
      next.operations = { specification: cmd.specification, basedOnInputDigest: next.inputDigest,
        evaluation: await planOperations(next.input, cmd.specification, ctx.now) };
    } else if (cmd.action === "approve_exception") {
      const rule = next.input.constraints.find((r) => r.id === cmd.ruleId);
      if (
        !rule ||
        rule.verification !== "verified" ||
        !rule.exceptionPermitted ||
        !next.input.actions.some((a) => a.id === cmd.actionId) ||
        ["safety", "regulatory"].includes(rule.category)
      )
        throw new Error("CORE_EXCEPTION_NOT_PERMITTED");
      requireCapabilities(ctx, [ruleAuthority(rule.category)]);
      if (actorId === next.inputEditor) throw new Error("CORE_INDEPENDENT_APPROVER_REQUIRED");
      if (
        Date.parse(cmd.expiresAt) <= Date.parse(ctx.now) ||
        Date.parse(cmd.expiresAt) > Date.parse(rule.expiresAt) ||
        !evidenceReady(next.input, cmd.evidenceIds, ctx.now)
      )
        throw new Error("CORE_EXCEPTION_EVIDENCE_REQUIRED");
      rule.exception = {
        actionId: cmd.actionId,
        approvedBy: actorId,
        expiresAt: cmd.expiresAt,
        evidenceIds: cmd.evidenceIds,
      };
      rule.version += 1;
      next.inputDigest = await digest(next.input);
      next.evaluation = null;
      next.decisionDigest = null;
      next.workflow = null;
    } else if (cmd.action === "verify_input") {
      if (actorId === next.inputEditor) throw new Error("CORE_INDEPENDENT_REVIEWER_REQUIRED");
      const authorities = Array.from(
        new Set<Capability>(["quality", ...next.input.constraints.map((r) => r.authority)]),
      );
      requireCapabilities(ctx, authorities);
      for (const e of next.input.evidence) e.verification = "verified";
      for (const r of next.input.constraints) {
        r.verification = "verified";
        r.verifiedBy = actorId;
      }
      for (const e of next.input.entities)
        if (e.kind === "capability") e.attributes.verification = "verified";
      next.inputDigest = await digest(next.input);
      next.evaluation = null;
      next.decisionDigest = null;
      next.workflow = null;
    } else if (cmd.action === "evaluate" || cmd.action === "disruption") {
      if (cmd.action === "disruption") {
        next.input = applyDisruption(next.input, cmd.eventId, ctx.now);
        next.inputDigest = await digest(next.input);
        next.inputEditor = actorId;
      }
      next.evaluation = evaluate(next.input, ctx.now);
      next.decisionDigest = await digest(next.evaluation);
      next.workflow = null;
    } else {
      if (!next.evaluation || !next.decisionDigest) throw new Error("CORE_EVALUATION_REQUIRED");
      const fresh = evaluate(next.input, ctx.now);
      if (cmd.action === "request_approval") {
        if (next.workflow && !["completed", "failed", "cancelled"].includes(next.workflow.phase))
          throw new Error("CORE_WORKFLOW_TRANSITION_DENIED");
        const action = fresh.alternatives.find((a) => a.actionId === cmd.actionId);
        if (!authorizable(action)) throw new Error("CORE_ACTION_NOT_ELIGIBLE");
        // A confirmed unresolved strategic disagreement invalidates the decision as a
        // whole. Approving a different action must not bypass the owner's review.
        if (fresh.ownerIntentAssessment?.conflicts.length)
          throw new Error("CORE_OWNER_INTENT_CONFLICT_REQUIRES_REVIEW");
        const requiredAuthorities = Array.from(
          new Set<Capability>([...action.requiredAuthorities, authorityFor(cmd.kind)]),
        );
        next.workflow = {
          kind: cmd.kind,
          phase: "awaiting_approval",
          actionId: cmd.actionId,
          inputDigest: next.inputDigest,
          decisionDigest: next.decisionDigest,
          requiredAuthorities,
          proposedBy: actorId,
          approvedBy: null,
          approvedAt: null,
          executionRef: null,
          executedAt: null,
          result: "unverified",
          outcomeEvidenceId: null,
        };
      } else {
        if (!next.workflow) throw new Error("CORE_WORKFLOW_MISSING");
        if (
          !["cancel", "record_outcome"].includes(cmd.action) &&
          (
            !authorizable(fresh.alternatives.find((a) => a.actionId === next.workflow!.actionId)) ||
            Boolean(fresh.ownerIntentAssessment?.conflicts.length)
          )
        )
          throw new Error("CORE_ACTION_NO_LONGER_ELIGIBLE");
        if (cmd.action === "approve")
          next.workflow = approveWorkflow(
            next.workflow,
            ctx,
            next.inputDigest,
            next.decisionDigest,
          );
        else if (cmd.action === "execute")
          next.workflow = await executeWorkflow(
            next.workflow,
            ctx,
            cmd.requestKey,
            context.approverCapabilities,
            provider,
          );
        else if (cmd.action === "cancel") {
          if (["completed", "cancelled"].includes(next.workflow.phase))
            throw new Error("CORE_WORKFLOW_TRANSITION_DENIED");
          next.workflow = { ...next.workflow, phase: "cancelled" };
        } else if (cmd.action === "record_outcome") {
          requireCapabilities(ctx, ["quality"]);
          const evidence = next.input.evidence.find((e) => e.id === cmd.evidenceId);
          if (
            next.workflow.phase !== "completed" ||
            !evidence ||
            !evidenceReady(next.input, [evidence.id], ctx.now) ||
            !next.workflow.executedAt ||
            Date.parse(evidence.observedAt) < Date.parse(next.workflow.executedAt)
          )
            throw new Error("CORE_OUTCOME_EVIDENCE_REQUIRED");
          next.workflow = {
            ...next.workflow,
            result: "observed_internal_result",
            outcomeEvidenceId: evidence.id,
          };
        }
      }
    }
  }
  if (next.operations && next.operations.basedOnInputDigest !== next.inputDigest)
    next.operations = { ...next.operations, evaluation: null };
  const snapshot = z
    .object({ origin: z.literal("synthetic"), input: inputSchema })
    .passthrough()
    .parse(next);
  return decode(
    await store.call({
      ...args,
      _op: "append",
      _expected: cmd.expectedRevision,
      _key: cmd.requestKey,
      _fingerprint: fingerprint,
      _snapshot: snapshot,
      _event: {
        kind: cmd.action,
        ...(cmd.action === "replace_input" ? { sourceId: next.input.sourceId } : {}),
        ...(cmd.action === "disruption" ? { eventId: cmd.eventId } : {}),
        algorithmVersion: "gm-core-003/constraints-v1",
        inputDigest: next.inputDigest,
        decisionDigest: next.decisionDigest,
      },
    }),
  );
}
