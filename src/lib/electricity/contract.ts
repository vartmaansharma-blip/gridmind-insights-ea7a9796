import { z } from "zod";
const uuid = z.string().uuid();
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => {
    const d = new Date(`${v}T00:00:00Z`);
    return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === v;
  }, "Use a valid calendar date");
export const utilities = ["JBVNL", "TSUISL", "TSL", "DVC", "Other", "Unknown"] as const;
export const statuses = [
  "opened",
  "investigating",
  "awaiting_expert",
  "closed_inconclusive",
] as const;
export const nextStatuses: Record<string, string[]> = {
  opened: ["investigating", "closed_inconclusive"],
  investigating: ["awaiting_expert", "closed_inconclusive"],
  awaiting_expert: ["investigating", "closed_inconclusive"],
  closed_inconclusive: [],
};
export const commandSchema = z
  .discriminatedUnion("action", [
    z.object({ action: z.literal("options") }).strict(),
    z.object({ action: z.literal("list") }).strict(),
    z.object({ action: z.literal("load"), caseId: uuid }).strict(),
    z
      .object({
        action: z.literal("create"),
        id: uuid,
        factoryId: z.number().int().positive(),
        investigatorId: uuid,
        utility: z.enum(utilities),
        from: date,
        to: date,
        issue: z.string().trim().min(10).max(4000),
      })
      .strict(),
    z
      .object({
        action: z.literal("status"),
        caseId: uuid,
        revision: z.number().int().positive(),
        status: z.enum(statuses),
      })
      .strict(),
    z
      .object({
        action: z.literal("reserve"),
        caseId: uuid,
        id: uuid,
        filename: z
          .string()
          .min(1)
          .max(180)
          .regex(/^[^/\\]+$/)
          .refine(
            (value) => [...value].every((char) => char.charCodeAt(0) >= 32),
            "Filename contains control characters",
          ),
        mime: z.enum(["application/pdf", "image/png", "image/jpeg"]),
        bytes: z.number().int().min(1).max(10485760),
      })
      .strict(),
    z.object({ action: z.literal("finalize"), caseId: uuid, id: uuid }).strict(),
  ])
  .superRefine((v, ctx) => {
    if (
      v.action === "create" &&
      (v.to < v.from || (Date.parse(v.to) - Date.parse(v.from)) / 86400000 > 366)
    )
      ctx.addIssue({
        code: "custom",
        message: "Bill period must be ordered and at most 366 days",
        path: ["to"],
      });
  });
export type Command = z.infer<typeof commandSchema>;
export interface CaseRecord {
  id: string;
  factory_id: number;
  utility: string;
  bill_from: string;
  bill_to: string;
  issue: string;
  investigator_id: string;
  status: string;
  revision: number;
}
export interface Evidence {
  id: string;
  object_path: string;
  filename: string;
  mime: string;
  bytes: number;
  state: string;
}
export interface Detail {
  case: CaseRecord;
  site: string;
  organization: string;
  evidence: Evidence[];
  events: { id: number; kind: string; actor_id: string; created_at: string }[];
}
export interface Site {
  id: number;
  name: string;
  organization: string;
  organizationId: number;
  investigators: { id: string; role: string }[];
}
