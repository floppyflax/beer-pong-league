import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useDisplayScenes,
  type SceneConfig,
} from "@/features/display/hooks/useDisplayScenes";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

const baseScenes: SceneConfig[] = [
  { id: "ranking", mode: "self-paced", pinned: true },
  { id: "podium", mode: "timed", durationMs: 1000 },
  { id: "live-match", mode: "timed", durationMs: 1000 },
  { id: "highlight", mode: "timed", durationMs: 1000 },
  { id: "stats", mode: "timed", durationMs: 1000 },
];

describe("useDisplayScenes", () => {
  it("starts on the first scene of the interlaced sequence (pinned ranking)", () => {
    const { result } = renderHook(() => useDisplayScenes({ scenes: baseScenes }));
    expect(result.current.activeSceneId).toBe("ranking");
    expect(result.current.uniqueScenes.map((s) => s.id)).toEqual([
      "ranking",
      "podium",
      "live-match",
      "highlight",
      "stats",
    ]);
  });

  it("interleaves the pinned scene between each other scene", () => {
    const { result } = renderHook(() => useDisplayScenes({ scenes: baseScenes }));
    const order: string[] = [result.current.activeSceneId];
    for (let i = 0; i < 7; i++) {
      act(() => result.current.next());
      order.push(result.current.activeSceneId);
    }
    expect(order).toEqual([
      "ranking",
      "podium",
      "ranking",
      "live-match",
      "ranking",
      "highlight",
      "ranking",
      "stats",
    ]);
  });

  it("auto-advances on timed scenes after durationMs", () => {
    const { result } = renderHook(() => useDisplayScenes({ scenes: baseScenes }));
    // Saute manuellement à "podium" (timed 1s)
    act(() => result.current.jumpTo("podium"));
    expect(result.current.activeSceneId).toBe("podium");
    // Avance le temps + force un frame rAF
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    // Après expiration, on saute à la suivante dans la séquence (ranking
    // est pinned entre chaque, donc après podium → ranking)
    expect(result.current.activeSceneId).toBe("ranking");
  });

  it("waits for notifyComplete on self-paced scenes", () => {
    const { result } = renderHook(() => useDisplayScenes({ scenes: baseScenes }));
    expect(result.current.activeSceneId).toBe("ranking"); // self-paced
    // 5 secondes : pas de changement, car on n'a pas notifié
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(result.current.activeSceneId).toBe("ranking");
    // Notification → avance
    act(() => result.current.notifyComplete());
    expect(result.current.activeSceneId).toBe("podium");
  });

  it("forces next on self-paced after maxDurationMs", () => {
    const { result } = renderHook(() =>
      useDisplayScenes({ scenes: baseScenes, maxDurationMs: 2_000 }),
    );
    expect(result.current.activeSceneId).toBe("ranking");
    act(() => {
      vi.advanceTimersByTime(2_100);
    });
    expect(result.current.activeSceneId).toBe("podium");
  });

  it("supports manual prev/next", () => {
    const { result } = renderHook(() => useDisplayScenes({ scenes: baseScenes }));
    expect(result.current.activeSceneId).toBe("ranking");
    act(() => result.current.next());
    expect(result.current.activeSceneId).toBe("podium");
    act(() => result.current.prev());
    expect(result.current.activeSceneId).toBe("ranking");
    // wrap-around : prev depuis le 1er va au dernier
    act(() => result.current.prev());
    expect(result.current.activeSceneId).toBe("stats");
  });

  it("pause prevents timed advancement", () => {
    const { result } = renderHook(() => useDisplayScenes({ scenes: baseScenes }));
    act(() => result.current.jumpTo("podium"));
    act(() => result.current.pause());
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(result.current.activeSceneId).toBe("podium");
    expect(result.current.isPaused).toBe(true);
  });

  it("jumps to newMatchSceneId when newMatchSignal changes", () => {
    const { result, rerender } = renderHook(
      ({ signal }: { signal: string | null }) =>
        useDisplayScenes({
          scenes: baseScenes,
          pauseOnNewMatch: true,
          newMatchSceneId: "live-match",
          newMatchHoldMs: 500,
          newMatchSignal: signal,
        }),
      { initialProps: { signal: null } },
    );
    expect(result.current.activeSceneId).toBe("ranking");

    // Le match arrive → saut sur live-match
    rerender({ signal: "match-abc" });
    expect(result.current.activeSceneId).toBe("live-match");

    // Après le hold, on avance dans la séquence
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(result.current.activeSceneId).not.toBe("live-match");
  });
});
