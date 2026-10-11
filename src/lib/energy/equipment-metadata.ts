import type { EquipmentCategory } from "./types";

const CATEGORIES: readonly EquipmentCategory[] = [
  "compressor",
  "motor",
  "furnace",
  "hvac",
  "lighting",
  "other",
];

const record = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};

function boundedNumber(value: unknown, fallback: number, min: number, max: number): number {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

/**
 * Restore the legacy electricity-workspace fields stored on canonical asset
 * metadata. Missing or malformed metadata uses explicit safe defaults rather
 * than erasing valid stored values during snapshot hydration.
 */
export function equipmentFieldsFromAssetMetadata(value: unknown): {
  category: EquipmentCategory;
  quantity: number;
  hoursPerMonth: number;
  loadFactor: number;
} {
  const metadata = record(value);
  const category = metadata.category;
  return {
    category: typeof category === "string" && CATEGORIES.includes(category as EquipmentCategory)
      ? category as EquipmentCategory
      : "other",
    quantity: boundedNumber(metadata.quantity, 1, 0, 1_000_000),
    hoursPerMonth: boundedNumber(metadata.hoursPerMonth, 0, 0, 744),
    loadFactor: boundedNumber(metadata.loadFactor, 0, 0, 1),
  };
}
