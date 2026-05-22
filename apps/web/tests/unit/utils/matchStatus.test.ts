import { describe, it, expect } from "vitest";
import { isMatchValidated } from "../../../src/utils/matchStatus";

describe("isMatchValidated", () => {
  it("counts a confirmed match in both modes", () => {
    expect(isMatchValidated({ status: "confirmed" }, false)).toBe(true);
    expect(isMatchValidated({ status: "confirmed" }, true)).toBe(true);
  });

  it("counts a match with no explicit status (defaults to confirmed)", () => {
    expect(isMatchValidated({ status: undefined }, false)).toBe(true);
    expect(isMatchValidated({}, false)).toBe(true);
  });

  it("never counts a rejected match, regardless of anti-cheat", () => {
    expect(isMatchValidated({ status: "rejected" }, false)).toBe(false);
    expect(isMatchValidated({ status: "rejected" }, true)).toBe(false);
  });

  it("excludes a pending match only when anti-cheat is enabled", () => {
    expect(isMatchValidated({ status: "pending" }, true)).toBe(false);
    // anti-cheat off → server applies ELO even to a pending row, so it counts
    expect(isMatchValidated({ status: "pending" }, false)).toBe(true);
  });

  it("treats undefined anti-cheat flag as off", () => {
    expect(isMatchValidated({ status: "pending" }, undefined)).toBe(true);
    expect(isMatchValidated({ status: "confirmed" }, undefined)).toBe(true);
  });
});
