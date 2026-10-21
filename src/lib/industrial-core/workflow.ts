import { z } from "zod";
import type { Capability, Context } from "./model";
export const transactionKind = z.enum([
  "inquiry",
  "quotation",
  "order_acceptance",
  "material_requirement",
  "purchase_requisition",
  "purchase_order",
  "production_scheduling",
  "work_assignment",
  "quality_release",
  "dispatch",
  "invoice",
  "payment_status",
  "exception",
  "reconciliation",
]);
export type TransactionKind = z.infer<typeof transactionKind>;
export const phase = z.enum([
  "awaiting_approval",
  "approved",
  "executing",
  "completed",
  "failed",
  "cancelled",
  "awaiting_provider",
]);
export const workflowSchema = z
  .object({
    kind: transactionKind,
    phase,
    actionId: z.string(),
    inputDigest: z.string(),
    decisionDigest: z.string(),
    requiredAuthorities: z.array(
      z.enum(["read", "edit", "commercial", "quality", "safety", "finance", "sharing"]),
    ),
    proposedBy: z.string(),
    approvedBy: z.string().nullable(),
    approvedAt: z.string().nullable(),
    executionRef: z.string().nullable(),
    executedAt: z.string().nullable(),
    result: z.enum(["unverified", "inconclusive", "observed_internal_result"]),
    outcomeEvidenceId: z.string().nullable(),
  })
  .strict();
export type Workflow = z.infer<typeof workflowSchema>;
export const authorityFor = (kind: TransactionKind): Capability =>
  kind === "quality_release"
    ? "quality"
    : kind === "payment_status" || kind === "invoice"
      ? "finance"
      : ["quotation", "order_acceptance", "purchase_order", "dispatch"].includes(kind)
        ? "commercial"
        : "edit";
export function requireCapabilities(context: Context, required: Capability[]) {
  if (required.some((r) => !context.capabilities.includes(r)))
    throw new Error("CORE_AUTHORITY_DENIED");
}
export interface InternalExecutionProvider {
  readonly mode: "internal-synthetic-only";
  execute(idempotencyKey: string): Promise<{ reference: string }>;
}
// Future payment/ERP adapters must verify authenticated provider receipts. None is wired here.
export interface ConfirmedPaymentProvider {
  verifyReceipt(
    receipt: unknown,
  ): Promise<{ provider: string; transactionId: string; confirmed: boolean }>;
}
export function approveWorkflow(
  workflow: Workflow,
  ctx: Context,
  inputDigest: string,
  decisionDigest: string,
): Workflow {
  if (
    workflow.phase !== "awaiting_approval" ||
    workflow.inputDigest !== inputDigest ||
    workflow.decisionDigest !== decisionDigest
  )
    throw new Error("CORE_STALE_APPROVAL");
  if (workflow.proposedBy === ctx.actorId) throw new Error("CORE_INDEPENDENT_APPROVER_REQUIRED");
  requireCapabilities(ctx, workflow.requiredAuthorities);
  return { ...workflow, phase: "approved", approvedBy: ctx.actorId, approvedAt: ctx.now };
}
export async function executeWorkflow(
  workflow: Workflow,
  ctx: Context,
  key: string,
  approverCapabilities: Capability[],
  provider: InternalExecutionProvider,
): Promise<Workflow> {
  if (!["approved", "executing", "failed"].includes(workflow.phase) || !workflow.approvedBy)
    throw new Error("CORE_WORKFLOW_TRANSITION_DENIED");
  requireCapabilities(ctx, ["edit"]);
  if (workflow.requiredAuthorities.some((c) => !approverCapabilities.includes(c)))
    throw new Error("CORE_APPROVAL_AUTHORITY_REVOKED");
  if (workflow.kind === "payment_status")
    return { ...workflow, phase: "awaiting_provider", result: "unverified" };
  if (provider.mode !== "internal-synthetic-only")
    throw new Error("CORE_EXTERNAL_EXECUTION_DISABLED");
  try {
    const result = await provider.execute(key);
    return {
      ...workflow,
      phase: "completed",
      executionRef: result.reference,
      executedAt: ctx.now,
      result: "unverified",
    };
  } catch {
    return {
      ...workflow,
      phase: "failed",
      executionRef: null,
      executedAt: ctx.now,
      result: "inconclusive",
    };
  }
}
