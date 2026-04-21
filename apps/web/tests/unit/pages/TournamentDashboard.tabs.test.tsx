import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { TournamentDashboard } from "../../../src/pages/TournamentDashboard";

// Mock react-router-dom useParams
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "test-tournament-id" }),
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

vi.mock("../../../src/services/DatabaseService", () => ({
  databaseService: {
    loadTournamentParticipants: vi.fn().mockResolvedValue([]),
    addLeaguePlayerToTournament: vi.fn().mockResolvedValue("new-tp-id"),
  },
}));

describe("TournamentDashboard - Tab Navigation (Task 1)", () => {
  const renderDashboard = () => {
    return render(
      <BrowserRouter>
        <TournamentDashboard />
      </BrowserRouter>,
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("AC1: Tab Navigation Structure", () => {
    it("should display 3 tabs: Classement, Matchs, Paramètres", () => {
      renderDashboard();

      expect(
        screen.getByRole("tab", { name: "Classement" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Matchs" })).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: "Paramètres" }),
      ).toBeInTheDocument();
    });

    it("should have Classement tab active by default", () => {
      renderDashboard();

      const classementTab = screen.getByRole("tab", { name: "Classement" });
      expect(classementTab).toHaveAttribute("aria-selected", "true");
    });

    it("should highlight active tab with gradient (SegmentedTabs encapsulated)", () => {
      renderDashboard();

      const classementTab = screen.getByRole("tab", { name: "Classement" });
      expect(classementTab).toHaveClass("bg-gradient-tab-active");
    });

    it("should switch to Matchs tab when clicked", () => {
      renderDashboard();

      const matchsTab = screen.getByRole("tab", { name: "Matchs" });
      fireEvent.click(matchsTab);

      expect(matchsTab).toHaveAttribute("aria-selected", "true");
    });

    it("should switch to Paramètres tab when clicked", () => {
      renderDashboard();

      const parametresTab = screen.getByRole("tab", { name: "Paramètres" });
      fireEvent.click(parametresTab);

      expect(parametresTab).toHaveAttribute("aria-selected", "true");
    });

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

    it("should show Paramètres content when on Paramètres tab", () => {
      renderDashboard();

      const parametresTab = screen.getByRole("tab", { name: "Paramètres" });
      fireEvent.click(parametresTab);

      // Should show settings sections
      expect(screen.getByText("Informations")).toBeInTheDocument();
      expect(screen.getByText(/Association à une League/)).toBeInTheDocument();
    });
  });
});
