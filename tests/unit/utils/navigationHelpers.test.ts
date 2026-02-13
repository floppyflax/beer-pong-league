import { describe, it, expect } from "vitest";
import {
  shouldShowBottomMenu,
  shouldShowBackButton,
  shouldShowSidebar,
  getContentPaddingBottom,
} from "../../../src/utils/navigationHelpers";

describe("navigationHelpers", () => {
  describe("shouldShowBottomMenu (Story 14-10)", () => {
    it("should return true for core routes", () => {
      expect(shouldShowBottomMenu("/")).toBe(true);
      expect(shouldShowBottomMenu("/join")).toBe(true);
      expect(shouldShowBottomMenu("/tournaments")).toBe(true);
      expect(shouldShowBottomMenu("/leagues")).toBe(true);
      expect(shouldShowBottomMenu("/user/profile")).toBe(true);
    });

    it("should return true for detail pages", () => {
      expect(shouldShowBottomMenu("/tournament/123")).toBe(true);
      expect(shouldShowBottomMenu("/league/456")).toBe(true);
      expect(shouldShowBottomMenu("/player/abc")).toBe(true);
    });

    it("should return false for display routes", () => {
      expect(shouldShowBottomMenu("/tournament/123/display")).toBe(false);
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

    it("should return true for tournament invite/join sub-routes (Story 14-14, design-system 5.5)", () => {
      expect(shouldShowBottomMenu("/tournament/123/invite")).toBe(true);
      expect(shouldShowBottomMenu("/tournament/123/join")).toBe(true);
    });
  });

  describe("getContentPaddingBottom", () => {
    it("should return empty string when bottom menu is hidden", () => {
      expect(getContentPaddingBottom("/auth/callback")).toBe("");
      expect(getContentPaddingBottom("/design-system")).toBe("");
    });

    it("should return pb-20 for core routes without specific menu", () => {
      expect(getContentPaddingBottom("/")).toContain("pb-20");
      expect(getContentPaddingBottom("/user/profile")).toContain("pb-20");
      expect(getContentPaddingBottom("/tournament/123")).toContain("pb-20");
    });

    it("should return pb-36 for pages with BottomMenuSpecific", () => {
      expect(getContentPaddingBottom("/join")).toContain("pb-36");
      // Story 14-12: /tournaments uses FAB instead of BottomMenuSpecific → pb-20
      // Story 14-16: /leagues uses FAB instead of BottomMenuSpecific → pb-20
      expect(getContentPaddingBottom("/tournaments")).toContain("pb-20");
      expect(getContentPaddingBottom("/leagues")).toContain("pb-20");
    });

    it("should return pb-20 for tournament invite/join sub-routes (Story 14-14)", () => {
      expect(getContentPaddingBottom("/tournament/123/invite")).toContain(
        "pb-20",
      );
      expect(getContentPaddingBottom("/tournament/123/join")).toContain(
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

    it("should return true for join route", () => {
      expect(shouldShowBackButton("/join")).toBe(true);
    });

    it("should return false for tournaments route (main nav, Story 14-12)", () => {
      expect(shouldShowBackButton("/tournaments")).toBe(false);
    });

    it("should return false for leagues route (main nav, Story 14-16)", () => {
      expect(shouldShowBackButton("/leagues")).toBe(false);
    });

    it("should return true for tournament detail pages", () => {
      expect(shouldShowBackButton("/tournament/123")).toBe(true);
      expect(shouldShowBackButton("/tournament/abc/invite")).toBe(true);
    });

    it("should return true for league detail pages", () => {
      expect(shouldShowBackButton("/league/456")).toBe(true);
    });

    it("should return false for auth routes", () => {
      expect(shouldShowBackButton("/auth/callback")).toBe(false);
    });

    it("should return false for display routes", () => {
      expect(shouldShowBackButton("/tournament/123/display")).toBe(false);
    });
  });

  describe("shouldShowSidebar", () => {
    it("should return true for home route", () => {
      expect(shouldShowSidebar("/")).toBe(true);
    });

    it("should return true for join route", () => {
      expect(shouldShowSidebar("/join")).toBe(true);
    });

    it("should return true for tournaments route", () => {
      expect(shouldShowSidebar("/tournaments")).toBe(true);
    });

    it("should return true for leagues route", () => {
      expect(shouldShowSidebar("/leagues")).toBe(true);
    });

    it("should return true for profile route", () => {
      expect(shouldShowSidebar("/user/profile")).toBe(true);
    });

    it("should return true for tournament detail pages", () => {
      expect(shouldShowSidebar("/tournament/123")).toBe(true);
      expect(shouldShowSidebar("/tournament/abc/invite")).toBe(true);
    });

    it("should return true for league detail pages", () => {
      expect(shouldShowSidebar("/league/456")).toBe(true);
    });

    it("should return false for auth routes", () => {
      expect(shouldShowSidebar("/auth/callback")).toBe(false);
      expect(shouldShowSidebar("/auth/something")).toBe(false);
    });

    it("should return false for display routes", () => {
      expect(shouldShowSidebar("/tournament/123/display")).toBe(false);
      expect(shouldShowSidebar("/league/456/display")).toBe(false);
    });

    it("should return true for unknown routes", () => {
      expect(shouldShowSidebar("/unknown")).toBe(true);
    });
  });
});
