import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Users, Calendar } from 'lucide-react';
import type { LeagueListItem } from '../../hooks/useLeaguesList';
import { formatRelativeTime } from '../../utils/dateUtils';
import { useAuthContext } from '../../context/AuthContext';
import { useIdentity } from '../../hooks/useIdentity';

interface LeagueCardProps {
  league: LeagueListItem;
}

/**
 * LeagueCard Component
 * 
 * Displays a league card with:
 * - League name (bold, 18px)
 * - Owner badge (👑 Propriétaire) if user created it
 * - Status badge (Active / Terminée)
 * - Member count
 * - Tournament count
 * - Last activity time (relative)
 * 
 * Clicks navigate to /league/:id
 */
export const LeagueCard: React.FC<LeagueCardProps> = ({ league }) => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { anonymousUser } = useIdentity();

  const handleClick = () => {
    navigate(`/league/${league.id}`);
  };

  // Check if current user is the owner
  const isOwner = (user && user.id === league.creator_user_id) || 
                  (anonymousUser && anonymousUser.id === league.creator_anonymous_user_id);

  // Format last activity time (consistent with LastLeagueCard, LastTournamentCard)
  const lastActivity = formatRelativeTime(league.updatedAt);

  return (
    <div
      data-testid="league-card"
      onClick={handleClick}
      className="bg-slate-800 border border-slate-700 rounded-xl p-6 cursor-pointer transition-all hover:border-primary hover:shadow-lg hover:shadow-primary/20 active:scale-95"
    >
      {/* Header: Name + Owner Badge + Status Badge */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 mr-3">
          <h3 className="text-lg font-bold text-white mb-2">
            {league.name}
          </h3>
          {/* Owner Badge - Story 10.3 AC6 */}
          {isOwner && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-primary/20 text-primary">
              👑 Propriétaire
            </span>
          )}
        </div>
        {/* Status Badge */}
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
            league.status === 'finished'
              ? 'bg-slate-700 text-slate-300'
              : 'bg-green-500/20 text-green-400'
          }`}
        >
          {league.status === 'finished' ? 'Terminée' : 'Active'}
        </span>
      </div>

      {/* Info Grid */}
      <div className="space-y-2 text-sm text-slate-400">
        {/* Member Count */}
        <div className="flex items-center gap-2">
          <Users size={16} className="text-slate-500" />
          <span>
            {league.member_count} {league.member_count === 1 ? 'membre' : 'membres'}
          </span>
        </div>

        {/* Tournament Count */}
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-slate-500" />
          <span>
            {league.tournament_count} {league.tournament_count === 1 ? 'tournoi' : 'tournois'}
          </span>
        </div>

        {/* Last Activity */}
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-slate-500" />
          <span className="text-xs">Dernière activité {lastActivity}</span>
        </div>
      </div>
    </div>
  );
};
