import { z } from "zod";
const amount = z.number().int().safe().nonnegative().nullable();
export const economicOptionSchema = z
  .object({
    id: z.string().min(1).max(100),
    currency: z.string().regex(/^[A-Z]{3}$/),
    kind: z.enum([
      "make",
      "outsource",
      "buy",
      "use_stock",
      "sell_surplus",
      "retain",
      "accept_order",
      "reserve_capacity",
      "supplier",
      "route",
      "schedule",
    ]),
    revenueMinor: amount,
    incrementalMinor: amount,
    opportunityMinor: amount,
    transportMinor: amount,
    storageMinor: amount,
    minutes: z.number().finite().nonnegative().nullable(),
    uncertaintyMinor: amount,
    feasible: z.boolean().nullable(),
    evidenceIds: z.array(z.string().min(1)).min(1).max(20),
  })
  .strict();
export type EconomicOption = z.infer<typeof economicOptionSchema>;
export function compareEconomics(raw: unknown) {
  const options = z.array(economicOptionSchema).min(2).max(15).parse(raw);
  if (new Set(options.map((o) => o.id)).size !== options.length)
    throw new Error("DUPLICATE_ECONOMIC_OPTION");
  if (new Set(options.map((o) => o.currency)).size !== 1)
    return {
      status: "insufficient_information",
      reasons: ["CURRENCY_MISMATCH"],
      results: [],
      recommendation: null,
    } as const;
  const results = options.map((o) => {
    const keys = [
      "revenueMinor",
      "incrementalMinor",
      "opportunityMinor",
      "transportMinor",
      "storageMinor",
      "minutes",
      "uncertaintyMinor",
      "feasible",
    ] as const;
    const missing = keys.filter((k) => o[k] === null);
    if (missing.length) return { id: o.id, status: "insufficient_information", missing };
    if (!o.feasible) return { id: o.id, status: "prohibited", missing: [] };
    const net =
      BigInt(o.revenueMinor!) -
      BigInt(o.incrementalMinor!) -
      BigInt(o.opportunityMinor!) -
      BigInt(o.transportMinor!) -
      BigInt(o.storageMinor!);
    const low = net - BigInt(o.uncertaintyMinor!),
      high = net + BigInt(o.uncertaintyMinor!);
    if (
      [net, low, high].some(
        (v) => v > BigInt(Number.MAX_SAFE_INTEGER) || v < BigInt(Number.MIN_SAFE_INTEGER),
      )
    )
      return { id: o.id, status: "insufficient_information", missing: ["SAFE_INTEGER_RANGE"] };
    return {
      id: o.id,
      status: "estimated",
      netMinor: Number(net),
      rangeMinor: [Number(low), Number(high)],
      minutes: o.minutes,
      evidenceIds: o.evidenceIds,
    };
  });
  const complete = results.every((r) => r.status !== "insufficient_information");
  // No automatic optimizer/ranking across uncertainty, timing or risk preferences.
  return {
    status: complete ? "estimated_comparison" : "insufficient_information",
    reasons: [],
    currency: options[0].currency,
    results,
    recommendation: null,
    verifiedSavings: null,
  } as const;
}
