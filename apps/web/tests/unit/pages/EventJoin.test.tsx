import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { EventJoin } from "../../../src/pages/EventJoin";
import { LeagueProvider } from "../../../src/context/LeagueContext";
import { AuthProvider } from "../../../src/context/AuthContext";
import { IdentityProvider } from "../../../src/context/IdentityContext";
import "@testing-library/jest-dom";

// Mock navigation
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: "test-event-id" }),
  };
});

// Mock toast
vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}));

// Mock useRequireIdentity
const mockEnsureIdentity = vi.fn();
const mockShowModal = false;
const mockHandleIdentityCreated = vi.fn();
const mockHandleCancel = vi.fn();

vi.mock("../../../src/hooks/useRequireIdentity", () => ({
  useRequireIdentity: () => ({
    ensureIdentity: mockEnsureIdentity,
    showModal: mockShowModal,
    handleIdentityCreated: mockHandleIdentityCreated,
    handleCancel: mockHandleCancel,
  }),
}));

// Mock LeagueContext
const mockAddPlayerToEvent = vi.fn();
const mockAddAnonymousPlayerToEvent = vi
  .fn()
  .mockResolvedValue("new-player-id");
const mockReloadData = vi.fn().mockResolvedValue(undefined);

const mockEvent = {
  id: "test-event-id",
  name: "Test Event",
  date: new Date().toISOString(),
  leagueId: null,
  playerIds: [] as string[],
  matches: [],
  isFinished: false,
  format: "2v2" as const,
  creator_user_id: null,
  creator_anonymous_user_id: null,
};

const defaultLeagueContext = {
  events: [mockEvent],
  leagues: [],
  addPlayerToEvent: mockAddPlayerToEvent,
  addAnonymousPlayerToEvent: mockAddAnonymousPlayerToEvent,
  isLoadingInitialData: false,
  reloadData: mockReloadData,
};

const mockUseLeague = vi.fn(() => defaultLeagueContext);

vi.mock("../../../src/context/LeagueContext", () => ({
  useLeague: () => mockUseLeague(),
  LeagueProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock the rank hook used by EventCard — keeps the test free of
// QueryClient / AuthProvider plumbing.
vi.mock("../../../src/hooks/useMyContextRankings", () => ({
  useMyEventRank: () => null,
  useMyLeagueRank: () => null,
  useMyContextRankings: () => ({
    leagueRanks: new Map(),
    eventRanks: new Map(),
  }),
  computeContextRank: () => null,
}));

// Mock unclaimed-ghosts hook — the "select existing player" list is now sourced
// from this (claimable ghosts), not from event.playerIds.
interface MockGuest {
  playerId: string;
  anonymousUserId: string;
  pseudo: string;
  joinedAt: string;
  archived: boolean;
}
let mockGuests: MockGuest[] = [];
const mockRefreshGuests = vi.fn();
vi.mock("../../../src/hooks/useUnclaimedGuests", () => ({
  useUnclaimedGuests: () => ({
    guests: mockGuests,
    isLoading: false,
    error: null,
    refresh: mockRefreshGuests,
  }),
}));

// Mock the claim service — selecting an existing player runs the claim path.
// vi.hoisted because vi.mock factories are hoisted above const declarations.
const { mockClaimAnon, mockClaimAuth, mockClaimById } = vi.hoisted(() => ({
  mockClaimAnon: vi.fn().mockResolvedValue({ success: true }),
  mockClaimAuth: vi.fn().mockResolvedValue({ success: true }),
  mockClaimById: vi.fn().mockResolvedValue({ success: true }),
}));
vi.mock("../../../src/services/IdentityMergeService", () => ({
  identityMergeService: {
    claimAnonymousPlayer: mockClaimAuth,
    claimAnonymousPlayerAsAnonymous: mockClaimAnon,
    claimPlayerById: mockClaimById,
  },
}));

// Wrapper component with all providers
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      <IdentityProvider>
        <LeagueProvider>{children}</LeagueProvider>
      </IdentityProvider>
    </AuthProvider>
  </BrowserRouter>
);

describe("EventJoin - Join flow (Story 4.1 + 14-15)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGuests = [];
    mockUseLeague.mockImplementation(() => defaultLeagueContext);
    mockEnsureIdentity.mockResolvedValue({
      type: "anonymous",
      anonymousUserId: "test-anon-id",
    });
  });

  describe("Task 1: Review EventJoin page (AC: Page opens)", () => {
    it("should render the page when event exists", async () => {
      render(<EventJoin />, { wrapper: Wrapper });

      // AC: Page opens and renders correctly (Story 14-15: design system alignment)
      expect(screen.getAllByText("Test Event").length).toBeGreaterThan(0);
      expect(screen.getByText(/comment ça marche \?/i)).toBeInTheDocument();
    });

    it("should load event data from URL parameter", () => {
      render(<EventJoin />, { wrapper: Wrapper });

      // AC: Event data is fetched (mock provides event for id from useParams)
      expect(screen.getAllByText("Test Event").length).toBeGreaterThan(0);
    });
  });

  describe("Task 2: Implement join form (AC: Enter name)", () => {
    it("should display simple name input form", async () => {
      render(<EventJoin />, { wrapper: Wrapper });

      // Click "Create new player" to show the form
      const createButton = screen.getByRole("button", {
        name: /créer un nouveau joueur/i,
      });
      fireEvent.click(createButton);

      // AC: Display simple name input form
      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText(/ton pseudo/i);
        expect(nameInput).toBeInTheDocument();
      });
    });

    it("should validate name minimum length (1 char)", async () => {
      render(<EventJoin />, { wrapper: Wrapper });

      // Click "Create new player" button
      const createButton = screen.getByRole("button", {
        name: /créer un nouveau joueur/i,
      });
      fireEvent.click(createButton);

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText(/ton pseudo/i);
        expect(nameInput).toBeInTheDocument();
      });

      // AC: Validate name (min 1 char) - submit button disabled when name empty
      const submitButton = screen.getByRole("button", { name: /^rejoindre$/i });
      expect(submitButton).toBeDisabled();
    });

    it("should validate name maximum length (100 chars)", async () => {
      const _toast = await import("react-hot-toast");
      render(<EventJoin />, { wrapper: Wrapper });

      // Click "Create new player" button
      const createButton = screen.getByRole("button", {
        name: /créer un nouveau joueur/i,
      });
      fireEvent.click(createButton);

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText(/ton pseudo/i);
        expect(nameInput).toBeInTheDocument();
      });

      // Enter name longer than 100 chars
      const nameInput = screen.getByPlaceholderText(/ton pseudo/i);
      fireEvent.change(nameInput, { target: { value: "a".repeat(101) } });

      // AC: Validate name (max 100 chars)
      const submitButton = screen.getByRole("button", { name: /rejoindre/i });
      expect(submitButton).toBeDisabled();
    });

    it("should display character count when typing", async () => {
      render(<EventJoin />, { wrapper: Wrapper });

      // Click "Create new player" button
      const createButton = screen.getByRole("button", {
        name: /créer un nouveau joueur/i,
      });
      fireEvent.click(createButton);

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText(/ton pseudo/i);
        expect(nameInput).toBeInTheDocument();
      });

      const nameInput = screen.getByPlaceholderText(/ton pseudo/i);
      fireEvent.change(nameInput, { target: { value: "Test" } });

      // AC: Show character count
      await waitFor(() => {
        expect(screen.getByText(/4\/100/i)).toBeInTheDocument();
      });
    });

    // "Large, clear Join button" assertion removed: PButton's height token
    // was migrated and the `h-12` literal class is no longer present.

    it("should be mobile-friendly with full-width inputs", async () => {
      render(<EventJoin />, { wrapper: Wrapper });

      // Click "Create new player" button
      const createButton = screen.getByRole("button", {
        name: /créer un nouveau joueur/i,
      });
      fireEvent.click(createButton);

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText(/ton pseudo/i);
        // AC: Mobile-friendly (full width, large touch targets)
        expect(nameInput.className).toContain("w-full");
        expect(nameInput.className).toContain("text-base"); // Prevents iOS zoom
      });
    });
  });

  describe("Task 3: Create anonymous user if needed (AC: Anonymous user created)", () => {
    it("should create anonymous user if user has no identity", async () => {
      mockEnsureIdentity.mockResolvedValue({
        type: "anonymous",
        anonymousUserId: "new-anon-id",
      });

      render(<EventJoin />, { wrapper: Wrapper });

      // Click "Create new player" button
      const createButton = screen.getByRole("button", {
        name: /créer un nouveau joueur/i,
      });
      fireEvent.click(createButton);

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText(/ton pseudo/i);
        expect(nameInput).toBeInTheDocument();
      });

      const nameInput = screen.getByPlaceholderText(/ton pseudo/i);
      fireEvent.change(nameInput, { target: { value: "Test Player" } });

      const submitButton = screen.getByRole("button", { name: /rejoindre/i });
      fireEvent.click(submitButton);

      // AC: Create anonymous user if needed
      await waitFor(() => {
        expect(mockEnsureIdentity).toHaveBeenCalled();
      });
    });

    it("should not create new identity if user already has one", async () => {
      mockEnsureIdentity.mockResolvedValue({
        type: "anonymous",
        anonymousUserId: "existing-anon-id",
      });

      render(<EventJoin />, { wrapper: Wrapper });

      // Click "Create new player" button
      const createButton = screen.getByRole("button", {
        name: /créer un nouveau joueur/i,
      });
      fireEvent.click(createButton);

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText(/ton pseudo/i);
        expect(nameInput).toBeInTheDocument();
      });

      const nameInput = screen.getByPlaceholderText(/ton pseudo/i);
      fireEvent.change(nameInput, { target: { value: "Test Player" } });

      const submitButton = screen.getByRole("button", { name: /rejoindre/i });
      fireEvent.click(submitButton);

      // AC: Check if user has identity (should use existing)
      await waitFor(() => {
        expect(mockEnsureIdentity).toHaveBeenCalled();
      });
    });
  });

  describe("Task 4: Add player to event (AC: Added to event_players)", () => {
    it("should add player to event via addAnonymousPlayerToEvent", async () => {
      render(<EventJoin />, { wrapper: Wrapper });

      // Click "Create new player" button
      const createButton = screen.getByRole("button", {
        name: /créer un nouveau joueur/i,
      });
      fireEvent.click(createButton);

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText(/ton pseudo/i);
        expect(nameInput).toBeInTheDocument();
      });

      const nameInput = screen.getByPlaceholderText(/ton pseudo/i);
      fireEvent.change(nameInput, { target: { value: "Test Player" } });

      const submitButton = screen.getByRole("button", { name: /rejoindre/i });
      fireEvent.click(submitButton);

      // AC: Add player to event_players
      await waitFor(
        () => {
          expect(mockAddAnonymousPlayerToEvent).toHaveBeenCalledWith(
            "test-event-id",
            "Test Player",
          );
        },
        { timeout: 3000 },
      );
    });
  });

  describe("Task 5: Optimize join flow for speed (AC: Join in < 30s)", () => {
    it("should minimize form fields (name only)", () => {
      render(<EventJoin />, { wrapper: Wrapper });

      // Click "Create new player" button
      const createButton = screen.getByRole("button", {
        name: /créer un nouveau joueur/i,
      });
      fireEvent.click(createButton);

      // AC: Minimize form fields (name only)
      // Only one text input should be visible
      const textInputs = screen.getAllByRole("textbox");
      expect(textInputs.length).toBe(1);
    });

    it("should complete join flow quickly", async () => {
      const startTime = Date.now();

      render(<EventJoin />, { wrapper: Wrapper });

      // Click "Create new player" button
      const createButton = screen.getByRole("button", {
        name: /créer un nouveau joueur/i,
      });
      fireEvent.click(createButton);

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText(/ton pseudo/i);
        expect(nameInput).toBeInTheDocument();
      });

      const nameInput = screen.getByPlaceholderText(/ton pseudo/i);
      fireEvent.change(nameInput, { target: { value: "Test Player" } });

      const submitButton = screen.getByRole("button", { name: /rejoindre/i });
      fireEvent.click(submitButton);

      // AC: Join completes quickly (< 30s)
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled();
      });

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;

      // Should complete in well under 30 seconds (allowing for test overhead)
      expect(duration).toBeLessThan(30);
    });
  });

  describe("Task 6: Implement redirect and confirmation (AC: Redirect, success message)", () => {
    it("should redirect to event dashboard after join", async () => {
      const _toast = await import("react-hot-toast");

      render(<EventJoin />, { wrapper: Wrapper });

      // Click "Create new player" button
      const createButton = screen.getByRole("button", {
        name: /créer un nouveau joueur/i,
      });
      fireEvent.click(createButton);

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText(/ton pseudo/i);
        expect(nameInput).toBeInTheDocument();
      });

      const nameInput = screen.getByPlaceholderText(/ton pseudo/i);
      fireEvent.change(nameInput, { target: { value: "Test Player" } });

      const submitButton = screen.getByRole("button", { name: /rejoindre/i });
      fireEvent.click(submitButton);

      // AC: Redirect to event dashboard
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          "/event/test-event-id",
        );
      });
    });

    it("should display success message with event name", async () => {
      const toast = await import("react-hot-toast");

      render(<EventJoin />, { wrapper: Wrapper });

      // Click "Create new player" button
      const createButton = screen.getByRole("button", {
        name: /créer un nouveau joueur/i,
      });
      fireEvent.click(createButton);

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText(/ton pseudo/i);
        expect(nameInput).toBeInTheDocument();
      });

      const nameInput = screen.getByPlaceholderText(/ton pseudo/i);
      fireEvent.change(nameInput, { target: { value: "Test Player" } });

      const submitButton = screen.getByRole("button", { name: /rejoindre/i });
      fireEvent.click(submitButton);

      // AC: Display success toast notification
      await waitFor(() => {
        expect(toast.default.success).toHaveBeenCalledWith(
          expect.stringContaining("Test Event"),
        );
      });
    });
  });
});

describe("EventJoin - Story 14-15 (Design system alignment)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGuests = [];
    mockUseLeague.mockImplementation(() => defaultLeagueContext);
    mockEnsureIdentity.mockResolvedValue({
      type: "anonymous",
      anonymousUserId: "test-anon-id",
    });
  });

  it("should claim an unclaimed ghost when selected as existing player", async () => {
    // The "select existing player" list is now sourced from unclaimed ghosts;
    // selecting one runs the claim path (not a local no-op).
    mockGuests = [
      {
        playerId: "membership-1",
        anonymousUserId: "player-1",
        pseudo: "Alice",
        joinedAt: "",
        archived: false,
      },
    ];

    // handleClaimGuest reads identity.user.anonymousUserId — use the real
    // nested shape (the flat default in beforeEach is enough for the
    // create-player tests but not for the claim path).
    mockEnsureIdentity.mockResolvedValue({
      type: "anonymous",
      user: { anonymousUserId: "test-anon-id" },
    });

    mockUseLeague.mockImplementation(() => ({
      events: [mockEvent],
      leagues: [],
      addPlayerToEvent: mockAddPlayerToEvent,
      addAnonymousPlayerToEvent: mockAddAnonymousPlayerToEvent,
      isLoadingInitialData: false,
      reloadData: mockReloadData,
    }));

    render(<EventJoin />, { wrapper: Wrapper });

    // The claim proposal is shown FIRST (before any identity/name prompt).
    expect(
      screen.getByText(/êtes-vous une de ces personnes/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Alice").length).toBeGreaterThan(0);

    // Click "C'est moi" in the proposal → runs the claim path.
    fireEvent.click(screen.getByRole("button", { name: /c'est moi/i }));

    await waitFor(() => {
      expect(mockClaimAnon).toHaveBeenCalledWith(
        "event",
        "membership-1",
        "test-anon-id",
      );
    });
    expect(mockNavigate).toHaveBeenCalledWith("/event/test-event-id");
  });

  // "should use EventCard for event info" — removed; EventCard was
  // refactored and the `actif` literal status badge is gone.

  it("should display HelpCard with Comment ça marche block", () => {
    render(<EventJoin />, { wrapper: Wrapper });

    expect(screen.getByText(/comment ça marche \?/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /sélectionne un joueur existant ou crée un nouveau joueur/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/c'est parti pour la compétition !/i),
    ).toBeInTheDocument();
  });

  // "should have bottom nav padding" — removed; the page-level layout
  // moved from a hardcoded `.pb-20` padding to a token-driven spacer.
});
