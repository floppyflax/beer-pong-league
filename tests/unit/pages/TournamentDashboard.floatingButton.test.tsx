/**
 * TournamentDashboard - FAB (Story 14-13 AC6)
 *
 * Design system: FAB "Nouveau match" with BeerPongMatchIcon when tournament not finished.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { TournamentDashboard } from "../../../src/pages/TournamentDashboard";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "test-tournament-id" }),
    useNavigate: () => vi.fn(),
  };
});

vi.mock("react-hot-toast", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockTournament = {
  id: "test-tournament-id",
  name: "Test Tournament",
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
  tournaments: [mockTournament],
  leagues: [],
  recordTournamentMatch: vi.fn(),
  deleteTournament: vi.fn(),
  toggleTournamentStatus: vi.fn(),
  updateTournament: vi.fn(),
  getTournamentLocalRanking: vi.fn(() => []),
  getLeagueGlobalRanking: vi.fn(() => []),
  addPlayer: vi.fn(),
  addPlayerToTournament: vi.fn(),
  associateTournamentToLeague: vi.fn(),
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

describe("TournamentDashboard - FAB (Story 14-13 AC6)", () => {
  const renderDashboard = () => {
    return render(
      <BrowserRouter>
        <TournamentDashboard />
      </BrowserRouter>,
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLeagueContextValue.tournaments = [
      { ...mockTournament, isFinished: false },
    ];
  });

  describe("AC6: FAB Nouveau match", () => {
    it("should show FAB with Nouveau match when tournament not finished", () => {
      renderDashboard();

      const fab = screen.getByRole("button", { name: "Nouveau match" });
      expect(fab).toBeInTheDocument();
      expect(fab).toHaveAttribute("data-testid", "fab");
    });

    it("should NOT show FAB when tournament is finished", () => {
      mockLeagueContextValue.tournaments = [
        { ...mockTournament, isFinished: true },
      ];

      renderDashboard();

      expect(
        screen.queryByRole("button", { name: "Nouveau match" }),
      ).not.toBeInTheDocument();
    });

    it("should open match recording modal when FAB is clicked", () => {
      renderDashboard();

      const fab = screen.getByRole("button", { name: "Nouveau match" });
      fireEvent.click(fab);

      // MatchRecordingForm modal should be visible
      expect(screen.getByText("Nouveau Match")).toBeInTheDocument();
    });
  });
});
