import { describe, it, expect } from "vitest";
import tailwindConfig from "../../../tailwind.config.js";

describe("Tailwind design tokens (Epic 15 — Arcade palette)", () => {
  const theme = tailwindConfig.theme?.extend;

  it("should define legacy background color aliases (AC: 1)", () => {
    expect(theme?.colors?.background).toBeDefined();
    // Arcade: remapped to new dark surfaces
    expect(theme?.colors?.background?.primary).toBe("#0B0D14");
    expect(theme?.colors?.background?.secondary).toBe("#141826");
    expect(theme?.colors?.background?.tertiary).toBeDefined();
  });

  it("should define legacy text color aliases (AC: 1)", () => {
    expect(theme?.colors?.text).toBeDefined();
    // Arcade ink primary
    expect(theme?.colors?.text?.primary).toBe("#F4F2E8");
    expect(theme?.colors?.text?.secondary).toBeDefined();
    expect(theme?.colors?.text?.tertiary).toBeDefined();
    expect(theme?.colors?.text?.muted).toBeDefined();
  });

  it("should define new Arcade surfaces (cream, paper)", () => {
    expect(theme?.colors?.cream).toBe("#0B0D14");
    expect(theme?.colors?.["cream-deep"]).toBe("#050710");
    expect(theme?.colors?.paper).toBe("#141826");
  });

  it("should define new Arcade ink colors", () => {
    expect(theme?.colors?.ink).toBe("#F4F2E8");
    expect(theme?.colors?.["ink-soft"]).toBe("#B8B4A3");
    expect(theme?.colors?.["ink-mute"]).toBe("#6B6A5E");
  });

  it("should define new Arcade cup brand colors", () => {
    expect(theme?.colors?.["cup-red"]).toBe("#FF4438");
    expect(theme?.colors?.["cup-blue"]).toBe("#3B8EFF");
    expect(theme?.colors?.["cup-green"]).toBe("#B8FF3D");
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

  it("should define signal colors (lime, gold, ruby)", () => {
    expect(theme?.colors?.lime).toBe("#B8FF3D");
    expect(theme?.colors?.gold).toBe("#FFB800");
    expect(theme?.colors?.ruby).toBe("#FF4438");
  });

  it("should define gradients: CTA, FAB, tab-active (AC: 2)", () => {
    expect(theme?.backgroundImage?.["gradient-cta"]).toBeDefined();
    expect(theme?.backgroundImage?.["gradient-fab"]).toBeDefined();
    expect(theme?.backgroundImage?.["gradient-tab-active"]).toBeDefined();
  });

  it("should define gradient-card for card components", () => {
    expect(theme?.backgroundImage?.["gradient-card"]).toBeDefined();
    // Arcade: paper → cream-deep ink wash
    expect(theme?.backgroundImage?.["gradient-card"]).toContain("#141826");
    expect(theme?.backgroundImage?.["gradient-card"]).toContain("#0B0D14");
  });

  it("should define typography tokens with correct mobile/desktop sizes (AC: 3)", () => {
    expect(theme?.fontSize?.["page-title"]).toBeDefined();
    expect(theme?.fontSize?.["page-title"]?.[0]).toBe("1.25rem");
    expect(theme?.fontSize?.["page-title-lg"]?.[0]).toBe("1.5rem");
    expect(theme?.fontSize?.["section-title"]).toBeDefined();
    expect(theme?.fontSize?.["body"]).toBeDefined();
    expect(theme?.fontSize?.["label"]).toBeDefined();
    expect(theme?.fontSize?.["stat"]).toBeDefined();
  });

  it("should define Arcade display font sizes", () => {
    expect(theme?.fontSize?.["display-sm"]).toBeDefined();
    expect(theme?.fontSize?.["display-md"]).toBeDefined();
    expect(theme?.fontSize?.["display-lg"]).toBeDefined();
  });

  it("should define spacing tokens: page, card-gap, bottom-nav (AC: 4)", () => {
    expect(theme?.spacing?.["page"]).toBe("1rem");
    expect(theme?.spacing?.["page-lg"]).toBe("1.5rem");
    expect(theme?.spacing?.["card-gap"]).toBe("1rem");
    expect(theme?.spacing?.["bottom-nav"]).toBe("5rem");
    expect(theme?.spacing?.["bottom-nav-lg"]).toBe("6rem");
  });

  it("should define radius and borders (AC: 5) — Arcade sharper radii", () => {
    // Arcade sharper: card 10px (was 12px), button 6px (was 8px), input 6px (was 12px)
    expect(theme?.borderRadius?.["card"]).toBe("10px");
    expect(theme?.borderRadius?.["button"]).toBe("6px");
    expect(theme?.borderRadius?.["input"]).toBe("6px");
    expect(theme?.borderColor?.["card"]).toBeDefined();
  });

  it("should define Arcade font families (Space Grotesk + JetBrains Mono)", () => {
    expect(theme?.fontFamily?.sans?.[0]).toBe("Space Grotesk");
    expect(theme?.fontFamily?.mono?.[0]).toBe("JetBrains Mono");
    expect(theme?.fontFamily?.archivo?.[0]).toBe("Archivo");
  });

  it("should define screens for Frame 1–11 consistency (AC: 6)", () => {
    expect(theme?.screens?.sm).toBe("640px");
    expect(theme?.screens?.md).toBe("768px");
    expect(theme?.screens?.lg).toBe("1024px");
    expect(theme?.screens?.xl).toBe("1440px");
  });
});
