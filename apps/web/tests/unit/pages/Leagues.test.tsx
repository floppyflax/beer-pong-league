import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { Leagues } from "../../../src/pages/Leagues";
import type { LeagueListItem } from "../../../src/hooks/useLeaguesList";

const mockNavigate = vi.fn();

// Mock dependencies
vi.mock("../../../src/hooks/useLeaguesList", () => ({
  useLeaguesList: vi.fn(),
}));

vi.mock("../../../src/hooks/usePremiumLimits", () => ({
  usePremiumLimits: vi.fn(),
}));

vi.mock("../../../src/context/LeagueContext", () => ({
  useLeague: vi.fn(() => ({ reloadData: vi.fn() })),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../../src/components/leagues/LeagueCard", () => ({
  LeagueCard: ({ league }: { league: LeagueListItem }) => (
    <div data-testid={`league-card-${league.id}`}>{league.name}</div>
  ),
}));

vi.mock("../../../src/components/design-system", () => ({
  SearchBar: ({
    value,
    onChange,
    placeholder,
  }: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
  }) => (
    <input
      data-testid="search-bar"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  ),
  SegmentedTabs: ({
    tabs,
    activeId,
    onChange,
  }: {
    tabs: { id: string; label: string }[];
    activeId: string;
    onChange: (id: string) => void;
  }) => (
    <div data-testid="segmented-tabs">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          data-active={activeId === t.id}
        >
          {t.label}
        </button>
      ))}
    </div>
  ),
  FAB: ({ ariaLabel, onClick }: { ariaLabel: string; onClick: () => void }) => (
    <button data-testid="fab" aria-label={ariaLabel} onClick={onClick}>
      FAB
    </button>
  ),
  ScreenLayout: ({
    header,
    overlay,
    children,
  }: {
    header?: React.ReactNode;
    overlay?: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <div data-testid="screen-layout">
      {header}
      <main>{children}</main>
      {overlay}
    </div>
  ),
}));

vi.mock("../../../src/components/PaymentModal", () => ({
  PaymentModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="payment-modal">Payment Modal</div> : null,
}));

import { useLeaguesList } from "../../../src/hooks/useLeaguesList";
import { usePremiumLimits } from "../../../src/hooks/usePremiumLimits";

describe("Leagues Page", () => {
  const mockLeagues: LeagueListItem[] = [
    {
      id: "league-1",
      name: "Active League 1",
      status: "active",
      creator_user_id: "user-1",
      creator_anonymous_user_id: null,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-20T00:00:00Z",
      member_count: 5,
      event_count: 2,
    },
    {
      id: "league-2",
      name: "Active League 2",
      status: "active",
      creator_user_id: "user-1",
      creator_anonymous_user_id: null,
      createdAt: "2024-01-05T00:00:00Z",
      updatedAt: "2024-01-18T00:00:00Z",
      member_count: 8,
      event_count: 3,
    },
    {
      id: "league-3",
      name: "Finished League",
      status: "finished",
      creator_user_id: "user-1",
      creator_anonymous_user_id: null,
      createdAt: "2023-12-01T00:00:00Z",
      updatedAt: "2023-12-31T00:00:00Z",
      member_count: 10,
      event_count: 5,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Default to premium user — la création de ligue est réservée Premium.
    vi.mocked(usePremiumLimits).mockReturnValue({
      canCreateLeague: true,
      canCreateEvent: true,
      leagueCount: 0,
      eventCount: 0,
      limits: { leagues: Infinity, events: Infinity },
      isPremium: true,
      isAtLeagueLimit: false,
      isAtEventLimit: false,
      isPremiumLoading: false,
      refetchPremium: vi.fn(),
    });
  });

  describe("Loading State", () => {
    it("should display loading spinner when loading", () => {
      vi.mocked(useLeaguesList).mockReturnValue({
        leagues: [],
        isLoading: true,
      });

      render(
        <BrowserRouter>
          <Leagues />
        </BrowserRouter>,
      );

      expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should display empty state when no leagues", () => {
      vi.mocked(useLeaguesList).mockReturnValue({
        leagues: [],
        isLoading: false,
      });

      render(
        <BrowserRouter>
          <Leagues />
        </BrowserRouter>,
      );

      expect(screen.getByText("🏅")).toBeInTheDocument();
      expect(screen.getByText("Aucune league")).toBeInTheDocument();
      expect(
        screen.getByText(/Créez votre première league/),
      ).toBeInTheDocument();
    });

    it("should show create button in empty state", () => {
      vi.mocked(useLeaguesList).mockReturnValue({
        leagues: [],
        isLoading: false,
      });

      render(
        <BrowserRouter>
          <Leagues />
        </BrowserRouter>,
      );

      expect(screen.getByText("Créer une league")).toBeInTheDocument();
    });

    it("should navigate to create-league when clicking create button", () => {
      vi.mocked(useLeaguesList).mockReturnValue({
        leagues: [],
        isLoading: false,
      });

      render(
        <BrowserRouter>
          <Leagues />
        </BrowserRouter>,
      );

      const createButton = screen.getByText("Créer une league");
      fireEvent.click(createButton);

      expect(mockNavigate).toHaveBeenCalledWith("/create-league");
    });

    it("should show payment modal for non-premium users in empty state", () => {
      vi.mocked(useLeaguesList).mockReturnValue({
        leagues: [],
        isLoading: false,
      });

      vi.mocked(usePremiumLimits).mockReturnValue({
        canCreateLeague: false,
        canCreateEvent: true,
        leagueCount: 0,
        eventCount: 0,
        limits: { leagues: 0, events: 2 },
        isPremium: false,
        isAtLeagueLimit: true,
        isAtEventLimit: false,
        isPremiumLoading: false,
        refetchPremium: vi.fn(),
      });

      render(
        <BrowserRouter>
          <Leagues />
        </BrowserRouter>,
      );

      const createButton = screen.getByText("Créer une league");
      fireEvent.click(createButton);

      expect(screen.getByTestId("payment-modal")).toBeInTheDocument();
    });
  });

  describe("League List", () => {
    beforeEach(() => {
      vi.mocked(useLeaguesList).mockReturnValue({
        leagues: mockLeagues,
        isLoading: false,
      });
    });

    it("should render all leagues", () => {
      render(
        <BrowserRouter>
          <Leagues />
        </BrowserRouter>,
      );

      expect(screen.getByText("Active League 1")).toBeInTheDocument();
      expect(screen.getByText("Active League 2")).toBeInTheDocument();
      expect(screen.getByText("Finished League")).toBeInTheDocument();
    });

    it("should display page header", () => {
      render(
        <BrowserRouter>
          <Leagues />
        </BrowserRouter>,
      );

      expect(screen.getByText("Mes Ligues")).toBeInTheDocument();
    });

    it("should display search bar", () => {
      render(
        <BrowserRouter>
          <Leagues />
        </BrowserRouter>,
      );

      expect(
        screen.getByPlaceholderText("Rechercher une league..."),
      ).toBeInTheDocument();
    });

    it("should display filter tabs", () => {
      render(
        <BrowserRouter>
          <Leagues />
        </BrowserRouter>,
      );

      expect(screen.getByText("Tous")).toBeInTheDocument();
      expect(screen.getByText("Actifs")).toBeInTheDocument();
      expect(screen.getByText("Terminés")).toBeInTheDocument();
    });
  });

  describe("Filtering", () => {
    beforeEach(() => {
      vi.mocked(useLeaguesList).mockReturnValue({
        leagues: mockLeagues,
        isLoading: false,
      });
    });

    it('should filter active leagues when "Actifs" tab is clicked', () => {
      render(
        <BrowserRouter>
          <Leagues />
        </BrowserRouter>,
      );

      const activeTab = screen.getByText("Actifs");
      fireEvent.click(activeTab);

      expect(screen.getByText("Active League 1")).toBeInTheDocument();
      expect(screen.getByText("Active League 2")).toBeInTheDocument();
      expect(screen.queryByText("Finished League")).not.toBeInTheDocument();
    });

    it('should filter finished leagues when "Terminés" tab is clicked', () => {
      render(
        <BrowserRouter>
          <Leagues />
        </BrowserRouter>,
      );

      const finishedTab = screen.getByText("Terminés");
      fireEvent.click(finishedTab);

      expect(screen.queryByText("Active League 1")).not.toBeInTheDocument();
      expect(screen.queryByText("Active League 2")).not.toBeInTheDocument();
      expect(screen.getByText("Finished League")).toBeInTheDocument();
    });

    it('should show all leagues when "Tous" tab is clicked', () => {
      render(
        <BrowserRouter>
          <Leagues />
        </BrowserRouter>,
      );

      // First filter to active
      const activeTab = screen.getByText("Actifs");
      fireEvent.click(activeTab);

      // Then back to all
      const allTab = screen.getByText("Tous");
      fireEvent.click(allTab);

      expect(screen.getByText("Active League 1")).toBeInTheDocument();
      expect(screen.getByText("Active League 2")).toBeInTheDocument();
      expect(screen.getByText("Finished League")).toBeInTheDocument();
    });
  });

  describe("Search", () => {
    beforeEach(() => {
      vi.mocked(useLeaguesList).mockReturnValue({
        leagues: mockLeagues,
        isLoading: false,
      });
    });

    it("should filter leagues by search query", async () => {
      render(
        <BrowserRouter>
          <Leagues />
        </BrowserRouter>,
      );

      const searchInput = screen.getByPlaceholderText(
        "Rechercher une league...",
      );
      fireEvent.change(searchInput, { target: { value: "Active League 1" } });

      // Wait for debounce
      await waitFor(
        () => {
          expect(screen.getByText("Active League 1")).toBeInTheDocument();
          expect(screen.queryByText("Active League 2")).not.toBeInTheDocument();
          expect(screen.queryByText("Finished League")).not.toBeInTheDocument();
        },
        { timeout: 400 },
      );
    });

    it("should be case-insensitive", async () => {
      render(
        <BrowserRouter>
          <Leagues />
        </BrowserRouter>,
      );

      const searchInput = screen.getByPlaceholderText(
        "Rechercher une league...",
      );
      fireEvent.change(searchInput, { target: { value: "finished" } });

      // Wait for debounce
      await waitFor(
        () => {
          expect(screen.queryByText("Active League 1")).not.toBeInTheDocument();
          expect(screen.queryByText("Active League 2")).not.toBeInTheDocument();
          expect(screen.getByText("Finished League")).toBeInTheDocument();
        },
        { timeout: 400 },
      );
    });

    it('should show "Aucun résultat" when no matches', async () => {
      render(
        <BrowserRouter>
          <Leagues />
        </BrowserRouter>,
      );

      const searchInput = screen.getByPlaceholderText(
        "Rechercher une league...",
      );
      fireEvent.change(searchInput, { target: { value: "nonexistent" } });

      // Wait for debounce
      await waitFor(
        () => {
          expect(screen.getByText("Aucun résultat")).toBeInTheDocument();
        },
        { timeout: 400 },
      );
    });

    it("should combine filter and search", async () => {
      render(
        <BrowserRouter>
          <Leagues />
        </BrowserRouter>,
      );

      // Click active filter
      const activeTab = screen.getByText("Actifs");
      fireEvent.click(activeTab);

      // Search within active leagues
      const searchInput = screen.getByPlaceholderText(
        "Rechercher une league...",
      );
      fireEvent.change(searchInput, { target: { value: "League 2" } });

      // Wait for debounce
      await waitFor(
        () => {
          expect(screen.queryByText("Active League 1")).not.toBeInTheDocument();
          expect(screen.getByText("Active League 2")).toBeInTheDocument();
          expect(screen.queryByText("Finished League")).not.toBeInTheDocument();
        },
        { timeout: 400 },
      );
    });
  });

  describe("Create League Action", () => {
    beforeEach(() => {
      vi.mocked(useLeaguesList).mockReturnValue({
        leagues: mockLeagues,
        isLoading: false,
      });
    });

    it("should expose a floating create-league button (FAB)", () => {
      render(
        <BrowserRouter>
          <Leagues />
        </BrowserRouter>,
      );

      expect(
        screen.getByRole("button", { name: /créer une league/i }),
      ).toBeInTheDocument();
    });

    it("should navigate to create-league when clicking create button", () => {
      render(
        <BrowserRouter>
          <Leagues />
        </BrowserRouter>,
      );

      const fab = screen.getByRole("button", { name: /créer une league/i });
      fireEvent.click(fab);

      expect(mockNavigate).toHaveBeenCalledWith("/create-league");
    });

    it("should show payment modal for non-premium users", () => {
      vi.mocked(usePremiumLimits).mockReturnValue({
        canCreateLeague: false,
        canCreateEvent: true,
        leagueCount: 0,
        eventCount: 0,
        limits: { leagues: 0, events: 2 },
        isPremium: false,
        isAtLeagueLimit: true,
        isAtEventLimit: false,
        isPremiumLoading: false,
        refetchPremium: vi.fn(),
      });

      render(
        <BrowserRouter>
          <Leagues />
        </BrowserRouter>,
      );

      const fab = screen.getByRole("button", { name: /créer une league/i });
      fireEvent.click(fab);

      expect(screen.getByTestId("payment-modal")).toBeInTheDocument();
    });

    it("should expose Premium-required signal on create button for non-premium users", () => {
      vi.mocked(usePremiumLimits).mockReturnValue({
        canCreateLeague: false,
        canCreateEvent: true,
        leagueCount: 0,
        eventCount: 0,
        limits: { leagues: 0, events: 2 },
        isPremium: false,
        isAtLeagueLimit: true,
        isAtEventLimit: false,
        isPremiumLoading: false,
        refetchPremium: vi.fn(),
      });

      render(
        <BrowserRouter>
          <Leagues />
        </BrowserRouter>,
      );

      // Lock icon dans la CTA du header (aria-label "Premium")
      expect(screen.getAllByLabelText(/premium/i).length).toBeGreaterThan(0);
    });
  });

  describe("Premium User", () => {
    beforeEach(() => {
      vi.mocked(useLeaguesList).mockReturnValue({
        leagues: mockLeagues,
        isLoading: false,
      });

      vi.mocked(usePremiumLimits).mockReturnValue({
        canCreateLeague: true,
        canCreateEvent: true,
        leagueCount: 5,
        eventCount: 10,
        limits: { leagues: Infinity, events: Infinity },
        isPremium: true,
        isAtLeagueLimit: false,
        isAtEventLimit: false,
        isPremiumLoading: false,
        refetchPremium: vi.fn(),
      });
    });

    it("should NOT show Premium-required signal for premium users", () => {
      render(
        <BrowserRouter>
          <Leagues />
        </BrowserRouter>,
      );

      expect(screen.queryByLabelText(/premium requis/i)).not.toBeInTheDocument();
    });

    it("should allow creating leagues without showing payment modal", () => {
      render(
        <BrowserRouter>
          <Leagues />
        </BrowserRouter>,
      );

      const fab = screen.getByRole("button", { name: /créer une league/i });
      fireEvent.click(fab);

      expect(mockNavigate).toHaveBeenCalledWith("/create-league");
      expect(screen.queryByTestId("payment-modal")).not.toBeInTheDocument();
    });
  });
});
