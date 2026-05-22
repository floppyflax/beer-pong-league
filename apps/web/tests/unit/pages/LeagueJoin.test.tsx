import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { LeagueJoin } from "../../../src/pages/LeagueJoin";
import { LeagueProvider } from "../../../src/context/LeagueContext";
import { AuthProvider } from "../../../src/context/AuthContext";
import { IdentityProvider } from "../../../src/context/IdentityContext";
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
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}));

const mockEnsureIdentity = vi.fn();
vi.mock("../../../src/hooks/useRequireIdentity", () => ({
  useRequireIdentity: () => ({
    ensureIdentity: mockEnsureIdentity,
    showModal: false,
    handleIdentityCreated: vi.fn(),
    handleCancel: vi.fn(),
  }),
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
const defaultLeagueContext = {
  leagues: [mockLeague],
  addPlayer: mockAddPlayer,
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

// Unclaimed-ghosts hook drives the "select existing player" list.
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

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      <IdentityProvider>
        <LeagueProvider>{children}</LeagueProvider>
      </IdentityProvider>
    </AuthProvider>
  </BrowserRouter>
);

describe("LeagueJoin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGuests = [];
    mockUseLeague.mockImplementation(() => defaultLeagueContext);
    mockEnsureIdentity.mockResolvedValue({
      type: "anonymous",
      user: { anonymousUserId: "test-anon-id" },
    });
  });

  it("renders the league name", () => {
    render(<LeagueJoin />, { wrapper: Wrapper });
    expect(screen.getAllByText("Test League").length).toBeGreaterThan(0);
  });

  it("creates a new player via addPlayer", async () => {
    render(<LeagueJoin />, { wrapper: Wrapper });

    fireEvent.click(
      screen.getByRole("button", { name: /créer un nouveau joueur/i }),
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/ton pseudo/i)).toBeInTheDocument();
    });
    fireEvent.change(screen.getByPlaceholderText(/ton pseudo/i), {
      target: { value: "Bob" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^rejoindre$/i }));

    await waitFor(() => {
      expect(mockAddPlayer).toHaveBeenCalledWith("test-league-id", "Bob");
    });
    expect(mockNavigate).toHaveBeenCalledWith("/league/test-league-id");
  });

  it("claims an unclaimed ghost when selected as existing player", async () => {
    mockGuests = [
      {
        playerId: "lm-1",
        anonymousUserId: "player-1",
        pseudo: "Alice",
        joinedAt: "",
        archived: false,
      },
    ];

    render(<LeagueJoin />, { wrapper: Wrapper });

    // The claim proposal is shown FIRST (before any identity/name prompt).
    expect(
      screen.getByText(/êtes-vous une de ces personnes/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Alice").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /c'est moi/i }));

    await waitFor(() => {
      expect(mockClaimAnon).toHaveBeenCalledWith(
        "league",
        "lm-1",
        "test-anon-id",
      );
    });
    expect(mockNavigate).toHaveBeenCalledWith("/league/test-league-id");
  });
});
