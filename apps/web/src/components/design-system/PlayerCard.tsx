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

import { ChevronRight, TrendingDown, TrendingUp } from "lucide-react";
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
  /** Variation de rang vs dernier match (>0 monté, <0 descendu, 0/undefined masqué). */
  rankDelta?: number;
  avatarUrl?: string;
  /** Stats jouées : optionnel. Si fourni, affiche W/L/winrate inline. */
  wins?: number;
  losses?: number;
  /** Calculé depuis wins/losses si non fourni. */
  winRate?: number;
  /** 5 derniers résultats (true = win/lime, false = loss/red). */
  recentResults?: boolean[];
  onClick?: () => void;
  /**
   * Échelle d'affichage :
   * - `default` (~10 avatar, text-base) — listes mobile/desktop habituelles.
   * - `display` (~16 avatar, text-2xl/3xl, padding doublé, dots 4px) — mode
   *   diffusion plein écran TV/projecteur. Pas de chevron (non interactif).
   */
  size?: "default" | "display";
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
      return "bg-ping-yellow text-navy"; // or
    case 2:
      return "bg-cool-gray text-navy"; // argent
    case 3:
      return "bg-bronze text-white"; // bronze
    default:
      return "bg-cool-gray/50 text-white"; // gris atténué, moins brillant que l'argent
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

function ResultDots({
  results,
  size = "md",
}: {
  results: boolean[];
  size?: "md" | "lg";
}) {
  const slots = Array.from({ length: 5 }, (_, i) => results[i]);
  const dotCls = size === "lg" ? "w-4 h-4" : "w-2.5 h-2.5";
  const gapCls = size === "lg" ? "gap-1.5" : "gap-0.5";
  return (
    <div
      className={`flex ${gapCls}`}
      role="img"
      aria-label="5 derniers résultats"
    >
      {slots.map((won, i) => {
        const cls =
          won === undefined
            ? "bg-cool-gray/30"
            : won
              ? "bg-lime"
              : "bg-signal-red";
        const title =
          won === undefined
            ? "Pas encore joué"
            : won
              ? "Victoire"
              : "Défaite";
        return (
          <div
            key={i}
            className={`${dotCls} rounded-full flex-shrink-0 ${cls}`}
            title={title}
          />
        );
      })}
    </div>
  );
}

function Avatar({
  name,
  avatarUrl,
  size = 10,
  rank,
  rankDelta,
}: {
  name: string;
  avatarUrl?: string;
  size?: 8 | 10 | 12 | 14 | 16 | 20;
  /** When set, renders a small medallion overlay on the bottom-right with the rank. */
  rank?: number;
  /** When set & non-zero, renders a small ▲/▼ badge overlay on the top-left. */
  rankDelta?: number;
}) {
  const initials = getInitials(name);
  const cls =
    size === 20
      ? "w-20 h-20 text-2xl"
      : size === 16
        ? "w-16 h-16 text-xl"
        : size === 14
          ? "w-14 h-14 text-base"
          : size === 12
            ? "w-12 h-12 text-base"
            : size === 8
              ? "w-8 h-8 text-xs"
              : "w-10 h-10 text-sm";
  const avatar = (
    <div
      className={`rounded-full bg-navy-deep flex items-center justify-center font-mono font-bold text-cool-gray overflow-hidden border border-card ${cls}`}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
  const hasRankDelta = rankDelta !== undefined && rankDelta !== 0;
  if (rank === undefined && !hasRankDelta) {
    return <div className="flex-shrink-0">{avatar}</div>;
  }
  // Échelle des médaillons : plus l'avatar est gros, plus les overlays le sont.
  const overlayCls =
    size && size >= 16
      ? "min-w-[28px] h-[28px] px-1.5 text-sm"
      : "min-w-[18px] h-[18px] px-1 text-[10px]";
  const overlayIconSize = size && size >= 16 ? 14 : 10;
  const overlayOffset = size && size >= 16 ? "-bottom-2 -right-2" : "-bottom-1 -right-1";
  const overlayOffsetTopLeft =
    size && size >= 16 ? "-top-2 -left-2" : "-top-1 -left-1";
  return (
    <div className="relative flex-shrink-0">
      {avatar}
      {rank !== undefined && (
        <div
          className={`absolute ${overlayOffset} ${overlayCls} rounded-full flex items-center justify-center font-mono font-bold ring-2 ring-navy-soft ${getRankBadgeClass(
            rank,
          )}`}
          aria-label={`Rang ${rank}`}
        >
          {rank}
        </div>
      )}
      {hasRankDelta && (
        <div
          className={`absolute ${overlayOffsetTopLeft} ${overlayCls} rounded-full flex items-center gap-0.5 justify-center font-mono font-extrabold tabular-nums ring-2 ring-navy-soft ${
            rankDelta > 0
              ? "bg-lime text-navy"
              : "bg-signal-red text-white"
          }`}
          data-testid="playercard-rank-delta"
          aria-label={`${rankDelta > 0 ? "Monté de" : "Descendu de"} ${Math.abs(
            rankDelta,
          )} ${Math.abs(rankDelta) > 1 ? "places" : "place"}`}
        >
          {rankDelta > 0 ? (
            <TrendingUp size={overlayIconSize} aria-hidden />
          ) : (
            <TrendingDown size={overlayIconSize} aria-hidden />
          )}
          {Math.abs(rankDelta)}
        </div>
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
  size?: "sm" | "md" | "lg";
}) {
  const labelCls =
    size === "sm"
      ? "text-[9px] tracking-[1px]"
      : size === "lg"
        ? "text-sm tracking-[2px]"
        : "text-[10px] tracking-widest";
  const valueCls =
    size === "sm" ? "text-xs" : size === "lg" ? "text-lg" : "text-sm";
  const gapCls = size === "lg" ? "gap-4" : "gap-2";
  return (
    <div
      className={`flex items-center ${gapCls} font-mono uppercase ${labelCls} text-cool-gray`}
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
    const isDisplay = props.size === "display";

    // Échelle "display" = TV/projecteur, sans chevron (non interactif en
    // diffusion). Mêmes tokens, juste des tailles doublées.
    const containerCls = isDisplay
      ? "flex items-center gap-6 p-6 w-full bg-navy-soft rounded-card border-[1.5px] border-card text-left"
      : `flex items-center gap-3 p-4 w-full bg-navy-soft rounded-card border border-card transition-colors hover:border-card-muted text-left ${
          props.onClick ? "cursor-pointer" : ""
        }`;
    const nameCls = isDisplay
      ? "text-3xl font-archivo font-extrabold uppercase tracking-tight text-white truncate min-w-0"
      : "text-base font-archivo font-extrabold uppercase tracking-tight text-white truncate min-w-0";
    const eloCls = isDisplay
      ? "text-4xl font-archivo font-black tabular-nums text-white tracking-[-1px]"
      : "text-base font-mono font-bold tabular-nums text-white";
    const deltaSizeCls = isDisplay
      ? "text-lg font-mono font-semibold tabular-nums"
      : "text-sm font-mono font-semibold tabular-nums";

    return (
      <Wrapper
        className={containerCls}
        data-testid="playercard-leaderrow"
        {...wrapperProps}
      >
        {/* Rank shown as medallion (bottom-right) and rank-delta as ▲/▼ badge (top-left). */}
        <Avatar
          name={props.name}
          avatarUrl={props.avatarUrl}
          size={isDisplay ? 16 : 10}
          rank={props.rank}
          rankDelta={props.rankDelta}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2 min-w-0">
            <span className={nameCls}>{props.name}</span>
            <span className="flex-shrink-0 flex items-baseline gap-2">
              {props.delta !== undefined && (
                <span
                  className={`${deltaSizeCls} ${deltaClass}`}
                  data-testid="playercard-delta"
                >
                  {props.delta >= 0 ? "+" : ""}
                  {props.delta}
                </span>
              )}
              <span className={eloCls}>{props.rightLabel ?? props.elo}</span>
            </span>
          </div>
          <div
            className={`flex items-center justify-between gap-2 min-w-0 ${
              isDisplay ? "mt-2" : "mt-0.5"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {hasStats && (
                <StatsInline
                  wins={props.wins ?? 0}
                  losses={props.losses ?? 0}
                  winRate={winRate}
                  size={isDisplay ? "lg" : "md"}
                />
              )}
            </div>
            {props.recentResults !== undefined && (
              <ResultDots
                results={props.recentResults}
                size={isDisplay ? "lg" : "md"}
              />
            )}
          </div>
        </div>

        {!isDisplay && (
          <ChevronRight
            size={20}
            className="flex-shrink-0 text-cool-gray"
            aria-hidden
          />
        )}
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
