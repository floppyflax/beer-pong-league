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
import { authService } from "@/services/AuthService";
import { localUserService } from "@/services/LocalUserService";
import { Trophy, Calendar, Mail, LogOut, Crown, ChevronRight, Camera, Pencil, Check, X } from "lucide-react";
import { useMemo, useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";

export const UserProfile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthContext();
  const { localUser } = useIdentity();
  const { fullDisconnect } = useFullDisconnect();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { leagues, tournaments } = useLeague();

  // Profile state (loaded from DB for auth users, localStorage for anon)
  const [pseudo, setPseudo] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Load profile on mount
  useEffect(() => {
    const userId = user?.id ?? null;
    const anonymousUserId = localUser?.anonymousUserId ?? null;
    premiumService.isPremium(userId, anonymousUserId).then(setIsPremium);

    if (isAuthenticated && user) {
      authService.getUserProfile(user.id).then((profile) => {
        if (profile) {
          setPseudo(profile.pseudo || user.email?.split("@")[0] || "Utilisateur");
          setAvatarUrl(profile.avatar_url ?? null);
        } else {
          setPseudo(user.email?.split("@")[0] || "Utilisateur");
        }
      });
    } else if (localUser) {
      setPseudo(localUser.pseudo || "Invité");
    }
  }, [user, isAuthenticated, localUser]);

  const displayName = pseudo ||
    (isAuthenticated && user ? user.email?.split("@")[0] || "Utilisateur" : localUser?.pseudo || "Invité");

  const showLogout = isAuthenticated || Boolean(localUser);

  // ── Name editing ──────────────────────────────────────────────────────────
  const startEditName = () => {
    setEditedName(displayName);
    setIsEditingName(true);
  };

  const cancelEditName = () => {
    setIsEditingName(false);
    setEditedName("");
  };

  const saveEditName = async () => {
    const trimmed = editedName.trim();
    if (!trimmed || trimmed === displayName) {
      cancelEditName();
      return;
    }
    setIsSavingName(true);
    try {
      if (isAuthenticated && user) {
        const ok = await authService.updateUserProfile(user.id, { pseudo: trimmed });
        if (!ok) throw new Error("update failed");
      } else {
        localUserService.updateLocalUser({ pseudo: trimmed });
      }
      setPseudo(trimmed);
      setIsEditingName(false);
      toast.success("Nom mis à jour");
    } catch {
      toast.error("Impossible de mettre à jour le nom");
    } finally {
      setIsSavingName(false);
    }
  };

  // ── Avatar upload ──────────────────────────────────────────────────────────
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    // Reset input so re-selecting the same file re-triggers onChange
    e.target.value = "";

    setIsUploadingAvatar(true);
    try {
      const url = await authService.uploadAvatar(user.id, file);
      if (!url) throw new Error("upload failed");
      const ok = await authService.updateUserProfile(user.id, { avatar_url: url });
      if (!ok) throw new Error("db update failed");
      setAvatarUrl(url);
      toast.success("Photo de profil mise à jour");
    } catch {
      toast.error("Impossible d'uploader la photo");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
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

  return (
    <div className="min-h-0 flex flex-col relative">
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

        <div className="text-xs text-cool-gray text-center">
          {isAuthenticated ? "Compte authentifié" : "Mode local"}
        </div>

        {/* ── Profile card ── */}
        <div className="bg-navy-soft rounded-card p-4 md:p-6 border border-card">
          <div className="flex items-center gap-4">
            {/* Avatar with upload overlay (auth only) */}
            <div className="relative flex-shrink-0 group">
              <PAvatar
                name={displayName}
                size={64}
                ring="#2F6BFF"
                imageUrl={avatarUrl ?? undefined}
              />
              {isAuthenticated && (
                <>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    aria-label="Changer la photo de profil"
                    className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity disabled:cursor-wait"
                  >
                    {isUploadingAvatar ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera size={18} className="text-white" />
                    )}
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={handleAvatarFileChange}
                  />
                </>
              )}
            </div>

            {/* Name + email */}
            <div className="flex-1 min-w-0">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void saveEditName();
                      if (e.key === "Escape") cancelEditName();
                    }}
                    maxLength={50}
                    autoFocus
                    className="flex-1 min-w-0 bg-navy-deep border border-electric-blue rounded-md px-3 py-1.5 text-white text-base font-archivo font-extrabold uppercase tracking-tight focus:outline-none focus:ring-2 focus:ring-electric-blue/30"
                  />
                  <button
                    type="button"
                    onClick={() => void saveEditName()}
                    disabled={isSavingName}
                    aria-label="Valider"
                    className="w-8 h-8 rounded-full bg-lime text-navy flex items-center justify-center flex-shrink-0 disabled:opacity-50"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditName}
                    aria-label="Annuler"
                    className="w-8 h-8 rounded-full border border-card text-cool-gray flex items-center justify-center flex-shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 min-w-0">
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
                  <button
                    type="button"
                    onClick={startEditName}
                    aria-label="Modifier le nom"
                    className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-cool-gray hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                </div>
              )}
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

        {/* Premium upsell */}
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
          <StatCard value={userStats.leagues} label="Ligues" variant="primary" />
          <StatCard value={userStats.tournaments} label="Événements" variant="accent" />
          <StatCard value={userStats.totalMatches} label="Matchs" />
        </div>

        {/* My Leagues */}
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

        {/* My Tournaments */}
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
