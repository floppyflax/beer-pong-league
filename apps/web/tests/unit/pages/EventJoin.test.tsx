import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { EventJoin } from "../../../src/pages/EventJoin";
import "@testing-library/jest-dom";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: "test-event-id" }),
  };
});

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn(), loading: vi.fn(), dismiss: vi.fn() },
}));

// ---- Context mocks ----
const mockAddAnonymousPlayerToEvent = vi.fn().mockResolvedValue("new-player-id");
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
};
let mockLeagueCtx: Record<string, unknown> = {};
vi.mock("../../../src/context/LeagueContext", () => ({
  useLeague: () => mockLeagueCtx,
  LeagueProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

let mockAuthCtx: Record<string, unknown> = {};
vi.mock("../../../src/context/AuthContext", () => ({
  useAuthContext: () => mockAuthCtx,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockInitAnon = vi
  .fn()
  .mockResolvedValue({ anonymousUserId: "anon-1", pseudo: "Joueur" });
let mockIdentityCtx: Record<string, unknown> = {};
vi.mock("../../../src/context/IdentityContext", () => ({
  useIdentityContext: () => mockIdentityCtx,
  IdentityProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ---- Hook + service mocks ----
interface MockGuest {
  playerId: string;
  anonymousUserId: string;
  pseudo: string;
  joinedAt: string;
  archived: boolean;
}
let mockGuests: MockGuest[] = [];
vi.mock("../../../src/hooks/useUnclaimedGuests", () => ({
  useUnclaimedGuests: () => ({
    guests: mockGuests,
    isLoading: false,
    error: null,
    refresh: vi.fn(),
  }),
}));

const { mockClaimAnon, mockClaimAuth, mockClaimById, mockRename, mockOwnsPlayer } =
  vi.hoisted(() => ({
    mockClaimAnon: vi.fn().mockResolvedValue({ success: true }),
    mockClaimAuth: vi.fn().mockResolvedValue({ success: true }),
    mockClaimById: vi.fn().mockResolvedValue({ success: true }),
    mockRename: vi.fn().mockResolvedValue({ success: true }),
    mockOwnsPlayer: vi.fn().mockResolvedValue(false),
  }));
vi.mock("../../../src/services/IdentityMergeService", () => ({
  identityMergeService: {
    claimAnonymousPlayer: mockClaimAuth,
    claimAnonymousPlayerAsAnonymous: mockClaimAnon,
    claimPlayerById: mockClaimById,
    renameAnonymousPlayer: mockRename,
    userOwnsPlayer: mockOwnsPlayer,
  },
}));

vi.mock("../../../src/services/DatabaseService", () => ({
  databaseService: { loadEventById: vi.fn().mockResolvedValue(null) },
}));

// EventCard rank hook — keep the test free of QueryClient plumbing.
vi.mock("../../../src/hooks/useMyContextRankings", () => ({
  useMyEventRank: () => null,
  useMyLeagueRank: () => null,
  useMyContextRankings: () => ({ leagueRanks: new Map(), eventRanks: new Map() }),
  computeContextRank: () => null,
}));

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

const renderPage = () => render(<EventJoin />, { wrapper: Wrapper });

describe("EventJoin — step flow (gate → claim → name)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGuests = [];
    mockLeagueCtx = {
      events: [mockEvent],
      leagues: [],
      addAnonymousPlayerToEvent: mockAddAnonymousPlayerToEvent,
      isLoadingInitialData: false,
      reloadData: mockReloadData,
    };
    mockAuthCtx = { user: null, isAuthenticated: false };
    mockIdentityCtx = { localUser: null, initializeAnonymousUser: mockInitAnon };
    mockOwnsPlayer.mockResolvedValue(false);
  });

  it("renders the event and shows the identity gate first", () => {
    renderPage();
    expect(screen.getAllByText("Test Event").length).toBeGreaterThan(0);
    // Gate offers the no-account path before any name input.
    expect(screen.getByText(/jouer sans compte/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/nom du joueur/i)).not.toBeInTheDocument();
  });

  it("no participants: gate → name (create) → join", async () => {
    renderPage();

    fireEvent.click(screen.getByText(/jouer sans compte/i));
    await waitFor(() => expect(mockInitAnon).toHaveBeenCalled());

    // No guests → goes straight to the create-name sheet.
    await waitFor(() =>
      expect(screen.getByText(/choisis ton pseudo/i)).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByLabelText(/nom du joueur/i), {
      target: { value: "Bob" },
    });
    fireEvent.click(screen.getByRole("button", { name: /rejoindre/i }));

    await waitFor(() =>
      expect(mockAddAnonymousPlayerToEvent).toHaveBeenCalledWith(
        "test-event-id",
        "Bob",
      ),
    );
    expect(mockNavigate).toHaveBeenCalledWith("/event/test-event-id");
  });

  it("with participants: gate → claim → keep name → join (no rename)", async () => {
    mockGuests = [
      { playerId: "m1", anonymousUserId: "p1", pseudo: "Alice", joinedAt: "", archived: false },
    ];
    renderPage();

    fireEvent.click(screen.getByText(/jouer sans compte/i));

    // Participants modal first.
    await waitFor(() =>
      expect(screen.getByText(/êtes-vous une de ces personnes/i)).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: /c'est moi/i }));

    await waitFor(() =>
      expect(mockClaimAnon).toHaveBeenCalledWith("event", "m1", "anon-1"),
    );

    // Confirm-name step prefilled with the claimed pseudo; keep as-is.
    await waitFor(() =>
      expect(screen.getByText(/garde ou modifie ton nom/i)).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: /c'est parti/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/event/test-event-id"));
    expect(mockRename).not.toHaveBeenCalled();
  });

  it("with participants: claim → modify name → rename called", async () => {
    mockGuests = [
      { playerId: "m1", anonymousUserId: "p1", pseudo: "Alice", joinedAt: "", archived: false },
    ];
    renderPage();

    fireEvent.click(screen.getByText(/jouer sans compte/i));
    await waitFor(() =>
      expect(screen.getByText(/êtes-vous une de ces personnes/i)).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: /c'est moi/i }));

    await waitFor(() =>
      expect(screen.getByLabelText(/nom du joueur/i)).toBeInTheDocument(),
    );
    fireEvent.change(screen.getByLabelText(/nom du joueur/i), {
      target: { value: "Alex" },
    });
    fireEvent.click(screen.getByRole("button", { name: /c'est parti/i }));

    await waitFor(() =>
      expect(mockRename).toHaveBeenCalledWith("event", "m1", "Alex"),
    );
    expect(mockNavigate).toHaveBeenCalledWith("/event/test-event-id");
  });

  it("identified user with an existing player joins directly (no create step)", async () => {
    mockIdentityCtx = {
      localUser: { anonymousUserId: "anon-1", pseudo: "Bob" },
      initializeAnonymousUser: mockInitAnon,
    };
    mockOwnsPlayer.mockResolvedValue(true);
    mockGuests = [];

    renderPage();

    // Gate offers "Continuer en tant que Bob" — pick it.
    fireEvent.click(screen.getByRole("button", { name: /continuer en tant que/i }));

    // Joins with the existing player — no "choisis ton pseudo" step.
    await waitFor(() =>
      expect(mockAddAnonymousPlayerToEvent).toHaveBeenCalledWith(
        "test-event-id",
        "Bob",
      ),
    );
    expect(mockNavigate).toHaveBeenCalledWith("/event/test-event-id");
    expect(screen.queryByText(/choisis ton pseudo/i)).not.toBeInTheDocument();
  });

  it("\"not in the list\" goes to the create-name step", async () => {
    mockGuests = [
      { playerId: "m1", anonymousUserId: "p1", pseudo: "Alice", joinedAt: "", archived: false },
    ];
    renderPage();

    fireEvent.click(screen.getByText(/jouer sans compte/i));
    await waitFor(() =>
      expect(screen.getByText(/êtes-vous une de ces personnes/i)).toBeInTheDocument(),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /je ne suis pas dans la liste/i }),
    );

    await waitFor(() =>
      expect(screen.getByText(/choisis ton pseudo/i)).toBeInTheDocument(),
    );
    expect(mockClaimAnon).not.toHaveBeenCalled();
  });
});
