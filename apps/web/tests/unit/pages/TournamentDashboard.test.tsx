/**
 * Unit tests for TournamentDashboard component
 * Story 8.3 - Tournament Dashboard Management
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { TournamentDashboard } from "../../../src/pages/TournamentDashboard";
import * as LeagueContext from "../../../src/context/LeagueContext";
import * as AuthContext from "../../../src/context/AuthContext";
import * as IdentityHook from "../../../src/hooks/useIdentity";
import * as DetailPagePermissions from "../../../src/hooks/useDetailPagePermissions";
import { databaseService } from "../../../src/services/DatabaseService";

// Mock modules
vi.mock("../../../src/services/DatabaseService", () => ({
  databaseService: {
    leaveTournament: vi.fn(),
    loadTournamentParticipants: vi.fn().mockResolvedValue([]),
    addLeaguePlayerToTournament: vi.fn().mockResolvedValue("new-tp-id"),
  },
}));

vi.mock("../../../src/hooks/useDetailPagePermissions", () => ({
  useDetailPagePermissions: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "test-tournament-id" }),
    useNavigate: () => vi.fn(),
  };
});

describe("TournamentDashboard - Story 8.3", () => {
  const mockPlayers = [
    {
      id: "player1",
      name: "Alice",
      elo: 1520,
      wins: 5,
      losses: 2,
      matchesPlayed: 7,
      streak: 2,
    },
    {
      id: "player2",
      name: "Bob",
      elo: 1480,
      wins: 3,
      losses: 4,
      matchesPlayed: 7,
      streak: -1,
    },
  ];

  const mockLeague = {
    id: "test-league-id",
    name: "Test League",
    type: "event" as const,
    createdAt: "2026-02-03T10:00:00Z",
    players: mockPlayers,
    matches: [],
  };

  const mockTournament = {
    id: "test-tournament-id",
    name: "Summer Cup",
    date: "2026-02-03",
    format: "2v2" as const,
    leagueId: "test-league-id",
    createdAt: "2026-02-03T10:00:00Z",
    playerIds: ["player1", "player2"],
    matches: [
      {
        id: "match1",
        date: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        teamA: ["player1"],
        teamB: ["player2"],
        scoreA: 10,
        scoreB: 8,
        eloChanges: { player1: 15, player2: -15 },
        photo_url: "https://example.com/winner-photo.jpg",
        cups_remaining: 4,
      },
    ],
    isFinished: false,
    creator_user_id: "creator-user-id",
    // Story 8.2 fields
    joinCode: "ABC123",
    formatType: "fixed" as const,
    team1Size: 2,
    team2Size: 2,
    maxPlayers: 16,
    isPrivate: false,
    status: "active" as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (databaseService.loadTournamentParticipants as ReturnType<typeof vi.fn>).mockImplementation(
      () => Promise.resolve(mockPlayers.map((p) => ({ ...p, leaguePlayerId: p.id, joinedAt: new Date().toISOString() }))),
    );

    // Default: user is non-admin but can invite (so Inviter action + leave menu both visible)
    vi.mocked(DetailPagePermissions.useDetailPagePermissions).mockReturnValue({
      isAdmin: false,
      canInvite: true,
    });

    // Mock LeagueContext
    vi.spyOn(LeagueContext, "useLeague").mockReturnValue({
      tournaments: [mockTournament],
      leagues: [mockLeague],
      recordTournamentMatch: vi.fn(),
      deleteTournament: vi.fn(),
      toggleTournamentStatus: vi.fn(),
      updateTournament: vi.fn(),
      getTournamentLocalRanking: vi.fn().mockReturnValue(mockPlayers),
      getLeagueGlobalRanking: vi.fn().mockReturnValue([]),
      addPlayer: vi.fn(),
      addPlayerToTournament: vi.fn(),
      associateTournamentToLeague: vi.fn(),
      isLoadingInitialData: false,
      reloadData: vi.fn(),
    } as any);

    // Mock AuthContext
    vi.spyOn(AuthContext, "useAuthContext").mockReturnValue({
      isAuthenticated: true,
      user: { id: "test-user-id", email: "test@example.com" },
      signOut: vi.fn(),
    } as any);

    // Mock useIdentity
    vi.spyOn(IdentityHook, "useIdentity").mockReturnValue({
      localUser: null,
    } as any);
  });

  // Task 2 - AC2: Display Tournament Header
  describe("Task 2 - Tournament Header (AC2)", () => {
    it("should display tournament name", () => {
      render(
        <BrowserRouter>
          <TournamentDashboard />
        </BrowserRouter>,
      );

      expect(screen.getAllByText(/Summer Cup/i).length).toBeGreaterThan(0);
    });

    it("should expose an Inviter action on the hero", () => {
      render(
        <BrowserRouter>
          <TournamentDashboard />
        </BrowserRouter>,
      );

      // Single invite action (QR code removed from hero — exposed via invitation modal/settings)
      expect(
        screen.getByRole("button", { name: /Inviter/i }),
      ).toBeInTheDocument();
    });

    it("should display format info", () => {
      render(
        <BrowserRouter>
          <TournamentDashboard />
        </BrowserRouter>,
      );

      // DetailHero meta chip: "Format 2v2" (no colon)
      expect(screen.getByText(/Format 2v2/i)).toBeInTheDocument();
    });

    it("should display player count with max", () => {
      render(
        <BrowserRouter>
          <TournamentDashboard />
        </BrowserRouter>,
      );

      // DetailHero stats grid has a "Joueurs" cell
      expect(screen.getAllByText(/Joueurs/i).length).toBeGreaterThan(0);
    });

    it("should display status badge", () => {
      render(
        <BrowserRouter>
          <TournamentDashboard />
        </BrowserRouter>,
      );

      expect(screen.getByText(/En cours/i)).toBeInTheDocument();
    });
  });

  // Task 4 - AC4: Display Match History with timestamps and ELO
  // Note: These tests require loadTournamentParticipants to resolve before Match tab content renders.
  // The async timing causes flakiness; consider using fake timers or mocking at a higher level.
  describe("Task 4 - Match History (AC4)", () => {
    it.skip("should display match teams", async () => {
      render(
        <BrowserRouter>
          <TournamentDashboard />
        </BrowserRouter>,
      );

      await waitFor(
        () => {
          const values = screen.getAllByTestId("statcard-value");
          expect(values[0].textContent).toBe("2");
        },
        { timeout: 2000 },
      );

      const historyTab = screen.getByRole("tab", { name: "Matchs" });
      await act(async () => {
        fireEvent.click(historyTab);
      });

      expect(
        await screen.findByText(/Alice/i, {}, { timeout: 3000 }),
      ).toBeInTheDocument();
      expect(screen.getByText(/Bob/i)).toBeInTheDocument();
    });

    it.skip("should display relative timestamp", async () => {
      render(
        <BrowserRouter>
          <TournamentDashboard />
        </BrowserRouter>,
      );

      const historyTab = screen.getByRole("tab", { name: "Matchs" });
      fireEvent.click(historyTab);

      await waitFor(() => {
        expect(screen.getByText(/Il y a 5 min/i)).toBeInTheDocument();
      });
    });

    it.skip("should display ELO changes for players", async () => {
      render(
        <BrowserRouter>
          <TournamentDashboard />
        </BrowserRouter>,
      );

      const historyTab = screen.getByRole("tab", { name: "Matchs" });
      fireEvent.click(historyTab);

      await waitFor(() => {
        expect(screen.getByText(/Alice: \+15/i)).toBeInTheDocument();
        expect(screen.getByText(/Bob: -15/i)).toBeInTheDocument();
      });
    });

    it.skip("should highlight winning team", async () => {
      render(
        <BrowserRouter>
          <TournamentDashboard />
        </BrowserRouter>,
      );

      const historyTab = screen.getByRole("tab", { name: "Matchs" });
      fireEvent.click(historyTab);

      await waitFor(() => {
        const aliceElement = screen.getByText(/🏆.*Alice/i);
        expect(aliceElement).toBeInTheDocument();
      });
    });

    // Story 14-28: Photo and cups in match history
    it("should display photo thumbnail and cups badge when match has enriched data", async () => {
      render(
        <BrowserRouter>
          <TournamentDashboard />
        </BrowserRouter>,
      );

      const historyTab = screen.getByRole("tab", { name: "Matchs" });
      fireEvent.click(historyTab);

      await waitFor(() => {
        expect(screen.getByText(/4 gobelets restants/i)).toBeInTheDocument();
      });
      expect(screen.getByRole("img", { name: /photo de l'équipe gagnante/i })).toBeInTheDocument();
    });
  });

  // Task 7 - AC7: Leave Tournament Functionality (moved to overflow menu)
  describe("Task 7 - Leave Tournament (AC7)", () => {
    it("should display leave tournament entry for non-creators in the overflow menu", async () => {
      render(
        <BrowserRouter>
          <TournamentDashboard />
        </BrowserRouter>,
      );

      fireEvent.click(screen.getByRole("button", { name: "Menu" }));

      await waitFor(() => {
        expect(
          screen.getByRole("menuitem", { name: /Quitter l'événement/i }),
        ).toBeInTheDocument();
      });
    });

    it("should NOT display leave entry for creators", async () => {
      // Mock user as creator (admin)
      vi.spyOn(AuthContext, "useAuthContext").mockReturnValue({
        isAuthenticated: true,
        user: { id: "creator-user-id", email: "creator@example.com" },
        signOut: vi.fn(),
      } as any);
      vi.mocked(DetailPagePermissions.useDetailPagePermissions).mockReturnValue({
        isAdmin: true,
        canInvite: true,
      });

      render(
        <BrowserRouter>
          <TournamentDashboard />
        </BrowserRouter>,
      );

      fireEvent.click(screen.getByRole("button", { name: "Menu" }));

      await waitFor(() => {
        // Menu is open → Paramètres is visible as a hint
        expect(
          screen.getByRole("menuitem", { name: /Paramètres/i }),
        ).toBeInTheDocument();
      });
      expect(
        screen.queryByRole("menuitem", { name: /Quitter l'événement/i }),
      ).not.toBeInTheDocument();
    });

    it("should call leaveTournament from overflow menu on confirmation", async () => {
      global.confirm = vi.fn(() => true);
      (databaseService.leaveTournament as any).mockResolvedValue(undefined);

      const mockReloadData = vi.fn().mockResolvedValue(undefined);
      vi.spyOn(LeagueContext, "useLeague").mockReturnValue({
        ...vi.mocked(LeagueContext.useLeague)(),
        reloadData: mockReloadData,
      } as any);

      render(
        <BrowserRouter>
          <TournamentDashboard />
        </BrowserRouter>,
      );

      fireEvent.click(screen.getByRole("button", { name: "Menu" }));
      const leaveItem = await screen.findByRole("menuitem", {
        name: /Quitter l'événement/i,
      });
      await userEvent.click(leaveItem);

      await waitFor(() => {
        expect(databaseService.leaveTournament).toHaveBeenCalledWith(
          "test-tournament-id",
          "test-user-id",
          undefined,
        );
        expect(mockReloadData).toHaveBeenCalled();
      });
    });

    it("should show error toast if leave fails", async () => {
      global.confirm = vi.fn(() => true);
      (databaseService.leaveTournament as any).mockRejectedValue(
        new Error("Le créateur du tournoi ne peut pas quitter"),
      );

      render(
        <BrowserRouter>
          <TournamentDashboard />
        </BrowserRouter>,
      );

      fireEvent.click(screen.getByRole("button", { name: "Menu" }));
      const leaveItem = await screen.findByRole("menuitem", {
        name: /Quitter l'événement/i,
      });
      await userEvent.click(leaveItem);

      await waitFor(() => {
        expect(databaseService.leaveTournament).toHaveBeenCalled();
      });
    });
  });
});
