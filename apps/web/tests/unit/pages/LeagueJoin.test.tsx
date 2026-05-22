import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { LeagueJoin } from "../../../src/pages/LeagueJoin";
import "@testing-library/jest-dom";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: "test-league-id" }),
  };
});

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn(), loading: vi.fn(), dismiss: vi.fn() },
}));

const mockAddPlayer = vi.fn().mockResolvedValue(undefined);
const mockReloadData = vi.fn().mockResolvedValue(undefined);
const mockLeague = {
  id: "test-league-id",
  name: "Test League",
  type: "season" as const,
  createdAt: new Date().toISOString(),
  players: [] as Array<{ id: string; name: string }>,
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

const { mockClaimAnon, mockClaimAuth, mockClaimById, mockRename } = vi.hoisted(
  () => ({
    mockClaimAnon: vi.fn().mockResolvedValue({ success: true }),
    mockClaimAuth: vi.fn().mockResolvedValue({ success: true }),
    mockClaimById: vi.fn().mockResolvedValue({ success: true }),
    mockRename: vi.fn().mockResolvedValue({ success: true }),
  }),
);
vi.mock("../../../src/services/IdentityMergeService", () => ({
  identityMergeService: {
    claimAnonymousPlayer: mockClaimAuth,
    claimAnonymousPlayerAsAnonymous: mockClaimAnon,
    claimPlayerById: mockClaimById,
    renameAnonymousPlayer: mockRename,
  },
}));

vi.mock("../../../src/services/DatabaseService", () => ({
  databaseService: { getLeagueById: vi.fn().mockResolvedValue(null) },
}));

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

const renderPage = () => render(<LeagueJoin />, { wrapper: Wrapper });

describe("LeagueJoin — step flow (gate → claim → name)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGuests = [];
    mockLeagueCtx = {
      leagues: [mockLeague],
      addPlayer: mockAddPlayer,
      isLoadingInitialData: false,
      reloadData: mockReloadData,
    };
    mockAuthCtx = { user: null, isAuthenticated: false };
    mockIdentityCtx = { localUser: null, initializeAnonymousUser: mockInitAnon };
  });

  it("renders the league and shows the identity gate first", () => {
    renderPage();
    expect(screen.getAllByText("Test League").length).toBeGreaterThan(0);
    expect(screen.getByText(/jouer sans compte/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/nom du joueur/i)).not.toBeInTheDocument();
  });

  it("no participants: gate → name (create) → join", async () => {
    renderPage();

    fireEvent.click(screen.getByText(/jouer sans compte/i));
    await waitFor(() => expect(mockInitAnon).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.getByText(/choisis ton pseudo/i)).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByLabelText(/nom du joueur/i), {
      target: { value: "Bob" },
    });
    fireEvent.click(screen.getByRole("button", { name: /rejoindre/i }));

    await waitFor(() =>
      expect(mockAddPlayer).toHaveBeenCalledWith("test-league-id", "Bob"),
    );
    expect(mockNavigate).toHaveBeenCalledWith("/league/test-league-id");
  });

  it("with participants: gate → claim → keep name → join (no rename)", async () => {
    mockGuests = [
      { playerId: "lm1", anonymousUserId: "p1", pseudo: "Alice", joinedAt: "", archived: false },
    ];
    renderPage();

    fireEvent.click(screen.getByText(/jouer sans compte/i));
    await waitFor(() =>
      expect(screen.getByText(/êtes-vous une de ces personnes/i)).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: /c'est moi/i }));

    await waitFor(() =>
      expect(mockClaimAnon).toHaveBeenCalledWith("league", "lm1", "anon-1"),
    );
    await waitFor(() =>
      expect(screen.getByText(/garde ou modifie ton nom/i)).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: /c'est parti/i }));

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/league/test-league-id"),
    );
    expect(mockRename).not.toHaveBeenCalled();
  });

  it("\"not in the list\" goes to the create-name step", async () => {
    mockGuests = [
      { playerId: "lm1", anonymousUserId: "p1", pseudo: "Alice", joinedAt: "", archived: false },
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
