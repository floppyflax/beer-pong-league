import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { Events } from "../../../src/pages/Events";
import * as UseEventsList from "../../../src/hooks/useEventsList";
import * as UsePremiumLimits from "../../../src/hooks/usePremiumLimits";
import type { Event } from "../../../src/types";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../../src/hooks/useEventsList");
vi.mock("../../../src/hooks/usePremiumLimits");
const mockReloadData = vi.fn();
vi.mock("../../../src/context/LeagueContext", () => ({
  useLeague: () => ({ reloadData: mockReloadData }),
}));

// Mock child components to simplify testing
vi.mock("../../../src/components/events/EventCard", () => ({
  EventCard: ({ event }: { event: Event }) => (
    <div data-testid={`event-card-${event.id}`}>
      {event.name}
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

describe("Events Page", () => {
  const mockEvents: Event[] = [
    {
      id: "t1",
      name: "Active Event 1",
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
      name: "Active Event 2",
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
      name: "Finished Event",
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

    // Default mock: User can create events (not at limit)
    vi.spyOn(UsePremiumLimits, "usePremiumLimits").mockReturnValue({
      canCreateEvent: true,
      canCreateLeague: true,
      eventCount: 1,
      leagueCount: 0,
      limits: { events: 2, leagues: 1 },
      isPremium: false,
      isAtEventLimit: false,
      isAtLeagueLimit: false,
      refetchPremium: vi.fn(),
    });
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  describe("Error State (H1)", () => {
    it("should show error banner and retry button when load fails", () => {
      vi.spyOn(UseEventsList, "useEventsList").mockReturnValue({
        events: [],
        isLoading: false,
        loadError: "Erreur réseau",
      });

      renderWithRouter(<Events />);

      expect(screen.getByRole("alert")).toHaveTextContent("Erreur réseau");
      const retryButton = screen.getByRole("button", { name: /Réessayer/i });
      expect(retryButton).toBeInTheDocument();

      fireEvent.click(retryButton);
      expect(mockReloadData).toHaveBeenCalled();
    });
  });

  describe("Loading State", () => {
    it("should show loading spinner while data is loading", () => {
      vi.spyOn(UseEventsList, "useEventsList").mockReturnValue({
        events: [],
        isLoading: true,
      });

      renderWithRouter(<Events />);
      expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should show empty state when no events", () => {
      vi.spyOn(UseEventsList, "useEventsList").mockReturnValue({
        events: [],
        isLoading: false,
      });

      renderWithRouter(<Events />);

      expect(screen.getByText("Aucun événement")).toBeInTheDocument();
      expect(
        screen.getByText(/Rejoignez votre premier événement/i),
      ).toBeInTheDocument();
    });

    it("should show action buttons in empty state", () => {
      vi.spyOn(UseEventsList, "useEventsList").mockReturnValue({
        events: [],
        isLoading: false,
      });

      renderWithRouter(<Events />);

      expect(screen.getByText("Rejoindre un événement")).toBeInTheDocument();
      expect(screen.getByText("Créer un événement")).toBeInTheDocument();
    });

    it('should navigate to /join when clicking "Rejoindre"', () => {
      vi.spyOn(UseEventsList, "useEventsList").mockReturnValue({
        events: [],
        isLoading: false,
      });

      renderWithRouter(<Events />);

      const joinButton = screen.getByText("Rejoindre un événement");
      fireEvent.click(joinButton);

      expect(mockNavigate).toHaveBeenCalledWith("/join");
    });

    it('should navigate to /create-event when clicking "Créer" (if allowed)', () => {
      vi.spyOn(UseEventsList, "useEventsList").mockReturnValue({
        events: [],
        isLoading: false,
      });

      renderWithRouter(<Events />);

      const createButton = screen.getByText("Créer un événement");
      fireEvent.click(createButton);

      expect(mockNavigate).toHaveBeenCalledWith("/create-event");
    });
  });

  describe("Event List", () => {
    it("should render list of events", () => {
      vi.spyOn(UseEventsList, "useEventsList").mockReturnValue({
        events: mockEvents,
        isLoading: false,
      });

      renderWithRouter(<Events />);

      expect(screen.getByTestId("event-card-t1")).toBeInTheDocument();
      expect(screen.getByTestId("event-card-t2")).toBeInTheDocument();
      expect(screen.getByTestId("event-card-t3")).toBeInTheDocument();
    });

    it("should show page header", () => {
      vi.spyOn(UseEventsList, "useEventsList").mockReturnValue({
        events: mockEvents,
        isLoading: false,
      });

      renderWithRouter(<Events />);

      expect(screen.getByText("Mes Événements")).toBeInTheDocument();
    });
  });

  describe("Search Functionality", () => {
    it("should show search input", () => {
      vi.spyOn(UseEventsList, "useEventsList").mockReturnValue({
        events: mockEvents,
        isLoading: false,
      });

      renderWithRouter(<Events />);

      expect(
        screen.getByPlaceholderText("Rechercher un événement..."),
      ).toBeInTheDocument();
    });

    it("should filter events by name (case-insensitive)", async () => {
      vi.spyOn(UseEventsList, "useEventsList").mockReturnValue({
        events: mockEvents,
        isLoading: false,
      });

      renderWithRouter(<Events />);

      const searchInput = screen.getByPlaceholderText(
        "Rechercher un événement...",
      );
      fireEvent.change(searchInput, { target: { value: "finished" } });

      await waitFor(() => {
        expect(screen.getByTestId("event-card-t3")).toBeInTheDocument();
        expect(
          screen.queryByTestId("event-card-t1"),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByTestId("event-card-t2"),
        ).not.toBeInTheDocument();
      });
    });

    it('should show "Aucun résultat" when no match', async () => {
      vi.spyOn(UseEventsList, "useEventsList").mockReturnValue({
        events: mockEvents,
        isLoading: false,
      });

      renderWithRouter(<Events />);

      const searchInput = screen.getByPlaceholderText(
        "Rechercher un événement...",
      );
      fireEvent.change(searchInput, {
        target: { value: "NonExistentEvent" },
      });

      await waitFor(() => {
        expect(screen.getByText("Aucun résultat")).toBeInTheDocument();
      });
    });

    it("should debounce search by 300ms (AC2, M2)", async () => {
      vi.useFakeTimers();
      vi.spyOn(UseEventsList, "useEventsList").mockReturnValue({
        events: mockEvents,
        isLoading: false,
      });

      renderWithRouter(<Events />);

      const searchInput = screen.getByPlaceholderText(
        "Rechercher un événement...",
      );

      // Type "finished" - filter should NOT apply immediately
      fireEvent.change(searchInput, { target: { value: "finished" } });

      // Before 300ms: all 3 cards still visible (parent searchQuery not yet updated)
      act(() => {
        vi.advanceTimersByTime(299);
      });
      expect(screen.getByTestId("event-card-t1")).toBeInTheDocument();
      expect(screen.getByTestId("event-card-t2")).toBeInTheDocument();
      expect(screen.getByTestId("event-card-t3")).toBeInTheDocument();

      // After 300ms: debounce fires, only t3 visible
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(screen.queryByTestId("event-card-t1")).not.toBeInTheDocument();
      expect(screen.queryByTestId("event-card-t2")).not.toBeInTheDocument();
      expect(screen.getByTestId("event-card-t3")).toBeInTheDocument();

      vi.useRealTimers();
    });
  });

  describe("Filter Tabs", () => {
    it("should show filter tabs", () => {
      vi.spyOn(UseEventsList, "useEventsList").mockReturnValue({
        events: mockEvents,
        isLoading: false,
      });

      renderWithRouter(<Events />);

      expect(screen.getByText("Tous")).toBeInTheDocument();
      expect(screen.getByText("Actifs")).toBeInTheDocument();
      expect(screen.getByText("Terminés")).toBeInTheDocument();
    });

    it('should filter active events when "Actifs" is clicked', async () => {
      vi.spyOn(UseEventsList, "useEventsList").mockReturnValue({
        events: mockEvents,
        isLoading: false,
      });

      renderWithRouter(<Events />);

      const actifTab = screen.getByText("Actifs");
      fireEvent.click(actifTab);

      await waitFor(() => {
        expect(screen.getByTestId("event-card-t1")).toBeInTheDocument();
        expect(screen.getByTestId("event-card-t2")).toBeInTheDocument();
        expect(
          screen.queryByTestId("event-card-t3"),
        ).not.toBeInTheDocument();
      });
    });

    it('should filter finished events when "Terminés" is clicked', async () => {
      vi.spyOn(UseEventsList, "useEventsList").mockReturnValue({
        events: mockEvents,
        isLoading: false,
      });

      renderWithRouter(<Events />);

      const finishedTab = screen.getByText("Terminés");
      fireEvent.click(finishedTab);

      await waitFor(() => {
        expect(screen.getByTestId("event-card-t3")).toBeInTheDocument();
        expect(
          screen.queryByTestId("event-card-t1"),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByTestId("event-card-t2"),
        ).not.toBeInTheDocument();
      });
    });

    it('should show all events when "Tous" is clicked', async () => {
      vi.spyOn(UseEventsList, "useEventsList").mockReturnValue({
        events: mockEvents,
        isLoading: false,
      });

      renderWithRouter(<Events />);

      // First click "Actifs" to change filter
      fireEvent.click(screen.getByText("Actifs"));

      // Then click "Tous"
      fireEvent.click(screen.getByText("Tous"));

      await waitFor(() => {
        expect(screen.getByTestId("event-card-t1")).toBeInTheDocument();
        expect(screen.getByTestId("event-card-t2")).toBeInTheDocument();
        expect(screen.getByTestId("event-card-t3")).toBeInTheDocument();
      });
    });
  });

  describe("Create Event Action", () => {
    it("should navigate to /create-event when FAB is clicked and user can create", () => {
      vi.spyOn(UseEventsList, "useEventsList").mockReturnValue({
        events: mockEvents,
        isLoading: false,
      });

      renderWithRouter(<Events />);

      const fab = screen.getByTestId("fab");
      fireEvent.click(fab);

      expect(mockNavigate).toHaveBeenCalledWith("/create-event");
    });

    it("should show payment modal when FAB clicked and user is at event limit", async () => {
      vi.spyOn(UseEventsList, "useEventsList").mockReturnValue({
        events: mockEvents,
        isLoading: false,
      });

      vi.spyOn(UsePremiumLimits, "usePremiumLimits").mockReturnValue({
        canCreateEvent: false,
        canCreateLeague: true,
        eventCount: 2,
        leagueCount: 0,
        limits: { events: 2, leagues: 1 },
        isPremium: false,
        isAtEventLimit: true,
        isAtLeagueLimit: false,
        refetchPremium: vi.fn(),
      });

      renderWithRouter(<Events />);

      const fab = screen.getByTestId("fab");
      fireEvent.click(fab);

      await waitFor(() => {
        expect(screen.getByTestId("payment-modal")).toBeInTheDocument();
      });
    });

    it("should show lock icon on header create button when at limit (desktop)", () => {
      vi.spyOn(UseEventsList, "useEventsList").mockReturnValue({
        events: mockEvents,
        isLoading: false,
      });

      vi.spyOn(UsePremiumLimits, "usePremiumLimits").mockReturnValue({
        canCreateEvent: false,
        canCreateLeague: true,
        eventCount: 2,
        leagueCount: 0,
        limits: { events: 2, leagues: 1 },
        isPremium: false,
        isAtEventLimit: true,
        isAtLeagueLimit: false,
        refetchPremium: vi.fn(),
      });

      renderWithRouter(<Events />);

      // ContextualHeader shows lock on desktop action when at limit
      expect(screen.getAllByText("🔒").length).toBeGreaterThan(0);
    });
  });

  describe("Design System (Story 14-12)", () => {
    it("should render FAB and header create action for responsive design (M3)", () => {
      vi.spyOn(UseEventsList, "useEventsList").mockReturnValue({
        events: mockEvents,
        isLoading: false,
      });

      renderWithRouter(<Events />);

      // FAB: primary create action on mobile (design system 2.4)
      expect(screen.getByTestId("fab")).toBeInTheDocument();
      // Header: create action for desktop (hidden on mobile via lg:flex)
      expect(
        screen.getByRole("button", { name: /CRÉER ÉVÉNEMENT/i }),
      ).toBeInTheDocument();
    });

    it("should render FAB for create event", () => {
      vi.spyOn(UseEventsList, "useEventsList").mockReturnValue({
        events: mockEvents,
        isLoading: false,
      });

      renderWithRouter(<Events />);

      expect(screen.getByTestId("fab")).toBeInTheDocument();
    });

    it("should render SearchBar with placeholder", () => {
      vi.spyOn(UseEventsList, "useEventsList").mockReturnValue({
        events: mockEvents,
        isLoading: false,
      });

      renderWithRouter(<Events />);

      expect(
        screen.getByPlaceholderText("Rechercher un événement..."),
      ).toBeInTheDocument();
      expect(screen.getByRole("searchbox")).toBeInTheDocument();
    });

    it("should render SegmentedTabs (Tous, Actifs, Terminés)", () => {
      vi.spyOn(UseEventsList, "useEventsList").mockReturnValue({
        events: mockEvents,
        isLoading: false,
      });

      renderWithRouter(<Events />);

      expect(screen.getByRole("tablist")).toBeInTheDocument();
      expect(screen.getByText("Tous")).toBeInTheDocument();
      expect(screen.getByText("Actifs")).toBeInTheDocument();
      expect(screen.getByText("Terminés")).toBeInTheDocument();
    });
  });
});
