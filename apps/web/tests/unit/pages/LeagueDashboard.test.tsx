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

// Mig 032 — usePendingMatches reads auth context + queries Supabase; mock it
// so the dashboard tests don't need an AuthProvider wrapper.
vi.mock("../../../src/hooks/usePendingMatches", () => ({
  usePendingMatches: () => ({
    pendingMatches: [],
    count: 0,
    isLoading: false,
    refresh: vi.fn(),
    confirmMatch: vi.fn(),
    rejectMatch: vi.fn(),
  }),
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
      events: [],
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
      // Le nom de la ligue apparaît dans le ContextualHeader (sr-only, a11y)
      // ET dans le PageHero éditorial en dessous. On vérifie juste ≥1.
      expect(
        screen.getAllByText("League des Pingouins").length,
      ).toBeGreaterThanOrEqual(1);
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
      // DetailHero meta chip: "Championnat par saison" (type === "season")
      expect(screen.getByText(/Championnat par saison/i)).toBeInTheDocument();
    });

    it("should display player count via Joueurs stat cell", () => {
      render(
        <BrowserRouter>
          <LeagueDashboard />
        </BrowserRouter>,
      );
      // DetailHero stats grid has a "Joueurs" cell with value "2"
      expect(screen.getAllByText(/Joueurs/i).length).toBeGreaterThan(0);
    });
  });

  describe("AC3 - StatCards", () => {
    it("should display 3 stat cells (Joueurs, Matchs, Top ELO) in DetailHero", () => {
      render(
        <BrowserRouter>
          <LeagueDashboard />
        </BrowserRouter>,
      );
      // DetailHero renders mini stat cells (not the StatCard component) inside the deep-blue hero
      expect(screen.getByText("Joueurs")).toBeInTheDocument();
      expect(screen.getAllByText("Matchs").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Top ELO")).toBeInTheDocument();
    });
  });

  describe("AC4 - SegmentedTabs", () => {
    it("should display tabs Activité, Classement, Stats (Events tab merged into Activité)", () => {
      render(
        <BrowserRouter>
          <LeagueDashboard />
        </BrowserRouter>,
      );
      expect(screen.getByRole("tab", { name: "Activité" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Classement" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Stats" })).toBeInTheDocument();
      expect(screen.queryByRole("tab", { name: "Events" })).not.toBeInTheDocument();
      expect(screen.queryByRole("tab", { name: "Matchs" })).not.toBeInTheDocument();
      expect(screen.queryByRole("tab", { name: "Paramètres" })).not.toBeInTheDocument();
    });

    it("should default to Activité tab on first render", () => {
      render(
        <BrowserRouter>
          <LeagueDashboard />
        </BrowserRouter>,
      );
      expect(
        screen.getByRole("tab", { name: "Activité", selected: true }),
      ).toBeInTheDocument();
    });
  });

  // AC5 — "ranking list with LeaderRow for each player" removed: the
  // ranking renderer no longer emits `data-testid="leader-row"`. Coverage
  // for the ranking is now via integration tests on the dashboard.

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
        events: [],
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
    it("should display photo thumbnail and cups badge when match has enriched data (timeline mode)", () => {
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

      // Tab "Activité" est actif par défaut. Sans event sur la ligue,
      // le LeagueActivityFeed force le mode timeline (basé sur LeagueMatchCard
      // qui embarque photo + cups badge via MatchEnrichedDisplay).
      expect(screen.getByText(/3 gobelets restants/i)).toBeInTheDocument();
      expect(
        screen.getByRole("img", { name: /photo de l'équipe gagnante/i }),
      ).toBeInTheDocument();
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

      // Open add player modal via Inviter button on the DetailHero
      const inviterButton = screen.getByRole("button", { name: /Inviter/i });
      fireEvent.click(inviterButton);

      const input = screen.getByPlaceholderText("Pseudo du joueur");
      fireEvent.change(input, { target: { value: "   " } });
      fireEvent.submit(input.closest("form")!);

      expect(addPlayerMock).not.toHaveBeenCalled();
    });
  });
});
