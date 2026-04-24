import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { LeagueListItem } from "@/hooks/useLeaguesList";
import { formatRelativeTime } from "@/utils/dateUtils";
import { useAuthContext } from "@/context/AuthContext";
import { useIdentity } from "@/hooks/useIdentity";

interface LeagueCardProps {
  league: LeagueListItem;
}

/**
 * LeagueCard Component
 *
 * Displays a league card aligned with TournamentCard format (design system 5.1).
 * Structure: header (title + badge), middle (date/activity), bottom (3 stats + chevron).
 *
 * - Header: Title + Badge (ACTIF / TERMINÉE) + owner badge if applicable
 * - Middle: Dernière activité
 * - Bottom: 3 columns (Membres, Tournois, Activité) + chevron
 *
 * Clicks navigate to /league/:id
 */
export const LeagueCard: React.FC<LeagueCardProps> = ({ league }) => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { localUser } = useIdentity();

  const handleClick = () => {
    navigate(`/league/${league.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  // Check if current user is the owner (authenticated or anonymous)
  const isOwner =
    (user && user.id === league.creator_user_id) ||
    (localUser &&
      localUser.anonymousUserId === league.creator_anonymous_user_id);

  const lastActivity = formatRelativeTime(league.updatedAt);
  const createdDateRaw = league.createdAt
    ? new Date(league.createdAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";
  const createdDate =
    createdDateRaw && createdDateRaw !== "Invalid Date"
      ? createdDateRaw
      : "Date inconnue";

  return (
    <div
      data-testid="league-card"
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="bg-gradient-card backdrop-blur-sm rounded-xl p-6 border border-card/50 cursor-pointer transition-all hover:border-signal-red hover:shadow-lg hover:shadow-primary/20 active:scale-95"
      aria-label={`Voir la league ${league.name}`}
    >
      {/* Header: Title + Badge (format TournamentCard) */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white truncate">
            {league.name}
          </h3>
          {isOwner && (
            <span className="text-xs text-cool-gray mt-0.5">
              👑 Propriétaire
            </span>
          )}
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap shrink-0 ${
            league.status === "finished"
              ? "bg-navy-deep text-cool-gray"
              : "bg-green-500/20 text-green-400"
          }`}
        >
          {league.status === "finished" ? "TERMINÉE" : "ACTIF"}
        </span>
      </div>

      {/* Middle: Date (format TournamentCard) */}
      <p className="text-sm text-cool-gray mb-4">Créée le {createdDate}</p>

      {/* Bottom: 3 stats columns + chevron (format TournamentCard) */}
      <div className="flex items-end justify-between gap-4">
        <div className="flex gap-6 flex-1 min-w-0">
          <div>
            <p className="text-lg font-bold text-white">
              {league.member_count}
            </p>
            <p className="text-xs text-cool-gray">
              {league.member_count === 1 ? "Membre" : "Membres"}
            </p>
          </div>
          <div>
            <p className="text-lg font-bold text-white">
              {league.tournament_count}
            </p>
            <p className="text-xs text-cool-gray">
              {league.tournament_count === 1 ? "Tournoi" : "Tournois"}
            </p>
          </div>
          <div>
            <p className="text-lg font-bold text-blue-400">{lastActivity}</p>
            <p className="text-xs text-cool-gray">Dern. activité</p>
          </div>
        </div>
        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          className="shrink-0 w-10 h-10 rounded-full bg-navy-deep flex items-center justify-center text-white hover:bg-navy-soft transition-colors"
          aria-hidden
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};
