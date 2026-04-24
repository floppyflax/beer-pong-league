import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/context/AuthContext";
import { useLeague } from "@/context/LeagueContext";
import { useIdentity } from "@/hooks/useIdentity";
import { useFullDisconnect } from "@/hooks/useFullDisconnect";
import { PageHero } from "@/components/design-system";
import { StatCard } from "@/components/design-system/StatCard";
import { PAvatar } from "@/components/ponglo/PAvatar";
import { PButton } from "@/components/ponglo/PButton";
import { PaymentModal } from "@/components/PaymentModal";
import { premiumService } from "@/services/PremiumService";
import { Trophy, Calendar, Mail, LogOut, Crown, ChevronRight } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

export const UserProfile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthContext();
  const { localUser } = useIdentity();
  const { fullDisconnect } = useFullDisconnect();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { leagues, tournaments } = useLeague();

  useEffect(() => {
    const userId = user?.id ?? null;
    const anonymousUserId = localUser?.anonymousUserId ?? null;
    premiumService.isPremium(userId, anonymousUserId).then(setIsPremium);
  }, [user, localUser]);

  // Calculate user stats
  const userStats = useMemo(() => {
    const userLeagues = leagues.filter(
      (league) =>
        (isAuthenticated && user && league.creator_user_id === user.id) ||
        (!isAuthenticated &&
          localUser &&
          league.creator_anonymous_user_id === localUser.anonymousUserId),
    );

    const userTournaments = tournaments.filter(
      (tournament) =>
        (isAuthenticated && user && tournament.creator_user_id === user.id) ||
        (!isAuthenticated &&
          localUser &&
          tournament.creator_anonymous_user_id === localUser.anonymousUserId),
    );

    const totalMatches =
      userLeagues.reduce((acc, l) => acc + l.matches.length, 0) +
      userTournaments.reduce((acc, t) => acc + t.matches.length, 0);

    return {
      leagues: userLeagues.length,
      tournaments: userTournaments.length,
      totalMatches,
      userLeagues,
      userTournaments,
    };
  }, [leagues, tournaments, user, isAuthenticated, localUser]);

  const displayName =
    isAuthenticated && user
      ? user.email?.split("@")[0] || "Utilisateur"
      : localUser?.pseudo || "Invité";

  const showLogout = isAuthenticated || Boolean(localUser);

  return (
    <div className="min-h-0 flex flex-col relative">
      {/* pt-6 / pt-8 aligns PageHero eyebrow with ScreenLayout pages (py-6 / py-8) */}
      <div
        className={`flex-1 overflow-y-auto px-4 md:px-6 pt-6 md:pt-8 space-y-4 ${
          showLogout ? "pb-[160px] lg:pb-24" : "pb-6 md:pb-8"
        }`}
      >
        <PageHero
          eyebrow="Profil"
          title="Mon profil"
          subtitle="Ton identité, tes leagues et tes événements — tout au même endroit."
        />

        {/* User status badge */}
        <div className="text-xs text-cool-gray text-center">
          {isAuthenticated ? "Compte authentifié" : "Mode local"}
        </div>

        {/* Profile Info card */}
        <div className="bg-navy-soft rounded-card p-4 md:p-6 border border-card">
          <div className="flex items-center gap-4">
            <PAvatar
              name={displayName}
              size={64}
              ring="#2F6BFF"
              className="flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-archivo font-extrabold uppercase tracking-tight text-white truncate flex items-center gap-2">
                {displayName}
                {isPremium && (
                  <Crown
                    size={16}
                    className="text-ping-yellow shrink-0"
                    aria-label="Premium"
                  />
                )}
              </h3>
              {isAuthenticated && user && (
                <div className="text-sm text-cool-gray flex items-center gap-2 mt-1 truncate">
                  <Mail size={14} className="shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
              )}
              {!isAuthenticated && localUser && (
                <div className="text-sm text-cool-gray flex items-center gap-2 mt-1">
                  <span className="font-mono text-xs uppercase tracking-widest">Mode local</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Premium upsell — shown only when not premium */}
        {!isPremium && (
          <div
            className="w-full bg-gradient-to-br from-ping-yellow/20 via-ping-yellow/10 to-ping-yellow/5 border-2 border-ping-yellow/50 rounded-card p-4 flex items-center gap-4"
            role="region"
            aria-label="Statut Premium"
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-ping-yellow/25 flex items-center justify-center">
              <Crown size={24} className="text-ping-yellow" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-archivo font-extrabold uppercase tracking-tight text-base leading-tight text-white">
                Passe Premium
              </div>
              <p className="text-white/70 text-sm mt-0.5">
                Événements illimités, ligues et stats —{" "}
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(true)}
                  className="inline-flex items-center gap-0.5 text-ping-yellow font-archivo font-extrabold uppercase tracking-tight underline-offset-2 hover:underline"
                >
                  3€
                  <ChevronRight size={14} className="-mr-1" />
                </button>
              </p>
            </div>
          </div>
        )}

        {/* StatCards */}
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          <StatCard
            value={userStats.leagues}
            label="Ligues"
            variant="primary"
          />
          <StatCard
            value={userStats.tournaments}
            label="Événements"
            variant="accent"
          />
          <StatCard value={userStats.totalMatches} label="Matchs" />
        </div>

        {/* My Leagues — always visible */}
        <div>
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <Trophy size={20} className="text-electric-blue" />
            Mes Ligues
          </h3>
          {userStats.userLeagues.length > 0 ? (
            <div className="space-y-2">
              {userStats.userLeagues.map((league) => (
                <div
                  key={league.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/league/${league.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/league/${league.id}`);
                    }
                  }}
                  className="bg-navy-soft rounded-card p-4 border border-card hover:border-card-muted cursor-pointer transition-colors"
                >
                  <div className="font-bold text-white">{league.name}</div>
                  <div className="text-xs text-cool-gray mt-1">
                    {league.players.length} joueurs • {league.matches.length} matchs
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-navy-soft rounded-card p-4 border border-card text-center">
              <p className="text-cool-gray text-sm">Aucune ligue pour l'instant.</p>
            </div>
          )}
        </div>

        {/* My Tournaments — always visible */}
        <div>
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <Calendar size={20} className="text-electric-blue" />
            Mes Événements
          </h3>
          {userStats.userTournaments.length > 0 ? (
            <div className="space-y-2">
              {userStats.userTournaments.map((tournament) => (
                <div
                  key={tournament.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/tournament/${tournament.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/tournament/${tournament.id}`);
                    }
                  }}
                  className="bg-navy-soft rounded-card p-4 border border-card hover:border-card-muted cursor-pointer transition-colors"
                >
                  <div className="font-bold text-white flex items-center gap-2">
                    {tournament.name}
                    {tournament.isFinished && (
                      <span className="text-xs bg-navy-deep text-cool-gray px-2 py-1 rounded">
                        Terminé
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-cool-gray mt-1">
                    {tournament.date
                      ? new Date(tournament.date).toLocaleDateString("fr-FR")
                      : "—"}{" "}
                    • {tournament.matches.length} matchs
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-navy-soft rounded-card p-4 border border-card text-center">
              <p className="text-cool-gray text-sm">Aucun événement pour l'instant.</p>
            </div>
          )}
        </div>
      </div>

      {/* Sticky logout CTA */}
      {showLogout && (
        <div className="fixed left-0 right-0 bottom-0 px-4 sm:px-6 pt-4 pb-bottom-nav lg:pb-bottom-nav-lg bg-gradient-to-t from-navy via-navy/95 to-transparent pointer-events-none z-20">
          <div className="max-w-[720px] mx-auto pointer-events-auto">
            <PButton
              variant="ghost"
              size="lg"
              full
              icon={<LogOut size={18} />}
              className="!bg-signal-red !border-[#B22830] !text-white shadow-[0_3px_0_#B22830] hover:!brightness-105 active:!translate-y-[2px] active:!shadow-[0_1px_0_#B22830]"
              onClick={async () => {
                setIsDisconnecting(true);
                try {
                  await fullDisconnect();
                } finally {
                  setIsDisconnecting(false);
                }
              }}
              disabled={isDisconnecting}
            >
              {isDisconnecting ? "Déconnexion…" : "Déconnexion"}
            </PButton>
          </div>
        </div>
      )}

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={() => setIsPremium(true)}
      />
    </div>
  );
};
