import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLeague } from "../../context/LeagueContext";
import { Volume2, VolumeX } from "lucide-react";
import { PersistentFrame } from "./components/PersistentFrame";
import { PodiumStand } from "./components/PodiumStand";
import { RecentMatchesPanel } from "./components/RecentMatchesPanel";
import { NewMatchAlertOverlay } from "./components/NewMatchAlertOverlay";
import { SceneIndicators } from "./components/SceneIndicators";
import { RankingScene } from "./scenes/RankingScene";
import { RankingWideScene } from "./scenes/RankingWideScene";
import { PodiumScene } from "./scenes/PodiumScene";
import { LiveMatchScene } from "./scenes/LiveMatchScene";
import { HighlightScene } from "./scenes/HighlightScene";
import { StatsScene } from "./scenes/StatsScene";
import { PhotoWallScene, matchesWithPhotos } from "./scenes/PhotoWallScene";
import { DuosRivalriesScene } from "./scenes/DuosRivalriesScene";
import { PlayerFocusScene } from "./scenes/PlayerFocusScene";
import { useDuoRivalryStats } from "./hooks/useDuoRivalryStats";
import {
  useDisplayScenes,
  type SceneConfig,
} from "./hooks/useDisplayScenes";
import { useDisplayAutoRefresh } from "./hooks/useDisplayAutoRefresh";
import { useMatchReveal } from "./hooks/useMatchReveal";
import type { SelfPacedScrollPhase } from "./hooks/useSelfPacedScroll";
import type { DisplaySource } from "./types";

interface Props {
  source: DisplaySource | null;
}

const BASE_SCENES: SceneConfig[] = [
  { id: "ranking", mode: "self-paced", pinned: true },
  { id: "ranking-wide", mode: "timed", durationMs: 15_000 },
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

const DUOS_SCENE: SceneConfig = {
  id: "duos",
  mode: "timed",
  durationMs: 12_000,
};

const PLAYER_FOCUS_SCENE: SceneConfig = {
  id: "player-focus",
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

  // Scènes optionnelles : photo-wall si des photos, duos si des stats duo/rivalité.
  const hasPhotos = source ? matchesWithPhotos(source).length > 0 : false;
  const duoStats = useDuoRivalryStats(source);
  const hasDuos = duoStats.duosAvailable;
  const hasPlayerFocus = duoStats.focusAvailable;
  const scenes = useMemo(() => {
    const s = [...BASE_SCENES];
    if (hasPhotos) s.push(PHOTO_WALL_SCENE);
    if (hasPlayerFocus) s.push(PLAYER_FOCUS_SCENE);
    if (hasDuos) s.push(DUOS_SCENE);
    return s;
  }, [hasPhotos, hasPlayerFocus, hasDuos]);

  // Slideshow
  const {
    activeSceneId,
    activeMode,
    progress,
    isPaused,
    uniqueScenes,
    notifyComplete,
    pause,
    resume,
    jumpTo,
  } = useDisplayScenes({ scenes });

  // Orchestration complète de l'arrivée d'un nouveau match : alerte floutée +
  // sonnerie, puis reveal chorégraphié sur le Classement (commit du nouvel
  // ordre, surbrillance, visite séquentielle des protagonistes).
  const reveal = useMatchReveal(source);

  // Pendant la séquence : on met la rotation en pause et on force le Classement
  // (au passage en phase "reveal").
  useEffect(() => {
    if (reveal.active) pause();
    else resume();
  }, [reveal.active, pause, resume]);
  useEffect(() => {
    if (reveal.phase === "reveal") jumpTo("ranking");
  }, [reveal.phase, jumpTo]);

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
            players={reveal.committedPlayers}
            winnerIds={reveal.winnerIds}
            loserIds={reveal.loserIds}
            enabled
            paused={isPaused}
            onComplete={notifyComplete}
            onPhaseChange={setSelfPacedPhase}
            focusMode={reveal.phase === "reveal"}
            focusedPlayerId={reveal.focusedPlayerId}
          />
        );
      case "ranking-wide":
        return (
          <RankingWideScene
            players={reveal.committedPlayers}
            winnerIds={reveal.winnerIds}
            loserIds={reveal.loserIds}
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
      case "duos":
        return <DuosRivalriesScene source={source} />;
      case "player-focus":
        return <PlayerFocusScene source={source} />;
      default:
        return null;
    }
  }, [
    activeSceneId,
    source,
    reveal.committedPlayers,
    reveal.winnerIds,
    reveal.loserIds,
    reveal.phase,
    reveal.focusedPlayerId,
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
        fullWidth={activeSceneId === "ranking-wide"}
        rightRail={
          <>
            <div className="flex-shrink-0">
              <PodiumStand players={top3} variant="compact" />
            </div>
            <RecentMatchesPanel
              source={source}
              blinkMatchId={reveal.blinkMatchId}
            />
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

      {/* Alerte plein écran floutée (canal visuel primaire) + sonnerie */}
      <NewMatchAlertOverlay match={reveal.alertMatch} source={source} />

      {/* Indicateur état du son (découvrabilité du toggle M) */}
      <div className="fixed bottom-3 left-4 z-40 flex items-center gap-1.5 font-mono text-[10px] md:text-xs uppercase tracking-[1.5px] text-cool-gray font-bold pointer-events-none">
        {reveal.soundOn && reveal.audioArmed ? (
          <Volume2 size={14} className="text-electric-blue" aria-hidden />
        ) : (
          <VolumeX size={14} aria-hidden />
        )}
        <span>
          {!reveal.audioArmed
            ? "Touche = son"
            : reveal.soundOn
              ? "Son · M"
              : "Muet · M"}
        </span>
      </div>
    </>
  );
}
