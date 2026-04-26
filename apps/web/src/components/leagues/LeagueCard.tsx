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
 * LeagueCard — carton press, aligné sur EventCard (ponglo).
 */
export const LeagueCard: React.FC<LeagueCardProps> = ({ league }) => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { localUser } = useIdentity();

  const handleClick = () => {
    navigate(`/league/${league.id}`);
  };

  const isOwner =
    (user && user.id === league.creator_user_id) ||
    (localUser &&
      localUser.anonymousUserId === league.creator_anonymous_user_id);

  const lastActivity = formatRelativeTime(league.updatedAt);
  const isFinished = league.status === "finished";

  const badgeLabel = isFinished ? "Terminée" : "Active";
  const badgeColor = isFinished ? "text-cool-gray" : "text-lime";
  const dotColor = isFinished ? "bg-cool-gray" : "bg-lime";

  return (
    <button
      type="button"
      data-testid="league-card"
      onClick={handleClick}
      aria-label={`Voir la league ${league.name}`}
      className="w-full text-left bg-navy-soft border-[1.5px] border-white rounded-lg p-4 shadow-[0_3px_0_#F4F2E8] hover:brightness-110 transition-[filter] duration-75 active:translate-y-[2px] active:shadow-none"
    >
      {/* Header: status pill + title */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`}
              style={
                !isFinished
                  ? { boxShadow: "0 0 0 4px rgba(183,255,59,0.18)" }
                  : undefined
              }
            />
            <span
              className={`font-mono text-[10px] tracking-[1.5px] uppercase font-bold ${badgeColor}`}
            >
              {badgeLabel}
            </span>
            {isOwner && (
              <span className="font-mono text-[10px] tracking-[1.5px] uppercase font-bold text-ping-yellow">
                · Propriétaire
              </span>
            )}
          </div>
          <div className="font-archivo font-extrabold text-xl tracking-[-0.4px] truncate text-white">
            {league.name}
          </div>
        </div>

        <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
          <ChevronRight size={18} className="text-white" />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-baseline gap-5 mt-3">
        <div>
          <div className="font-archivo font-extrabold text-lg text-white leading-none">
            {league.member_count}
          </div>
          <div className="text-[11px] uppercase tracking-[1px] text-cool-gray mt-1">
            {league.member_count === 1 ? "Membre" : "Membres"}
          </div>
        </div>
        <div>
          <div className="font-archivo font-extrabold text-lg text-white leading-none">
            {league.tournament_count}
          </div>
          <div className="text-[11px] uppercase tracking-[1px] text-cool-gray mt-1">
            {league.tournament_count === 1 ? "Événement" : "Événements"}
          </div>
        </div>
        <div className="min-w-0">
          <div className="font-archivo font-extrabold text-lg text-electric-blue leading-none truncate">
            {lastActivity}
          </div>
          <div className="text-[11px] uppercase tracking-[1px] text-cool-gray mt-1">
            Activité
          </div>
        </div>
      </div>
    </button>
  );
};
