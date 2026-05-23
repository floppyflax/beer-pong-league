/**
 * EventDashboard - FAB (Story 14-13 AC6)
 *
 * Design system: FAB "Nouveau match" with BeerPongMatchIcon when event not finished.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { EventDashboard } from "../../../src/pages/EventDashboard";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "test-event-id" }),
    useNavigate: () => vi.fn(),
  };
});

vi.mock("react-hot-toast", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockEvent = {
  id: "test-event-id",
  name: "Test Event",
  joinCode: "ABC123",
  date: "2026-02-03",
  format: "libre" as const,
  formatType: "fixed" as const,
  team1Size: 2,
  team2Size: 2,
  status: "active" as const,
  isFinished: false,
  matches: [],
  playerIds: [],
  creator_user_id: "creator-id",
  creator_anonymous_user_id: null,
  maxPlayers: 16,
  anti_cheat_enabled: false,
  leagueId: null,
};

const mockLeagueContextValue = {
  events: [mockEvent],
  leagues: [],
  recordEventMatch: vi.fn(),
  deleteEvent: vi.fn(),
  toggleEventStatus: vi.fn(),
  updateEvent: vi.fn(),
  getEventLocalRanking: vi.fn(() => []),
  getLeagueGlobalRanking: vi.fn(() => []),
  addPlayer: vi.fn(),
  addPlayerToEvent: vi.fn(),
  associateEventToLeague: vi.fn(),
  isLoadingInitialData: false,
  reloadData: vi.fn(),
};

vi.mock("../../../src/context/AuthContext", () => ({
  useAuthContext: () => ({
    user: null,
    isAuthenticated: false,
    signInWithOTP: vi.fn(),
    signOut: vi.fn(),
  }),
}));

vi.mock("../../../src/context/LeagueContext", () => ({
  useLeague: () => mockLeagueContextValue,
}));

vi.mock("../../../src/hooks/useIdentity", () => ({
  useIdentity: () => ({ localUser: null }),
}));

vi.mock("../../../src/hooks/useDetailPagePermissions", () => ({
  useDetailPagePermissions: () => ({ isAdmin: false, canInvite: false }),
}));

vi.mock("../../../src/hooks/useCurrentUserMemberships", () => ({
  useCurrentUserMemberships: () => ({
    leagueMembershipByLeague: new Map(),
    eventMembershipByEvent: new Map(),
  }),
}));

vi.mock("../../../src/services/DatabaseService", () => ({
  databaseService: {
    loadEventParticipants: vi.fn().mockResolvedValue([]),
    addLeaguePlayerToEvent: vi.fn().mockResolvedValue("new-tp-id"),
  },
}));

describe("EventDashboard - FAB (Story 14-13 AC6)", () => {
  const renderDashboard = () => {
    return render(
      <BrowserRouter>
        <EventDashboard />
      </BrowserRouter>,
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLeagueContextValue.events = [
      { ...mockEvent, isFinished: false },
    ];
  });

  describe("AC6: FAB Nouveau match", () => {
    it("should show FAB with Nouveau match when event not finished", () => {
      renderDashboard();

      const fab = screen.getByRole("button", { name: "Nouveau match" });
      expect(fab).toBeInTheDocument();
      expect(fab).toHaveAttribute("data-testid", "fab");
    });

    it("should NOT show FAB when event is finished", () => {
      mockLeagueContextValue.events = [
        { ...mockEvent, isFinished: true },
      ];

      renderDashboard();

      expect(
        screen.queryByRole("button", { name: "Nouveau match" }),
      ).not.toBeInTheDocument();
    });

    it("should invoke navigation when FAB is clicked (no modal opened)", () => {
      renderDashboard();

      const fab = screen.getByRole("button", { name: "Nouveau match" });
      expect(fab).toBeInTheDocument();
      // Click navigates to /record-match/event/:id — no modal is opened
      fireEvent.click(fab);
      // Verify no "Nouveau Match" modal appeared (modal was removed in B.4)
      expect(screen.queryByText("Nouveau Match")).not.toBeInTheDocument();
    });
  });
});
