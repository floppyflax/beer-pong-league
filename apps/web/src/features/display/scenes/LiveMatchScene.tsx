import { TrendingDown, TrendingUp } from "lucide-react";
import { getInitials } from "@/utils/string";
import type { DisplaySource } from "../types";

interface Props {
  source: DisplaySource;
}

interface TeamPlayer {
  id: string;
  name: string;
  avatarUrl?: string;
  delta: number;
}

/**
 * Scène "Match qui vient de tomber" : grand format, équipe A vs B, avatars +
 * noms des joueurs, et **un seul** delta ELO par équipe (gagné côté vainqueur,
 * perdu côté battu). Si pas encore de match, fallback.
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
  const toTeam = (ids: string[]): TeamPlayer[] =>
    ids.map((id) => {
      const p = source.players.find((sp) => sp.id === id);
      return {
        id,
        name: p?.name ?? "Joueur",
        avatarUrl: p?.avatarUrl,
        delta: last.eloChanges?.[id] ?? 0,
      };
    });
  const teamA = toTeam(last.teamA);
  const teamB = toTeam(last.teamB);

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

/** Delta ELO représentatif de l'équipe : moyenne arrondie des deltas joueurs
 *  (égal à la valeur commune en 1v1 ou quand le K-factor est uniforme). */
function teamDelta(team: TeamPlayer[]): number {
  const withDelta = team.filter((p) => p.delta !== 0);
  if (withDelta.length === 0) return 0;
  const sum = withDelta.reduce((acc, p) => acc + p.delta, 0);
  return Math.round(sum / withDelta.length);
}

function PlayerAvatar({ player }: { player: TeamPlayer }) {
  return (
    <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-navy-deep flex items-center justify-center font-mono font-bold text-white overflow-hidden border-2 border-card flex-shrink-0 text-lg">
      {player.avatarUrl ? (
        <img
          src={player.avatarUrl}
          alt=""
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{getInitials(player.name)}</span>
      )}
    </div>
  );
}

function TeamCard({
  team,
  score,
  isWinner,
}: {
  team: TeamPlayer[];
  score: number;
  isWinner: boolean;
}) {
  const delta = teamDelta(team);
  return (
    <div
      className={`flex flex-col items-center justify-center h-full rounded-card border-[1.5px] p-6 md:p-8 ${
        isWinner
          ? "bg-lime/10 border-lime shadow-[0_3px_0_#8BCC1F]"
          : "bg-signal-red/10 border-signal-red shadow-[0_3px_0_#C42418]"
      }`}
    >
      <div className="font-mono text-xs uppercase tracking-[3px] mb-3 opacity-70">
        {isWinner ? "Vainqueur" : "Battu"}
      </div>
      <div
        className={`font-archivo font-black tabular-nums leading-none mb-3 ${
          isWinner ? "text-lime" : "text-signal-red"
        }`}
        style={{ fontSize: "min(180px, 20vh)", letterSpacing: "-6px" }}
      >
        {score}
      </div>

      {/* Un seul delta ELO pour toute l'équipe */}
      {delta !== 0 && (
        <div
          className={`flex items-center gap-1.5 font-archivo font-black tabular-nums mb-5 text-2xl md:text-3xl ${
            delta > 0 ? "text-lime" : "text-signal-red"
          }`}
        >
          {delta > 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
          {delta > 0 ? "+" : ""}
          {delta} ELO
        </div>
      )}

      {/* Avatars + noms */}
      <div className="flex flex-col items-center gap-3 w-full">
        {team.map((p) => (
          <div key={p.id} className="flex items-center gap-3 max-w-full">
            <PlayerAvatar player={p} />
            <span className="font-archivo font-extrabold uppercase tracking-tight text-white truncate text-2xl md:text-4xl">
              {p.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
