/**
 * TableSide — one half of the beer-pong table viewed from above.
 *
 * Vertical layout: A on top (back row at top, tip pointing down towards
 * center), B at bottom (tip at top pointing up, back row at bottom).
 *
 *   - tap the side → declare it winner
 *   - winner: cups solid, score editable (+/- or tap a cup)
 *   - loser: empty positions, score = 0
 */

import { Minus, Plus } from "lucide-react";
import { PlayerChip } from "../atoms/PlayerChip";
import {
  CUP_ROWS,
  TOTAL_CUPS,
  cupId,
  type EnrichedPlayer,
  type Team,
} from "./recordMatchInternals";

export type TableSideState = "pending" | "winner" | "loser";

export interface TableSideProps {
  team: Team;
  players: EnrichedPlayer[];
  droppedCups: Set<string>;
  state: TableSideState;
  onSelectWinner: () => void;
  onAdjustCups: (next: number) => void;
  onToggleCup: (id: string) => void;
}

export function TableSide({
  team,
  players,
  droppedCups,
  state,
  onSelectWinner,
  onAdjustCups,
  onToggleCup,
}: TableSideProps) {
  const cupsRemaining = TOTAL_CUPS - droppedCups.size;
  const isA = team === "A";
  const accentText = isA ? "text-electric-blue" : "text-signal-red";
  const cupSolid = isA
    ? "bg-electric-blue border-electric-blue"
    : "bg-signal-red border-signal-red";
  const dotBg = isA ? "bg-electric-blue" : "bg-signal-red";

  // Render rows top-to-bottom. A: wide row at top, tip at bottom (points down
  // towards center). B: tip at top (points up towards center), wide row at the
  // bottom edge.
  const rows = isA ? CUP_ROWS : [...CUP_ROWS].reverse();
  const rackRowFor = (renderRow: number) => (isA ? renderRow : 3 - renderRow);

  // Pending and loser are both clickable: pending → pick winner, loser → swap.
  // Winner is non-clickable at the wrapper level (cups handle their own clicks).
  const sideClickable = state !== "winner";
  const interactiveSide = sideClickable ? "cursor-pointer" : "";

  const handleSideClick = () => {
    if (state !== "winner") onSelectWinner();
  };

  const sideAccentBg = isA ? "bg-electric-blue/10" : "bg-signal-red/10";
  const sideAccentBorder = isA ? "border-electric-blue" : "border-signal-red";
  const sideAccentShadow = isA
    ? "shadow-[0_3px_0_#0052D4]"
    : "shadow-[0_3px_0_#C42418]";

  const sideStateClass =
    state === "winner"
      ? `${sideAccentBg} border-[1.5px] ${sideAccentBorder} ${sideAccentShadow}`
      : state === "loser"
        ? "bg-navy/40 border-[1.5px] border-card hover:border-cool-gray hover:bg-navy/60"
        : "border-[1.5px] border-dashed border-cool-gray/40 hover:border-cool-gray hover:bg-white/[0.02]";

  const handleCupTap = (id: string) => {
    if (state !== "winner") return;
    onToggleCup(id);
  };

  /* Sub-blocks */

  const headerRow = (
    <div className="flex items-center justify-between gap-3 w-full">
      <div className="flex items-center gap-2 min-w-0">
        <span className={`w-2 h-2 rounded-full shrink-0 ${dotBg}`} />
        <h3
          className={`font-archivo font-extrabold uppercase tracking-tight text-sm ${accentText}`}
        >
          Équipe {team}
        </h3>
        {state === "winner" && (
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-lime">
            🏆
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {state === "winner" && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAdjustCups(Math.max(1, cupsRemaining - 1));
            }}
            className="w-7 h-7 rounded-full border border-card flex items-center justify-center text-cool-gray hover:text-white hover:border-cool-gray transition-colors"
            aria-label="Diminuer les cups restants"
          >
            <Minus size={12} />
          </button>
        )}
        <div
          className={`text-[56px] font-archivo font-black tabular-nums leading-none ${
            state === "loser" ? "text-cool-gray/40" : accentText
          }`}
        >
          {state === "loser" ? 0 : cupsRemaining}
        </div>
        {state === "winner" && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAdjustCups(Math.min(TOTAL_CUPS, cupsRemaining + 1));
            }}
            className="w-7 h-7 rounded-full border border-card flex items-center justify-center text-cool-gray hover:text-white hover:border-cool-gray transition-colors"
            aria-label="Augmenter les cups restants"
          >
            <Plus size={12} />
          </button>
        )}
      </div>
    </div>
  );

  const chipsRow = (
    <div className="flex flex-wrap gap-2 w-full">
      {players.map((p) => (
        <PlayerChip
          key={p.id}
          name={p.name}
          avatarUrl={p.avatarUrl}
          side={team}
          dim={state === "loser"}
        />
      ))}
    </div>
  );

  const pyramid = (
    <div className="flex flex-col items-center gap-1.5 w-full py-1">
      {rows.map((rowCount, rowIdx) => {
        const rackRow = rackRowFor(rowIdx);
        return (
          <div key={rowIdx} className="flex gap-1.5">
            {Array.from({ length: rowCount }).map((_, posInRow) => {
              const id = cupId(rackRow, posInRow);
              const isDropped = droppedCups.has(id);
              const visible = state === "loser" ? false : !isDropped;
              const interactive = state === "winner";
              return (
                <button
                  key={posInRow}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (interactive) handleCupTap(id);
                  }}
                  disabled={!interactive}
                  aria-label={
                    visible
                      ? "Cup debout — tape pour le faire tomber"
                      : "Cup tombé — tape pour le remettre"
                  }
                  className={`w-7 h-7 md:w-8 md:h-8 rounded-full border-2 transition-all ${
                    interactive ? "active:scale-90 cursor-pointer" : ""
                  } ${
                    visible
                      ? cupSolid
                      : "bg-transparent border-cool-gray/30 opacity-40"
                  }`}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );

  return (
    <div
      onClick={handleSideClick}
      onKeyDown={(e) => {
        if (sideClickable && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          handleSideClick();
        }
      }}
      role={sideClickable ? "button" : undefined}
      tabIndex={sideClickable ? 0 : undefined}
      className={`group relative w-full flex flex-col gap-3 px-4 py-3 text-left rounded-card transition-all duration-150 ${interactiveSide} ${sideStateClass}`}
      aria-label={
        state === "winner"
          ? undefined
          : `Choisir l'équipe ${team} comme vainqueur`
      }
    >
      {/* A: header → chips → pyramid (tip down, towards center).
          B: pyramid (tip up, towards center) → chips → header. */}
      {isA ? (
        <>
          {headerRow}
          {chipsRow}
          {pyramid}
        </>
      ) : (
        <>
          {pyramid}
          {chipsRow}
          {headerRow}
        </>
      )}

    </div>
  );
}
