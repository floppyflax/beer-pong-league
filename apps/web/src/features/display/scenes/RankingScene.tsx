import { useEffect, useRef, type CSSProperties } from "react";
import autoAnimate from "@formkit/auto-animate";
import { PlayerCard } from "@/components/design-system/PlayerCard";
import {
  useSelfPacedScroll,
  type SelfPacedScrollPhase,
} from "../hooks/useSelfPacedScroll";
import type { DisplaySourcePlayer } from "../types";

const GLOW_WIN = "rgba(183,255,59,0.85)"; // lime
const GLOW_LOSE = "rgba(255,59,59,0.85)"; // signal-red

interface Props {
  /**
   * Ordre du classement à afficher. Fourni par le DisplayShell (ordre
   * "committé", gelé jusqu'au reveal d'un nouveau match) — pas directement
   * `source.players`, pour éviter un réordonnancement en arrière-plan.
   */
  players: DisplaySourcePlayer[];
  /** Vainqueurs du dernier match → toute la card brille en vert. */
  winnerIds?: Set<string>;
  /** Perdants du dernier match → toute la card brille en rouge. */
  loserIds?: Set<string>;
  /** Active le self-paced scroll (la scène est-elle visible). */
  enabled?: boolean;
  /** Freeze le scroll (pause clavier). */
  paused?: boolean;
  /** Appelée quand la séquence hold→scroll→hold-bottom est finie. */
  onComplete?: () => void;
  /** Reporte la phase au DisplayShell pour les indicators. */
  onPhaseChange?: (phase: SelfPacedScrollPhase) => void;
  /**
   * Mode "reveal" : désactive le scroll auto self-paced ; le scroll suit le
   * `focusedPlayerId` (visite séquentielle des protagonistes).
   */
  focusMode?: boolean;
  /** Joueur sur lequel scroller (et mettre en avant) pendant la visite. */
  focusedPlayerId?: string | null;
}

/**
 * Scène classement : top 10 affichés en `PlayerCard size="display"`, le reste
 * (rang 11+) affiché en cards plus compactes en dessous.
 *
 * Self-paced : utilise `useSelfPacedScroll` quand `enabled = true` :
 * hold-top → scroll lent → hold-bottom → notifyComplete().
 */
export function RankingScene({
  players,
  winnerIds,
  loserIds,
  enabled = true,
  paused = false,
  onComplete,
  onPhaseChange,
  focusMode = false,
  focusedPlayerId = null,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const phase = useSelfPacedScroll(scrollRef, {
    // En mode reveal, le scroll est piloté par focusedPlayerId, pas par le
    // self-paced.
    enabled: enabled && !focusMode,
    paused,
    holdTopMs: 6_000,
    scrollSpeedPxPerSec: 55,
    holdBottomMs: 2_500,
    onComplete: () => {
      onComplete?.();
    },
  });

  // Report la phase au parent (dans un effet pour ne pas update pendant le
  // render du child).
  useEffect(() => {
    onPhaseChange?.(phase);
  }, [phase, onPhaseChange]);

  // Visite séquentielle : scroll doux vers le joueur focalisé.
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const setRowRef = (id: string) => (el: HTMLDivElement | null) => {
    if (el) rowRefs.current.set(id, el);
    else rowRefs.current.delete(id);
  };
  useEffect(() => {
    if (!focusedPlayerId) return;
    const el = rowRefs.current.get(focusedPlayerId);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusedPlayerId]);

  // Réordonnancement animé : les lignes glissent vers leur nouvelle position
  // quand le classement change. API core (impérative) pour éviter le souci de
  // double copie de React de l'entrée /react en monorepo. auto-animate respecte
  // prefers-reduced-motion nativement.
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (listRef.current) autoAnimate(listRef.current);
  }, []);

  return (
    <div className="flex flex-col h-full min-h-0">
      <h2 className="font-archivo font-black uppercase tracking-[-0.6px] text-xl md:text-3xl mb-4 flex-shrink-0">
        Classement
      </h2>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden relative min-h-0"
      >
        {/* Toute la liste utilise le MÊME rendu (PlayerCard leaderRow display) :
            même structure visuelle pour le rang 1 et le rang 11+, pour ne pas
            créer de "rupture" à la cassure du top 10. La self-paced scroll
            descend naturellement dans la liste complète. */}
        <div ref={listRef} className="space-y-2">
          {players.map((player) => {
            const isWinner = winnerIds?.has(player.id);
            const isLoser = loserIds?.has(player.id);
            const isHighlighted = isWinner || isLoser;
            return (
              <div
                key={player.id}
                ref={setRowRef(player.id)}
                className="relative rounded-card"
              >
                <PlayerCard
                  variant="leaderRow"
                  size="display"
                  name={player.name}
                  avatarUrl={player.avatarUrl}
                  elo={player.elo}
                  rank={player.rank}
                  delta={player.eloDelta}
                  rankDelta={player.rankDelta}
                  wins={player.wins}
                  losses={player.losses}
                  winRate={player.winRate}
                  recentResults={player.recentResults}
                />
                {isHighlighted && (
                  <div
                    aria-hidden
                    className={`absolute inset-0 rounded-card pointer-events-none animate-glow-pulse ring-2 ${
                      isWinner ? "bg-lime/25 ring-lime" : "bg-signal-red/25 ring-signal-red"
                    }`}
                    style={
                      { ["--glow"]: isWinner ? GLOW_WIN : GLOW_LOSE } as CSSProperties
                    }
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
