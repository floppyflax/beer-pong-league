import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthContext } from "../context/AuthContext";
import { useIdentity } from "../hooks/useIdentity";
import { useHomeData } from "../hooks/useHomeData";
import { usePremium } from "../hooks/usePremium";
import { usePremiumLimits } from "../hooks/usePremiumLimits";
import { ContextualHeader } from "../components/navigation/ContextualHeader";
import { LastTournamentCard } from "../components/home/LastTournamentCard";
import { LastLeagueCard } from "../components/home/LastLeagueCard";
import { PersonalStatsSummary } from "../components/home/PersonalStatsSummary";
import { PaymentModal } from "../components/PaymentModal";

export const Home = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const { localUser } = useIdentity();
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // userId: authenticated user.id OR anonymous user's anonymousUserId (LeagueContext pattern)
  const userId = user?.id ?? localUser?.anonymousUserId ?? null;

  // Fetch home data - only if userId exists
  const { lastTournament, lastLeague, personalStats, isLoading, error } =
    useHomeData(userId);

  // Fetch premium status via hook (follows architecture pattern)
  const { isPremium, refetch: refetchPremium } = usePremium(userId);
  const { canCreateLeague, isAtLeagueLimit } = usePremiumLimits();

  const handleUpgradeClick = () => {
    setShowPaymentModal(true);
  };

  const handleCreateLeague = () => {
    if (canCreateLeague) {
      navigate("/create-league");
    } else {
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    refetchPremium();
    if (userId) {
      queryClient.invalidateQueries({ queryKey: ["homeData", userId] });
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center flex-grow">
        <div className="text-center">
          <p className="text-red-500 mb-4">
            Erreur lors du chargement des données
          </p>
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
        {/* Contextual Header (Story 13.2) */}
        <ContextualHeader title="🍺 BPL" />

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Message */}
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              👋 Salut{" "}
              {localUser?.pseudo ?? user?.email?.split("@")[0] ?? "Champion"}
            </h2>
            <p className="text-slate-400">Voici ton activité récente</p>
          </div>

          {/* Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - 2/3 width on desktop */}
            <div className="lg:col-span-2 space-y-6">
              {/* Last Tournament */}
              <div>
                <h2 className="text-xl font-bold text-white mb-4">
                  Mon dernier tournoi
                </h2>
                <LastTournamentCard
                  tournament={lastTournament}
                  isLoading={isLoading}
                />
              </div>

              {/* Last League */}
              <div>
                <h2 className="text-xl font-bold text-white mb-4">
                  Ma dernière league
                </h2>
                <LastLeagueCard
                  league={lastLeague}
                  isLoading={isLoading}
                  onEmptyAction={handleCreateLeague}
                  emptyActionLocked={isAtLeagueLimit}
                />
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
