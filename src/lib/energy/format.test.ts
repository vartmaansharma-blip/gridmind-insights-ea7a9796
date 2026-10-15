import { describe, expect, it } from "vitest";
import { currencyAmount } from "./format";

describe("persisted financial display", () => {
  it("keeps zero distinct from absent value", () => {
    expect(currencyAmount(null, "INR")).toBe("—");
    expect(currencyAmount(0, "INR")).toBe("₹0");
    expect(currencyAmount(0, "USD")).toBe("0.00 USD");
  });
  it("preserves non-INR units and negative values without currency conversion", () => {
    expect(currencyAmount(1200, "USD", true)).toBe("1,200.00 USD");
    expect(currencyAmount(-45.75, "EUR")).toBe("-45.75 EUR");
    expect(currencyAmount(42, "")).toBe("42.00 (currency unknown)");
    expect(currencyAmount(1200, "INR", true)).toBe("₹1.2K");
  });
});
