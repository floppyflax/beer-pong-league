import { useEffect, useRef } from "react";
import { PlayerCard } from "@/components/design-system/PlayerCard";
import {
  useSelfPacedScroll,
  type SelfPacedScrollPhase,
} from "../hooks/useSelfPacedScroll";
import type { DisplaySource } from "../types";

interface Props {
  source: DisplaySource;
  /** Ids des joueurs à highlighter (animation d'arrivée d'un match récent). */
  highlightedPlayerIds?: Set<string>;
  /** Active le self-paced scroll (la scène est-elle visible). */
  enabled?: boolean;
  /** Freeze le scroll (pause clavier). */
  paused?: boolean;
  /** Appelée quand la séquence hold→scroll→hold-bottom est finie. */
  onComplete?: () => void;
  /** Reporte la phase au DisplayShell pour les indicators. */
  onPhaseChange?: (phase: SelfPacedScrollPhase) => void;
}

/**
 * Scène classement : top 10 affichés en `PlayerCard size="display"`, le reste
 * (rang 11+) affiché en cards plus compactes en dessous.
 *
 * Self-paced : utilise `useSelfPacedScroll` quand `enabled = true` :
 * hold-top → scroll lent → hold-bottom → notifyComplete().
 */
export function RankingScene({
  source,
  highlightedPlayerIds,
  enabled = true,
  paused = false,
  onComplete,
  onPhaseChange,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const phase = useSelfPacedScroll(scrollRef, {
    enabled,
    paused,
    holdTopMs: 8_000,
    scrollSpeedPxPerSec: 30,
    holdBottomMs: 3_000,
    onComplete: () => {
      onComplete?.();
    },
  });

  // Report la phase au parent (dans un effet pour ne pas update pendant le
  // render du child).
  useEffect(() => {
    onPhaseChange?.(phase);
  }, [phase, onPhaseChange]);

  const top10 = source.players.slice(0, 10);
  const rest = source.players.slice(10);

  return (
    <div className="flex flex-col h-full min-h-0">
      <h2 className="font-archivo font-black uppercase tracking-[-0.6px] text-xl md:text-3xl mb-4 flex-shrink-0">
        Classement
      </h2>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden relative min-h-0"
      >
        <div className="space-y-2.5 md:space-y-3 mb-6">
          {top10.map((player) => {
            const isHighlighted = highlightedPlayerIds?.has(player.id);
            return (
              <div
                key={player.id}
                className={`transition-all duration-500 rounded-card ${
                  isHighlighted
                    ? "ring-2 ring-electric-blue shadow-[0_3px_0_#0052D4] scale-[1.01]"
                    : ""
                }`}
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
              </div>
            );
          })}
        </div>

        {rest.length > 0 && (
          <div className="space-y-2">
            {rest.map((player) => (
              <div
                key={player.id}
                className="bg-navy-soft/70 border border-card rounded-card px-4 py-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center font-archivo font-bold text-base bg-navy text-cool-gray rounded-full border border-card">
                      {player.rank}
                    </div>
                    <div>
                      <div className="font-archivo font-bold text-base truncate">
                        {player.name}
                      </div>
                      <div className="font-mono text-[10px] uppercase tracking-[1.5px] text-cool-gray font-bold">
                        {player.wins}V — {player.losses}D
                      </div>
                    </div>
                  </div>
                  <div className="font-archivo font-black text-2xl text-white tracking-tight">
                    {player.elo}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
