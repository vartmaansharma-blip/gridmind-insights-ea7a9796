import { INVOICE_HEADER, type InvoiceScope } from "./invoice-exception";

export const INVOICE_DEMO_SCOPE: InvoiceScope = {
  origin: "synthetic",
  organizationId: "synthetic-org",
  factoryId: "synthetic-factory",
  caseId: "synthetic-invoice-case",
  orderId: "SYN-PO",
  invoiceId: "SYN-INV",
  partId: "SYN-PART",
  revision: "A",
  analystId: "synthetic-analyst",
  customerActorId: "synthetic-customer",
};
export const INVOICE_DEMO_CSV =
  "record_id,kind,order_id,invoice_id,part_id,revision,date,quantity_pieces,amount_paise,currency,status,reference,note\nSYN-O,order,SYN-PO,SYN-INV,SYN-PART,A,2026-01-01,100,100000,INR,recorded,fictional-order,Invented records only\nSYN-D,dispatch,SYN-PO,SYN-INV,SYN-PART,A,2026-01-02,100,,INR,recorded,fictional-dispatch,Quantity claimed dispatched\nSYN-R,receipt,SYN-PO,SYN-INV,SYN-PART,A,2026-01-03,90,,INR,recorded,fictional-receipt,Reason for difference unknown\nSYN-A,acceptance,SYN-PO,SYN-INV,SYN-PART,A,2026-01-04,90,,INR,accepted,fictional-acceptance,Acceptance scope needs reconciliation\nSYN-I,invoice,SYN-PO,SYN-INV,SYN-PART,A,2026-01-02,100,100000,INR,recorded,fictional-invoice,Face value is not a loss\n";
export const INVOICE_NEGATIVE_CSV = INVOICE_DEMO_CSV.replace(/,90,/g, ",100,");
export const INVOICE_CONFLICT_CSV =
  INVOICE_DEMO_CSV +
  "SYN-I2,invoice,SYN-PO,SYN-INV,SYN-PART,A,2026-01-02,100,90000,INR,recorded,fictional-second-invoice,No automatic version selection\n";
export const INVOICE_REVIEW_DEMO = {
  reviewerId: "synthetic-independent-reviewer",
  competence: "Fictional commercial records reviewer",
  decision: "accept",
  rationale: "Check the recorded quantity differences; no cause or payment entitlement established",
  at: "2026-01-05T12:00:00Z",
  simulated: true,
} as const;
export const INVOICE_ACTION_DEMO = {
  id: "synthetic-action",
  ownerId: INVOICE_DEMO_SCOPE.customerActorId,
  description: "Fictional customer reconciles the receiving and invoice records",
  customerAuthorization: "fictionally_authorized",
  status: "completed",
  completionEvidenceLines: [4, 5],
} as const;
// This header is exposed for the synthetic CLI fixture contract.
export { INVOICE_HEADER };
