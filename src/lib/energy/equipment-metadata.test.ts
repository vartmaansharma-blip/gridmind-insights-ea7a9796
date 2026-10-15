import { describe, expect, it } from "vitest";
import {
  assetMetadataFromEquipmentInput,
  equipmentFieldsFromAssetMetadata,
} from "./equipment-metadata";

describe("equipmentFieldsFromAssetMetadata", () => {
  it("restores saved equipment inputs after canonical snapshot reload", () => {
    expect(
      equipmentFieldsFromAssetMetadata({
        category: "compressor",
        quantity: 3,
        hoursPerMonth: 420,
        loadFactor: 0.65,
      }),
    ).toEqual({
      category: "compressor",
      quantity: 3,
      hoursPerMonth: 420,
      loadFactor: 0.65,
    });
  });

  it("round-trips saved equipment fields through the persistence payload without dropping unrelated metadata", () => {
    const persisted = assetMetadataFromEquipmentInput(
      {
        category: "motor",
        quantity: 4,
        hoursPerMonth: 312,
        loadFactor: 0.72,
      },
      {
        vendorReference: "vendor-123",
        commissioningYear: 2022,
        lifecycle_status: "planned",
      },
    );

    expect(persisted).toMatchObject({
      vendorReference: "vendor-123",
      commissioningYear: 2022,
      lifecycle_status: "active",
      application_contract_version: 2,
      category: "motor",
      quantity: 4,
      hoursPerMonth: 312,
      loadFactor: 0.72,
    });
    expect(equipmentFieldsFromAssetMetadata(persisted)).toEqual({
      category: "motor",
      quantity: 4,
      hoursPerMonth: 312,
      loadFactor: 0.72,
    });
  });

  it("uses explicit defaults for missing or malformed metadata", () => {
    expect(
      equipmentFieldsFromAssetMetadata({
        category: "unknown-machine",
        quantity: "not-a-number",
        hoursPerMonth: null,
        loadFactor: 2,
      }),
    ).toEqual({
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
