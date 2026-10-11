import { describe, expect, it } from "vitest";
import { assetMetadataFromEquipmentInput, equipmentFieldsFromAssetMetadata } from "./equipment-metadata";

describe("equipmentFieldsFromAssetMetadata", () => {
  it("restores saved equipment inputs after canonical snapshot reload", () => {
    expect(equipmentFieldsFromAssetMetadata({
      category: "compressor",
      quantity: 3,
      hoursPerMonth: 420,
      loadFactor: 0.65,
    })).toEqual({
      category: "compressor",
      quantity: 3,
      hoursPerMonth: 420,
      loadFactor: 0.65,
    });
  });

  it("uses explicit defaults for missing or malformed metadata", () => {
    expect(equipmentFieldsFromAssetMetadata({
      category: "unknown-machine",
      quantity: "not-a-number",
      hoursPerMonth: null,
      loadFactor: 2,
    })).toEqual({
      category: "other",
      quantity: 1,
      hoursPerMonth: 0,
      loadFactor: 1,
    });
    expect(equipmentFieldsFromAssetMetadata(null)).toEqual({
      category: "other",
      quantity: 1,
      hoursPerMonth: 0,
      loadFactor: 0,
    });
  });
});
