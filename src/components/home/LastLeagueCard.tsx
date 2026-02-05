import { useNavigate } from 'react-router-dom';
import { Award } from 'lucide-react';

interface League {
  id: string;
  name: string;
  memberCount: number;
  updatedAt: string;
  status: 'active' | 'finished';
}

interface LastLeagueCardProps {
  league?: League;
  isLoading?: boolean;
}

const formatRelativeTime = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString('fr-FR');
};

const SkeletonCard = () => (
  <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 animate-pulse">
    <div className="h-6 bg-slate-700 rounded w-3/4 mb-4"></div>
    <div className="h-4 bg-slate-700 rounded w-1/2 mb-4"></div>
    <div className="h-10 bg-slate-700 rounded"></div>
  </div>
);

const EmptyCard = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 text-center">
      <Award size={32} className="mx-auto mb-4 text-slate-600" />
      <h3 className="text-lg font-bold text-white mb-2">Aucune league</h3>
      <p className="text-sm text-slate-400 mb-4">
        Créez une league pour jouer avec vos amis régulièrement
      </p>
      <button
        onClick={() => navigate('/league/create')}
        className="w-full bg-primary hover:bg-amber-600 text-white font-bold py-3 rounded-lg transition-all"
      >
        Créer une league
      </button>
    </div>
  );
};

export const LastLeagueCard = ({ league, isLoading }: LastLeagueCardProps) => {
  const navigate = useNavigate();

  if (isLoading) {
    return <SkeletonCard />;
  }

  if (!league) {
    return <EmptyCard />;
  }

  return (
    <div
      className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-primary/50 transition-all cursor-pointer"
      onClick={() => navigate(`/league/${league.id}`)}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">
            {league.name}
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            {league.memberCount} membres
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
          league.status === 'finished'
            ? 'bg-slate-700 text-slate-400'
            : 'bg-primary/20 text-primary'
        }`}>
          {league.status === 'finished' ? 'Terminée' : 'Active'}
        </span>
      </div>

      <p className="text-xs text-slate-500 mb-4">
        Dernière activité: {formatRelativeTime(league.updatedAt)}
      </p>

      <button className="w-full bg-primary hover:bg-amber-600 text-white font-bold py-3 rounded-lg transition-all">
        VOIR LE CLASSEMENT
      </button>
    </div>
  );
};
