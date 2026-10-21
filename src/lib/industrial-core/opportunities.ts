import { z } from "zod";
import { id, instant } from "./model";
const common = {
  organizationId: z.number().int().positive(),
  companyId: id,
  productName: id,
  specification: id.nullable(),
  revision: id.nullable(),
  unit: id,
  quantity: z.number().finite().nonnegative(),
  evidenceIds: z.array(id).min(1).max(15),
  expiresAt: instant,
};
export const offerSchema = z
  .object({
    ...common,
    id,
    kind: z.enum(["surplus", "capacity"]),
    committedQuantity: z.number().finite().nonnegative(),
    qualityReleased: z.boolean().nullable(),
    supplierQualified: z.boolean().nullable(),
    contractEligible: z.boolean().nullable(),
  })
  .strict();
export const demandSchema = z
  .object({ ...common, id, status: z.enum(["verified", "potential"]) })
  .strict();
export type SharingGrant = {
  fromOrganizationId: number;
  toOrganizationId: number;
  recordId: string;
  expiresAt: string;
  approvedBy: string;
};
export function matchOpportunity(
  rawOffer: unknown,
  rawDemand: unknown,
  grants: SharingGrant[],
  at: string,
) {
  const offer = offerSchema.parse(rawOffer),
    demand = demandSchema.parse(rawDemand);
  if (offer.committedQuantity > offer.quantity) throw new Error("INVALID_COMMITTED_QUANTITY");
  const canShare = (from: number, to: number, recordId: string) =>
    grants.some(
      (g) =>
        g.fromOrganizationId === from &&
        g.toOrganizationId === to &&
        g.recordId === recordId &&
        g.approvedBy &&
        Date.parse(g.expiresAt) > Date.parse(at),
    );
  // Return no private stock, demand or company details without bilateral record-specific grants.
  if (
    !canShare(offer.organizationId, demand.organizationId, offer.id) ||
    !canShare(demand.organizationId, offer.organizationId, demand.id)
  )
    return {
      status: "requires_review",
      reasons: ["BILATERAL_SHARING_NOT_AUTHORIZED"],
      quantity: null,
    } as const;
  const reasons: string[] = [];
  if (!offer.specification || !demand.specification || !offer.revision || !demand.revision)
    reasons.push("TECHNICAL_SPECIFICATION_MISSING");
  else if (
    offer.specification !== demand.specification ||
    offer.revision !== demand.revision ||
    offer.unit !== demand.unit
  )
    return { status: "prohibited", reasons: ["TECHNICAL_MISMATCH"], quantity: null } as const;
  if (
    Date.parse(offer.expiresAt) <= Date.parse(at) ||
    Date.parse(demand.expiresAt) <= Date.parse(at)
  )
    reasons.push("STALE_OFFER_OR_DEMAND");
  if (demand.status !== "verified") reasons.push("BUYER_DEMAND_NOT_VERIFIED");
  for (const field of ["qualityReleased", "supplierQualified", "contractEligible"] as const) {
    if (offer[field] === false)
      return {
        status: "prohibited",
        reasons: [field.toUpperCase() + "_FAILED"],
        quantity: null,
      } as const;
    if (offer[field] === null) reasons.push(field.toUpperCase() + "_UNKNOWN");
  }
  const available = offer.quantity - offer.committedQuantity;
  if (available < demand.quantity) reasons.push("INSUFFICIENT_UNCOMMITTED_QUANTITY");
  return {
    status: reasons.length ? "requires_review" : "conditional",
    reasons: reasons.length ? reasons : ["POTENTIAL_MATCH_REQUIRES_COMMERCIAL_APPROVAL"],
    quantity: reasons.length ? null : demand.quantity,
    evidenceIds: [...offer.evidenceIds, ...demand.evidenceIds],
  } as const;
}
