/**
 * LeagueCard — listing pressed-card pour une ligue.
 *
 * Construit sur `CardShell` (partagé avec `EventCard`).
 * Header : pill statut (Active / Terminée) + Propriétaire si owner.
 * Body : 3 colonnes de stats — membres, événements, dernière activité.
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import type { LeagueListItem } from "@/hooks/useLeaguesList";
import { formatRelativeTime } from "@/utils/dateUtils";
import { useAuthContext } from "@/context/AuthContext";
import { useIdentity } from "@/hooks/useIdentity";
import { CardShell } from "./CardShell";

export interface LeagueCardProps {
  league: LeagueListItem;
}

export const LeagueCard: React.FC<LeagueCardProps> = ({ league }) => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { localUser } = useIdentity();

  const isOwner =
    (user && user.id === league.creator_user_id) ||
    (localUser &&
      localUser.anonymousUserId === league.creator_anonymous_user_id);

  const lastActivity = formatRelativeTime(league.updatedAt);
  const isFinished = league.status === "finished";

  const body = (
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
          {league.event_count}
        </div>
        <div className="text-[11px] uppercase tracking-[1px] text-cool-gray mt-1">
          {league.event_count === 1 ? "Événement" : "Événements"}
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
  );

  return (
    <CardShell
      title={league.name}
      status={{
        label: isFinished ? "Terminée" : "Active",
        tone: isFinished ? "muted" : "live",
      }}
      ownerLabel={isOwner ? "Propriétaire" : undefined}
      body={body}
      testId="league-card"
      ariaLabel={`Voir la league ${league.name}`}
      onClick={() => navigate(`/league/${league.id}`)}
    />
  );
};
