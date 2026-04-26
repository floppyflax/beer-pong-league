/**
 * PlayerCard — joueur dans une liste, 3 variants visuels :
 *
 * - `compact`   : avatar + nom (sélection EventJoin, pickers).
 * - `leaderRow` : ligne de classement complète — rang médaillé (à gauche)
 *                 + avatar + nom + bloc stats W/L/% + dots derniers matchs +
 *                 ELO + delta + chevron.
 * - `detailed`  : 2 lignes — rang + avatar + nom + ELO en haut, stats W/L%
 *                 + dots derniers matchs en bas. Pour les profils.
 *
 * NOTE — la variante `full` historique (avatar + nom + sous-texte + ELO) a
 * été retirée : `leaderRow` la remplace.
 */

import { ChevronRight } from "lucide-react";
import { getInitials } from "@/utils/string";

export interface PlayerCardCompactProps {
  variant: "compact";
  name: string;
  avatarUrl?: string;
  selected?: boolean;
  onClick?: () => void;
}

export interface PlayerCardLeaderRowProps {
  variant: "leaderRow";
  name: string;
  /** ELO ou autre métrique principale affichée à droite. */
  elo: number;
  /** Libellé personnalisé à droite — remplace l'affichage ELO. */
  rightLabel?: string;
  rank?: number;
  /** Delta ELO (positif vert, négatif rouge). */
  delta?: number;
  avatarUrl?: string;
  /** Stats jouées : optionnel. Si fourni, affiche W/L/winrate inline. */
  wins?: number;
  losses?: number;
  /** Calculé depuis wins/losses si non fourni. */
  winRate?: number;
  /** 5 derniers résultats (true = win/lime, false = loss/red). */
  recentResults?: boolean[];
  onClick?: () => void;
}

export interface PlayerCardDetailedProps {
  variant: "detailed";
  name: string;
  elo: number;
  delta?: number;
  avatarUrl?: string;
  rank?: number;
  /** Stats agrégées affichées sur la 2e ligne. */
  wins: number;
  losses: number;
  /** Win rate exprimé en pourcentage 0–100. Calculé si non fourni. */
  winRate?: number;
  /** 5 derniers résultats (true = win, false = loss). */
  recentResults?: boolean[];
  onClick?: () => void;
}

export type PlayerCardProps =
  | PlayerCardCompactProps
  | PlayerCardLeaderRowProps
  | PlayerCardDetailedProps;

function getRankBadgeClass(rank: number): string {
  switch (rank) {
    case 1:
      return "bg-ping-yellow text-navy";
    case 2:
      return "bg-cool-gray text-navy";
    case 3:
      return "bg-signal-red-deep text-white";
    default:
      return "bg-navy-deep text-cool-gray border border-card";
  }
}

function RankBadge({ rank }: { rank: number }) {
  return (
    <div
      className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${getRankBadgeClass(
        rank,
      )}`}
      aria-label={`Rang ${rank}`}
    >
      {rank}
    </div>
  );
}

function ResultDots({ results }: { results: boolean[] }) {
  return (
    <div className="flex gap-0.5" role="img" aria-label="5 derniers résultats">
      {results.slice(0, 5).map((won, i) => (
        <div
          key={i}
          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
            won ? "bg-lime" : "bg-signal-red"
          }`}
          title={won ? "Victoire" : "Défaite"}
        />
      ))}
    </div>
  );
}

function Avatar({
  name,
  avatarUrl,
  size = 10,
}: {
  name: string;
  avatarUrl?: string;
  size?: 8 | 10 | 12 | 14;
}) {
  const initials = getInitials(name);
  const cls =
    size === 14
      ? "w-14 h-14 text-base"
      : size === 12
        ? "w-12 h-12 text-base"
        : size === 8
          ? "w-8 h-8 text-xs"
          : "w-10 h-10 text-sm";
  return (
    <div
      className={`flex-shrink-0 rounded-full bg-navy-deep flex items-center justify-center font-mono font-bold text-cool-gray overflow-hidden border border-card ${cls}`}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

/**
 * Bloc inline W / L / % — utilisé sur leaderRow et detailed.
 */
function StatsInline({
  wins,
  losses,
  winRate,
  size = "md",
}: {
  wins: number;
  losses: number;
  winRate: number;
  size?: "sm" | "md";
}) {
  const labelCls =
    size === "sm"
      ? "text-[9px] tracking-[1px]"
      : "text-[10px] tracking-widest";
  const valueCls = size === "sm" ? "text-xs" : "text-sm";
  return (
    <div
      className={`flex items-center gap-2 font-mono uppercase ${labelCls} text-cool-gray`}
    >
      <span>
        <span className={`text-lime font-bold tabular-nums ${valueCls}`}>
          {wins}
        </span>
        <span className="ml-0.5">W</span>
      </span>
      <span>
        <span className={`text-signal-red font-bold tabular-nums ${valueCls}`}>
          {losses}
        </span>
        <span className="ml-0.5">L</span>
      </span>
      <span>
        <span className={`text-white font-bold tabular-nums ${valueCls}`}>
          {winRate}%
        </span>
      </span>
    </div>
  );
}

function deriveWinRate(wins: number | undefined, losses: number | undefined) {
  const w = wins ?? 0;
  const l = losses ?? 0;
  const total = w + l;
  return total > 0 ? Math.round((w / total) * 100) : 0;
}

export function PlayerCard(props: PlayerCardProps) {
  if (props.variant === "compact") {
    const baseClasses =
      "flex items-center gap-3 p-4 rounded-card border transition-colors text-left w-full";
    const stateClasses = props.selected
      ? "bg-electric-blue/15 border-electric-blue text-white"
      : "bg-navy-soft border-card text-cool-gray hover:border-card-muted hover:text-white";

    const content = (
      <>
        <Avatar name={props.name} avatarUrl={props.avatarUrl} />
        <span className="font-semibold truncate flex-1">{props.name}</span>
      </>
    );

    if (props.onClick) {
      return (
        <button
          type="button"
          onClick={props.onClick}
          className={`${baseClasses} ${stateClasses} cursor-pointer`}
          data-testid="playercard-compact"
        >
          {content}
        </button>
      );
    }

    return (
      <div
        className={`${baseClasses} ${stateClasses}`}
        data-testid="playercard-compact"
      >
        {content}
      </div>
    );
  }

  if (props.variant === "leaderRow") {
    const Wrapper = props.onClick ? "button" : "div";
    const wrapperProps = props.onClick
      ? { onClick: props.onClick, type: "button" as const }
      : {};
    const deltaClass =
      props.delta !== undefined
        ? props.delta >= 0
          ? "text-lime"
          : "text-signal-red"
        : "";
    const hasStats =
      props.wins !== undefined ||
      props.losses !== undefined ||
      props.winRate !== undefined;
    const winRate = hasStats
      ? props.winRate ?? deriveWinRate(props.wins, props.losses)
      : 0;

    return (
      <Wrapper
        className={`flex items-center gap-3 p-4 w-full bg-navy-soft rounded-card border border-card transition-colors hover:border-card-muted ${
          props.onClick ? "cursor-pointer" : ""
        }`}
        data-testid="playercard-leaderrow"
        {...wrapperProps}
      >
        {/* Rank badge LEFT of avatar (per spec). */}
        {props.rank !== undefined && <RankBadge rank={props.rank} />}
        <Avatar name={props.name} avatarUrl={props.avatarUrl} />

        <div className="flex-1 min-w-0">
          <div className="text-base font-archivo font-extrabold uppercase tracking-tight text-white truncate">
            {props.name}
          </div>
          <div className="flex items-center gap-3 flex-wrap mt-0.5">
            {hasStats && (
              <StatsInline
                wins={props.wins ?? 0}
                losses={props.losses ?? 0}
                winRate={winRate}
              />
            )}
            {props.recentResults && props.recentResults.length > 0 && (
              <ResultDots results={props.recentResults} />
            )}
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center gap-2">
          <span className="text-base font-mono font-bold tabular-nums text-lime">
            {props.rightLabel ?? props.elo}
          </span>
          {props.delta !== undefined && (
            <span
              className={`text-sm font-mono font-semibold tabular-nums ${deltaClass}`}
              data-testid="playercard-delta"
            >
              {props.delta >= 0 ? "+" : ""}
              {props.delta}
            </span>
          )}
        </div>

        <ChevronRight
          size={20}
          className="flex-shrink-0 text-cool-gray"
          aria-hidden
        />
      </Wrapper>
    );
  }

  // variant === "detailed"
  const winRate =
    props.winRate !== undefined
      ? props.winRate
      : deriveWinRate(props.wins, props.losses);
  const deltaClass =
    props.delta !== undefined
      ? props.delta >= 0
        ? "text-lime"
        : "text-signal-red"
      : "";
  const Wrapper = props.onClick ? "button" : "div";
  const wrapperProps = props.onClick
    ? { onClick: props.onClick, type: "button" as const }
    : {};
  // Width of the rank+avatar+gap cluster (for the 2nd-row indent so the stats
  // align with the name above).
  const indent = props.rank !== undefined ? "pl-[84px]" : "pl-[60px]";

  return (
    <Wrapper
      className={`flex flex-col gap-3 p-4 w-full bg-navy-soft rounded-card border border-card transition-colors hover:border-card-muted text-left ${
        props.onClick ? "cursor-pointer" : ""
      }`}
      data-testid="playercard-detailed"
      {...wrapperProps}
    >
      {/* Top row: rank (LEFT) + avatar + name + ELO */}
      <div className="flex items-center gap-3 w-full">
        {props.rank !== undefined && <RankBadge rank={props.rank} />}
        <Avatar name={props.name} avatarUrl={props.avatarUrl} size={12} />
        <div className="flex-1 min-w-0">
          <div className="text-base font-archivo font-extrabold uppercase tracking-tight text-white truncate">
            {props.name}
          </div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-cool-gray">
            ELO
            <span className="ml-1 text-base font-archivo font-black tabular-nums text-lime">
              {props.elo}
            </span>
            {props.delta !== undefined && (
              <span
                className={`ml-1.5 text-xs font-mono font-semibold tabular-nums ${deltaClass}`}
              >
                {props.delta >= 0 ? "+" : ""}
                {props.delta}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom row: stats W / L / winrate + dots */}
      <div className={`flex items-center justify-between gap-3 w-full ${indent}`}>
        <StatsInline
          wins={props.wins}
          losses={props.losses}
          winRate={winRate}
        />
        {props.recentResults && props.recentResults.length > 0 && (
          <ResultDots results={props.recentResults} />
        )}
      </div>
    </Wrapper>
  );
}
