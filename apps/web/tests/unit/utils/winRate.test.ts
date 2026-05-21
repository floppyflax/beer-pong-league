import { describe, it, expect } from "vitest";
import { getWinRateColorClass } from "../../../src/utils/winRate";

describe("getWinRateColorClass", () => {
  it("returns signal-red for low win rates (< 40)", () => {
    expect(getWinRateColorClass(0)).toBe("text-signal-red");
    expect(getWinRateColorClass(39)).toBe("text-signal-red");
    expect(getWinRateColorClass(39.99)).toBe("text-signal-red");
  });

  it("returns white for normal win rates (40-60 inclusive)", () => {
    expect(getWinRateColorClass(40)).toBe("text-white");
    expect(getWinRateColorClass(50)).toBe("text-white");
    expect(getWinRateColorClass(60)).toBe("text-white");
  });

  it("returns lime for high win rates (> 60)", () => {
    expect(getWinRateColorClass(60.01)).toBe("text-lime");
    expect(getWinRateColorClass(61)).toBe("text-lime");
    expect(getWinRateColorClass(100)).toBe("text-lime");
  });
});
