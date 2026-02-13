import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { Tournaments } from "../../../src/pages/Tournaments";
import * as UseTournamentsList from "../../../src/hooks/useTournamentsList";
import * as UsePremiumLimits from "../../../src/hooks/usePremiumLimits";
import type { Tournament } from "../../../src/types";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../../src/hooks/useTournamentsList");
vi.mock("../../../src/hooks/usePremiumLimits");
vi.mock("../../../src/context/LeagueContext", () => ({
  useLeague: () => ({ reloadData: vi.fn() }),
}));

// Mock child components to simplify testing
vi.mock("../../../src/components/tournaments/TournamentCard", () => ({
  TournamentCard: ({ tournament }: { tournament: Tournament }) => (
    <div data-testid={`tournament-card-${tournament.id}`}>
      {tournament.name}
    </div>
  ),
}));

// Story 14-12: FAB replaces BottomMenuSpecific for create action

vi.mock("../../../src/components/PaymentModal", () => ({
  PaymentModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="payment-modal">Payment Modal</div> : null,
}));

vi.mock("../../../src/components/LoadingSpinner", () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
}));

describe("Tournaments Page", () => {
  const mockTournaments: Tournament[] = [
    {
      id: "t1",
      name: "Active Tournament 1",
      date: "2024-06-15",
      format: "2v2",
      leagueId: null,
      createdAt: "2024-01-10T10:00:00Z",
      playerIds: ["p1", "p2"],
      matches: [],
      isFinished: false,
    },
    {
      id: "t2",
      name: "Active Tournament 2",
      date: "2024-06-20",
      format: "1v1",
      leagueId: null,
      createdAt: "2024-01-15T10:00:00Z",
      playerIds: ["p1", "p2", "p3"],
      matches: [],
      isFinished: false,
    },
    {
      id: "t3",
      name: "Finished Tournament",
      date: "2024-01-01",
      format: "3v3",
      leagueId: null,
      createdAt: "2024-01-01T10:00:00Z",
      playerIds: ["p1", "p2", "p3", "p4"],
      matches: [],
      isFinished: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock: User can create tournaments (not at limit)
    vi.spyOn(UsePremiumLimits, "usePremiumLimits").mockReturnValue({
      canCreateTournament: true,
      canCreateLeague: true,
      tournamentCount: 1,
      leagueCount: 0,
      limits: { tournaments: 2, leagues: 1 },
      isPremium: false,
      isAtTournamentLimit: false,
      isAtLeagueLimit: false,
      refetchPremium: vi.fn(),
    });
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  describe("Loading State", () => {
    it("should show loading spinner while data is loading", () => {
      vi.spyOn(UseTournamentsList, "useTournamentsList").mockReturnValue({
        tournaments: [],
        isLoading: true,
      });

      renderWithRouter(<Tournaments />);
      expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should show empty state when no tournaments", () => {
      vi.spyOn(UseTournamentsList, "useTournamentsList").mockReturnValue({
        tournaments: [],
        isLoading: false,
      });

      renderWithRouter(<Tournaments />);

      expect(screen.getByText("Aucun tournoi")).toBeInTheDocument();
      expect(
        screen.getByText(/Rejoignez votre premier tournoi/i),
      ).toBeInTheDocument();
    });

    it("should show action buttons in empty state", () => {
      vi.spyOn(UseTournamentsList, "useTournamentsList").mockReturnValue({
        tournaments: [],
        isLoading: false,
      });

      renderWithRouter(<Tournaments />);

      expect(screen.getByText("Rejoindre un tournoi")).toBeInTheDocument();
      expect(screen.getByText("Créer un tournoi")).toBeInTheDocument();
    });

    it('should navigate to /join when clicking "Rejoindre"', () => {
      vi.spyOn(UseTournamentsList, "useTournamentsList").mockReturnValue({
        tournaments: [],
        isLoading: false,
      });

      renderWithRouter(<Tournaments />);

      const joinButton = screen.getByText("Rejoindre un tournoi");
      fireEvent.click(joinButton);

      expect(mockNavigate).toHaveBeenCalledWith("/join");
    });

    it('should navigate to /create-tournament when clicking "Créer" (if allowed)', () => {
      vi.spyOn(UseTournamentsList, "useTournamentsList").mockReturnValue({
        tournaments: [],
        isLoading: false,
      });

      renderWithRouter(<Tournaments />);

      const createButton = screen.getByText("Créer un tournoi");
      fireEvent.click(createButton);

      expect(mockNavigate).toHaveBeenCalledWith("/create-tournament");
    });
  });

  describe("Tournament List", () => {
    it("should render list of tournaments", () => {
      vi.spyOn(UseTournamentsList, "useTournamentsList").mockReturnValue({
        tournaments: mockTournaments,
        isLoading: false,
      });

      renderWithRouter(<Tournaments />);

      expect(screen.getByTestId("tournament-card-t1")).toBeInTheDocument();
      expect(screen.getByTestId("tournament-card-t2")).toBeInTheDocument();
      expect(screen.getByTestId("tournament-card-t3")).toBeInTheDocument();
    });

    it("should show page header", () => {
      vi.spyOn(UseTournamentsList, "useTournamentsList").mockReturnValue({
        tournaments: mockTournaments,
        isLoading: false,
      });

      renderWithRouter(<Tournaments />);

      expect(screen.getByText("Mes Tournois")).toBeInTheDocument();
    });
  });

  describe("Search Functionality", () => {
    it("should show search input", () => {
      vi.spyOn(UseTournamentsList, "useTournamentsList").mockReturnValue({
        tournaments: mockTournaments,
        isLoading: false,
      });

      renderWithRouter(<Tournaments />);

      expect(
        screen.getByPlaceholderText("Rechercher un tournoi..."),
      ).toBeInTheDocument();
    });

    it("should filter tournaments by name (case-insensitive)", async () => {
      vi.spyOn(UseTournamentsList, "useTournamentsList").mockReturnValue({
        tournaments: mockTournaments,
        isLoading: false,
      });

      renderWithRouter(<Tournaments />);

      const searchInput = screen.getByPlaceholderText(
        "Rechercher un tournoi...",
      );
      fireEvent.change(searchInput, { target: { value: "finished" } });

      await waitFor(() => {
        expect(screen.getByTestId("tournament-card-t3")).toBeInTheDocument();
        expect(
          screen.queryByTestId("tournament-card-t1"),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByTestId("tournament-card-t2"),
        ).not.toBeInTheDocument();
      });
    });

    it('should show "Aucun résultat" when no match', async () => {
      vi.spyOn(UseTournamentsList, "useTournamentsList").mockReturnValue({
        tournaments: mockTournaments,
        isLoading: false,
      });

      renderWithRouter(<Tournaments />);

      const searchInput = screen.getByPlaceholderText(
        "Rechercher un tournoi...",
      );
      fireEvent.change(searchInput, {
        target: { value: "NonExistentTournament" },
      });

      await waitFor(() => {
        expect(screen.getByText("Aucun résultat")).toBeInTheDocument();
      });
    });
  });

  describe("Filter Tabs", () => {
    it("should show filter tabs", () => {
      vi.spyOn(UseTournamentsList, "useTournamentsList").mockReturnValue({
        tournaments: mockTournaments,
        isLoading: false,
      });

      renderWithRouter(<Tournaments />);

      expect(screen.getByText("Tous")).toBeInTheDocument();
      expect(screen.getByText("Actifs")).toBeInTheDocument();
      expect(screen.getByText("Terminés")).toBeInTheDocument();
    });

    it('should filter active tournaments when "Actifs" is clicked', async () => {
      vi.spyOn(UseTournamentsList, "useTournamentsList").mockReturnValue({
        tournaments: mockTournaments,
        isLoading: false,
      });

      renderWithRouter(<Tournaments />);

      const actifTab = screen.getByText("Actifs");
      fireEvent.click(actifTab);

      await waitFor(() => {
        expect(screen.getByTestId("tournament-card-t1")).toBeInTheDocument();
        expect(screen.getByTestId("tournament-card-t2")).toBeInTheDocument();
        expect(
          screen.queryByTestId("tournament-card-t3"),
        ).not.toBeInTheDocument();
      });
    });

    it('should filter finished tournaments when "Terminés" is clicked', async () => {
      vi.spyOn(UseTournamentsList, "useTournamentsList").mockReturnValue({
        tournaments: mockTournaments,
        isLoading: false,
      });

      renderWithRouter(<Tournaments />);

      const finishedTab = screen.getByText("Terminés");
      fireEvent.click(finishedTab);

      await waitFor(() => {
        expect(screen.getByTestId("tournament-card-t3")).toBeInTheDocument();
        expect(
          screen.queryByTestId("tournament-card-t1"),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByTestId("tournament-card-t2"),
        ).not.toBeInTheDocument();
      });
    });

    it('should show all tournaments when "Tous" is clicked', async () => {
      vi.spyOn(UseTournamentsList, "useTournamentsList").mockReturnValue({
        tournaments: mockTournaments,
        isLoading: false,
      });

      renderWithRouter(<Tournaments />);

      // First click "Actifs" to change filter
      fireEvent.click(screen.getByText("Actifs"));

      // Then click "Tous"
      fireEvent.click(screen.getByText("Tous"));

      await waitFor(() => {
        expect(screen.getByTestId("tournament-card-t1")).toBeInTheDocument();
        expect(screen.getByTestId("tournament-card-t2")).toBeInTheDocument();
        expect(screen.getByTestId("tournament-card-t3")).toBeInTheDocument();
      });
    });
  });

  describe("Create Tournament Action", () => {
    it("should navigate to /create-tournament when FAB is clicked and user can create", () => {
      vi.spyOn(UseTournamentsList, "useTournamentsList").mockReturnValue({
        tournaments: mockTournaments,
        isLoading: false,
      });

      renderWithRouter(<Tournaments />);

      const fab = screen.getByTestId("fab");
      fireEvent.click(fab);

      expect(mockNavigate).toHaveBeenCalledWith("/create-tournament");
    });

    it("should show payment modal when FAB clicked and user is at tournament limit", async () => {
      vi.spyOn(UseTournamentsList, "useTournamentsList").mockReturnValue({
        tournaments: mockTournaments,
        isLoading: false,
      });

      vi.spyOn(UsePremiumLimits, "usePremiumLimits").mockReturnValue({
        canCreateTournament: false,
        canCreateLeague: true,
        tournamentCount: 2,
        leagueCount: 0,
        limits: { tournaments: 2, leagues: 1 },
        isPremium: false,
        isAtTournamentLimit: true,
        isAtLeagueLimit: false,
        refetchPremium: vi.fn(),
      });

      renderWithRouter(<Tournaments />);

      const fab = screen.getByTestId("fab");
      fireEvent.click(fab);

      await waitFor(() => {
        expect(screen.getByTestId("payment-modal")).toBeInTheDocument();
      });
    });

    it("should show lock icon on header create button when at limit (desktop)", () => {
      vi.spyOn(UseTournamentsList, "useTournamentsList").mockReturnValue({
        tournaments: mockTournaments,
        isLoading: false,
      });

      vi.spyOn(UsePremiumLimits, "usePremiumLimits").mockReturnValue({
        canCreateTournament: false,
        canCreateLeague: true,
        tournamentCount: 2,
        leagueCount: 0,
        limits: { tournaments: 2, leagues: 1 },
        isPremium: false,
        isAtTournamentLimit: true,
        isAtLeagueLimit: false,
        refetchPremium: vi.fn(),
      });

      renderWithRouter(<Tournaments />);

      // ContextualHeader shows lock on desktop action when at limit
      expect(screen.getAllByText("🔒").length).toBeGreaterThan(0);
    });
  });

  describe("Design System (Story 14-12)", () => {
    it("should render FAB for create tournament", () => {
      vi.spyOn(UseTournamentsList, "useTournamentsList").mockReturnValue({
        tournaments: mockTournaments,
        isLoading: false,
      });

      renderWithRouter(<Tournaments />);

      expect(screen.getByTestId("fab")).toBeInTheDocument();
    });

    it("should render SearchBar with placeholder", () => {
      vi.spyOn(UseTournamentsList, "useTournamentsList").mockReturnValue({
        tournaments: mockTournaments,
        isLoading: false,
      });

      renderWithRouter(<Tournaments />);

      expect(
        screen.getByPlaceholderText("Rechercher un tournoi..."),
      ).toBeInTheDocument();
      expect(screen.getByRole("searchbox")).toBeInTheDocument();
    });

    it("should render SegmentedTabs (Tous, Actifs, Terminés)", () => {
      vi.spyOn(UseTournamentsList, "useTournamentsList").mockReturnValue({
        tournaments: mockTournaments,
        isLoading: false,
      });

      renderWithRouter(<Tournaments />);

      expect(screen.getByRole("tablist")).toBeInTheDocument();
      expect(screen.getByText("Tous")).toBeInTheDocument();
      expect(screen.getByText("Actifs")).toBeInTheDocument();
      expect(screen.getByText("Terminés")).toBeInTheDocument();
    });
  });
});
