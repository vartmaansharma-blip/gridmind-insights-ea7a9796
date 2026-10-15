import type { GridMindFactorySnapshot } from "../gridmind/domain";
import type { Factory, OpportunityStatus } from "./types";
import { implementedMonthFromTimestamp } from "./intervention-date";
import { equipmentFieldsFromAssetMetadata } from "./equipment-metadata";

export function snapshotToFactory(snapshot: GridMindFactorySnapshot): Factory {
  const metadata = new Map<string, { value: number; createdAt: string }>();
  for (const o of snapshot.observations) {
    const key = typeof o.metadata.entry_key === "string" ? o.metadata.entry_key : null;
    if (!key) continue;
    // A null numeric observation with quality_status=missing is an explicit
    // tombstone, so a cleared field cannot resurrect an older numeric value.
    if (!metadata.has(key) || metadata.get(key)!.createdAt < o.createdAt) {
      metadata.set(key, {
        value: o.valueNumeric === null ? Number.NaN : o.valueNumeric,
        createdAt: o.createdAt,
      });
    }
  }

  const monthsByKey = new Map<string, Record<string, number | string>>();
  for (const item of metadata) {
    const [month, metric] = item[0].split(":");
    if (!month || !metric) continue;
    const row = monthsByKey.get(month) ?? { month };
    row[metric] = item[1].value;
    monthsByKey.set(month, row);
  }

  const months = [...monthsByKey.values()]
    .sort((a, b) => String(a.month).localeCompare(String(b.month)))
    .map((row) => ({
      month: String(row.month),
      // NaN is the in-memory sentinel for an absent metric. persistFactory
      // records it as an explicit missing-data tombstone, never as numeric zero.
      kwh: row.kwh === undefined ? Number.NaN : Number(row.kwh),
      cost: row.cost === undefined ? Number.NaN : Number(row.cost),
      peakKva: row.peakKva === undefined ? Number.NaN : Number(row.peakKva),
      production: row.production === undefined ? Number.NaN : Number(row.production),
      operatingHours: row.operatingHours === undefined ? Number.NaN : Number(row.operatingHours),
      ...(row.powerFactor !== undefined ? { powerFactor: Number(row.powerFactor) } : {}),
    }));

  const profile = snapshot.metadata;

  const interventions = snapshot.interventions
    .map((iv) => ({
      id: String(iv.id),
      title: iv.description ?? "GridMind intervention",
      opportunityId: iv.opportunityId ? String(iv.opportunityId) : undefined,
      // Only project a month from a recorded implementation timestamp; null stays unknown.
      implementedMonth: implementedMonthFromTimestamp(iv.implementedAt, snapshot.timezone),
      cost: Number(iv.implementationCost ?? 0),
    }))
    .filter((iv) => iv.implementedMonth);

  return {
    id: String(snapshot.factoryId),
    organizationId: snapshot.organizationId,
    name: snapshot.name,
    location: snapshot.location ?? "",
    sector: snapshot.industry ?? "",
    productUnit: typeof profile.productUnit === "string" ? profile.productUnit : "unit",
    contractDemandKva: Number(profile.contractDemandKva ?? 0),
    demandChargePerKva: Number(profile.demandChargePerKva ?? 0),
    isDemo: false,
    months,
    equipment: snapshot.assets.map((a) => ({
      id: String(a.id),
      name: a.name,
      ...equipmentFieldsFromAssetMetadata(a.assetMetadata),
      ratedKw: Number(a.ratedPowerKw ?? 0),
    })),
    interventions,
    opportunityStatus: Object.fromEntries(
      snapshot.opportunities.map((o) => [String(o.id), o.status as OpportunityStatus]),
    ),
  };
}
