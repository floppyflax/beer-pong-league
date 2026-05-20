/**
 * DetailedStatsPanel — onglet "Stats détaillées" partagé entre
 * LeagueDashboard et EventDashboard.
 *
 * Affiche 4 sections dérivées de `computeContextStats` : top scorers, win
 * streaks (active + record), biggest upset, top rivalries. Toutes les
 * métriques sont locales au contexte fourni (cf. invariant #8 — pas
 * d'ELO global agrégé).
 */

import { useMemo } from "react";
import { Flame, Swords, Trophy, Zap } from "lucide-react";

import { EmptyState, ListRow } from "@/components/design-system";
import {
  computeContextStats,
  type ContextMatch,
  type ContextPlayer,
  type Rivalry,
  type TopScorer,
} from "@/utils/contextStats";
import { formatRelativeTime } from "@/utils/dateUtils";

const MIN_MATCHES_TO_DISPLAY = 3;

export interface DetailedStatsPanelProps {
  matches: ContextMatch[];
  players: ContextPlayer[];
  /** Mot utilisé dans l'empty state : "league" ou "event". */
  contextLabel?: "league" | "event";
  /** Callback optionnel quand un joueur est cliqué (top scorers / rivalries). */
  onPlayerClick?: (playerId: string) => void;
}

function SectionHeader({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <h3 className="text-sm font-archivo font-extrabold uppercase tracking-tight mb-3 flex items-center gap-2 text-white">
      <span aria-hidden className="text-cool-gray">
        {icon}
      </span>
      {title}
    </h3>
  );
}

function TopScorersSection({
  scorers,
  onPlayerClick,
}: {
  scorers: TopScorer[];
  onPlayerClick?: (playerId: string) => void;
}) {
  return (
    <section>
      <SectionHeader icon={<Trophy size={18} />} title="Top scorers" />
      <div className="space-y-2">
        {scorers.map((scorer, idx) => (
          <ListRow
            key={scorer.playerId}
            variant="player"
            name={scorer.name}
            subtitle={`${scorer.wins}V - ${scorer.losses}D`}
            rank={idx + 1}
            elo={0}
            rightLabel={`${scorer.winRate}%`}
            onClick={
              onPlayerClick ? () => onPlayerClick(scorer.playerId) : undefined
            }
          />
        ))}
      </div>
    </section>
  );
}

function StreaksSection({
  active,
  record,
}: {
  active: { name: string; streak: number } | null;
  record: { name: string; streak: number } | null;
}) {
  if (!active && !record) return null;
  return (
    <section>
      <SectionHeader icon={<Flame size={18} />} title="Séries" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {active && (
          <div
            className={`p-4 rounded-card border flex items-center gap-3 ${
              active.streak >= 3
                ? "bg-ping-yellow/20 border-ping-yellow/50"
                : "bg-lime/20 border-lime/50"
            }`}
          >
            <Flame
              className={
                active.streak >= 3 ? "text-ping-yellow" : "text-lime"
              }
              size={24}
              aria-hidden
            />
            <div className="min-w-0">
              <div className="font-bold text-white truncate">{active.name}</div>
              <div className="text-xs text-cool-gray">
                Série en cours : {active.streak} V
              </div>
            </div>
          </div>
        )}
        {record && (
          <div className="p-4 rounded-card border border-card bg-navy-soft flex items-center gap-3">
            <Trophy className="text-ping-yellow" size={24} aria-hidden />
            <div className="min-w-0">
              <div className="font-bold text-white truncate">{record.name}</div>
              <div className="text-xs text-cool-gray">
                Record all-time : {record.streak} V d'affilée
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function BiggestUpsetSection({
  upset,
}: {
  upset: NonNullable<ReturnType<typeof computeContextStats>["biggestUpset"]>;
}) {
  return (
    <section>
      <SectionHeader icon={<Zap size={18} />} title="Plus gros upset" />
      <div className="bg-navy-soft p-4 rounded-card border border-card">
        <div className="flex items-baseline justify-between gap-2 mb-2">
          <div className="text-xs text-cool-gray font-mono uppercase tracking-widest">
            Écart d'ELO
          </div>
          <div className="text-stat font-mono font-bold tabular-nums text-electric-blue">
            +{upset.eloGap}
          </div>
        </div>
        <div className="text-sm text-white">
          <span className="font-bold text-lime">
            {upset.winners.map((p) => p.name).join(" & ")}
          </span>
          <span className="text-cool-gray"> ({upset.winnerAvgElo} ELO)</span>
          <span className="text-cool-gray"> ont battu </span>
          <span className="font-bold text-signal-red">
            {upset.losers.map((p) => p.name).join(" & ")}
          </span>
          <span className="text-cool-gray"> ({upset.loserAvgElo} ELO)</span>
        </div>
        <div className="text-xs text-cool-gray mt-2">
          {formatRelativeTime(upset.date)}
        </div>
      </div>
    </section>
  );
}

function RivalriesSection({
  rivalries,
  onPlayerClick,
}: {
  rivalries: Rivalry[];
  onPlayerClick?: (playerId: string) => void;
}) {
  return (
    <section>
      <SectionHeader icon={<Swords size={18} />} title="Top rivalités" />
      <div className="space-y-2">
        {rivalries.map((rivalry) => (
          <ListRow
            key={`${rivalry.playerAId}-${rivalry.playerBId}`}
            variant="player"
            name={`${rivalry.playerAName} vs ${rivalry.playerBName}`}
            subtitle={`${rivalry.winsA}V - ${rivalry.winsB}V`}
            elo={0}
            rightLabel={`${rivalry.matchesPlayed} matchs`}
            onClick={
              onPlayerClick
                ? () => onPlayerClick(rivalry.playerAId)
                : undefined
            }
          />
        ))}
      </div>
    </section>
  );
}

export function DetailedStatsPanel({
  matches,
  players,
  contextLabel = "league",
  onPlayerClick,
}: DetailedStatsPanelProps) {
  const stats = useMemo(
    () => computeContextStats(matches, players),
    [matches, players],
  );

  if (stats.totalMatches < MIN_MATCHES_TO_DISPLAY) {
    return (
      <EmptyState
        icon={<Trophy size={48} className="text-cool-gray" aria-hidden />}
        title="Pas encore de stats"
        description={`Joue au moins ${MIN_MATCHES_TO_DISPLAY} matchs dans ${
          contextLabel === "event" ? "cet event" : "cette league"
        } pour débloquer les stats détaillées.`}
        minHeight="min-h-[30vh]"
      />
    );
  }

  return (
    <div className="space-y-6">
      {stats.topScorers.length > 0 && (
        <TopScorersSection
          scorers={stats.topScorers}
          onPlayerClick={onPlayerClick}
        />
      )}
      <StreaksSection active={stats.streaks.active} record={stats.streaks.record} />
      {stats.biggestUpset && <BiggestUpsetSection upset={stats.biggestUpset} />}
      {stats.topRivalries.length > 0 && (
        <RivalriesSection
          rivalries={stats.topRivalries}
          onPlayerClick={onPlayerClick}
        />
      )}
    </div>
  );
}
