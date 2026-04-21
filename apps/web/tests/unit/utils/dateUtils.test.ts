/**
 * dateUtils unit tests
 * Code review 14-35: invalid date handling
 */

import { describe, it, expect } from "vitest";
import { formatJoinedSince, formatRelativeTime } from "@/utils/dateUtils";

describe("formatJoinedSince", () => {
  it("should format valid date as 'Membre depuis [month] [year]'", () => {
    expect(formatJoinedSince("2025-01-15")).toMatch(/Membre depuis janvier 2025/);
  });

  it("should return fallback for invalid date string", () => {
    expect(formatJoinedSince("invalid")).toBe("Membre depuis —");
  });

  it("should return fallback for empty string", () => {
    expect(formatJoinedSince("")).toBe("Membre depuis —");
  });
});

describe("formatRelativeTime", () => {
  it("should format valid date", () => {
    const past = new Date();
    past.setMinutes(past.getMinutes() - 5);
    expect(formatRelativeTime(past.toISOString())).toMatch(/Il y a \d+ min/);
  });

  it("should return fallback for invalid date string", () => {
    expect(formatRelativeTime("invalid")).toBe("—");
  });

  it("should return fallback for empty string", () => {
    expect(formatRelativeTime("")).toBe("—");
  });
});
