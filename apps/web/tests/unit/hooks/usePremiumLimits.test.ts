import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePremiumLimits } from "../../../src/hooks/usePremiumLimits";
import * as AuthContext from "../../../src/context/AuthContext";
import * as LeagueContext from "../../../src/context/LeagueContext";
import * as UsePremium from "../../../src/hooks/usePremium";

// Mock contexts and usePremium (usePremiumLimits now uses usePremium for isPremium)
vi.mock("../../../src/context/AuthContext");
vi.mock("../../../src/context/LeagueContext");
vi.mock("../../../src/hooks/usePremium");

describe("usePremiumLimits", () => {
  const mockUseAuthContext = vi.spyOn(AuthContext, "useAuthContext");
  const mockUseLeague = vi.spyOn(LeagueContext, "useLeague");
  const mockUsePremium = vi.spyOn(UsePremium, "usePremium");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Free User Limits", () => {
    beforeEach(() => {
      mockUseAuthContext.mockReturnValue({
        user: { id: "user-1", user_metadata: { isPremium: false } },
        isAuthenticated: true,
        signIn: vi.fn(),
        signOut: vi.fn(),
      } as any);
      mockUsePremium.mockReturnValue({
        isPremium: false,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });
    });

    it("should return false for isPremium when user is not premium", () => {
      mockUseLeague.mockReturnValue({
        events: [],
        leagues: [],
      } as any);

      const { result } = renderHook(() => usePremiumLimits());

      expect(result.current.isPremium).toBe(false);
    });

    it("should allow creating events when under limit (0/2)", () => {
      mockUseLeague.mockReturnValue({
        events: [],
        leagues: [],
      } as any);

      const { result } = renderHook(() => usePremiumLimits());

      expect(result.current.canCreateEvent).toBe(true);
      expect(result.current.isAtEventLimit).toBe(false);
      expect(result.current.eventCount).toBe(0);
      expect(result.current.limits.events).toBe(2);
    });

    it("should allow creating events when at 1/2 limit", () => {
      mockUseLeague.mockReturnValue({
        events: [{ id: "1", isFinished: false }],
        leagues: [],
      } as any);

      const { result } = renderHook(() => usePremiumLimits());

      expect(result.current.canCreateEvent).toBe(true);
      expect(result.current.isAtEventLimit).toBe(false);
      expect(result.current.eventCount).toBe(1);
    });

    it("should prevent creating events when at limit (2/2)", () => {
      mockUseLeague.mockReturnValue({
        events: [
          { id: "1", isFinished: false },
          { id: "2", isFinished: false },
        ],
        leagues: [],
      } as any);

      const { result } = renderHook(() => usePremiumLimits());

      expect(result.current.canCreateEvent).toBe(false);
      expect(result.current.isAtEventLimit).toBe(true);
      expect(result.current.eventCount).toBe(2);
    });

    it("should not count finished events against limit", () => {
      mockUseLeague.mockReturnValue({
        events: [
          { id: "1", isFinished: false },
          { id: "2", isFinished: true },
          { id: "3", isFinished: true },
        ],
        leagues: [],
      } as any);

      const { result } = renderHook(() => usePremiumLimits());

      expect(result.current.canCreateEvent).toBe(true);
      expect(result.current.eventCount).toBe(1);
    });

    it("should prevent creating leagues for free users (premium-only feature)", () => {
      mockUseLeague.mockReturnValue({
        events: [],
        leagues: [],
      } as any);

      const { result } = renderHook(() => usePremiumLimits());

      expect(result.current.canCreateLeague).toBe(false);
      expect(result.current.isAtLeagueLimit).toBe(true);
      expect(result.current.leagueCount).toBe(0);
      expect(result.current.limits.leagues).toBe(0);
    });

    it("should still report league count when free user is member of leagues", () => {
      mockUseLeague.mockReturnValue({
        events: [],
        leagues: [{ id: "1", status: "active" }],
      } as any);

      const { result } = renderHook(() => usePremiumLimits());

      expect(result.current.canCreateLeague).toBe(false);
      expect(result.current.isAtLeagueLimit).toBe(true);
      expect(result.current.leagueCount).toBe(1);
    });
  });

  describe("Premium User Limits", () => {
    beforeEach(() => {
      mockUseAuthContext.mockReturnValue({
        user: { id: "user-1", user_metadata: { isPremium: true } },
        isAuthenticated: true,
        signIn: vi.fn(),
        signOut: vi.fn(),
      } as any);
      mockUsePremium.mockReturnValue({
        isPremium: true,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });
    });

    it("should return true for isPremium when user is premium", () => {
      mockUseLeague.mockReturnValue({
        events: [],
        leagues: [],
      } as any);

      const { result } = renderHook(() => usePremiumLimits());

      expect(result.current.isPremium).toBe(true);
    });

    it("should allow unlimited events for premium users", () => {
      mockUseLeague.mockReturnValue({
        events: [
          { id: "1", isFinished: false },
          { id: "2", isFinished: false },
          { id: "3", isFinished: false },
        ],
        leagues: [],
      } as any);

      const { result } = renderHook(() => usePremiumLimits());

      expect(result.current.canCreateEvent).toBe(true);
      expect(result.current.isAtEventLimit).toBe(false);
      expect(result.current.limits.events).toBe(Infinity);
    });

    it("should allow unlimited leagues for premium users", () => {
      mockUseLeague.mockReturnValue({
        events: [],
        leagues: [
          { id: "1", status: "active" },
          { id: "2", status: "active" },
        ],
      } as any);

      const { result } = renderHook(() => usePremiumLimits());

      expect(result.current.canCreateLeague).toBe(true);
      expect(result.current.isAtLeagueLimit).toBe(false);
      expect(result.current.limits.leagues).toBe(Infinity);
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing user gracefully", () => {
      mockUseAuthContext.mockReturnValue({
        user: null,
        isAuthenticated: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
      } as any);
      mockUsePremium.mockReturnValue({
        isPremium: false,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      mockUseLeague.mockReturnValue({
        events: [],
        leagues: [],
      } as any);

      const { result } = renderHook(() => usePremiumLimits());

      expect(result.current.isPremium).toBe(false);
      expect(result.current.limits.events).toBe(2);
      expect(result.current.limits.leagues).toBe(0);
    });

    it("should handle missing events array", () => {
      mockUseAuthContext.mockReturnValue({
        user: { id: "user-1", user_metadata: { isPremium: false } },
        isAuthenticated: true,
        signIn: vi.fn(),
        signOut: vi.fn(),
      } as any);
      mockUsePremium.mockReturnValue({
        isPremium: false,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      mockUseLeague.mockReturnValue({
        leagues: [],
      } as any);

      const { result } = renderHook(() => usePremiumLimits());

      expect(result.current.eventCount).toBe(0);
      expect(result.current.canCreateEvent).toBe(true);
    });

    it("should handle missing leagues array (free user still cannot create)", () => {
      mockUseAuthContext.mockReturnValue({
        user: { id: "user-1", user_metadata: { isPremium: false } },
        isAuthenticated: true,
        signIn: vi.fn(),
        signOut: vi.fn(),
      } as any);
      mockUsePremium.mockReturnValue({
        isPremium: false,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      mockUseLeague.mockReturnValue({
        events: [],
      } as any);

      const { result } = renderHook(() => usePremiumLimits());

      expect(result.current.leagueCount).toBe(0);
      expect(result.current.canCreateLeague).toBe(false);
    });
  });
});
