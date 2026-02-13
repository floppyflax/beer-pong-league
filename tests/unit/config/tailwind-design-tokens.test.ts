import { describe, it, expect } from "vitest";
import tailwindConfig from "../../../tailwind.config.js";

describe("Tailwind design tokens (Story 14-1)", () => {
  const theme = tailwindConfig.theme?.extend;

  it("should define background colors (AC: 1)", () => {
    expect(theme?.colors?.background).toBeDefined();
    expect(theme?.colors?.background?.primary).toBe("#0f172a");
    expect(theme?.colors?.background?.secondary).toBe("#1e293b");
    expect(theme?.colors?.background?.tertiary).toBe("#334155");
  });

  it("should define text colors (AC: 1)", () => {
    expect(theme?.colors?.text).toBeDefined();
    expect(theme?.colors?.text?.primary).toBe("#ffffff");
    expect(theme?.colors?.text?.secondary).toBeDefined();
    expect(theme?.colors?.text?.tertiary).toBeDefined();
    expect(theme?.colors?.text?.muted).toBeDefined();
  });

  it("should define accent colors: primary, success, error, ELO, info (AC: 1)", () => {
    expect(theme?.colors?.primary).toBeDefined();
    expect(theme?.colors?.success).toBeDefined();
    expect(theme?.colors?.error).toBeDefined();
    expect(theme?.colors?.elo).toBeDefined();
    expect(theme?.colors?.info).toBeDefined();
  });

  it("should define semantic colors: status-active, status-finished, delta (AC: 1)", () => {
    expect(theme?.colors?.["status-active"]).toBeDefined();
    expect(theme?.colors?.["status-finished"]).toBeDefined();
    expect(theme?.colors?.["delta-positive"]).toBeDefined();
    expect(theme?.colors?.["delta-negative"]).toBeDefined();
  });

  it("should define gradients: CTA, FAB, tab-active (AC: 2)", () => {
    expect(theme?.backgroundImage?.["gradient-cta"]).toBeDefined();
    expect(theme?.backgroundImage?.["gradient-fab"]).toBeDefined();
    expect(theme?.backgroundImage?.["gradient-tab-active"]).toBeDefined();
  });

  it("should define typography tokens with correct mobile/desktop sizes (AC: 3)", () => {
    expect(theme?.fontSize?.["page-title"]).toBeDefined();
    expect(theme?.fontSize?.["page-title"]?.[0]).toBe("1.25rem"); // text-xl mobile
    expect(theme?.fontSize?.["page-title-lg"]?.[0]).toBe("1.5rem"); // text-2xl desktop
    expect(theme?.fontSize?.["section-title"]).toBeDefined();
    expect(theme?.fontSize?.["body"]).toBeDefined();
    expect(theme?.fontSize?.["label"]).toBeDefined();
    expect(theme?.fontSize?.["stat"]).toBeDefined();
  });

  it("should define spacing tokens: page, card-gap, bottom-nav (AC: 4)", () => {
    expect(theme?.spacing?.["page"]).toBe("1rem");
    expect(theme?.spacing?.["page-lg"]).toBe("1.5rem");
    expect(theme?.spacing?.["card-gap"]).toBe("1rem");
    expect(theme?.spacing?.["bottom-nav"]).toBe("5rem");
    expect(theme?.spacing?.["bottom-nav-lg"]).toBe("6rem");
  });

  it("should define radius and borders (AC: 5)", () => {
    expect(theme?.borderRadius?.["card"]).toBe("0.75rem");
    expect(theme?.borderRadius?.["button"]).toBe("0.5rem");
    expect(theme?.borderRadius?.["input"]).toBe("0.75rem");
    expect(theme?.borderColor?.["card"]).toBeDefined();
  });

  it("should define screens for Frame 1–11 consistency (AC: 6)", () => {
    expect(theme?.screens?.sm).toBe("640px");
    expect(theme?.screens?.md).toBe("768px");
    expect(theme?.screens?.lg).toBe("1024px");
    expect(theme?.screens?.xl).toBe("1440px");
  });
});
