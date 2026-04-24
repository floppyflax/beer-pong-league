import { describe, it, expect } from "vitest";
import tailwindConfig from "../../../tailwind.config.js";

// PR4 — Legacy aliases purged. Only canonical Everything ELO tokens remain.
describe("Tailwind design tokens (Everything ELO palette)", () => {
  const theme = tailwindConfig.theme?.extend;

  // ── Canonical tokens (PR1 + PR4) ────────────────────────────────────────
  it("should define canonical Everything ELO tokens (navy, electric-blue, ping-yellow, signal-red, cool-gray, bronze)", () => {
    expect(theme?.colors?.navy).toBe("#0B1320");
    expect(theme?.colors?.["navy-deep"]).toBe("#070C16");
    expect(theme?.colors?.["navy-soft"]).toBe("#141D2F");
    expect(theme?.colors?.["electric-blue"]).toBe("#2F6BFF");
    expect(theme?.colors?.["electric-blue-deep"]).toBe("#1E4CD9");
    expect(theme?.colors?.["signal-red"]).toBe("#FF3B3B");
    expect(theme?.colors?.["signal-red-deep"]).toBe("#D32828");
    expect(theme?.colors?.["ping-yellow"]).toBe("#FFD400");
    expect(theme?.colors?.["ping-yellow-deep"]).toBe("#D9B400");
    expect(theme?.colors?.["cool-gray"]).toBe("#A8B0C0");
    expect(theme?.colors?.bronze).toBe("#CD7F32");
  });

  it("should define lime family tokens", () => {
    expect(theme?.colors?.lime).toBe("#B7FF3B");
    expect(theme?.colors?.["lime-deep"]).toBe("#8BCC1F");
  });

  // ── Legacy aliases MUST be absent (PR4 purge) ───────────────────────────
  it("PR4: legacy background aliases removed", () => {
    expect(theme?.colors?.background).toBeUndefined();
  });

  it("PR4: legacy text aliases removed", () => {
    expect(theme?.colors?.text).toBeUndefined();
  });

  it("PR4: legacy surface aliases removed (cream, paper)", () => {
    expect(theme?.colors?.cream).toBeUndefined();
    expect(theme?.colors?.["cream-deep"]).toBeUndefined();
    expect(theme?.colors?.paper).toBeUndefined();
  });

  it("PR4: legacy ink aliases removed", () => {
    expect(theme?.colors?.ink).toBeUndefined();
    expect(theme?.colors?.["ink-soft"]).toBeUndefined();
    expect(theme?.colors?.["ink-mute"]).toBeUndefined();
  });

  it("PR4: legacy cup brand aliases removed", () => {
    expect(theme?.colors?.["cup-red"]).toBeUndefined();
    expect(theme?.colors?.["cup-blue"]).toBeUndefined();
    expect(theme?.colors?.["cup-green"]).toBeUndefined();
    expect(theme?.colors?.["cup-red-deep"]).toBeUndefined();
    expect(theme?.colors?.["cup-blue-deep"]).toBeUndefined();
    expect(theme?.colors?.["cup-green-deep"]).toBeUndefined();
  });

  it("PR4: legacy semantic aliases removed (primary, success, error, elo, info, secondary, accent)", () => {
    expect(theme?.colors?.primary).toBeUndefined();
    expect(theme?.colors?.success).toBeUndefined();
    expect(theme?.colors?.error).toBeUndefined();
    expect(theme?.colors?.elo).toBeUndefined();
    expect(theme?.colors?.info).toBeUndefined();
    expect(theme?.colors?.secondary).toBeUndefined();
    expect(theme?.colors?.accent).toBeUndefined();
    expect(theme?.colors?.["status-active"]).toBeUndefined();
    expect(theme?.colors?.["status-finished"]).toBeUndefined();
    expect(theme?.colors?.["delta-positive"]).toBeUndefined();
    expect(theme?.colors?.["delta-negative"]).toBeUndefined();
  });

  it("PR4: legacy forest/terracotta/gold/ruby aliases removed", () => {
    expect(theme?.colors?.forest).toBeUndefined();
    expect(theme?.colors?.["forest-deep"]).toBeUndefined();
    expect(theme?.colors?.terracotta).toBeUndefined();
    expect(theme?.colors?.["terracotta-deep"]).toBeUndefined();
    expect(theme?.colors?.gold).toBeUndefined();
    expect(theme?.colors?.ruby).toBeUndefined();
  });

  // ── Gradients ────────────────────────────────────────────────────────────
  it("should define gradients: CTA, FAB, tab-active (AC: 2)", () => {
    expect(theme?.backgroundImage?.["gradient-cta"]).toBeDefined();
    expect(theme?.backgroundImage?.["gradient-fab"]).toBeDefined();
    expect(theme?.backgroundImage?.["gradient-tab-active"]).toBeDefined();
  });

  it("should define gradient-card for card components", () => {
    expect(theme?.backgroundImage?.["gradient-card"]).toBeDefined();
    // Everything ELO: navy-soft → navy ink wash
    expect(theme?.backgroundImage?.["gradient-card"]).toContain("#141D2F");
    expect(theme?.backgroundImage?.["gradient-card"]).toContain("#0B1320");
  });

  // ── Typography ───────────────────────────────────────────────────────────
  it("should define typography tokens with correct mobile/desktop sizes (AC: 3)", () => {
    expect(theme?.fontSize?.["page-title"]).toBeDefined();
    expect(theme?.fontSize?.["page-title"]?.[0]).toBe("1.25rem");
    expect(theme?.fontSize?.["page-title-lg"]?.[0]).toBe("1.5rem");
    expect(theme?.fontSize?.["section-title"]).toBeDefined();
    expect(theme?.fontSize?.["body"]).toBeDefined();
    expect(theme?.fontSize?.["label"]).toBeDefined();
    expect(theme?.fontSize?.["stat"]).toBeDefined();
  });

  it("should define display font sizes", () => {
    expect(theme?.fontSize?.["display-sm"]).toBeDefined();
    expect(theme?.fontSize?.["display-md"]).toBeDefined();
    expect(theme?.fontSize?.["display-lg"]).toBeDefined();
  });

  it("should define Everything ELO font families (Sora + JetBrains Mono)", () => {
    // PR1: sans → Sora (was Space Grotesk), display → Teko, mono unchanged
    expect(theme?.fontFamily?.sans?.[0]).toBe("Sora");
    expect(theme?.fontFamily?.mono?.[0]).toBe("JetBrains Mono");
    // @deprecated legacy fallback — kept during DS migration
    expect(theme?.fontFamily?.archivo?.[0]).toBe("Archivo");
  });

  // ── Spacing / radii ──────────────────────────────────────────────────────
  it("should define spacing tokens: page, card-gap, bottom-nav (AC: 4)", () => {
    expect(theme?.spacing?.["page"]).toBe("1rem");
    expect(theme?.spacing?.["page-lg"]).toBe("1.5rem");
    expect(theme?.spacing?.["card-gap"]).toBe("1rem");
    expect(theme?.spacing?.["bottom-nav"]).toBe("5rem");
    expect(theme?.spacing?.["bottom-nav-lg"]).toBe("6rem");
  });

  it("should define radius and borders (AC: 5) — sharp radii", () => {
    expect(theme?.borderRadius?.["card"]).toBe("10px");
    expect(theme?.borderRadius?.["button"]).toBe("6px");
    expect(theme?.borderRadius?.["input"]).toBe("6px");
    expect(theme?.borderColor?.["card"]).toBeDefined();
  });

  // ── Screens ──────────────────────────────────────────────────────────────
  it("should define screens for Frame 1–11 consistency (AC: 6)", () => {
    expect(theme?.screens?.sm).toBe("640px");
    expect(theme?.screens?.md).toBe("768px");
    expect(theme?.screens?.lg).toBe("1024px");
    expect(theme?.screens?.xl).toBe("1440px");
  });
});
