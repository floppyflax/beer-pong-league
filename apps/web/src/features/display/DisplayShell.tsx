import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLeague } from "../../context/LeagueContext";
import { Volume2, VolumeX } from "lucide-react";
import { PersistentFrame } from "./components/PersistentFrame";
import { PodiumStand } from "./components/PodiumStand";
import { RecentMatchesPanel } from "./components/RecentMatchesPanel";
import { NewMatchBanner } from "./components/NewMatchBanner";
import { SceneIndicators } from "./components/SceneIndicators";
import { RankingScene } from "./scenes/RankingScene";
import { PodiumScene } from "./scenes/PodiumScene";
import { LiveMatchScene } from "./scenes/LiveMatchScene";
import { HighlightScene } from "./scenes/HighlightScene";
import { StatsScene } from "./scenes/StatsScene";
import { PhotoWallScene, matchesWithPhotos } from "./scenes/PhotoWallScene";
import {
  useDisplayScenes,
  type SceneConfig,
} from "./hooks/useDisplayScenes";
import { useDisplayAutoRefresh } from "./hooks/useDisplayAutoRefresh";
import { useRankingReveal } from "./hooks/useRankingReveal";
import { useNewMatchAlert } from "./hooks/useNewMatchAlert";
import type { SelfPacedScrollPhase } from "./hooks/useSelfPacedScroll";
import type { DisplaySource } from "./types";

interface Props {
  source: DisplaySource | null;
}

const BASE_SCENES: SceneConfig[] = [
  { id: "ranking", mode: "self-paced", pinned: true },
  { id: "podium", mode: "timed", durationMs: 12_000 },
  { id: "live-match", mode: "timed", durationMs: 10_000 },
  { id: "highlight", mode: "timed", durationMs: 12_000 },
  { id: "stats", mode: "timed", durationMs: 10_000 },
];

const PHOTO_WALL_SCENE: SceneConfig = {
  id: "photo-wall",
  mode: "timed",
  durationMs: 12_000,
};

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

  const lastMatchId = source?.matches[0]?.id ?? null;

  // La scène "photo-wall" n'entre dans la rotation que s'il y a des photos.
  const hasPhotos = source ? matchesWithPhotos(source).length > 0 : false;
  const scenes = useMemo(
    () => (hasPhotos ? [...BASE_SCENES, PHOTO_WALL_SCENE] : BASE_SCENES),
    [hasPhotos],
  );

  // Slideshow
  const {
    activeSceneId,
    activeMode,
    progress,
    isPaused,
    uniqueScenes,
    notifyComplete,
  } = useDisplayScenes({
    scenes,
    pauseOnNewMatch: true,
    newMatchSceneId: "live-match",
    newMatchHoldMs: 8_000,
    newMatchSignal: lastMatchId,
  });

  // Reveal différé : le classement ne se réordonne pas en arrière-plan ; on
  // attend d'être sur le slide Classement pour animer le mouvement + mettre
  // les protagonistes en surbrillance. Le nouveau match clignote dans le rail.
  const { committedPlayers, highlightedPlayerIds, blinkMatchId } =
    useRankingReveal(source, activeSceneId);

  // Feedback d'arrivée d'un nouveau match : bannière (visuel primaire) + son.
  const { alertMatch, soundOn, audioArmed } = useNewMatchAlert(source);

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
            players={committedPlayers}
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
      case "photo-wall":
        return <PhotoWallScene source={source} />;
      default:
        return null;
    }
  }, [
    activeSceneId,
    source,
    committedPlayers,
    highlightedPlayerIds,
    isPaused,
    notifyComplete,
  ]);

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
    <>
      <PersistentFrame
        source={source}
        rightRail={
          <>
            <div className="flex-shrink-0">
              <PodiumStand players={top3} variant="compact" />
            </div>
            <RecentMatchesPanel source={source} blinkMatchId={blinkMatchId} />
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

      {/* Bannière d'arrivée d'un nouveau match (canal visuel primaire) */}
      <NewMatchBanner match={alertMatch} source={source} />

      {/* Indicateur état du son (découvrabilité du toggle M) */}
      <div className="fixed bottom-3 left-4 z-40 flex items-center gap-1.5 font-mono text-[10px] md:text-xs uppercase tracking-[1.5px] text-cool-gray font-bold pointer-events-none">
        {soundOn && audioArmed ? (
          <Volume2 size={14} className="text-electric-blue" aria-hidden />
        ) : (
          <VolumeX size={14} aria-hidden />
        )}
        <span>
          {!audioArmed
            ? "Touche = son"
            : soundOn
              ? "Son · M"
              : "Muet · M"}
        </span>
      </div>
    </>
  );
}
