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
  <div className="bg-paper rounded-xl p-6 border border-card animate-pulse">
    <div className="h-6 bg-cream-deep rounded w-1/2 mb-6"></div>
    <div className="space-y-4">
      <div className="h-10 bg-cream-deep rounded"></div>
      <div className="h-10 bg-cream-deep rounded"></div>
      <div className="h-10 bg-cream-deep rounded"></div>
    </div>
  </div>
);

const EmptyState = () => (
  <div className="bg-paper rounded-xl p-6 border border-card text-center">
    <BarChart3 size={32} className="mx-auto mb-4 text-ink-mute" />
    <h3 className="text-lg font-bold text-ink mb-2">Aucun match joué</h3>
    <p className="text-sm text-ink-soft">
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
      <div className="bg-paper rounded-xl p-6 border border-card text-center">
        <div className="mb-6">
          <span className="text-4xl mb-4 block">🔒</span>
          <h2 className="text-xl font-bold text-ink mb-2">Fonctionnalité Premium</h2>
          <p className="text-ink-soft text-sm">
            Débloquez vos statistiques personnelles pour suivre votre progression
            à travers tous vos tournois et leagues.
          </p>
        </div>

        <div className="bg-cream-deep/30 rounded-lg p-4 mb-6 text-left">
          <div className="space-y-2 text-sm text-ink-soft">
            <div className="flex items-center gap-2">
              <span className="text-cup-red">✓</span>
              <span>Évolution ELO globale</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-cup-red">✓</span>
              <span>Taux de victoire détaillé</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-cup-red">✓</span>
              <span>Statistiques par adversaire</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-cup-red">✓</span>
              <span>Graphiques de performance</span>
            </div>
          </div>
        </div>

        <button
          onClick={onUpgradeClick}
          className="w-full bg-gradient-to-r from-primary to-accent hover:from-amber-600 hover:to-red-600 text-ink font-bold py-3 rounded-lg transition-all shadow-lg"
        >
          ⬆️ PASSER AU PREMIUM
        </button>
      </div>
    );
  }

  // Premium users see full stats
  return (
    <div className="bg-paper rounded-xl p-6 border border-card">
      <h2 className="text-xl font-bold text-ink mb-6">Mes Stats</h2>

      <div className="space-y-4">
        {/* Total Matches */}
        <div className="bg-cream-deep/50 rounded-lg p-4">
          <p className="text-sm text-ink-soft">Matchs joués</p>
          <p className="text-2xl font-bold text-ink">{stats.totalMatches}</p>
        </div>

        {/* Win Rate */}
        <div className="bg-cream-deep/50 rounded-lg p-4">
          <p className="text-sm text-ink-soft">Taux de victoire</p>
          <p className="text-2xl font-bold text-cup-red">{stats.winRate}%</p>
        </div>

        {/* Average ELO */}
        <div className="bg-cream-deep/50 rounded-lg p-4">
          <p className="text-sm text-ink-soft">ELO moyen</p>
          <p className="text-2xl font-bold text-accent">{stats.averageElo}</p>
        </div>
      </div>

      {/* CTA for premium users */}
      <button
        onClick={() => navigate('/profile?tab=stats')}
        className="w-full mt-6 text-cup-red hover:brightness-110 font-bold text-sm transition-colors"
      >
        Voir toutes mes stats →
      </button>
    </div>
  );
};
