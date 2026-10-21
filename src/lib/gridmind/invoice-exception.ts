import { z } from "zod";
import { evaluateSyntheticResolveCase } from "./resolve-workflow";

/** Offline synthetic R2 method. Scope checks are NOT authenticated tenant authorization. */
const id = z.string().trim().min(1).max(100);
const note = z.string().trim().min(1).max(500);
const hash = z.string().regex(/^[a-f0-9]{64}$/);
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => {
    const d = new Date(v);
    return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === v;
  }, "Invalid calendar date");
const integer = z.number().int().nonnegative().max(1_000_000_000);
export const invoiceScopeSchema = z
  .object({
    origin: z.literal("synthetic"),
    organizationId: id,
    factoryId: id,
    caseId: id,
    orderId: id,
    invoiceId: id,
    partId: id,
    revision: id,
    analystId: id,
    customerActorId: id,
  })
  .strict();
export type InvoiceScope = z.infer<typeof invoiceScopeSchema>;
const kind = z.enum([
  "order",
  "dispatch",
  "receipt",
  "acceptance",
  "invoice",
  "dispute",
  "payment",
]);
const recordSchema = z
  .object({
    id,
    kind,
    orderId: id,
    invoiceId: id,
    partId: id,
    revision: id,
    date,
    quantityPieces: integer.nullable(),
    amountPaise: z.number().int().nonnegative().max(1e12).nullable(),
    currency: z.literal("INR"),
    status: z.enum(["recorded", "accepted", "rejected", "unknown"]),
    reference: note,
    note: z.string().trim().max(500),
    sourceLine: z.number().int().min(2),
  })
  .strict();
const datasetSchema = z
  .object({
    version: z.literal(1),
    scope: invoiceScopeSchema,
    sourceName: id,
    rawCsv: z.string().max(2_000_000),
    sourceSha256: hash,
    records: z.array(recordSchema).min(1).max(500),
  })
  .strict();
export type InvoiceDataset = z.infer<typeof datasetSchema>;
export const INVOICE_HEADER =
  "record_id,kind,order_id,invoice_id,part_id,revision,date,quantity_pieces,amount_paise,currency,status,reference,note";

async function digest(text: string) {
  return Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))),
    (v) => v.toString(16).padStart(2, "0"),
  ).join("");
}
function cellNumber(value: string) {
  if (value === "") return null;
  if (!/^\d+$/.test(value))
    throw new Error("Use whole nonnegative pieces/paise or an explicit blank unknown");
  return Number(value);
}
export async function importInvoiceCsv(
  rawCsv: string,
  scopeInput: unknown,
  sourceName: string,
): Promise<InvoiceDataset> {
  const scope = invoiceScopeSchema.parse(scopeInput);
  if (
    new TextEncoder().encode(rawCsv).length > 2_000_000 ||
    rawCsv.includes('"') ||
    (rawCsv.includes("\r") && !rawCsv.includes("\r\n"))
  )
    throw new Error("Unsupported CSV: 2 MB maximum; no quoted or multiline cells");
  const lines = rawCsv
    .replace(/^\uFEFF/, "")
    .replace(/\r?\n$/, "")
    .split(/\r?\n/);
  if (lines.shift() !== INVOICE_HEADER)
    throw new Error("Use the exact header with pieces and paise");
  if (lines.length < 1 || lines.length > 500) throw new Error("Use 1–500 source rows");
  const records = lines.map((line, index) => {
    const c = line.split(",").map((v) => v.trim());
    if (c.length !== 13) throw new Error(`Line ${index + 2}: expected 13 cells`);
    const row = recordSchema.parse({
      id: c[0],
      kind: c[1],
      orderId: c[2],
      invoiceId: c[3],
      partId: c[4],
      revision: c[5],
      date: c[6],
      quantityPieces: cellNumber(c[7]),
      amountPaise: cellNumber(c[8]),
      currency: c[9],
      status: c[10],
      reference: c[11],
      note: c[12],
      sourceLine: index + 2,
    });
    if (
      row.orderId !== scope.orderId ||
      row.invoiceId !== scope.invoiceId ||
      row.partId !== scope.partId ||
      row.revision !== scope.revision
    )
      throw new Error(`Line ${index + 2}: outside the declared order/invoice/part/revision scope`);
    return row;
  });
  if (new Set(records.map((r) => r.id)).size !== records.length)
    throw new Error("Duplicate record ID");
  return datasetSchema.parse({
    version: 1,
    scope,
    sourceName,
    rawCsv,
    sourceSha256: await digest(rawCsv),
    records,
  });
}
async function checkedDataset(input: unknown, expectedScope: unknown) {
  const d = datasetSchema.parse(input);
  if (JSON.stringify(d.scope) !== JSON.stringify(invoiceScopeSchema.parse(expectedScope)))
    throw new Error("Scope mismatch");
  const rebuilt = await importInvoiceCsv(d.rawCsv, d.scope, d.sourceName);
  if (
    d.sourceSha256 !== rebuilt.sourceSha256 ||
    JSON.stringify(d.records) !== JSON.stringify(rebuilt.records)
  )
    throw new Error(
      "Source or normalized records altered; import a new revision and obtain a new review",
    );
  return d;
}
export async function reconcileInvoice(input: unknown, expectedScope: unknown) {
  const d = await checkedDataset(input, expectedScope);
  const issues: { code: string; statement: string; sourceLines: number[] }[] = [];
  const unknowns: string[] = [];
  for (const k of kind.options) {
    const rows = d.records.filter((r) => r.kind === k);
    if (rows.length > 1)
      issues.push({
        code: "ambiguous_document",
        statement: `Multiple ${k} records; no automatic selection or addition`,
        sourceLines: rows.map((r) => r.sourceLine),
      });
  }
  const one = (k: z.infer<typeof kind>) => d.records.find((r) => r.kind === k);
  for (const k of ["order", "dispatch", "receipt", "acceptance", "invoice"] as const) {
    const r = one(k);
    if (!r) unknowns.push(`Missing ${k} record`);
    else {
      if (r.quantityPieces === null) unknowns.push(`Unknown ${k} quantity`);
      if (r.status === "unknown") unknowns.push(`Unknown ${k} status`);
      if (k !== "acceptance" && r.status !== "recorded")
        unknowns.push(`Unresolved ${k} document status`);
    }
  }
  const inv = one("invoice"),
    accepted = one("acceptance");
  if (inv && inv.amountPaise === null) unknowns.push("Invoice amount is unknown");
  const sequence = ["order", "dispatch", "receipt", "acceptance", "invoice"] as const;
  // An invoice may precede acceptance; only physical/contract chronology is checked.
  for (const [earlier, later] of [
    ["order", "dispatch"],
    ["dispatch", "receipt"],
    ["receipt", "acceptance"],
    ["order", "invoice"],
    ["invoice", "payment"],
  ] as const) {
    const a = one(earlier),
      b = one(later);
    if (a && b && b.date < a.date)
      issues.push({
        code: "chronology_conflict",
        statement: `${later} predates ${earlier}`,
        sourceLines: [a.sourceLine, b.sourceLine],
      });
  }
  const conflicts = issues.length > 0;
  if (!conflicts) {
    for (let i = 1; i < sequence.length; i++) {
      const a = one(sequence[i - 1]),
        b = one(sequence[i]);
      if (
        a?.quantityPieces != null &&
        b?.quantityPieces != null &&
        a.quantityPieces !== b.quantityPieces
      )
        issues.push({
          code: "quantity_difference",
          statement: `${a.kind} quantity ${a.quantityPieces} differs from ${b.kind} quantity ${b.quantityPieces}; reason unverified`,
          sourceLines: [a.sourceLine, b.sourceLine],
        });
    }
    if (accepted?.status === "rejected")
      issues.push({
        code: "acceptance_rejected",
        statement: "Acceptance record states rejection; no technical cause inferred",
        sourceLines: [accepted.sourceLine],
      });
    else if (accepted && accepted.status !== "accepted")
      unknowns.push("Acceptance is not established");
    const dispute = one("dispute");
    if (dispute) {
      if (dispute.status !== "recorded" || !dispute.note)
        unknowns.push("Dispute reason/status is unknown");
      else
        issues.push({
          code: "dispute_recorded",
          statement: `Recorded claim, not verified cause: ${dispute.note}`,
          sourceLines: [dispute.sourceLine],
        });
    }
  }
  if (!one("payment"))
    unknowns.push(
      "Payment history absent; unpaid status, due date and cash constraint cannot be inferred",
    );
  const requiredUnknowns = unknowns.filter((s) => !s.startsWith("Payment history"));
  return {
    origin: "synthetic" as const,
    sourceSha256: d.sourceSha256,
    status: conflicts
      ? ("conflict" as const)
      : requiredUnknowns.length
        ? ("inconclusive" as const)
        : issues.length
          ? ("documentary_exception" as const)
          : ("no_documentary_exception_established" as const),
    issues,
    unknowns,
    invoiceFaceValuePaise: inv?.amountPaise ?? null,
    invoiceAmountMeaning:
      "Documented face value only; not recoverable value, overdue debt, profit or savings",
    hypotheses: [
      "Partial delivery or acceptance",
      "Record or specification mismatch",
      "A known commercial/quality hold",
      "No actionable documentary gap",
    ].map((statement) => ({
      type: "hypothesis" as const,
      statement,
      status: "unconfirmed" as const,
    })),
    nextCheck:
      "Ask the authorised document owner to reconcile the specific difference against the current ERP/manual method",
    verifiedSavings: null,
    paymentRecovery: null,
    customerValidated: false as const,
  };
}
const reviewInput = z
  .object({
    reviewerId: id,
    competence: note,
    decision: z.enum(["accept", "revise", "reject"]),
    rationale: note,
    at: z.string().datetime({ offset: true }),
    simulated: z.literal(true),
  })
  .strict();
const reviewSchema = reviewInput.extend({ snapshotSha256: hash }).strict();
export const invoiceActionSchema = z
  .object({
    id,
    ownerId: id,
    description: note,
    status: z.enum(["planned", "completed"]),
    customerAuthorization: z.literal("fictionally_authorized"),
    completionEvidenceLines: z.array(z.number().int().min(2)).max(50),
  })
  .strict();
const outcomeSchema = z
  .object({
    status: z.literal("inconclusive"),
    observation: note,
    confounders: note,
    sourceLines: z.array(z.number().int().min(2)).min(1).max(50),
  })
  .strict();
const stateSchema = z
  .object({
    version: z.literal(1),
    dataset: datasetSchema,
    review: reviewSchema.nullable(),
    reviewHistory: z.array(reviewSchema).max(20),
    actions: z.array(invoiceActionSchema).max(20),
    outcome: outcomeSchema.nullable(),
  })
  .strict();
export type InvoiceState = z.infer<typeof stateSchema>;
export function startInvoiceExperiment(dataset: InvoiceDataset): InvoiceState {
  return stateSchema.parse({
    version: 1,
    dataset,
    review: null,
    reviewHistory: [],
    actions: [],
    outcome: null,
  });
}
function checkLines(d: InvoiceDataset, lines: number[]) {
  if (
    new Set(lines).size !== lines.length ||
    lines.some((line) => !d.records.some((r) => r.sourceLine === line))
  )
    throw new Error("Unknown or duplicate evidence source line");
}
export async function reviewInvoiceExperiment(
  input: unknown,
  expectedScope: unknown,
  decision: unknown,
) {
  const { s } = await checkedState(input, expectedScope);
  const r = reviewInput.parse(decision);
  if (s.actions.length)
    throw new Error("Keep action history; a new review requires a separate source revision");
  const a = await reconcileInvoice(s.dataset, expectedScope);
  if (
    r.reviewerId === s.dataset.scope.analystId ||
    r.reviewerId === s.dataset.scope.customerActorId
  )
    throw new Error("Use a distinct simulated independent reviewer");
  if (r.at.slice(0, 10) < s.dataset.records.reduce((v, row) => (row.date > v ? row.date : v), ""))
    throw new Error("Review predates evidence");
  if (r.decision === "accept" && a.status !== "documentary_exception")
    throw new Error("Only a reconciled documentary exception can enter simulated action review");
  return stateSchema.parse({
    ...s,
    review: { ...r, snapshotSha256: await digest(JSON.stringify(s.dataset)) },
    reviewHistory: [...s.reviewHistory, ...(s.review ? [s.review] : [])],
    actions: [],
    outcome: null,
  });
}
async function checkedState(input: unknown, expectedScope: unknown) {
  const s = stateSchema.parse(input);
  const a = await reconcileInvoice(s.dataset, expectedScope);
  if (
    [...s.reviewHistory, ...(s.review ? [s.review] : [])].some(
      (r) =>
        r.at.slice(0, 10) < s.dataset.records.reduce((v, row) => (row.date > v ? row.date : v), ""),
    )
  )
    throw new Error("Review predates evidence");
  const snapshot = await digest(JSON.stringify(s.dataset));
  if (
    [...s.reviewHistory, ...(s.review ? [s.review] : [])].some(
      (r) =>
        r.snapshotSha256 !== snapshot ||
        r.reviewerId === s.dataset.scope.analystId ||
        r.reviewerId === s.dataset.scope.customerActorId,
    )
  )
    throw new Error("Stale or non-independent simulated review");
  for (const action of s.actions) {
    checkLines(s.dataset, action.completionEvidenceLines);
    if (action.ownerId !== s.dataset.scope.customerActorId)
      throw new Error("Action requires declared simulated customer owner");
    if (action.status === "completed" && !action.completionEvidenceLines.length)
      throw new Error("Completion requires evidence");
  }
  if (s.actions.length && (s.review?.decision !== "accept" || a.status !== "documentary_exception"))
    throw new Error("Action blocked before accepted review");
  if (new Set(s.actions.map((v) => v.id)).size !== s.actions.length)
    throw new Error("Duplicate action ID");
  if (s.outcome) {
    checkLines(s.dataset, s.outcome.sourceLines);
    if (!s.actions.length || s.actions.some((v) => v.status !== "completed"))
      throw new Error("Outcome requires completed simulated action");
  }
  return { s, a };
}
export async function recordInvoiceAction(input: unknown, expectedScope: unknown, action: unknown) {
  const { s } = await checkedState(input, expectedScope);
  const next = stateSchema.parse({
    ...s,
    actions: [...s.actions, invoiceActionSchema.parse(action)],
    outcome: null,
  });
  await checkedState(next, expectedScope);
  return next;
}
export async function recordInvoiceOutcome(
  input: unknown,
  expectedScope: unknown,
  outcome: unknown,
) {
  const { s } = await checkedState(input, expectedScope);
  const next = stateSchema.parse({ ...s, outcome: outcomeSchema.parse(outcome) });
  await checkedState(next, expectedScope);
  return next;
}
export async function exportInvoiceExperiment(input: unknown, expectedScope: unknown) {
  const { s, a } = await checkedState(input, expectedScope);
  const workflow = evaluateSyntheticResolveCase({
    origin: "synthetic",
    lane: "R2",
    caseRevision: 1,
    question: "Which recorded discrepancy needs a customer-owned documentary check?",
    sources: [
      {
        id: s.dataset.sourceSha256,
        reference: s.dataset.sourceName,
        permission: "fictional_permission",
        check: a.status === "documentary_exception" ? "fictionally_checked" : "unknown",
        conflict: a.status === "conflict" ? "Unreconciled source conflict" : "",
      },
    ],
    simulatedReview: s.review
      ? { revision: 1, decision: s.review.decision, simulated: true }
      : null,
    actions: s.actions.map((v) => ({
      ownerRole: v.ownerId,
      nextStep: v.description,
      status: v.status === "completed" ? "fictionally_completed" : "planned",
      customerAuthorization: v.customerAuthorization,
    })),
    fictionalOutcome: null,
  });
  return {
    version: 1,
    method: "synthetic-invoice-exception-v1",
    state: s,
    analysis: a,
    workflow,
    learning: {
      observation: s.outcome?.observation ?? "No outcome recorded",
      confounders: s.outcome?.confounders ?? "Not assessed",
      reusableRule: "Unconfirmed; no customer-data training or institutional conclusion",
    },
    disclosure:
      "OFFLINE SYNTHETIC EXERCISE. Simulated roles, review and authorization are not authenticated permissions or qualified professional authority. No real factory intake.",
    approvedForCustomerUse: false,
    verifiedSavings: null,
    customerValidated: false,
  };
}
