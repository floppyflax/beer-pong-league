import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Users, Calendar } from 'lucide-react';
import type { Tournament } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TournamentCardProps {
  tournament: Tournament;
}

/**
 * TournamentCard Component
 * 
 * Displays a tournament card with:
 * - Tournament name (bold, 18px)
 * - Status badge (En cours / Terminé)
 * - Player count
 * - Last activity time (relative)
 * - Quick preview: user's current rank if active (TODO when ranking is available)
 * 
 * Clicks navigate to /tournament/:id
 */
export const TournamentCard: React.FC<TournamentCardProps> = ({ tournament }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/tournament/${tournament.id}`);
  };

  // Calculate player count from playerIds array
  const playerCount = tournament.playerIds?.length || 0;

  // Format last activity time (using createdAt for now, can be updated_at when available)
  const lastActivity = formatDistanceToNow(new Date(tournament.createdAt), {
    addSuffix: true,
    locale: fr,
  });

  // Format tournament date
  const tournamentDate = new Date(tournament.date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div
      onClick={handleClick}
      className="bg-slate-800 border border-slate-700 rounded-xl p-6 cursor-pointer transition-all hover:border-primary hover:shadow-lg hover:shadow-primary/20 active:scale-98"
    >
      {/* Header: Name + Status Badge */}
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex-1 mr-3">
          {tournament.name}
        </h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
            tournament.isFinished
              ? 'bg-slate-700 text-slate-300'
              : 'bg-green-500/20 text-green-400'
          }`}
        >
          {tournament.isFinished ? 'Terminé' : 'En cours'}
        </span>
      </div>

      {/* Info Grid */}
      <div className="space-y-2 text-sm text-slate-400">
        {/* Player Count */}
        <div className="flex items-center gap-2">
          <Users size={16} className="text-slate-500" />
          <span>
            {playerCount} {playerCount <= 1 ? 'joueur' : 'joueurs'}
          </span>
        </div>

        {/* Tournament Date */}
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-slate-500" />
          <span>{tournamentDate}</span>
        </div>

        {/* Last Activity */}
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-slate-500" />
          <span className="text-xs">Dernière activité {lastActivity}</span>
        </div>
      </div>

      {/* Quick Preview: User's Rank (TODO when ranking available) */}
      {!tournament.isFinished && tournament.playerIds?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <p className="text-xs text-slate-500">
            {/* TODO: Show user's current rank when ranking data is available */}
            Cliquez pour voir le classement
          </p>
        </div>
      )}
    </div>
  );
};
