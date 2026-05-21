import { TrendingDown, TrendingUp } from "lucide-react";
import type { DisplaySource } from "../types";

interface Props {
  source: DisplaySource;
}

/**
 * Scène "Match qui vient de tomber" : grand format, équipe A vs B, ELO delta
 * par joueur. Si pas encore de match, fallback "En attente du premier match".
 */
export function LiveMatchScene({ source }: Props) {
  const last = source.matches[0];

  if (!last) {
    return (
      <div className="flex flex-col h-full min-h-0 items-center justify-center">
        <p className="font-archivo font-black uppercase tracking-tight text-3xl text-cool-gray text-center">
          En attente du premier match
        </p>
        <p className="font-mono text-xs uppercase tracking-[2px] text-cool-gray/70 mt-3">
          Le score live apparaîtra ici
        </p>
      </div>
    );
  }

  const winnerA = last.scoreA > last.scoreB;
  const teamA = last.teamA.map((id) => ({
    id,
    name: source.players.find((p) => p.id === id)?.name ?? "Joueur",
    delta: last.eloChanges?.[id] ?? 0,
  }));
  const teamB = last.teamB.map((id) => ({
    id,
    name: source.players.find((p) => p.id === id)?.name ?? "Joueur",
    delta: last.eloChanges?.[id] ?? 0,
  }));

  return (
    <div className="flex flex-col h-full min-h-0">
      <h2 className="font-archivo font-black uppercase tracking-[-0.6px] text-xl md:text-3xl mb-4 flex-shrink-0">
        Dernier match
      </h2>

      <div className="flex-1 grid grid-cols-2 gap-6 min-h-0 items-center">
        <TeamCard team={teamA} score={last.scoreA} isWinner={winnerA} />
        <TeamCard team={teamB} score={last.scoreB} isWinner={!winnerA} />
      </div>

      <div className="flex-shrink-0 bg-navy-soft border border-card rounded-card px-4 py-3 mt-4 flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-[2px] text-cool-gray font-bold">
          {new Date(last.date).toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        <span className="font-mono text-xs uppercase tracking-[2px] text-cool-gray">
          {source.matchesPlayedCount} matchs ce soir
        </span>
      </div>
    </div>
  );
}

function TeamCard({
  team,
  score,
  isWinner,
}: {
  team: { id: string; name: string; delta: number }[];
  score: number;
  isWinner: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center h-full rounded-card border-[1.5px] p-8 ${
        isWinner
          ? "bg-lime/10 border-lime shadow-[0_3px_0_#8BCC1F]"
          : "bg-signal-red/10 border-signal-red shadow-[0_3px_0_#C42418]"
      }`}
    >
      <div className="font-mono text-xs uppercase tracking-[3px] mb-4 opacity-70">
        {isWinner ? "Vainqueur" : "Battu"}
      </div>
      <div
        className={`font-archivo font-black tabular-nums leading-none mb-6 ${
          isWinner ? "text-lime" : "text-signal-red"
        }`}
        style={{ fontSize: "min(200px, 22vh)", letterSpacing: "-6px" }}
      >
        {score}
      </div>
      <div className="space-y-2 w-full">
        {team.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between gap-3 font-archivo font-extrabold uppercase tracking-tight text-xl md:text-2xl"
          >
            <span className="truncate">{p.name}</span>
            {p.delta !== 0 && (
              <span
                className={`flex items-center gap-1 text-base tabular-nums ${
                  p.delta > 0 ? "text-lime" : "text-signal-red"
                }`}
              >
                {p.delta > 0 ? (
                  <TrendingUp size={16} />
                ) : (
                  <TrendingDown size={16} />
                )}
                {p.delta > 0 ? "+" : ""}
                {p.delta}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
