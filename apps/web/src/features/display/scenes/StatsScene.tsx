import { useMemo } from "react";
import { Avatar } from "@/components/design-system/Avatar";
import type { Match } from "@/types";
import type { DisplaySource } from "../types";

interface Props {
  source: DisplaySource;
}

interface CardPlayer {
  id: string;
  name: string;
  avatarUrl?: string;
}

/**
 * Scène stats : 3 chiffres globaux en haut + 2 récompenses joueur (Top ELO &
 * le plus assidu, avec avatar) + la tuile "match le plus serré" pleine largeur
 * (avatars d'équipe superposés + noms + heure). Borné en hauteur pour ne jamais
 * cropper, même sur écran court.
 */
export function StatsScene({ source }: Props) {
  const { kpis, closest } = useMemo(() => computeStats(source), [source]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <h2 className="font-archivo font-black uppercase tracking-[-0.6px] text-xl md:text-3xl mb-4 flex-shrink-0">
        En chiffres
      </h2>

      <div className="flex-1 min-h-0 grid grid-rows-[1fr_1fr_auto] gap-3 md:gap-4">
        {/* Ligne 1 : 3 chiffres globaux */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 min-h-0">
          <KpiTile kpi={kpis[0]} />
          <KpiTile kpi={kpis[1]} />
          <KpiTile kpi={kpis[2]} />
        </div>
        {/* Ligne 2 : 2 récompenses joueur (Top ELO + le plus assidu) */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 min-h-0">
          <KpiTile kpi={kpis[3]} />
          <KpiTile kpi={kpis[4]} />
        </div>

        {/* Match le plus serré — pleine largeur */}
        <ClosestMatchTile closest={closest} />
      </div>
    </div>
  );
}

interface Kpi {
  label: string;
  value: string;
  sub?: string;
  colorClass: string;
  /** Quand présent, on affiche l'avatar + le nom du joueur cité. */
  player?: CardPlayer;
}

function KpiTile({ kpi }: { kpi: Kpi }) {
  return (
    <div className="bg-navy-soft border-[1.5px] border-card rounded-card p-4 md:p-6 flex flex-col justify-center min-h-0 overflow-hidden">
      <div className="font-mono text-[10px] md:text-xs uppercase tracking-[2px] text-cool-gray font-bold mb-2">
        {kpi.label}
      </div>
      <div
        className={`font-archivo font-black tabular-nums leading-none truncate ${kpi.colorClass}`}
        style={{ fontSize: "clamp(36px, 7vh, 72px)", letterSpacing: "-2px" }}
      >
        {kpi.value}
      </div>
      {kpi.player ? (
        <div className="flex items-center gap-2 mt-2 min-w-0">
          <Avatar
            name={kpi.player.name}
            src={kpi.player.avatarUrl}
            size="sm"
            tone="deep"
            className="ring-2 ring-navy-soft"
          />
          <span className="font-archivo font-extrabold uppercase tracking-tight text-white truncate text-sm md:text-lg">
            {kpi.player.name}
          </span>
        </div>
      ) : kpi.sub ? (
        <div className="font-mono text-[10px] md:text-xs uppercase tracking-[2px] text-cool-gray mt-2 truncate">
          {kpi.sub}
        </div>
      ) : null}
    </div>
  );
}

interface ClosestMatch {
  teamA: CardPlayer[];
  teamB: CardPlayer[];
  scoreA: number;
  scoreB: number;
  time: string;
  gap: number;
}

function ClosestTeam({
  players,
  align,
}: {
  players: CardPlayer[];
  align: "left" | "right";
}) {
  const isRight = align === "right";
  return (
    <div
      className={`flex-1 min-w-0 flex items-center gap-2 md:gap-3 ${
        isRight ? "flex-row-reverse" : ""
      }`}
    >
      {/* Avatars superposés (photo quand dispo, sinon initiales) */}
      <div className={`flex flex-shrink-0 ${isRight ? "flex-row-reverse" : ""}`}>
        {players.slice(0, 2).map((p, i) => (
          <Avatar
            key={p.id}
            name={p.name}
            src={p.avatarUrl}
            size="sm"
            tone="deep"
            className={i > 0 ? "-ml-3 ring-2 ring-navy-soft" : "ring-2 ring-navy-soft"}
          />
        ))}
      </div>
      <div
        className={`min-w-0 flex flex-col ${
          isRight ? "items-end text-right" : "items-start text-left"
        }`}
      >
        {players.map((p) => (
          <span
            key={p.id}
            className="truncate max-w-full font-archivo font-extrabold uppercase tracking-tight text-white text-base md:text-2xl leading-tight"
            title={p.name}
          >
            {p.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function ClosestMatchTile({ closest }: { closest: ClosestMatch | null }) {
  return (
    <div className="bg-navy-soft border-[1.5px] border-card rounded-card p-4 md:p-6 flex flex-col justify-center min-h-0 overflow-hidden">
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="font-mono text-[10px] md:text-xs uppercase tracking-[2px] text-lime font-bold">
          Match le plus serré
        </span>
        {closest && (
          <span className="font-mono text-[10px] md:text-xs uppercase tracking-[2px] text-cool-gray">
            {closest.time} · {closest.gap === 1 ? "1 cup" : `${closest.gap} cups`} d'écart
          </span>
        )}
      </div>
      {closest ? (
        <div className="flex items-center justify-center gap-3 md:gap-5">
          <ClosestTeam players={closest.teamA} align="left" />
          <span
            className="font-archivo font-black tabular-nums text-lime leading-none flex-shrink-0"
            style={{ fontSize: "clamp(32px, 7vh, 72px)", letterSpacing: "-2px" }}
          >
            {Math.max(closest.scoreA, closest.scoreB)}
            <span className="text-cool-gray">-</span>
            {Math.min(closest.scoreA, closest.scoreB)}
          </span>
          <ClosestTeam players={closest.teamB} align="right" />
        </div>
      ) : (
        <p className="font-mono text-xs uppercase tracking-[2px] text-cool-gray text-center py-2">
          Pas encore de match
        </p>
      )}
    </div>
  );
}

function computeStats(source: DisplaySource): {
  kpis: Kpi[];
  closest: ClosestMatch | null;
} {
  const matchesCount = source.matchesPlayedCount;
  const activePlayers = source.players.filter(
    (p) => p.wins + p.losses > 0,
  ).length;
  const totalCups = source.matches.reduce(
    (acc, m) => acc + m.scoreA + m.scoreB,
    0,
  );

  // Match le plus serré
  let closestMatch: Match | null = null;
  let closestGap = Infinity;
  for (const m of source.matches) {
    const d = Math.abs(m.scoreA - m.scoreB);
    if (d > 0 && d < closestGap) {
      closestGap = d;
      closestMatch = m;
    }
  }

  const toCardPlayer = (id: string): CardPlayer => {
    const p = source.players.find((sp) => sp.id === id);
    return { id, name: p?.name ?? "Joueur", avatarUrl: p?.avatarUrl };
  };

  const closest: ClosestMatch | null = closestMatch
    ? {
        teamA: closestMatch.teamA.map(toCardPlayer),
        teamB: closestMatch.teamB.map(toCardPlayer),
        scoreA: closestMatch.scoreA,
        scoreB: closestMatch.scoreB,
        time: new Date(closestMatch.date).toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        gap: closestGap,
      }
    : null;

  const topPlayer = source.players[0];
  const topElo = topPlayer?.elo ?? 0;

  // Joueur le plus assidu : plus grand nombre de matchs joués (wins + losses).
  // Égalité tranchée par nom pour un affichage déterministe.
  const mostPlayed = [...source.players]
    .filter((p) => p.wins + p.losses > 0)
    .sort((a, b) => {
      const diff = b.wins + b.losses - (a.wins + a.losses);
      return diff !== 0 ? diff : a.name.localeCompare(b.name);
    })[0];
  const mostPlayedCount = mostPlayed ? mostPlayed.wins + mostPlayed.losses : 0;

  const kpis: Kpi[] = [
    { label: "Matchs joués", value: String(matchesCount), colorClass: "text-white" },
    {
      label: "Joueurs actifs",
      value: String(activePlayers),
      sub: `sur ${source.players.length} inscrits`,
      colorClass: "text-electric-blue",
    },
    { label: "Cups encaissés", value: String(totalCups), colorClass: "text-ping-yellow" },
    {
      label: "Top ELO",
      value: String(topElo),
      colorClass: "text-ping-yellow",
      player: topPlayer
        ? { id: topPlayer.id, name: topPlayer.name, avatarUrl: topPlayer.avatarUrl }
        : undefined,
    },
    {
      label: "Plus de matchs",
      value: String(mostPlayedCount),
      colorClass: "text-lime",
      player: mostPlayed
        ? { id: mostPlayed.id, name: mostPlayed.name, avatarUrl: mostPlayed.avatarUrl }
        : undefined,
    },
  ];

  return { kpis, closest };
}
