import { z } from "zod";
const uuid = z.string().uuid();
const text = z.string().trim().min(1).max(4000);
const ref = { caseId: uuid };
const mutation = { ...ref, id: uuid };
export const intakeSchema = z
  .object({
    title: text.max(160),
    question: text,
    site: text.max(160),
    candidate: z.enum(["C1", "C4"]),
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .strict();
export const portalCommandSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("principal") }).strict(),
  z.object({ action: z.literal("list") }).strict(),
  z.object({ action: z.literal("load"), ...ref }).strict(),
  z.object({ action: z.literal("intakeList") }).strict(),
  z.object({ action: z.literal("submit"), id: uuid, payload: intakeSchema }).strict(),
  z
    .object({
      action: z.literal("accept"),
      id: uuid,
      factoryId: z.number().int().positive(),
      caseId: uuid,
      autoPublish: z.boolean(),
    })
    .strict(),
  z
    .object({
      action: z.literal("grant"),
      ...ref,
      userId: uuid,
      active: z.boolean(),
      expiresAt: z.string().datetime({ offset: true }).nullable(),
    })
    .strict(),
  z
    .object({
      action: z.literal("publish"),
      ...mutation,
      expectedRevision: z.number().int().positive(),
    })
    .strict(),
  z.object({ action: z.literal("message"), ...mutation, text }).strict(),
  z
    .object({ action: z.literal("evidence_request"), ...mutation, text, evidenceId: text.max(100) })
    .strict(),
  z
    .object({
      action: z.literal("evidence_reply"),
      ...mutation,
      text,
      requestId: uuid,
      reference: text.max(400),
    })
    .strict(),
  z.object({ action: z.literal("withdraw"), ...mutation, text }).strict(),
  z
    .object({
      action: z.literal("decision"),
      ...mutation,
      text,
      publicationId: uuid,
      decision: z.enum(["accepted", "declined", "deferred"]),
    })
    .strict(),
]);
export type PortalCommand = z.infer<typeof portalCommandSchema>;
export interface PortalCase {
  id: string;
  revision: number;
  title: string;
  site: string;
  question: string;
  boundary: string;
  from: string;
  to: string;
  stage: string;
  role: string;
  evidence: { id: string; name: string; verified: boolean }[];
  publication: { id: string; revision: number; at: string; brief: string } | null;
  communications: {
    id: string;
    role: string;
    kind: string;
    payload: Record<string, string>;
    at: string;
  }[];
}
export interface PortalList {
  cases: {
    id: string;
    factoryId: number;
    revision: number;
    role: string;
    title: string;
    site: string;
    candidate: string;
  }[];
}
export interface Principal {
  factories: { id: number; name: string; role: string }[];
  isCustomer: boolean;
}
export interface Intake {
  id: string;
  requester: string;
  payload: z.infer<typeof intakeSchema>;
  caseId: string | null;
  at: string;
}
