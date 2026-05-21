import { useMemo } from "react";
import type { DisplaySource } from "../types";

interface Props {
  source: DisplaySource;
}

/**
 * Scène stats : 4-6 KPIs en grille, mis en scène en grands chiffres.
 */
export function StatsScene({ source }: Props) {
  const kpis = useMemo(() => computeKpis(source), [source]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <h2 className="font-archivo font-black uppercase tracking-[-0.6px] text-xl md:text-3xl mb-4 flex-shrink-0">
        En chiffres
      </h2>

      <div className="flex-1 grid grid-cols-2 gap-4 md:gap-6 min-h-0 items-stretch">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-navy-soft border-[1.5px] border-card rounded-card p-6 md:p-8 flex flex-col justify-center"
          >
            <div className="font-mono text-xs md:text-sm uppercase tracking-[2px] text-cool-gray font-bold mb-3">
              {kpi.label}
            </div>
            <div
              className={`font-archivo font-black tabular-nums leading-none ${kpi.colorClass}`}
              style={{ fontSize: "min(96px, 12vh)", letterSpacing: "-3px" }}
            >
              {kpi.value}
            </div>
            {kpi.sub && (
              <div className="font-mono text-xs uppercase tracking-[2px] text-cool-gray mt-3">
                {kpi.sub}
              </div>
            )}
          </div>
        ))}
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

function computeKpis(source: DisplaySource): Kpi[] {
  const matchesCount = source.matchesPlayedCount;
  const activePlayers = source.players.filter(
    (p) => p.wins + p.losses > 0,
  ).length;
  const totalCups = source.matches.reduce(
    (acc, m) => acc + m.scoreA + m.scoreB,
    0,
  );

  // Match le plus serré
  let closestDelta = Infinity;
  let closestMatchScore = "";
  for (const m of source.matches) {
    const d = Math.abs(m.scoreA - m.scoreB);
    if (d > 0 && d < closestDelta) {
      closestDelta = d;
      closestMatchScore = `${Math.max(m.scoreA, m.scoreB)}-${Math.min(
        m.scoreA,
        m.scoreB,
      )}`;
    }
  }
  if (!isFinite(closestDelta)) closestMatchScore = "—";

  // Plus haut ELO atteint
  const topElo = source.players[0]?.elo ?? 0;
  const topName = source.players[0]?.name ?? "—";

  return [
    {
      label: "Matchs joués",
      value: String(matchesCount),
      colorClass: "text-white",
    },
    {
      label: "Joueurs actifs",
      value: String(activePlayers),
      sub: `sur ${source.players.length} inscrits`,
      colorClass: "text-electric-blue",
    },
    {
      label: "Cups encaissés",
      value: String(totalCups),
      colorClass: "text-ping-yellow",
    },
    {
      label: "Match le plus serré",
      value: closestMatchScore,
      sub: closestDelta === 1 ? "1 cup d'écart" : `${closestDelta} cups d'écart`,
      colorClass: "text-lime",
    },
    {
      label: "Top ELO",
      value: String(topElo),
      sub: topName,
      colorClass: "text-ping-yellow",
    },
    {
      label: "Code event",
      value: source.joinCode ?? "—",
      sub: "Scan pour rejoindre",
      colorClass: "text-electric-blue",
    },
  ];
}
