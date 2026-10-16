import { z } from "zod";

const text = z.string().trim().max(4000);
const id = z.string().trim().min(1).max(100);
const money = z.number().finite().nonnegative().max(1e12);
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => {
    const parsed = new Date(v);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === v;
  }, "Use a valid calendar date");
const time = z.string().datetime({ offset: true });

export const evidenceSchema = z
  .object({
    id,
    reference: text,
    owner: text,
    origin: z.literal("synthetic"),
    permitted: z.boolean(),
    checked: z.boolean(),
    conflict: text,
    receivedAt: time,
    retention: text,
    limitation: text,
  })
  .strict();
export const periodSchema = z
  .object({
    id,
    evidenceId: id,
    invoiceId: text,
    month: text,
    kwh: z.number().finite(),
    billedInr: z.number().finite(),
    production: z.number().finite(),
    unit: text,
  })
  .strict();
export const eventSchema = z
  .object({
    id,
    evidenceId: id,
    rawTime: text,
    reconciledTime: text,
    clock: text,
    clockVerified: z.boolean(),
    kind: z.enum(["observation", "stop", "restart"]),
    description: text,
  })
  .strict();
export const findingSchema = z
  .object({
    id,
    type: z.enum(["observation", "hypothesis", "next_check"]),
    statement: text,
    evidenceIds: z.array(id).max(100),
    counterEvidence: text,
    uncertainty: text,
    nextCheck: text,
    disposition: z.enum(["open", "included", "rejected"]),
  })
  .strict();
export const reviewSchema = z
  .object({
    id,
    revision: z.number().int().positive(),
    snapshot: z.string().max(500000),
    reviewer: text,
    competence: text,
    scope: text,
    decision: z.enum(["revise", "reject", "accept"]),
    rationale: text,
    dissent: text,
    at: time,
    simulated: z.literal(true),
  })
  .strict();
export const caseSchema = z
  .object({
    id,
    origin: z.literal("synthetic"),
    candidate: z.enum(["C1", "C4"]),
    revision: z.number().int().positive(),
    title: text,
    scope: z
      .object({
        question: text,
        owner: text,
        site: text,
        boundary: text,
        from: date,
        to: date,
        exclusions: text,
        acceptance: text,
        stopRules: text,
        alternative: text,
        residualGap: text,
      })
      .strict(),
    stopped: z.boolean(),
    stopReason: text,
    evidence: z.array(evidenceSchema).max(200),
    periods: z.array(periodSchema).max(120),
    events: z.array(eventSchema).max(500),
    findings: z.array(findingSchema).max(100),
    reviews: z.array(reviewSchema).max(100),
    decision: z
      .object({
        status: z.enum(["pending", "accepted", "declined", "deferred"]),
        owner: text,
        rationale: text,
        at: z.union([date, z.literal("")]),
      })
      .strict(),
    outcome: z
      .object({
        status: z.enum(["not_measured", "planned", "observed"]),
        metric: text,
        baseline: z.number().finite().nullable(),
        observed: z.number().finite().nullable(),
        unit: text,
        from: z.union([date, z.literal("")]),
        to: z.union([date, z.literal("")]),
        evidenceIds: z.array(id).max(100),
        confounders: text,
      })
      .strict(),
    labor: z
      .array(
        z
          .object({
            id,
            role: z.enum(["founder", "analyst", "reviewer", "site"]),
            task: text,
            hours: z.number().finite().nonnegative().max(10000),
            shadowRate: money,
          })
          .strict(),
      )
      .max(500),
    expenses: z
      .array(
        z
          .object({
            id,
            category: z.enum(["reviewer", "travel", "tools", "rework", "other"]),
            reference: text,
            amount: money,
          })
          .strict(),
      )
      .max(500),
    payments: z
      .array(
        z
          .object({
            id,
            stage: z.enum(["quoted", "contracted", "invoiced", "collected"]),
            at: date,
            amount: money,
            reference: text,
          })
          .strict(),
      )
      .max(100),
  })
  .strict();
export type Investigation = z.infer<typeof caseSchema>;
export type Evidence = z.infer<typeof evidenceSchema>;
export type Period = z.infer<typeof periodSchema>;
export type TimelineEvent = z.infer<typeof eventSchema>;
export type Finding = z.infer<typeof findingSchema>;
export type Review = z.infer<typeof reviewSchema>;

export const workspaceSchema = z
  .object({
    version: z.literal(1),
    origin: z.literal("synthetic"),
    cases: z.array(caseSchema).max(30),
    history: z
      .array(
        z
          .object({
            caseId: id,
            revision: z.number().int().positive(),
            at: time,
            reason: text,
            before: caseSchema,
          })
          .strict(),
      )
      .max(100),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (new Set(value.cases.map((c) => c.id)).size !== value.cases.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Duplicate case IDs" });
    }
  });
export type Workspace = z.infer<typeof workspaceSchema>;
