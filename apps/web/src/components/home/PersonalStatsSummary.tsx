import { useNavigate } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';

interface PersonalStats {
  totalMatches: number;
  winRate: number;
  averageElo: number;
}

interface PersonalStatsSummaryProps {
  stats?: PersonalStats;
  isLoading?: boolean;
  isPremium: boolean;
  onUpgradeClick?: () => void;
}

const SkeletonCard = () => (
  <div className="bg-navy-soft rounded-xl p-6 border border-card animate-pulse">
    <div className="h-6 bg-navy-deep rounded w-1/2 mb-6"></div>
    <div className="space-y-4">
      <div className="h-10 bg-navy-deep rounded"></div>
      <div className="h-10 bg-navy-deep rounded"></div>
      <div className="h-10 bg-navy-deep rounded"></div>
    </div>
  </div>
);

const EmptyState = () => (
  <div className="bg-navy-soft rounded-xl p-6 border border-card text-center">
    <BarChart3 size={32} className="mx-auto mb-4 text-cool-gray" />
    <h3 className="text-lg font-bold text-white mb-2">Aucun match joué</h3>
    <p className="text-sm text-cool-gray">
      Commence à jouer pour voir tes stats
    </p>
  </div>
);

export const PersonalStatsSummary = ({ 
  stats, 
  isLoading, 
  isPremium,
  onUpgradeClick 
}: PersonalStatsSummaryProps) => {
  const navigate = useNavigate();

  if (isLoading) {
    return <SkeletonCard />;
  }

  if (!stats || stats.totalMatches === 0) {
    return <EmptyState />;
  }

  // Premium teaser - show full paywall for non-premium users (as per AC4)
  if (!isPremium) {
    return (
      <div className="bg-navy-soft rounded-xl p-6 border border-card text-center">
        <div className="mb-6">
          <span className="text-4xl mb-4 block">🔒</span>
          <h2 className="text-xl font-bold text-white mb-2">Fonctionnalité Premium</h2>
          <p className="text-cool-gray text-sm">
            Débloquez vos statistiques personnelles pour suivre votre progression
            à travers tous vos tournois et leagues.
          </p>
        </div>

        <div className="bg-navy-deep/30 rounded-lg p-4 mb-6 text-left">
          <div className="space-y-2 text-sm text-cool-gray">
            <div className="flex items-center gap-2">
              <span className="text-signal-red">✓</span>
              <span>Évolution ELO globale</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-signal-red">✓</span>
              <span>Taux de victoire détaillé</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-signal-red">✓</span>
              <span>Statistiques par adversaire</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-signal-red">✓</span>
              <span>Graphiques de performance</span>
            </div>
          </div>
        </div>

        <button
          onClick={onUpgradeClick}
          className="w-full bg-gradient-to-r from-electric-blue to-electric-blue hover:from-amber-600 hover:to-red-600 text-white font-bold py-3 rounded-lg transition-all shadow-lg"
        >
          ⬆️ PASSER AU PREMIUM
        </button>
      </div>
    );
  }

  // Premium users see full stats
  return (
    <div className="bg-navy-soft rounded-xl p-6 border border-card">
      <h2 className="text-xl font-bold text-white mb-6">Mes Stats</h2>

      <div className="space-y-4">
        {/* Total Matches */}
        <div className="bg-navy-deep/50 rounded-lg p-4">
          <p className="text-sm text-cool-gray">Matchs joués</p>
          <p className="text-2xl font-bold text-white">{stats.totalMatches}</p>
        </div>

        {/* Win Rate */}
        <div className="bg-navy-deep/50 rounded-lg p-4">
          <p className="text-sm text-cool-gray">Taux de victoire</p>
          <p className="text-2xl font-bold text-signal-red">{stats.winRate}%</p>
        </div>

        {/* Average ELO */}
        <div className="bg-navy-deep/50 rounded-lg p-4">
          <p className="text-sm text-cool-gray">ELO moyen</p>
          <p className="text-2xl font-bold text-electric-blue">{stats.averageElo}</p>
        </div>
      </div>

      {/* CTA for premium users */}
      <button
        onClick={() => navigate('/profile?tab=stats')}
        className="w-full mt-6 text-signal-red hover:brightness-110 font-bold text-sm transition-colors"
      >
        Voir toutes mes stats →
      </button>
    </div>
  );
};
