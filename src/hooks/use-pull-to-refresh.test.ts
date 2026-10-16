import { describe, expect, it } from "vitest";
import { PULL_REFRESH_THRESHOLD_PX, shouldRefreshOnRelease } from "./use-pull-to-refresh";

describe("mobile pull-to-refresh activation", () => {
  it("does not refresh when merely scrolling to the top", () => {
    expect(shouldRefreshOnRelease(0, true, true)).toBe(false);
    expect(shouldRefreshOnRelease(40, true, true)).toBe(false);
  });
  it("requires a deliberate overscroll that begins at the top", () => {
    expect(shouldRefreshOnRelease(PULL_REFRESH_THRESHOLD_PX, true, true)).toBe(true);
    expect(shouldRefreshOnRelease(140, false, true)).toBe(false);
  });
  it("never triggers on disabled or unauthenticated views", () => {
    expect(shouldRefreshOnRelease(200, true, false)).toBe(false);
  });
});
