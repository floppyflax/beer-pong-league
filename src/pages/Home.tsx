import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthContext } from "../context/AuthContext";
import { useIdentity } from "../hooks/useIdentity";
import { useHomeData } from "../hooks/useHomeData";
import { usePremium } from "../hooks/usePremium";
import { usePremiumLimits } from "../hooks/usePremiumLimits";
import { ContextualHeader } from "../components/navigation/ContextualHeader";
import { LastActivityCard } from "../components/design-system/LastActivityCard";
import { ScreenLayout } from "../components/design-system/ScreenLayout";
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
      <ScreenLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-ruby mb-4 font-archivo font-extrabold uppercase tracking-tight">
              Erreur lors du chargement des données
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-cup-red text-ink border-[1.5px] border-cup-red-deep shadow-[0_3px_0_#C42418] hover:brightness-110 active:translate-y-[2px] active:shadow-[0_1px_0_#C42418] font-archivo font-bold uppercase tracking-tight py-2 px-4 rounded-full transition-[transform,box-shadow,filter] duration-75"
            >
              Réessayer
            </button>
          </div>
        </div>
      </ScreenLayout>
    );
  }

  return (
    <>
      <ScreenLayout header={<ContextualHeader title="🍺 BPL" />}>
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-archivo font-extrabold uppercase tracking-tight text-ink mb-2">
            👋 Salut{" "}
            {localUser?.pseudo ?? user?.email?.split("@")[0] ?? "Champion"}
          </h2>
          <p className="text-ink-soft">Voici ton activité récente</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-xl font-archivo font-extrabold uppercase tracking-tight text-ink mb-4">
                Mon dernier tournoi
              </h2>
              <LastActivityCard
                kind="tournament"
                activity={
                  lastTournament
                    ? {
                        id: lastTournament.id,
                        name: lastTournament.name,
                        count: lastTournament.playerCount,
                        updatedAt: lastTournament.updatedAt,
                        finished: lastTournament.isFinished,
                      }
                    : undefined
                }
                isLoading={isLoading}
              />
            </div>

            <div>
              <h2 className="text-xl font-archivo font-extrabold uppercase tracking-tight text-ink mb-4">
                Ma dernière league
              </h2>
              <LastActivityCard
                kind="league"
                activity={
                  lastLeague
                    ? {
                        id: lastLeague.id,
                        name: lastLeague.name,
                        count: lastLeague.memberCount,
                        updatedAt: lastLeague.updatedAt,
                        finished: lastLeague.status === "finished",
                      }
                    : undefined
                }
                isLoading={isLoading}
                onEmptyAction={handleCreateLeague}
                emptyActionLocked={isAtLeagueLimit}
              />
            </div>
          </div>

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
      </ScreenLayout>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
};
