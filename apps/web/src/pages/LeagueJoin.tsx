import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useLeague } from "../context/LeagueContext";
import { useAuthContext } from "../context/AuthContext";
import { useIdentityContext } from "../context/IdentityContext";
import { useUnclaimedGuests } from "../hooks/useUnclaimedGuests";
import type { UnclaimedGuest } from "../hooks/useUnclaimedGuests";
import { AuthModal } from "../components/AuthModal";
import { ContextualHeader } from "../components/navigation/ContextualHeader";
import { HelpCard } from "../components/design-system/HelpCard";
import { ClaimGuestSheet } from "../components/design-system/ClaimGuestSheet";
import {
  IdentityGateSheet,
  type IdentityGateChoice,
} from "../components/design-system/IdentityGateSheet";
import { JoinNameSheet } from "../components/design-system/JoinNameSheet";
import { PButton } from "../components/ponglo/PButton";
import { Trophy } from "lucide-react";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { identityMergeService } from "../services/IdentityMergeService";
import { databaseService } from "../services/DatabaseService";
import toast from "react-hot-toast";

/**
 * LeagueJoin — mirror of EventJoin for leagues.
 *
 *   gate → (claim → confirm-name) | create-name → dashboard
 *
 * See EventJoin for the step-machine rationale. A fresh joiner landing via
 * link/QR won't have the league in context, so we resolve its name by id.
 */
type Step = "gate" | "postgate" | "claim" | "confirm" | "create" | "idle";

export const LeagueJoin = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { leagues, addPlayer, isLoadingInitialData, reloadData } = useLeague();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthContext();
  const { localUser, initializeAnonymousUser } = useIdentityContext();

  const ghostPlayerId = searchParams.get("ghost");
  const [tokenProcessed, setTokenProcessed] = useState(false);

  const [step, setStep] = useState<Step>(ghostPlayerId ? "idle" : "gate");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [claimedGuest, setClaimedGuest] = useState<UnclaimedGuest | null>(null);
  const [claimDismissed, setClaimDismissed] = useState(false);

  // The league may not be in context for a fresh joiner — resolve its name by
  // id as a fallback (RLS allows public reads on leagues).
  const [fetchedName, setFetchedName] = useState<string | null>(null);
  const [fetchAttempted, setFetchAttempted] = useState(false);
  const leagueInContext = leagues.find((l) => l.id === id);
  const leagueName = leagueInContext?.name ?? fetchedName;
  const leagueExists = !!leagueInContext || fetchedName !== null;

  const currentPseudo = useMemo<string | null>(() => {
    if (isAuthenticated && user) {
      const meta = user.user_metadata as { pseudo?: string } | undefined;
      return meta?.pseudo ?? user.email ?? null;
    }
    if (localUser) return localUser.pseudo ?? null;
    return null;
  }, [isAuthenticated, user, localUser]);

  const {
    guests: unclaimedGuests,
    refresh: refreshGuests,
    isLoading: guestsLoading,
  } = useUnclaimedGuests("league", id ?? null, { mode: "any" });
  const guestsReady = !guestsLoading;

  // Does the current identity already own a player? If so, joining a NEW
  // context adds THAT player (1 user = 1 player) — never "create a new player".
  const resolvedUid =
    isAuthenticated && user ? user.id : localUser?.anonymousUserId ?? null;
  const [hasOwnPlayer, setHasOwnPlayer] = useState<boolean | null>(null);
  useEffect(() => {
    if (!resolvedUid) {
      setHasOwnPlayer(false);
      return;
    }
    let alive = true;
    identityMergeService
      .userOwnsPlayer(resolvedUid)
      .then((owns) => alive && setHasOwnPlayer(owns))
      .catch(() => alive && setHasOwnPlayer(false));
    return () => {
      alive = false;
    };
  }, [resolvedUid]);

  // ---- Effects ----

  useEffect(() => {
    if (isLoadingInitialData || !id || leagueInContext || fetchAttempted) return;
    setFetchAttempted(true);
    databaseService
      .getLeagueById(id)
      .then((l) => setFetchedName(l?.name ?? null))
      .catch(() => setFetchedName(null));
  }, [id, leagueInContext, isLoadingInitialData, fetchAttempted]);

  useEffect(() => {
    if (!isLoadingInitialData && fetchAttempted && !leagueExists) {
      const t = setTimeout(() => navigate("/"), 3000);
      return () => clearTimeout(t);
    }
  }, [leagueExists, isLoadingInitialData, fetchAttempted, navigate]);

  // Ghost-targeted shortcut: claim the player_id from the URL and bounce.
  useEffect(() => {
    if (!ghostPlayerId || tokenProcessed || !leagueExists || !id) return;
    setTokenProcessed(true);

    (async () => {
      let caller: { userId?: string; anonymousUserId?: string };
      if (isAuthenticated && user) {
        caller = { userId: user.id };
      } else {
        const lu = localUser ?? (await initializeAnonymousUser());
        caller = { anonymousUserId: lu.anonymousUserId };
      }

      const result = await identityMergeService.claimPlayerById(
        ghostPlayerId,
        caller,
      );

      const next = new URLSearchParams(searchParams);
      next.delete("ghost");
      setSearchParams(next, { replace: true });

      if (!result.success) {
        toast.error(result.error ?? "Lien d'invitation invalide");
        setStep("gate");
        return;
      }

      await reloadData();
      toast.success(`Bienvenue dans ${leagueName ?? "la ligue"} !`);
      navigate(`/league/${id}`);
    })();
  }, [
    ghostPlayerId,
    tokenProcessed,
    leagueExists,
    id,
    leagueName,
    isAuthenticated,
    user,
    localUser,
    initializeAnonymousUser,
    navigate,
    searchParams,
    setSearchParams,
    reloadData,
  ]);

  useEffect(() => {
    if (step !== "postgate" || !guestsReady) return;
    setStep(
      unclaimedGuests.length > 0 && !claimDismissed ? "claim" : "create",
    );
  }, [step, guestsReady, unclaimedGuests.length, claimDismissed]);

  // Authenticated users already have an identity — skip the gate sheet and
  // go straight to the claim/create branch. Anonymous users with a local
  // identity still see the gate so the "create an account" path stays
  // discoverable (cf. 6f71362).
  useEffect(() => {
    if (step === "gate" && !authLoading && isAuthenticated && !ghostPlayerId) {
      setStep("postgate");
    }
  }, [step, authLoading, isAuthenticated, ghostPlayerId]);

  // ---- Handlers ----

  const handleGateChoice = async (choice: IdentityGateChoice) => {
    if (choice === "auth") {
      // OTP magic-link leaves the app; persist the join URL so AuthCallback
      // brings the user back HERE. localStorage (not sessionStorage) because the
      // magic link often opens in a NEW tab, which doesn't share sessionStorage.
      localStorage.setItem(
        "authReturnTo",
        window.location.pathname + window.location.search,
      );
      setShowAuthModal(true);
      return;
    }
    if (choice === "anonymous") await initializeAnonymousUser();
    setStep("postgate");
  };

  const handleClaimGuest = async (membershipId: string) => {
    if (!id) return;
    const guest = unclaimedGuests.find((g) => g.playerId === membershipId);
    if (!guest) return;

    let result;
    if (isAuthenticated && user) {
      result = await identityMergeService.claimAnonymousPlayer(
        "league",
        membershipId,
        user.id,
      );
    } else {
      const lu = localUser ?? (await initializeAnonymousUser());
      result = await identityMergeService.claimAnonymousPlayerAsAnonymous(
        "league",
        membershipId,
        lu.anonymousUserId,
      );
    }

    if (!result.success) {
      toast.error(result.error ?? "Réclamation impossible");
      return;
    }

    setClaimedGuest(guest);
    setStep("confirm");
  };

  const handleDismissClaim = () => {
    setClaimDismissed(true);
    refreshGuests();
    setStep("create");
  };

  const finalizeClaim = async (name: string) => {
    if (!id || !claimedGuest) return;
    const trimmed = name.trim();
    if (trimmed && trimmed !== claimedGuest.pseudo) {
      const r = await identityMergeService.renameAnonymousPlayer(
        "league",
        claimedGuest.playerId,
        trimmed,
      );
      if (!r.success) {
        toast.error(r.error ?? "Renommage impossible");
        return;
      }
    }
    await reloadData();
    toast.success(`Bienvenue dans ${leagueName ?? "la ligue"} !`);
    navigate(`/league/${id}`);
  };

  const finalizeCreate = async (name: string) => {
    if (!id) return;
    await addPlayer(id, name.trim());
    await reloadData();
    toast.success(`Tu as rejoint ${leagueName ?? "la ligue"} !`);
    navigate(`/league/${id}`);
  };

  // Identified user who already owns a player → join with THAT player (addPlayer
  // reuses the caller's player, so the name is irrelevant).
  const [joiningExisting, setJoiningExisting] = useState(false);
  const finalizeJoinAsExisting = useCallback(async () => {
    if (!id || joiningExisting) return;
    setJoiningExisting(true);
    try {
      await addPlayer(id, currentPseudo ?? "Joueur");
      await reloadData();
      toast.success(`Bienvenue dans ${leagueName ?? "la ligue"} !`);
      navigate(`/league/${id}`);
    } catch {
      setJoiningExisting(false);
      toast.error("Erreur lors de la jonction à la ligue");
    }
  }, [id, joiningExisting, addPlayer, currentPseudo, leagueName, reloadData, navigate]);

  useEffect(() => {
    if (step === "create" && hasOwnPlayer === true) {
      void finalizeJoinAsExisting();
    }
  }, [step, hasOwnPlayer, finalizeJoinAsExisting]);

  const handleResume = () => {
    if (claimedGuest) setStep("confirm");
    else if (guestsReady && unclaimedGuests.length > 0 && !claimDismissed)
      setStep("claim");
    else setStep("create");
  };

  // ---- Render guards ----

  if (isLoadingInitialData || (!leagueExists && !fetchAttempted)) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (!leagueExists) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Ligue introuvable
          </h1>
          <p className="text-cool-gray mb-4">Redirection en cours…</p>
        </div>
      </div>
    );
  }

  const processingGhost = !!ghostPlayerId && !tokenProcessed;

  return (
    <div className="min-h-screen bg-navy">
      <ContextualHeader
        title={leagueName ?? "Ligue"}
        showBackButton={true}
        onBack={() => navigate("/")}
      />

      <div className="px-4 md:px-6 pb-[120px]">
        <div className="max-w-md mx-auto space-y-4">
          <div className="bg-navy-soft rounded-card p-4 border border-card flex items-center gap-3">
            <Trophy size={20} className="text-electric-blue flex-shrink-0" />
            <div className="min-w-0">
              <div className="font-archivo font-extrabold uppercase tracking-tight text-white text-sm truncate">
                {leagueName ?? "Ligue"}
              </div>
              <div className="text-xs text-cool-gray font-mono uppercase tracking-widest">
                Rejoindre la ligue
              </div>
            </div>
          </div>

          <HelpCard
            title="Comment ça marche ?"
            steps={[
              { number: 1, text: "Crée un compte ou rejoins sans compte" },
              { number: 2, text: "Dis-nous si tu es l'un des joueurs déjà ajoutés" },
              { number: 3, text: "Choisis ton nom et accède au classement" },
            ]}
            successMessage="C'est parti pour la compétition !"
          />
        </div>
      </div>

      {step === "idle" && !processingGhost && (
        <div className="fixed left-0 right-0 bottom-0 px-6 pt-4 pb-bottom-nav lg:pb-bottom-nav-lg bg-gradient-to-t from-navy via-navy/95 to-transparent">
          <PButton variant="primary" size="lg" full onClick={handleResume}>
            Rejoindre la ligue
          </PButton>
        </div>
      )}

      {/* --- Sheets / modals --- */}

      <IdentityGateSheet
        isOpen={step === "gate" && !processingGhost}
        onClose={() => setStep("idle")}
        onChoose={handleGateChoice}
        currentPseudo={currentPseudo}
      />

      <ClaimGuestSheet
        isOpen={step === "claim"}
        onClose={handleDismissClaim}
        guests={unclaimedGuests}
        onClaim={handleClaimGuest}
        onDismissAll={handleDismissClaim}
        title="Êtes-vous une de ces personnes ?"
        dismissLabel={hasOwnPlayer ? "Rejoindre en tant que moi" : undefined}
      />

      <JoinNameSheet
        isOpen={step === "confirm"}
        mode="confirm"
        initialName={claimedGuest?.pseudo ?? ""}
        contextName={leagueName ?? undefined}
        onClose={() => finalizeClaim(claimedGuest?.pseudo ?? "")}
        onSubmit={finalizeClaim}
      />

      {/* "Create new player" — only for identities without a player. Identified
          users with a player auto-join via the effect above. */}
      <JoinNameSheet
        isOpen={step === "create" && hasOwnPlayer === false}
        mode="create"
        initialName=""
        contextName={leagueName ?? undefined}
        onClose={() => setStep("idle")}
        onSubmit={finalizeCreate}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          setStep("postgate");
        }}
      />
    </div>
  );
};
