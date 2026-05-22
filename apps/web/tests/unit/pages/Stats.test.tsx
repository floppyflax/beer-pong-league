import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Stats } from "@/pages/Stats";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

let isAnonymousValue = false;
vi.mock("@/hooks/useIsAnonymous", () => ({
  useIsAnonymous: () => isAnonymousValue,
}));

let homeData: {
  personalStats?: { totalMatches: number; winRate: number; bestStreak: number };
  recentResults: boolean[];
  currentStreak: number;
  isLoading: boolean;
} = {
  personalStats: { totalMatches: 12, winRate: 67, bestStreak: 4 },
  recentResults: [true, true, false, true, true],
  currentStreak: 2,
  isLoading: false,
};
vi.mock("@/hooks/useHomeData", () => ({
  useHomeData: () => homeData,
}));

let membershipsValue = {
  leagueMembershipByLeague: new Map<string, string>([["league-1", "me-membership"]]),
  eventMembershipByEvent: new Map<string, string>(),
};
vi.mock("@/hooks/useCurrentUserMemberships", () => ({
  useCurrentUserMemberships: () => membershipsValue,
}));

vi.mock("@/context/AuthContext", () => ({
  useAuthContext: () => ({ user: { id: "user-1" }, isAuthenticated: true }),
}));

vi.mock("@/hooks/useIdentity", () => ({
  useIdentity: () => ({ localUser: null }),
}));

let leaguesValue: Array<{
  id: string;
  name: string;
  players: Array<{ id: string; name: string; elo: number; wins: number; losses: number }>;
  matches: Array<{ id: string; date: string; teamA: string[]; teamB: string[]; scoreA: number; scoreB: number }>;
}> = [];
let eventsValue: Array<{ id: string; matches: Array<{ id: string; date: string; teamA: string[]; teamB: string[]; scoreA: number; scoreB: number }> }> = [];
vi.mock("@/context/LeagueContext", () => ({
  useLeague: () => ({
    leagues: leaguesValue,
    events: eventsValue,
  }),
}));

const renderStats = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <Stats />
      </MemoryRouter>
    </QueryClientProvider>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  isAnonymousValue = false;
  homeData = {
    personalStats: { totalMatches: 12, winRate: 67, bestStreak: 4 },
    recentResults: [true, true, false, true, true],
    currentStreak: 2,
    isLoading: false,
  };
  membershipsValue = {
    leagueMembershipByLeague: new Map([["league-1", "me-membership"]]),
    eventMembershipByEvent: new Map(),
  };
  leaguesValue = [
    {
      id: "league-1",
      name: "La Ligue Test",
      players: [
        { id: "me-membership", name: "Moi", elo: 1150, wins: 8, losses: 4 },
        { id: "ally-membership", name: "Mon Pote", elo: 1100, wins: 6, losses: 5 },
        { id: "nemesis-membership", name: "Le Boss", elo: 1300, wins: 10, losses: 2 },
      ],
      matches: buildAlternatingMatches(),
    },
  ];
  eventsValue = [];
});

function buildAlternatingMatches() {
  // 8 matches; me always with ally vs nemesis ; alternate W/L for variety.
  const matches = [];
  for (let i = 0; i < 8; i++) {
    matches.push({
      id: `m${i}`,
      date: `2026-05-${String(i + 1).padStart(2, "0")}`,
      teamA: ["me-membership", "ally-membership"],
      teamB: ["nemesis-membership"],
      scoreA: i % 3 === 0 ? 5 : 11,
      scoreB: i % 3 === 0 ? 11 : 5,
    });
  }
  return matches;
}

describe("Stats page", () => {
  it("renders hero KPIs from useHomeData", () => {
    renderStats();
    expect(screen.getByText("Tes stats")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("67%")).toBeInTheDocument();
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("renders the 5 recent result dots from useHomeData", () => {
    renderStats();
    expect(screen.getByRole("img", { name: /5 derniers résultats/i })).toBeInTheDocument();
  });

  it("renders the per-league progression section for joined leagues", () => {
    renderStats();
    expect(screen.getByText("Ma progression par league")).toBeInTheDocument();
    expect(screen.getByText("La Ligue Test")).toBeInTheDocument();
    expect(screen.getByText("1150")).toBeInTheDocument();
  });

  it("navigates to the league dashboard when a league row is clicked", async () => {
    const user = userEvent.setup();
    renderStats();
    await user.click(screen.getByText("La Ligue Test"));
    expect(mockNavigate).toHaveBeenCalledWith("/league/league-1");
  });

  it("shows AnonGatePlaceholder for anonymous users", () => {
    isAnonymousValue = true;
    renderStats();
    expect(screen.getByText(/stats verrouillées/i)).toBeInTheDocument();
  });

  it("shows the empty state when the user has no match at all", () => {
    homeData = {
      personalStats: { totalMatches: 0, winRate: 0, bestStreak: 0 },
      recentResults: [],
      currentStreak: 0,
      isLoading: false,
    };
    leaguesValue = [];
    membershipsValue = {
      leagueMembershipByLeague: new Map(),
      eventMembershipByEvent: new Map(),
    };
    renderStats();
    expect(screen.getByText(/pas encore de matchs/i)).toBeInTheDocument();
  });
});
