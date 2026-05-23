import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { Match } from "@/types";
import type {
  DisplaySource,
  DisplaySourcePlayer,
} from "@/features/display/types";
import {
  useMatchReveal,
  withTransitionDeltas,
} from "@/features/display/hooks/useMatchReveal";

// jsdom n'a pas AudioContext → la sonnerie est un no-op (testé indirectement).

function player(id: string, rank: number, eloDelta?: number): DisplaySourcePlayer {
  return {
    id,
    name: id.toUpperCase(),
    elo: 1100 - rank,
    rank,
    eloDelta,
    wins: 0,
    losses: 0,
    winRate: 0,
    recentResults: [],
  };
}

function match(id: string, teamA: string[], teamB: string[]): Match {
  return {
    id,
    date: new Date().toISOString(),
    teamA,
    teamB,
    scoreA: 10,
    scoreB: 4,
    eloChanges: {},
  };
}

function makeSource(
  players: DisplaySourcePlayer[],
  matches: Match[],
): DisplaySource {
  return {
    kind: "league",
    name: "T",
    joinUrl: "",
    isLive: true,
    players,
    matches,
    matchesPlayedCount: matches.length,
    isLoading: false,
    sourceId: "x",
    exitPath: "/",
  };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("useMatchReveal", () => {
  it("is idle initially and exposes the source order", () => {
    const P0 = [player("a", 1), player("b", 2)];
    const src = makeSource(P0, [match("m1", ["a"], ["b"])]);
    const { result } = renderHook(
      ({ s }) => useMatchReveal(s),
      { initialProps: { s: src as DisplaySource | null } },
    );
    expect(result.current.phase).toBe("idle");
    expect(result.current.active).toBe(false);
    expect(result.current.committedPlayers).toEqual(P0);
    expect(result.current.blur).toBe(false);
    expect(result.current.alertMatch).toBeNull();
    expect(result.current.focusedPlayerId).toBeNull();
  });

  it("nouveau match : overlay plein écran ~4s puis idle (sans visite séquentielle)", () => {
    const P0 = [player("a", 1), player("b", 2)];
    const src0 = makeSource(P0, [match("m1", ["a"], ["b"])]);
    const { result, rerender } = renderHook(
      ({ s }: { s: DisplaySource | null }) => useMatchReveal(s),
      { initialProps: { s: src0 } },
    );

    // Nouveau match m2 : a gagne, b perd.
    const P1 = [player("a", 1, 12), player("b", 2, -12)];
    const src1 = makeSource(P1, [
      match("m2", ["a"], ["b"]),
      match("m1", ["a"], ["b"]),
    ]);
    rerender({ s: src1 });

    // Phase ALERT : overlay actif + blur + match annoncé + actif (la rotation
    // se met en pause via DisplayShell).
    expect(result.current.phase).toBe("alert");
    expect(result.current.active).toBe(true);
    expect(result.current.blur).toBe(true);
    expect(result.current.alertMatch?.id).toBe("m2");

    // En parallèle : brillance lime/red + clignotement RecentMatches + commit.
    expect([...result.current.winnerIds]).toEqual(["a"]);
    expect([...result.current.loserIds]).toEqual(["b"]);
    expect([...result.current.highlightedPlayerIds].sort()).toEqual(["a", "b"]);
    expect(result.current.blinkMatchId).toBe("m2");
    expect(result.current.committedPlayers.map((p) => p.id)).toEqual(["a", "b"]);

    // Pas de visite séquentielle des protagonistes (focusedPlayerId reste null).
    expect(result.current.focusedPlayerId).toBeNull();

    // Après ALERT_MS (~4s) : l'overlay se ferme, on repasse en idle. La
    // brillance reste (HIGHLIGHT_MS = 6s).
    act(() => {
      vi.advanceTimersByTime(4_100);
    });
    expect(result.current.phase).toBe("idle");
    expect(result.current.active).toBe(false);
    expect(result.current.alertMatch).toBeNull();
    expect(result.current.winnerIds.size).toBe(1);

    // Après HIGHLIGHT_MS (6s depuis le début) : brillance retombe.
    act(() => {
      vi.advanceTimersByTime(2_000);
    });
    expect(result.current.winnerIds.size).toBe(0);
    expect(result.current.loserIds.size).toBe(0);
    expect(result.current.highlightedPlayerIds.size).toBe(0);
    expect(result.current.blinkMatchId).toBe("m2");

    // Après BLINK_MS (8s depuis le début) : blink retombe aussi.
    act(() => {
      vi.advanceTimersByTime(2_000);
    });
    expect(result.current.blinkMatchId).toBeNull();
  });

  it("toggles sound with the M key", () => {
    const src = makeSource([player("a", 1)], [match("m1", ["a"], ["b"])]);
    const { result } = renderHook(() => useMatchReveal(src));
    expect(result.current.soundOn).toBe(true);
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "m" }));
    });
    expect(result.current.soundOn).toBe(false);
  });
});

describe("withTransitionDeltas", () => {
  it("dérive places gagnées/perdues et ELO gagné/perdu depuis le diff avant→après", () => {
    // Avant : b #1 (1099), a #2 (1098). a bat b et passe #1 (+ELO), b descend.
    const before = [player("b", 1), player("a", 2)]; // elo = 1100 - rank
    const after = [
      { ...player("a", 1), elo: 1126 },
      { ...player("b", 2), elo: 1071 },
    ];
    const out = withTransitionDeltas(after, before);
    const a = out.find((x) => x.id === "a")!;
    const b = out.find((x) => x.id === "b")!;
    expect(a.rankDelta).toBe(1); // 2 -> 1 : monté d'une place
    expect(a.eloDelta).toBe(1126 - 1098); // +28
    expect(b.rankDelta).toBe(-1); // 1 -> 2 : descendu
    expect(b.eloDelta).toBe(1071 - 1099); // -28
  });

  it("ne dépend pas de match.eloChanges (calcul purement positionnel)", () => {
    const before = [{ ...player("x", 1), elo: 1000 }];
    const after = [{ ...player("x", 1), elo: 1012 }];
    expect(withTransitionDeltas(after, before)[0].eloDelta).toBe(12);
  });

  it("affiche '=' (rankDelta 0) pour un joueur qui a joué mais reste sur place", () => {
    // x et y jouent (leur ELO change) mais gardent leurs rangs 1 et 2.
    const before = [
      { ...player("x", 1), elo: 1000 },
      { ...player("y", 2), elo: 990 },
    ];
    const after = [
      { ...player("x", 1), elo: 1012 },
      { ...player("y", 2), elo: 978 },
    ];
    const out = withTransitionDeltas(after, before);
    const x = out.find((p) => p.id === "x")!;
    const y = out.find((p) => p.id === "y")!;
    expect(x.rankDelta).toBe(0); // a joué, resté → "="
    expect(x.eloDelta).toBe(12);
    expect(y.rankDelta).toBe(0);
    expect(y.eloDelta).toBe(-12);
  });

  it("marque un joueur dépassé sans avoir joué (rankDelta sans eloDelta)", () => {
    // c ne joue pas (ELO inchangé) mais se fait dépasser → descend d'un rang.
    const before = [
      { ...player("c", 2), elo: 1000 },
      { ...player("d", 3), elo: 990 },
    ];
    const after = [
      { ...player("d", 2), elo: 1015 },
      { ...player("c", 3), elo: 1000 },
    ];
    const c = withTransitionDeltas(after, before).find((x) => x.id === "c")!;
    expect(c.rankDelta).toBe(-1);
    expect(c.eloDelta).toBeUndefined();
  });

  it("laisse les deltas undefined quand rien ne change", () => {
    const before = [{ ...player("x", 1), elo: 1000 }];
    const after = [{ ...player("x", 1), elo: 1000 }];
    const x = withTransitionDeltas(after, before)[0];
    expect(x.rankDelta).toBeUndefined();
    expect(x.eloDelta).toBeUndefined();
  });

  it("retourne la liste inchangée sans référence avant (1ère ouverture)", () => {
    const after = [player("x", 1)];
    expect(withTransitionDeltas(after, null)).toBe(after);
    expect(withTransitionDeltas(after, [])).toBe(after);
  });
});
