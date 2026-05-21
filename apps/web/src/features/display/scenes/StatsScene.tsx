import { useMemo } from "react";
import type { Match } from "@/types";
import type { DisplaySource } from "../types";

interface Props {
  source: DisplaySource;
}

/**
 * Scène stats : 4 KPIs compacts en 2×2 + la tuile "match le plus serré" en
 * pleine largeur dessous (elle loge les noms des équipes + l'heure).
 * Tout est borné en hauteur pour ne jamais cropper, même sur écran court.
 */
export function StatsScene({ source }: Props) {
  const { kpis, closest } = useMemo(() => computeStats(source), [source]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <h2 className="font-archivo font-black uppercase tracking-[-0.6px] text-xl md:text-3xl mb-4 flex-shrink-0">
        En chiffres
      </h2>

      <div className="flex-1 min-h-0 grid grid-rows-[1fr_1fr_auto] gap-3 md:gap-4">
        {/* 2 lignes de 2 KPIs compacts */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 min-h-0">
          <KpiTile kpi={kpis[0]} />
          <KpiTile kpi={kpis[1]} />
        </div>
        <div className="grid grid-cols-2 gap-3 md:gap-4 min-h-0">
          <KpiTile kpi={kpis[2]} />
          <KpiTile kpi={kpis[3]} />
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
      {kpi.sub && (
        <div className="font-mono text-[10px] md:text-xs uppercase tracking-[2px] text-cool-gray mt-2 truncate">
          {kpi.sub}
        </div>
      )}
    </div>
  );
}

interface ClosestMatch {
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  time: string;
  gap: number;
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
        <div className="flex items-center justify-center gap-4 md:gap-6">
          <span className="flex-1 text-right font-archivo font-extrabold uppercase tracking-tight text-white truncate text-lg md:text-2xl">
            {closest.teamA}
          </span>
          <span
            className="font-archivo font-black tabular-nums text-lime leading-none flex-shrink-0"
            style={{ fontSize: "clamp(36px, 8vh, 80px)", letterSpacing: "-2px" }}
          >
            {Math.max(closest.scoreA, closest.scoreB)}
            <span className="text-cool-gray">-</span>
            {Math.min(closest.scoreA, closest.scoreB)}
          </span>
          <span className="flex-1 text-left font-archivo font-extrabold uppercase tracking-tight text-white truncate text-lg md:text-2xl">
            {closest.teamB}
          </span>
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

  const playerName = (id: string) =>
    source.players.find((p) => p.id === id)?.name ?? "Joueur";

  const closest: ClosestMatch | null = closestMatch
    ? {
        teamA: closestMatch.teamA.map(playerName).join(" & "),
        teamB: closestMatch.teamB.map(playerName).join(" & "),
        scoreA: closestMatch.scoreA,
        scoreB: closestMatch.scoreB,
        time: new Date(closestMatch.date).toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        gap: closestGap,
      }
    : null;

  const topElo = source.players[0]?.elo ?? 0;
  const topName = source.players[0]?.name ?? "—";

  const kpis: Kpi[] = [
    { label: "Matchs joués", value: String(matchesCount), colorClass: "text-white" },
    {
      label: "Joueurs actifs",
      value: String(activePlayers),
      sub: `sur ${source.players.length} inscrits`,
      colorClass: "text-electric-blue",
    },
    { label: "Cups encaissés", value: String(totalCups), colorClass: "text-ping-yellow" },
    { label: "Top ELO", value: String(topElo), sub: topName, colorClass: "text-ping-yellow" },
  ];

  return { kpis, closest };
}
