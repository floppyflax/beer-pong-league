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
  it("should format minutes as 'Il y a X min'", () => {
    const past = new Date();
    past.setMinutes(past.getMinutes() - 5);
    expect(formatRelativeTime(past.toISOString())).toMatch(/Il y a \d+ min/);
  });

  it("should format hours in full words (singular)", () => {
    const past = new Date();
    past.setHours(past.getHours() - 1);
    past.setMinutes(past.getMinutes() - 1); // ensure >= 1h
    expect(formatRelativeTime(past.toISOString())).toBe("Il y a 1 heure");
  });

  it("should format hours in full words (plural)", () => {
    const past = new Date();
    past.setHours(past.getHours() - 5);
    expect(formatRelativeTime(past.toISOString())).toBe("Il y a 5 heures");
  });

  it("should format yesterday as 'Hier'", () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);
    past.setHours(past.getHours() - 1); // ensure rounding to 1 day, not just under 24h
    expect(formatRelativeTime(past.toISOString())).toBe("Hier");
  });

  it("should format days in full words", () => {
    const past = new Date();
    past.setDate(past.getDate() - 4);
    expect(formatRelativeTime(past.toISOString())).toBe("Il y a 4 jours");
  });

  it("should return fallback for invalid date string", () => {
    expect(formatRelativeTime("invalid")).toBe("—");
  });

  it("should return fallback for empty string", () => {
    expect(formatRelativeTime("")).toBe("—");
  });
});
