import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLeague } from "../../context/LeagueContext";
import { PersistentFrame } from "./components/PersistentFrame";
import { PodiumStand } from "./components/PodiumStand";
import { RecentMatchesPanel } from "./components/RecentMatchesPanel";
import { SceneIndicators } from "./components/SceneIndicators";
import { RankingScene } from "./scenes/RankingScene";
import { PodiumScene } from "./scenes/PodiumScene";
import { LiveMatchScene } from "./scenes/LiveMatchScene";
import { HighlightScene } from "./scenes/HighlightScene";
import { StatsScene } from "./scenes/StatsScene";
import {
  useDisplayScenes,
  type SceneConfig,
} from "./hooks/useDisplayScenes";
import { useDisplayAutoRefresh } from "./hooks/useDisplayAutoRefresh";
import type { SelfPacedScrollPhase } from "./hooks/useSelfPacedScroll";
import type { DisplaySource } from "./types";

interface Props {
  source: DisplaySource | null;
}

const SCENES: SceneConfig[] = [
  { id: "ranking", mode: "self-paced", pinned: true },
  { id: "podium", mode: "timed", durationMs: 12_000 },
  { id: "live-match", mode: "timed", durationMs: 10_000 },
  { id: "highlight", mode: "timed", durationMs: 12_000 },
  { id: "stats", mode: "timed", durationMs: 10_000 },
];

/**
 * Shell de la vue diffusion. Orchestre :
 * - `PersistentFrame` (header + QR + rail droit garanti) en dehors du slideshow.
 * - `useDisplayScenes` qui cycle entre 5 scènes (ranking pinned interleaved).
 * - Interruption automatique vers `live-match` quand un nouveau match arrive.
 * - Sortie clavier ESC.
 */
export function DisplayShell({ source }: Props) {
  const navigate = useNavigate();
  const { reloadData } = useLeague();

  // Auto-refresh : l'écran se met à jour seul quand un match tombe ailleurs.
  useDisplayAutoRefresh(reloadData, { intervalMs: 10_000, enabled: !!source });

  // Highlight 5s les joueurs du dernier match dès qu'il change
  const lastMatchIdRef = useRef<string | null>(null);
  const [highlightedPlayerIds, setHighlightedPlayerIds] = useState<Set<string>>(
    new Set(),
  );
  const lastMatchId = source?.matches[0]?.id ?? null;

  useEffect(() => {
    if (!source || !lastMatchId) return;
    if (lastMatchId === lastMatchIdRef.current) return;
    // Premier mount : on capture l'id sans déclencher l'effet visuel
    if (lastMatchIdRef.current === null) {
      lastMatchIdRef.current = lastMatchId;
      return;
    }
    lastMatchIdRef.current = lastMatchId;
    const last = source.matches[0];
    if (!last) return;
    setHighlightedPlayerIds(new Set([...last.teamA, ...last.teamB]));
    const timeout = setTimeout(() => setHighlightedPlayerIds(new Set()), 5000);
    return () => clearTimeout(timeout);
  }, [source, lastMatchId]);

  // Slideshow
  const {
    activeSceneId,
    activeMode,
    progress,
    isPaused,
    uniqueScenes,
    notifyComplete,
  } = useDisplayScenes({
    scenes: SCENES,
    pauseOnNewMatch: true,
    newMatchSceneId: "live-match",
    newMatchHoldMs: 8_000,
    newMatchSignal: lastMatchId,
  });

  // Phase rapportée par la scène self-paced active (pour les indicators)
  const [selfPacedPhase, setSelfPacedPhase] =
    useState<SelfPacedScrollPhase>("idle");

  // ESC = retour à la page parente
  useEffect(() => {
    if (!source) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") navigate(source.exitPath);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [source, navigate]);

  const scene = useMemo(() => {
    if (!source) return null;
    switch (activeSceneId) {
      case "ranking":
        return (
          <RankingScene
            source={source}
            highlightedPlayerIds={highlightedPlayerIds}
            enabled
            paused={isPaused}
            onComplete={notifyComplete}
            onPhaseChange={setSelfPacedPhase}
          />
        );
      case "podium":
        return <PodiumScene source={source} />;
      case "live-match":
        return <LiveMatchScene source={source} />;
      case "highlight":
        return <HighlightScene source={source} />;
      case "stats":
        return <StatsScene source={source} />;
      default:
        return null;
    }
  }, [activeSceneId, source, highlightedPlayerIds, isPaused, notifyComplete]);

  if (!source) {
    return (
      <div className="h-screen flex items-center justify-center bg-navy text-white">
        <p className="font-archivo font-extrabold uppercase tracking-tight">
          Ressource introuvable.
        </p>
      </div>
    );
  }

  if (source.isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-navy text-white">
        <p className="font-mono uppercase tracking-[2px] text-cool-gray text-sm">
          Chargement…
        </p>
      </div>
    );
  }

  const top3 = source.players.slice(0, 3);

  return (
    <PersistentFrame
      source={source}
      rightRail={
        <>
          <div className="flex-shrink-0">
            <PodiumStand players={top3} variant="compact" />
          </div>
          <RecentMatchesPanel source={source} />
        </>
      }
    >
      <div className="flex flex-col h-full min-h-0">
        <div className="flex-1 min-h-0 overflow-hidden">{scene}</div>
        <div className="flex-shrink-0 mt-2">
          <SceneIndicators
            scenes={uniqueScenes}
            activeId={activeSceneId}
            progress={activeMode === "timed" ? progress : -1}
            selfPacedPhase={
              activeMode === "self-paced" ? selfPacedPhase : undefined
            }
            isPaused={isPaused}
          />
        </div>
      </div>
    </PersistentFrame>
  );
}
