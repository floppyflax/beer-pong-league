/**
 * Unit tests for string utilities
 */

import { describe, it, expect } from "vitest";
import { getInitials } from "../../../src/utils/string";

describe("getInitials", () => {
  it("should return initials for full name", () => {
    expect(getInitials("Jean Dupont")).toBe("JD");
    expect(getInitials("Marc Dupont")).toBe("MD");
  });

  it("should return first two chars for single name", () => {
    expect(getInitials("Alice")).toBe("AL");
    expect(getInitials("Bob")).toBe("BO");
  });

  it("should handle single character name", () => {
    expect(getInitials("A")).toBe("A");
  });

  it("should return ? for empty string", () => {
    expect(getInitials("")).toBe("?");
  });

  it("should handle whitespace-only string", () => {
    expect(getInitials("   ")).toBe("?");
  });

  it("should trim and handle extra spaces", () => {
    expect(getInitials("  Jean   Dupont  ")).toBe("JD");
  });

  it("should handle hyphenated names (first two words)", () => {
    expect(getInitials("Jean-Pierre Martin")).toBe("JM");
  });

  it("should uppercase result", () => {
    expect(getInitials("alice bob")).toBe("AB");
  });
});
