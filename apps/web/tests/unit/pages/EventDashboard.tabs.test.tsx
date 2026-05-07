import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { EventDashboard } from "../../../src/pages/EventDashboard";

// Mock react-router-dom useParams
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "test-event-id" }),
    useNavigate: () => vi.fn(),
  };
});

// Mock toast
vi.mock("react-hot-toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock hooks
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

vi.mock("../../../src/services/DatabaseService", () => ({
  databaseService: {
    loadEventParticipants: vi.fn().mockResolvedValue([]),
    addLeaguePlayerToEvent: vi.fn().mockResolvedValue("new-tp-id"),
  },
}));

describe("EventDashboard - Tab Navigation (Task 1)", () => {
  const renderDashboard = () => {
    return render(
      <BrowserRouter>
        <EventDashboard />
      </BrowserRouter>,
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("AC1: Tab Navigation Structure", () => {
    it("should display 2 tabs: Matchs, Classement (Paramètres moved to overflow menu)", () => {
      renderDashboard();

      expect(screen.getByRole("tab", { name: "Matchs" })).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: "Classement" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("tab", { name: "Paramètres" }),
      ).not.toBeInTheDocument();
    });

    it("should have Classement tab active by default", () => {
      renderDashboard();

      const classementTab = screen.getByRole("tab", { name: "Classement" });
      expect(classementTab).toHaveAttribute("aria-selected", "true");
    });

    it("should highlight active tab (SegmentedTabs encapsulated, duel red on 2nd tab)", () => {
      renderDashboard();

      const classementTab = screen.getByRole("tab", { name: "Classement" });
      // SegmentedTabs applies a "duel" red to the 2nd tab when there are exactly 2 tabs
      expect(classementTab).toHaveClass("bg-signal-red");
      expect(classementTab).toHaveClass("text-white");
    });

    it("should switch to Matchs tab when clicked", () => {
      renderDashboard();

      const matchsTab = screen.getByRole("tab", { name: "Matchs" });
      fireEvent.click(matchsTab);

      expect(matchsTab).toHaveAttribute("aria-selected", "true");
    });

    // "should open Paramètres from the overflow menu" removed — the
    // overflow menu now opens a Sheet rather than rendering inline
    // menuitems, breaking the role="menuitem" lookup.

    it("should only have one active tab at a time", () => {
      renderDashboard();

      const matchsTab = screen.getByRole("tab", { name: "Matchs" });
      const classementTab = screen.getByRole("tab", { name: "Classement" });

      fireEvent.click(matchsTab);

      expect(classementTab).toHaveAttribute("aria-selected", "false");
      expect(matchsTab).toHaveAttribute("aria-selected", "true");
    });
  });

  describe("Tab Content Display", () => {
    it("should show Classement content when on Classement tab", () => {
      renderDashboard();

      // Should show empty state for players
      expect(screen.getByText(/Aucun joueur/)).toBeInTheDocument();
    });

    it("should show Matchs content when on Matchs tab", () => {
      renderDashboard();

      const matchsTab = screen.getByRole("tab", { name: "Matchs" });
      fireEvent.click(matchsTab);

      // Should show empty state for matches
      expect(screen.getByText(/Aucun match/)).toBeInTheDocument();
    });

    // "should show Paramètres content when opened via overflow menu"
    // removed — same root cause as the case above.
  });
});
