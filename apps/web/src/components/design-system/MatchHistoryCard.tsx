import { ArrowUp, ArrowDown } from "lucide-react";
import { Avatar } from "./Avatar";
import { LiveMatchBadge } from "@/components/live/LiveMatchBadge";
import { MatchEnrichedDisplay } from "@/components/MatchEnrichedDisplay";

export interface MatchHistoryCardPlayer {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

export interface MatchHistoryCardProps {
  teamA: MatchHistoryCardPlayer[];
  teamB: MatchHistoryCardPlayer[];
  scoreA: number;
  scoreB: number;
  date: string;
  eloChanges?: Record<string, number>;
  /** Player IDs of the current viewer; their team is rendered on the left. */
  currentPlayerIds?: string[];
  isLive?: boolean;
  cupsRemaining?: number | null;
  photoUrl?: string | null;
}

function getRelativeTimestamp(date: string): string {
  const now = new Date();
  const matchDate = new Date(date);
  const diffMs = now.getTime() - matchDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 1)
    return `Hier à ${matchDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  if (diffDays < 7)
    return `${diffDays}j à ${matchDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  return matchDate.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sumTeamElo(
  team: MatchHistoryCardPlayer[],
  changes?: Record<string, number>,
): number | null {
  if (!changes) return null;
  let total = 0;
  let hasAny = false;
  for (const player of team) {
    const change = changes[player.id];
    if (typeof change === "number") {
      total += change;
      hasAny = true;
    }
  }
  return hasAny ? total : null;
}

const MAX_VISIBLE_AVATARS = 2;

function StackedAvatars({ players }: { players: MatchHistoryCardPlayer[] }) {
  const visible = players.slice(0, MAX_VISIBLE_AVATARS);
  const overflow = players.length - visible.length;

  return (
    <div className="flex flex-shrink-0 items-center">
      {visible.map((player, index) => (
        <Avatar
          key={player.id}
          name={player.name}
          src={player.avatarUrl ?? undefined}
          size="xs"
          className={
            index > 0
              ? "-ml-2 ring-2 ring-navy-soft"
              : "ring-2 ring-navy-soft"
          }
        />
      ))}
      {overflow > 0 && (
        <div
          className="-ml-2 w-6 h-6 rounded-full bg-navy-deep ring-2 ring-navy-soft flex items-center justify-center text-[10px] font-bold text-cool-gray"
          aria-label={`${overflow} joueur${overflow > 1 ? "s" : ""} de plus`}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}

interface TeamLineProps {
  players: MatchHistoryCardPlayer[];
  isWinner: boolean;
  score: number;
}

function TeamLine({ players, isWinner, score }: TeamLineProps) {
  const names = players.map((p) => p.name).join(", ");
  return (
    <div className="flex items-center gap-2 min-w-0">
      <StackedAvatars players={players} />
      <div
        className={`flex-1 min-w-0 truncate text-sm ${
          isWinner ? "text-white font-semibold" : "text-cool-gray font-medium"
        }`}
      >
        {names}
      </div>
      <div
        className={`flex-shrink-0 font-display text-2xl leading-none tabular-nums ${
          isWinner ? "text-white" : "text-cool-gray"
        }`}
      >
        {score}
      </div>
    </div>
  );
}

export function MatchHistoryCard({
  teamA,
  teamB,
  scoreA,
  scoreB,
  date,
  eloChanges,
  currentPlayerIds,
  isLive,
  cupsRemaining,
  photoUrl,
}: MatchHistoryCardProps) {
  const userInA =
    currentPlayerIds?.some((id) => teamA.some((p) => p.id === id)) ?? false;
  const userInB =
    currentPlayerIds?.some((id) => teamB.some((p) => p.id === id)) ?? false;
  const swap = userInB && !userInA;

  const leftTeam = swap ? teamB : teamA;
  const rightTeam = swap ? teamA : teamB;
  const leftScore = swap ? scoreB : scoreA;
  const rightScore = swap ? scoreA : scoreB;
  const leftWon = leftScore > rightScore;

  const leftElo = sumTeamElo(leftTeam, eloChanges);

  const accentClass = leftWon ? "bg-lime" : "bg-signal-red";

  return (
    <div
      className="relative bg-navy-soft rounded-xl border border-card/50 overflow-hidden"
      data-testid="match-history-card"
    >
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${accentClass}`}
        aria-hidden="true"
      />

      <div className="pl-4 pr-4 py-3">
        {isLive && <LiveMatchBadge isLive className="mb-2" />}

        <div className="space-y-1.5">
          <TeamLine players={leftTeam} isWinner={leftWon} score={leftScore} />
          <TeamLine
            players={rightTeam}
            isWinner={!leftWon}
            score={rightScore}
          />
        </div>

        <div className="flex items-center justify-between mt-2 gap-2">
          <span className="text-[10px] uppercase tracking-wider text-cool-gray font-semibold">
            {getRelativeTimestamp(date)}
          </span>
          {leftElo !== null && (
            <span
              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-bold tabular-nums ${
                leftElo >= 0
                  ? "bg-lime/20 text-lime"
                  : "bg-signal-red/20 text-signal-red"
              }`}
              aria-label={`Variation ELO ${leftElo >= 0 ? "+" : ""}${leftElo}`}
            >
              {leftElo >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
              {Math.abs(leftElo)}
            </span>
          )}
        </div>

        <MatchEnrichedDisplay
          photoUrl={photoUrl}
          cupsRemaining={cupsRemaining}
        />
      </div>
    </div>
  );
}
