import { describe, it, expect } from "vitest";
import {
  shouldShowBottomMenu,
  shouldShowBackButton,
  shouldShowSidebar,
  getContentPaddingBottom,
} from "../../../src/utils/navigationHelpers";

describe("navigationHelpers", () => {
  describe("shouldShowBottomMenu (post refonte 4 onglets)", () => {
    it("should return true for core read routes", () => {
      expect(shouldShowBottomMenu("/")).toBe(true);
      expect(shouldShowBottomMenu("/events")).toBe(true);
      expect(shouldShowBottomMenu("/leagues")).toBe(true);
      expect(shouldShowBottomMenu("/competitions")).toBe(true);
      expect(shouldShowBottomMenu("/leaderboard")).toBe(true);
      expect(shouldShowBottomMenu("/user/profile")).toBe(true);
    });

    it("should return true for detail pages (read)", () => {
      expect(shouldShowBottomMenu("/event/123")).toBe(true);
      expect(shouldShowBottomMenu("/league/456")).toBe(true);
      expect(shouldShowBottomMenu("/player/abc")).toBe(true);
    });

    it("should return false for modale-like action pages", () => {
      // Ces pages ont leur propre CTA + back button dans un header contextuel.
      expect(shouldShowBottomMenu("/join")).toBe(false);
      expect(shouldShowBottomMenu("/create-league")).toBe(false);
      expect(shouldShowBottomMenu("/create-event")).toBe(false);
    });

    it("should return false for display routes", () => {
      expect(shouldShowBottomMenu("/event/123/display")).toBe(false);
      expect(shouldShowBottomMenu("/league/456/display")).toBe(false);
    });

    it("should return false for auth routes", () => {
      expect(shouldShowBottomMenu("/auth/callback")).toBe(false);
    });

    it("should return false for payment routes", () => {
      expect(shouldShowBottomMenu("/payment-success")).toBe(false);
      expect(shouldShowBottomMenu("/payment-cancel")).toBe(false);
    });

    it("should return false for design-system dev page", () => {
      expect(shouldShowBottomMenu("/design-system")).toBe(false);
    });

    it("should return false for unknown routes", () => {
      expect(shouldShowBottomMenu("/unknown")).toBe(false);
    });

    it("should return true for event invite/join sub-routes (design-system 5.5)", () => {
      expect(shouldShowBottomMenu("/event/123/invite")).toBe(true);
      expect(shouldShowBottomMenu("/event/123/join")).toBe(true);
    });
  });

  describe("getContentPaddingBottom", () => {
    it("should return empty string when bottom menu is hidden", () => {
      expect(getContentPaddingBottom("/auth/callback")).toBe("");
      expect(getContentPaddingBottom("/design-system")).toBe("");
    });

    it("should return empty string for modale-like action pages (no bottom menu)", () => {
      expect(getContentPaddingBottom("/join")).toBe("");
      expect(getContentPaddingBottom("/create-league")).toBe("");
      expect(getContentPaddingBottom("/create-event")).toBe("");
    });

    it("should return pb-20 for core routes (no stacked menu anymore)", () => {
      expect(getContentPaddingBottom("/")).toContain("pb-20");
      expect(getContentPaddingBottom("/user/profile")).toContain("pb-20");
      expect(getContentPaddingBottom("/event/123")).toContain("pb-20");
      expect(getContentPaddingBottom("/events")).toContain("pb-20");
      expect(getContentPaddingBottom("/leagues")).toContain("pb-20");
    });

    it("should return pb-20 for event invite/join sub-routes", () => {
      expect(getContentPaddingBottom("/event/123/invite")).toContain(
        "pb-20",
      );
      expect(getContentPaddingBottom("/event/123/join")).toContain(
        "pb-20",
      );
    });
  });

  describe("shouldShowBackButton", () => {
    it("should return false for home route", () => {
      expect(shouldShowBackButton("/")).toBe(false);
    });

    it("should return false for profile route", () => {
      expect(shouldShowBackButton("/user/profile")).toBe(false);
    });

    it("should return false for join route (contextual header handles its own back button)", () => {
      // /join est une page modale-like avec son propre contextual header
      // (cf. apps/web/src/App.tsx `pagesWithContextualHeader`) → la global
      // shouldShowBackButton peut renvoyer false, le back est déjà affiché par la page.
      expect(shouldShowBackButton("/join")).toBe(false);
    });

    it("should return false for events route (main nav, Story 14-12)", () => {
      expect(shouldShowBackButton("/events")).toBe(false);
    });

    it("should return false for leagues route (main nav, Story 14-16)", () => {
      expect(shouldShowBackButton("/leagues")).toBe(false);
    });

    it("should return true for event detail pages", () => {
      expect(shouldShowBackButton("/event/123")).toBe(true);
      expect(shouldShowBackButton("/event/abc/invite")).toBe(true);
    });

    it("should return true for league detail pages", () => {
      expect(shouldShowBackButton("/league/456")).toBe(true);
    });

    it("should return false for auth routes", () => {
      expect(shouldShowBackButton("/auth/callback")).toBe(false);
    });

    it("should return false for display routes", () => {
      expect(shouldShowBackButton("/event/123/display")).toBe(false);
    });
  });

  describe("shouldShowSidebar", () => {
    it("should return true for home route", () => {
      expect(shouldShowSidebar("/")).toBe(true);
    });

    it("should return true for join route", () => {
      expect(shouldShowSidebar("/join")).toBe(true);
    });

    it("should return true for events route", () => {
      expect(shouldShowSidebar("/events")).toBe(true);
    });

    it("should return true for leagues route", () => {
      expect(shouldShowSidebar("/leagues")).toBe(true);
    });

    it("should return true for profile route", () => {
      expect(shouldShowSidebar("/user/profile")).toBe(true);
    });

    it("should return true for event detail pages", () => {
      expect(shouldShowSidebar("/event/123")).toBe(true);
      expect(shouldShowSidebar("/event/abc/invite")).toBe(true);
    });

    it("should return true for league detail pages", () => {
      expect(shouldShowSidebar("/league/456")).toBe(true);
    });

    it("should return false for auth routes", () => {
      expect(shouldShowSidebar("/auth/callback")).toBe(false);
      expect(shouldShowSidebar("/auth/something")).toBe(false);
    });

    it("should return false for display routes", () => {
      expect(shouldShowSidebar("/event/123/display")).toBe(false);
      expect(shouldShowSidebar("/league/456/display")).toBe(false);
    });

    it("should return true for unknown routes", () => {
      expect(shouldShowSidebar("/unknown")).toBe(true);
    });
  });
});
