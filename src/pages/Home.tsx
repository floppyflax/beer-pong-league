import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useIdentity } from '../hooks/useIdentity';
import { useHomeData } from '../hooks/useHomeData';
import { usePremium } from '../hooks/usePremium';
import { LastTournamentCard } from '../components/home/LastTournamentCard';
import { LastLeagueCard } from '../components/home/LastLeagueCard';
import { PersonalStatsSummary } from '../components/home/PersonalStatsSummary';
import { NewUserWelcome } from '../components/home/NewUserWelcome';
import { PaymentModal } from '../components/PaymentModal';

export const Home = () => {
  const { user } = useAuth();
  const { userId } = useIdentity();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Fetch home data - only if userId exists
  const { lastTournament, lastLeague, personalStats, isLoading, error } = useHomeData(userId);

  // Fetch premium status via hook (follows architecture pattern)
  const { isPremium } = usePremium(userId);

  // Determine if user is new (no data) - only check when not loading
  const isNewUser = !isLoading && !lastTournament && !lastLeague && (!personalStats || personalStats.totalMatches === 0);

  const handleUpgradeClick = () => {
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    // Premium status will be updated automatically by usePremium hook
    window.location.reload(); // Force reload to refresh premium status
  };

  if (error) {
    return (
      <div className="flex items-center justify-center flex-grow">
        <div className="text-center">
          <p className="text-red-500 mb-4">Erreur lors du chargement des données</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary hover:bg-amber-600 text-white font-bold py-2 px-4 rounded-lg"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              👋 Salut {user?.email?.split('@')[0] || 'Champion'}
            </h1>
            <p className="text-slate-400">
              Voici ton activité récente
            </p>
          </div>

          {/* New User Welcome */}
          {isNewUser && (
            <NewUserWelcome onUpgradeClick={handleUpgradeClick} />
          )}

          {/* Returning User Dashboard or Loading State */}
          {(isLoading || !isNewUser) && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - 2/3 width on desktop */}
              <div className="lg:col-span-2 space-y-6">
                {/* Last Tournament */}
                <div>
                  <h2 className="text-xl font-bold text-white mb-4">Mon dernier tournoi</h2>
                  <LastTournamentCard tournament={lastTournament} isLoading={isLoading} />
                </div>

                {/* Last League */}
                <div>
                  <h2 className="text-xl font-bold text-white mb-4">Ma dernière league</h2>
                  <LastLeagueCard league={lastLeague} isLoading={isLoading} />
                </div>
              </div>

              {/* Right Column - 1/3 width on desktop with sticky positioning */}
              <div className="lg:col-span-1">
                <div className="lg:sticky lg:top-6">
                  <PersonalStatsSummary 
                    stats={personalStats} 
                    isLoading={isLoading} 
                    isPremium={isPremium}
                    onUpgradeClick={handleUpgradeClick}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
};
