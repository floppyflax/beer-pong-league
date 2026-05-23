import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLeague } from "../../context/LeagueContext";
import { Volume2, VolumeX } from "lucide-react";
import { PersistentFrame } from "./components/PersistentFrame";
import { PodiumStand } from "./components/PodiumStand";
import { RecentMatchesPanel } from "./components/RecentMatchesPanel";
import { NewPlayerAlertOverlay } from "./components/NewPlayerAlertOverlay";
import { SceneIndicators } from "./components/SceneIndicators";
import { RankingScene } from "./scenes/RankingScene";
import { RankingWideScene } from "./scenes/RankingWideScene";
import { PodiumScene } from "./scenes/PodiumScene";
import { LiveMatchScene } from "./scenes/LiveMatchScene";
import { HighlightScene } from "./scenes/HighlightScene";
import { StatsScene } from "./scenes/StatsScene";
import { PhotoWallScene } from "./scenes/PhotoWallScene";
import { DuosRivalriesScene } from "./scenes/DuosRivalriesScene";
import { PlayerFocusScene } from "./scenes/PlayerFocusScene";
import {
  useDisplayScenes,
  type SceneConfig,
} from "./hooks/useDisplayScenes";
import { useDisplayAutoRefresh } from "./hooks/useDisplayAutoRefresh";
import { useMatchReveal } from "./hooks/useMatchReveal";
import { useNewPlayerReveal } from "./hooks/useNewPlayerReveal";
import type { SelfPacedScrollPhase } from "./hooks/useSelfPacedScroll";
import type { DisplaySource } from "./types";

interface Props {
  source: DisplaySource | null;
}

// Deux scènes "Classement" pinned alternent : à chaque retour au classement
// on bascule entre le mode normal (scroll vertical, self-paced) et le mode
// wide (3 colonnes denses, timed). Toutes les autres scènes sont toujours
// présentes dans la rotation — chaque scène gère son propre empty state
// quand la donnée associée manque (photos, duos, focus joueur).
const BASE_SCENES: SceneConfig[] = [
  { id: "ranking", mode: "self-paced", pinned: true },
  { id: "ranking-wide", mode: "timed", durationMs: 15_000, pinned: true },
  { id: "podium", mode: "timed", durationMs: 12_000 },
  { id: "live-match", mode: "timed", durationMs: 10_000 },
  { id: "highlight", mode: "timed", durationMs: 12_000 },
  { id: "stats", mode: "timed", durationMs: 10_000 },
  { id: "photo-wall", mode: "timed", durationMs: 12_000 },
  { id: "player-focus", mode: "timed", durationMs: 12_000 },
  { id: "duos", mode: "timed", durationMs: 12_000 },
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

  // Toutes les scènes sont toujours présentes — chacune gère son empty state
  // (placeholder lisible) quand la donnée associée n'est pas disponible.
  const scenes = BASE_SCENES;

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
  } = useDisplayScenes({ scenes });

  // Arrivée d'un nouveau match : commit silencieux du classement + brillance
  // timed + clignotement du match dans le panneau. Pas d'overlay plein écran,
  // pas de pause de la rotation — le diaporama continue exactement là où
  // il était.
  const reveal = useMatchReveal(source);

  // Orchestration d'arrivée d'un nouveau joueur : alerte plein écran + son,
  // puis refresh immédiat (pousser nom/avatar à jour). C'est le SEUL événement
  // qui interrompt la rotation aujourd'hui (par design — un nouveau joueur
  // mérite d'être annoncé, un match peut passer en arrière-plan).
  const playerReveal = useNewPlayerReveal(source, {
    onAfterAlert: reloadData,
    soundOn: reveal.soundOn,
  });

  // Pause de la rotation uniquement pendant l'alerte "nouveau joueur".
  useEffect(() => {
    if (playerReveal.active) pause();
    else resume();
  }, [playerReveal.active, pause, resume]);

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

      {/* Alerte plein écran nouveau(x) joueur(s) — seule interruption qui
          subsiste. Les matchs commitent en silence pour laisser le diaporama
          rouler. */}
      <NewPlayerAlertOverlay players={playerReveal.alertPlayers} />

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
