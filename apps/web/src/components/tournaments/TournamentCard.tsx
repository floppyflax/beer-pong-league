import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { Tournament } from "../../types";

interface TournamentCardProps {
  tournament: Tournament;
  /** When false, card is display-only (no click, no navigation). Default: true */
  interactive?: boolean;
}

/**
 * TournamentCard Component
 *
 * Displays a tournament card with:
 * - Header: [Title bold white] [Badge ACTIF / TERMINÉ]
 * - Middle: Date
 * - Bottom: 3 columns (Matchs, Joueurs, Format) + chevron navigation
 * - Container: bg-gradient-card, rounded-xl p-6, border-slate-700/50
 *
 * Clicks navigate to /tournament/:id (keyboard accessible: Enter/Space)
 */
export const TournamentCard: React.FC<TournamentCardProps> = ({
  tournament,
  interactive = true,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (interactive) {
      navigate(`/tournament/${tournament.id}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (interactive && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      handleClick();
    }
  };

  const playerCount = tournament.playerIds?.length || 0;
  const matchCount = tournament.matches?.length || 0;

  const tournamentDate = tournament.date
    ? new Date(tournament.date).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Date non définie";

  const formatLabel =
    tournament.format === "libre"
      ? "Libre"
      : tournament.format.toUpperCase().replace("V", "v");

  const containerClasses = interactive
    ? "bg-gradient-card backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 cursor-pointer transition-all hover:border-primary hover:shadow-lg hover:shadow-primary/20 active:scale-95"
    : "bg-gradient-card backdrop-blur-sm rounded-xl p-6 border border-slate-700/50";

  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? handleClick : undefined}
      onKeyDown={interactive ? handleKeyDown : undefined}
      className={containerClasses}
      data-testid="tournament-card"
      aria-label={
        interactive ? `Voir le tournoi ${tournament.name}` : undefined
      }
    >
      {/* Header: Title + Badge */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-lg font-bold text-white truncate flex-1 min-w-0">
          {tournament.name}
        </h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap shrink-0 ${
            tournament.isFinished
              ? "bg-slate-700 text-slate-300"
              : "bg-green-500/20 text-green-400"
          }`}
        >
          {tournament.isFinished ? "TERMINÉ" : "ACTIF"}
        </span>
      </div>

      {/* Middle: Date */}
      <p className="text-sm text-slate-400 mb-4">{tournamentDate}</p>

      {/* Bottom: 3 stats columns + chevron (decorative, no nested button) */}
      <div className="flex items-end justify-between gap-4">
        <div className="flex gap-6 flex-1 min-w-0">
          <div>
            <p className="text-lg font-bold text-white">{matchCount}</p>
            <p className="text-xs text-slate-400">Matchs</p>
          </div>
          <div>
            <p className="text-lg font-bold text-white">{playerCount}</p>
            <p className="text-xs text-slate-400">Joueurs</p>
          </div>
          <div>
            <p className="text-lg font-bold text-blue-400">{formatLabel}</p>
            <p className="text-xs text-slate-400">Format</p>
          </div>
        </div>
        {interactive ? (
          <span
            className="shrink-0 w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white"
            aria-hidden
            data-testid="tournament-card-chevron"
          >
            <ChevronRight size={20} />
          </span>
        ) : null}
      </div>
    </div>
  );
};
