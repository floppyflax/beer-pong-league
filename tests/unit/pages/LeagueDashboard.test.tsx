/**
 * Unit tests for LeagueDashboard component
 * Story 14-17 - League Dashboard (design system overhaul)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { LeagueDashboard } from "../../../src/pages/LeagueDashboard";
import * as LeagueContext from "../../../src/context/LeagueContext";
import * as DetailPagePermissions from "../../../src/hooks/useDetailPagePermissions";

vi.mock("../../../src/hooks/useDetailPagePermissions", () => ({
  useDetailPagePermissions: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "test-league-id" }),
    useNavigate: () => vi.fn(),
  };
});

describe("LeagueDashboard - Story 14-17", () => {
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
    name: "League des Pingouins",
    type: "season" as const,
    createdAt: "2026-02-03T10:00:00Z",
    players: mockPlayers,
    matches: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(DetailPagePermissions.useDetailPagePermissions).mockReturnValue({
      isAdmin: true,
      canInvite: true,
    });
    vi.spyOn(LeagueContext, "useLeague").mockReturnValue({
      leagues: [mockLeague],
      tournaments: [],
      addPlayer: vi.fn(),
      recordMatch: vi.fn(),
      deleteLeague: vi.fn(),
      updateLeague: vi.fn(),
      deletePlayer: vi.fn(),
      isLoadingInitialData: false,
    } as unknown as ReturnType<typeof LeagueContext.useLeague>);
  });

  describe("AC1 - Header", () => {
    it("should display league name in header", () => {
      render(
        <BrowserRouter>
          <LeagueDashboard />
        </BrowserRouter>,
      );
      expect(screen.getByText("League des Pingouins")).toBeInTheDocument();
    });
  });

  describe("AC2 - InfoCard", () => {
    it("should display status badge En cours", () => {
      render(
        <BrowserRouter>
          <LeagueDashboard />
        </BrowserRouter>,
      );
      expect(screen.getByText("En cours")).toBeInTheDocument();
    });

    it("should display format info", () => {
      render(
        <BrowserRouter>
          <LeagueDashboard />
        </BrowserRouter>,
      );
      expect(screen.getByText(/Format: Par Saison/i)).toBeInTheDocument();
    });

    it("should display player count", () => {
      render(
        <BrowserRouter>
          <LeagueDashboard />
        </BrowserRouter>,
      );
      expect(screen.getByText(/2 joueurs/i)).toBeInTheDocument();
    });
  });

  describe("AC3 - StatCards", () => {
    it("should display 3 stat cards (Joueurs, Matchs, Top ELO)", () => {
      render(
        <BrowserRouter>
          <LeagueDashboard />
        </BrowserRouter>,
      );
      expect(screen.getByText("Joueurs")).toBeInTheDocument();
      expect(screen.getAllByText("Matchs").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Top ELO")).toBeInTheDocument();
      const statCards = screen.getAllByTestId("statcard");
      expect(statCards).toHaveLength(3);
    });
  });

  describe("AC4 - SegmentedTabs", () => {
    it("should display tabs Classement, Matchs, Paramètres", () => {
      render(
        <BrowserRouter>
          <LeagueDashboard />
        </BrowserRouter>,
      );
      expect(screen.getByRole("tab", { name: "Classement" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Matchs" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Paramètres" })).toBeInTheDocument();
    });
  });

  describe("AC5 - Ranking with ListRow", () => {
    it("should display ranking list with ListRow for each player", () => {
      render(
        <BrowserRouter>
          <LeagueDashboard />
        </BrowserRouter>,
      );
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
      const listRows = screen.getAllByTestId("listrow");
      expect(listRows.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("AC6 - FAB", () => {
    it("should render FAB for new match", () => {
      render(
        <BrowserRouter>
          <LeagueDashboard />
        </BrowserRouter>,
      );
      const fab = screen.getByRole("button", { name: "Nouveau match" });
      expect(fab).toBeInTheDocument();
    });
  });

  describe("League not found", () => {
    it("should show empty state when league does not exist", () => {
      vi.spyOn(LeagueContext, "useLeague").mockReturnValue({
        leagues: [],
        tournaments: [],
        addPlayer: vi.fn(),
        recordMatch: vi.fn(),
        deleteLeague: vi.fn(),
        updateLeague: vi.fn(),
        deletePlayer: vi.fn(),
        isLoadingInitialData: false,
      } as unknown as ReturnType<typeof LeagueContext.useLeague>);

      render(
        <BrowserRouter>
          <LeagueDashboard />
        </BrowserRouter>,
      );
      expect(screen.getByText("Ligue introuvable")).toBeInTheDocument();
    });
  });

  describe("Story 14-28 - Match history with photo and cups", () => {
    it("should display photo thumbnail and cups badge when match has enriched data", () => {
      const leagueWithEnrichedMatch = {
        ...mockLeague,
        matches: [
          {
            id: "match1",
            date: new Date().toISOString(),
            teamA: ["player1"],
            teamB: ["player2"],
            scoreA: 10,
            scoreB: 8,
            photo_url: "https://example.com/winner.jpg",
            cups_remaining: 3,
          },
        ],
      };
      vi.spyOn(LeagueContext, "useLeague").mockReturnValue({
        ...vi.mocked(LeagueContext.useLeague)(),
        leagues: [leagueWithEnrichedMatch],
      } as unknown as ReturnType<typeof LeagueContext.useLeague>);

      render(
        <BrowserRouter>
          <LeagueDashboard />
        </BrowserRouter>,
      );

      fireEvent.click(screen.getByRole("tab", { name: "Matchs" }));

      expect(screen.getByText(/3 gobelets restants/i)).toBeInTheDocument();
      expect(screen.getByRole("img", { name: /photo de l'équipe gagnante/i })).toBeInTheDocument();
    });
  });

  describe("Add player validation", () => {
    it("should not add player with empty name", async () => {
      const addPlayerMock = vi.fn();
      vi.spyOn(LeagueContext, "useLeague").mockReturnValue({
        ...vi.mocked(LeagueContext.useLeague)(),
        addPlayer: addPlayerMock,
      } as unknown as ReturnType<typeof LeagueContext.useLeague>);

      render(
        <BrowserRouter>
          <LeagueDashboard />
        </BrowserRouter>,
      );

      // Open add player modal via Inviter button (if admin) or via Paramètres > Ajouter
      const parametresTab = screen.getByRole("tab", { name: "Paramètres" });
      fireEvent.click(parametresTab);

      const addButton = screen.getByText(/Ajouter un joueur/i);
      fireEvent.click(addButton);

      const input = screen.getByPlaceholderText("Nom du joueur");
      fireEvent.change(input, { target: { value: "   " } });
      fireEvent.submit(input.closest("form")!);

      expect(addPlayerMock).not.toHaveBeenCalled();
    });
  });
});
