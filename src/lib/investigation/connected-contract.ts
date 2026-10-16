import { z } from "zod";
import { caseSchema } from "./schema";

const uuid = z.string().uuid();
const key = z.string().trim().min(1).max(200);
const revision = z.number().int().positive();
const common = { caseId: uuid, expectedRevision: revision, requestKey: key };
export const caseCommandSchema = z.discriminatedUnion("action", [
  z
    .object({ action: z.literal("list"), factoryId: z.number().int().positive().optional() })
    .strict(),
  z.object({ action: z.literal("load"), caseId: uuid, revision: revision.optional() }).strict(),
  z
    .object({
      action: z.literal("create"),
      caseId: uuid,
      factoryId: z.number().int().positive(),
      candidate: z.enum(["C1", "C4"]),
      requestKey: key,
    })
    .strict(),
  z
    .object({
      action: z.literal("save"),
      ...common,
      snapshot: caseSchema,
      reason: z.string().trim().min(1).max(4000),
    })
    .strict(),
  z
    .object({
      action: z.literal("verify"),
      ...common,
      evidenceId: key,
      basis: z.string().trim().min(10).max(4000),
    })
    .strict(),
  z
    .object({
      action: z.literal("review"),
      ...common,
      reviewer: key,
      competence: key,
      scope: key,
      decision: z.enum(["accept", "revise", "reject"]),
      rationale: z.string().trim().min(10).max(4000),
      dissent: z.string().max(4000),
    })
    .strict(),
  z
    .object({
      action: z.literal("assign"),
      ...common,
      userId: uuid,
      role: z.enum(["investigator", "reviewer"]),
      active: z.boolean(),
      expiresAt: z.string().datetime({ offset: true }).nullable(),
    })
    .strict(),
]);
export type CaseCommand = z.infer<typeof caseCommandSchema>;
export const storedCaseSchema = z.object({
  caseId: uuid,
  factoryId: z.number().int().positive(),
  role: z.enum(["manager", "investigator", "reviewer"]),
  revision,
  headRevision: revision.optional(),
  snapshot: caseSchema,
  snapshotSha256: z.string().regex(/^[a-f0-9]{64}$/),
  integrityValid: z.literal(true),
  lastEditor: uuid,
  replayed: z.boolean().optional(),
  history: z
    .array(
      z.object({
        revision,
        snapshot: caseSchema.optional(),
        actorId: uuid,
        at: z.string(),
        event: z.record(z.unknown()),
        integrityValid: z.literal(true),
      }),
    )
    .optional(),
});
export type StoredCase = z.infer<typeof storedCaseSchema>;
export interface CaseStore {
  call(args: Record<string, unknown>): Promise<unknown>;
}
