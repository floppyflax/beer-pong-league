import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/context/AuthContext";
import { useLeague } from "@/context/LeagueContext";
import { useIdentity } from "@/hooks/useIdentity";
import { useFullDisconnect } from "@/hooks/useFullDisconnect";
import { PageHero, Sheet } from "@/components/design-system";
import { StatCard } from "@/components/design-system/StatCard";
import { PAvatar } from "@/components/ponglo/PAvatar";
import { PButton } from "@/components/ponglo/PButton";
import { PaymentModal } from "@/components/PaymentModal";
import { WebcamCaptureSheet } from "@/components/WebcamCaptureSheet";
import { premiumService } from "@/services/PremiumService";
import { authService } from "@/services/AuthService";
import { localUserService } from "@/services/LocalUserService";
import { PhotoService } from "@/services/PhotoService";
import { Trophy, Calendar, Mail, LogOut, Crown, ChevronRight, Camera, Image as ImageIcon, Pencil, Check, X } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import toast from "react-hot-toast";

export const UserProfile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthContext();
  const { localUser } = useIdentity();
  const { fullDisconnect } = useFullDisconnect();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { leagues, tournaments, reloadData } = useLeague();

  // Profile state (loaded from DB for auth users, localStorage for anon)
  const [pseudo, setPseudo] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showAvatarSourceSheet, setShowAvatarSourceSheet] = useState(false);
  const [showWebcamSheet, setShowWebcamSheet] = useState(false);

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
        // Refresh leagues/tournaments so the new pseudo appears in podium,
        // leaderboard, history, etc. (snapshots have been propagated
        // server-side by updateUserProfile).
        await reloadData();
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
  const isMobileDevice = () =>
    typeof navigator !== "undefined" &&
    /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const uploadAvatarFromBlob = async (blob: Blob) => {
    if (!user?.id) return;
    setIsUploadingAvatar(true);
    try {
      const mime = blob.type || "image/jpeg";
      const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
      const file = new File([blob], `avatar.${ext}`, { type: mime });
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

  const handlePickAvatar = async (source: "camera" | "gallery") => {
    if (!user?.id) return;
    setShowAvatarSourceSheet(false);
    // Desktop + caméra → vraie capture webcam (input.capture est ignoré sur desktop)
    if (source === "camera" && !isMobileDevice()) {
      setShowWebcamSheet(true);
      return;
    }
    try {
      const result =
        source === "camera"
          ? await PhotoService.takePhoto()
          : await PhotoService.pickFromGallery();
      await uploadAvatarFromBlob(result.blob);
    } catch (err) {
      if (err instanceof Error && err.message === "No file selected") return;
      toast.error("Impossible d'uploader la photo");
    }
  };

  const handleWebcamCapture = async (blob: Blob) => {
    setShowWebcamSheet(false);
    await uploadAvatarFromBlob(blob);
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
                <button
                  type="button"
                  onClick={() => setShowAvatarSourceSheet(true)}
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
                  onClick={() => navigate(`/event/${tournament.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/event/${tournament.id}`);
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

      {/* Logout CTA — secondary red, dans le flux (non sticky) */}
      {showLogout && (
        <div className="px-4 sm:px-6 mt-6 mb-6">
          <div className="max-w-[720px] mx-auto">
            <PButton
              variant="ghost"
              size="md"
              full
              icon={<LogOut size={18} />}
              className="!text-signal-red !border-signal-red/40 hover:!bg-signal-red/10 active:!bg-signal-red/20"
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

      <Sheet
        isOpen={showAvatarSourceSheet}
        onClose={() => setShowAvatarSourceSheet(false)}
        title="Photo de profil"
        maxWidth="sm"
      >
        <div className="flex flex-col gap-3 pt-2">
          <PButton
            variant="primary"
            size="md"
            full
            icon={<Camera size={18} />}
            onClick={() => void handlePickAvatar("camera")}
          >
            Prendre une photo
          </PButton>
          <PButton
            variant="accent"
            size="md"
            full
            icon={<ImageIcon size={18} />}
            onClick={() => void handlePickAvatar("gallery")}
          >
            Choisir depuis la galerie
          </PButton>
        </div>
      </Sheet>

      <WebcamCaptureSheet
        isOpen={showWebcamSheet}
        onClose={() => setShowWebcamSheet(false)}
        onCapture={(blob) => void handleWebcamCapture(blob)}
      />
    </div>
  );
};
