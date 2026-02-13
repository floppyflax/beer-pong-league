import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { TournamentJoin } from "../../../src/pages/TournamentJoin";
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
    useParams: () => ({ id: "test-tournament-id" }),
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
const mockAddPlayerToTournament = vi.fn();
const mockAddAnonymousPlayerToTournament = vi
  .fn()
  .mockResolvedValue("new-player-id");

vi.mock("../../../src/context/LeagueContext", () => ({
  useLeague: () => ({
    tournaments: [mockTournament],
    leagues: [],
    addPlayerToTournament: mockAddPlayerToTournament,
    addAnonymousPlayerToTournament: mockAddAnonymousPlayerToTournament,
    isLoadingInitialData: false,
  }),
  LeagueProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock tournament data
const mockTournament = {
  id: "test-tournament-id",
  name: "Test Tournament",
  date: new Date().toISOString(),
  leagueId: null,
  playerIds: [],
  matches: [],
  isFinished: false,
  format: "2v2" as const,
  creator_user_id: null,
  creator_anonymous_user_id: null,
};

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

describe("TournamentJoin - Story 4.1", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnsureIdentity.mockResolvedValue({
      type: "anonymous",
      anonymousUserId: "test-anon-id",
    });
  });

  describe("Task 1: Review TournamentJoin page (AC: Page opens)", () => {
    it("should render the page when tournament exists", async () => {
      render(<TournamentJoin />, { wrapper: Wrapper });

      // AC: Page opens and renders correctly (Story 14-15: design system alignment)
      expect(screen.getAllByText("Test Tournament").length).toBeGreaterThan(0);
      expect(screen.getByText(/comment ça marche \?/i)).toBeInTheDocument();
    });

    it("should load tournament data from URL parameter", () => {
      render(<TournamentJoin />, { wrapper: Wrapper });

      // AC: Tournament data is fetched (mock provides tournament for id from useParams)
      expect(screen.getAllByText("Test Tournament").length).toBeGreaterThan(0);
    });
  });

  describe("Task 2: Implement join form (AC: Enter name)", () => {
    it("should display simple name input form", async () => {
      render(<TournamentJoin />, { wrapper: Wrapper });

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
      render(<TournamentJoin />, { wrapper: Wrapper });

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
      const toast = await import("react-hot-toast");
      render(<TournamentJoin />, { wrapper: Wrapper });

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
      render(<TournamentJoin />, { wrapper: Wrapper });

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
        expect(screen.getByText(/4\/100 caractères/i)).toBeInTheDocument();
      });
    });

    it('should have large, clear "Join" button', async () => {
      render(<TournamentJoin />, { wrapper: Wrapper });

      // Click "Create new player" button
      const createButton = screen.getByRole("button", {
        name: /créer un nouveau joueur/i,
      });
      fireEvent.click(createButton);

      await waitFor(() => {
        const submitButton = screen.getByRole("button", { name: /rejoindre/i });
        expect(submitButton).toBeInTheDocument();
        // AC: Large, clear button (check for min-height class)
        expect(submitButton.className).toContain("min-h-[44px]");
      });
    });

    it("should be mobile-friendly with full-width inputs", async () => {
      render(<TournamentJoin />, { wrapper: Wrapper });

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

      render(<TournamentJoin />, { wrapper: Wrapper });

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

      render(<TournamentJoin />, { wrapper: Wrapper });

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

  describe("Task 4: Add player to tournament (AC: Added to tournament_players)", () => {
    it("should add player to tournament via addAnonymousPlayerToTournament", async () => {
      render(<TournamentJoin />, { wrapper: Wrapper });

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

      // AC: Add player to tournament_players
      await waitFor(
        () => {
          expect(mockAddAnonymousPlayerToTournament).toHaveBeenCalledWith(
            "test-tournament-id",
            "Test Player",
          );
        },
        { timeout: 3000 },
      );
    });
  });

  describe("Task 5: Optimize join flow for speed (AC: Join in < 30s)", () => {
    it("should minimize form fields (name only)", () => {
      render(<TournamentJoin />, { wrapper: Wrapper });

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

      render(<TournamentJoin />, { wrapper: Wrapper });

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
    it("should redirect to tournament dashboard after join", async () => {
      const toast = await import("react-hot-toast");

      render(<TournamentJoin />, { wrapper: Wrapper });

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

      // AC: Redirect to tournament dashboard
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          "/tournament/test-tournament-id",
        );
      });
    });

    it("should display success message with tournament name", async () => {
      const toast = await import("react-hot-toast");

      render(<TournamentJoin />, { wrapper: Wrapper });

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
          expect.stringContaining("Test Tournament"),
        );
      });
    });
  });
});

describe("TournamentJoin - Story 14-15 (Design system alignment)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnsureIdentity.mockResolvedValue({
      type: "anonymous",
      anonymousUserId: "test-anon-id",
    });
  });

  it("should use TournamentCard for tournament info", () => {
    render(<TournamentJoin />, { wrapper: Wrapper });

    expect(screen.getAllByText("Test Tournament").length).toBeGreaterThan(0);
    expect(screen.getByText(/actif/i)).toBeInTheDocument();
  });

  it("should display HelpCard with Comment ça marche block", () => {
    render(<TournamentJoin />, { wrapper: Wrapper });

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

  it("should have bottom nav padding for content clearance", () => {
    const { container } = render(<TournamentJoin />, { wrapper: Wrapper });

    const contentArea = container.querySelector(".pb-20");
    expect(contentArea).toBeInTheDocument();
  });
});
