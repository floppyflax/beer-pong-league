import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Zap, Radio, Diamond, Trophy, ChevronRight } from "lucide-react";
import { useAuthContext } from "../context/AuthContext";
import { useIdentity } from "../hooks/useIdentity";
import { useIsAnonymous } from "../hooks/useIsAnonymous";
import { useHomeData } from "../hooks/useHomeData";
import { AnonGatePlaceholder } from "../components/AnonGatePlaceholder";
import { usePremium } from "../hooks/usePremium";
import { usePremiumLimits } from "../hooks/usePremiumLimits";
import { PaymentModal } from "../components/PaymentModal";
import { PongloGlyph } from "../components/ponglo/Wordmark";
import { PButton } from "../components/ponglo/PButton";
import { EloDelta } from "../components/ponglo/EloDelta";
import { QuickAction, Sheet } from "../components/design-system";

export const Home = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, userProfile } = useAuthContext();
  const { localUser } = useIdentity();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showNoContextSheet, setShowNoContextSheet] = useState(false);

  const userId = user?.id ?? localUser?.anonymousUserId ?? null;
  const isAnonymous = useIsAnonymous();

  const { lastEvent, lastLeague, personalStats, recentMatches, isLoading, error } =
    useHomeData(userId);

  const { isPremium: _isPremium, refetch: refetchPremium } = usePremium(userId);
  const { canCreateEvent } = usePremiumLimits();

  const pseudo =
    userProfile?.pseudo ||
    localUser?.pseudo ||
    user?.email?.split("@")[0] ||
    "Champion";
  const initials = pseudo.slice(0, 2).toUpperCase();
  const totalMatches = personalStats?.totalMatches ?? 0;
  const wins = Math.round(totalMatches * (personalStats?.winRate ?? 0) / 100);
  const losses = Math.max(0, totalMatches - wins);
  const bestStreak = personalStats?.bestStreak ?? 0;

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    refetchPremium();
    if (userId) {
      queryClient.invalidateQueries({ queryKey: ["homeData", userId] });
    }
  };

  const activeEvent =
    lastEvent && !lastEvent.isFinished ? lastEvent : null;

  const handleNewMatch = () => {
    if (activeEvent) {
      navigate(`/record-match/event/${activeEvent.id}`);
      return;
    }
    if (lastLeague) {
      navigate(`/record-match/league/${lastLeague.id}`);
      return;
    }
    setShowNoContextSheet(true);
  };

  const handleCreateEventFromSheet = () => {
    setShowNoContextSheet(false);
    if (canCreateEvent) {
      navigate("/create-event");
    } else {
      setShowPaymentModal(true);
    }
  };

  const handleJoinFromSheet = () => {
    setShowNoContextSheet(false);
    navigate("/join");
  };

  if (error) {
    return (
      <div className="min-h-screen bg-navy text-white flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-signal-red mb-4 font-archivo font-extrabold uppercase tracking-tight">
            Erreur lors du chargement
          </p>
          <PButton variant="primary" onClick={() => window.location.reload()}>
            Réessayer
          </PButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy text-white flex flex-col">
      {/* Top nav */}
      <div className="flex items-center gap-2.5 px-[18px] pt-14 pb-3.5">
        <PongloGlyph size={32} />
        <h1 className="flex-1 font-archivo font-extrabold uppercase text-[17px] tracking-[-0.3px] text-white">
          Salut {pseudo} <span className="normal-case">👋</span>
        </h1>
        <div className="w-9 h-9 rounded-full bg-electric-blue text-navy flex items-center justify-center font-archivo font-extrabold text-[13px]">
          {initials}
        </div>
      </div>

      {/* Main scroll area */}
      <div className="flex-1 px-[18px] pb-[110px] overflow-auto">
        {/* Stats hero — masked for anon users behind a sign-up CTA. Anon users
            keep access to "Jouer" (active event banner + quick actions below)
            but lifetime stats live behind an account. */}
        {isAnonymous ? (
          <AnonGatePlaceholder
            title="Suis tes stats"
            description="Crée un compte gratuit pour voir tes matchs joués, ton win rate et ta meilleure streak en cumul lifetime."
          />
        ) : (
          <div className="relative overflow-hidden bg-electric-blue text-navy rounded-xl p-[22px] shadow-card-lg">
            <div className="flex justify-between items-start mb-3.5">
              <div className="font-mono text-[10px] uppercase tracking-[1.5px] opacity-55">
                {isLoading ? "Stats · —" : "Stats · Lifetime"}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 relative z-10">
              <div>
                <div
                  className="font-archivo font-black text-lime"
                  style={{ fontSize: 52, lineHeight: 0.9, letterSpacing: -1.5 }}
                >
                  {totalMatches}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[1.5px] opacity-55 mt-2">
                  Matchs joués
                </div>
              </div>
              <div>
                <div
                  className="font-archivo font-black text-navy"
                  style={{ fontSize: 52, lineHeight: 0.9, letterSpacing: -1.5 }}
                >
                  {totalMatches > 0
                    ? `${Math.round(personalStats?.winRate ?? 0)}%`
                    : "—"}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[1.5px] opacity-55 mt-2">
                  Win rate
                </div>
              </div>
            </div>
            <div className="text-xs opacity-60 mt-4 font-mono relative z-10">
              {totalMatches > 0
                ? `${wins}W — ${losses}L${bestStreak > 1 ? ` · streak max ${bestStreak}` : ""}`
                : "Pas encore de matchs"}
            </div>
            {/* lime glow decoration */}
            <div
              className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-lime pointer-events-none"
              style={{ opacity: 0.1 }}
            />
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-2.5 mt-4">
          <QuickAction
            label="Nouveau match"
            sub="+/- ELO instant"
            icon={<Zap size={22} strokeWidth={2.2} />}
            bg="bg-ping-yellow"
            color="text-navy"
            onClick={handleNewMatch}
          />
          <QuickAction
            label="Rejoindre"
            sub="code / QR"
            icon={<Radio size={22} strokeWidth={2.2} />}
            bg="bg-signal-red"
            color="text-navy"
            onClick={() => navigate("/join")}
          />
          <QuickAction
            label="Événement"
            sub="bracket live"
            icon={<Diamond size={22} strokeWidth={2.2} fill="currentColor" />}
            bg="bg-navy-soft"
            color="text-white"
            border
            onClick={() => navigate("/competitions?tab=events")}
          />
          <QuickAction
            label="Ligue"
            sub="saison longue"
            icon={<Trophy size={22} strokeWidth={2.2} />}
            bg="bg-navy-soft"
            color="text-white"
            border
            onClick={() => navigate("/competitions?tab=leagues")}
          />
        </div>

        {/* Active event banner */}
        {activeEvent && (
          <button
            className="mt-5 w-full bg-navy-soft border-[1.5px] border-white rounded-lg p-4 shadow-[0_3px_0_#F4F2E8] flex items-center gap-3 text-left"
            onClick={() => navigate(`/event/${activeEvent.id}`)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className="w-2 h-2 rounded-full bg-lime shrink-0"
                  style={{ boxShadow: "0 0 0 4px rgba(183,255,59,0.18)" }}
                />
                <span className="font-mono text-[10px] tracking-[1.5px] uppercase text-lime font-bold">
                  En ce moment
                </span>
              </div>
              <div className="font-archivo font-extrabold text-xl tracking-[-0.4px] truncate">
                {activeEvent.name}
              </div>
              <div className="text-[13px] text-cool-gray mt-0.5 flex items-center gap-1.5">
                <span>{activeEvent.playerCount} {activeEvent.playerCount === 1 ? "joueur" : "joueurs"}</span>
                <span className="opacity-40">·</span>
                <span>{activeEvent.matchCount} {activeEvent.matchCount === 1 ? "match" : "matchs"}</span>
                <span className="opacity-40">·</span>
                <span>{activeEvent.format}</span>
                <span className="opacity-40">·</span>
                <span className="text-lime font-bold">ELO</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <ChevronRight size={18} className="text-white" />
            </div>
          </button>
        )}

        {/* Last matches */}
        <div className="mt-6">
          <h2 className="font-archivo font-extrabold text-[14px] uppercase tracking-[0.5px] mb-2.5">
            Derniers résultats
          </h2>
          {recentMatches.length === 0 ? (
            <div className="bg-navy-soft border border-card rounded-card p-4 text-center">
              <p className="text-cool-gray text-[13px]">Aucun match joué pour l'instant.</p>
              <p className="text-cool-gray text-[12px] mt-0.5">Rejoins un événement et joue ta première partie !</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recentMatches.map((m) => (
                <div key={m.id} className="bg-navy-soft border border-card rounded-card px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="font-extrabold text-[14px] tracking-tight">
                      {m.scoreA} – {m.scoreB}
                      <span className="text-cool-gray font-normal text-[12px] ml-2">{m.format}</span>
                    </div>
                    {m.contextName && (
                      <div className="text-cool-gray text-[12px] mt-0.5">{m.contextName}</div>
                    )}
                  </div>
                  <EloDelta value={m.eloChange} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
      />

      <Sheet
        isOpen={showNoContextSheet}
        onClose={() => setShowNoContextSheet(false)}
        title="Aucun event ou ligue"
        footer={
          <div className="flex flex-col gap-2.5">
            <PButton variant="primary" full onClick={handleCreateEventFromSheet}>
              Créer un événement
            </PButton>
            <PButton variant="ghost" full onClick={handleJoinFromSheet}>
              Rejoindre avec un code
            </PButton>
          </div>
        }
      >
        <p className="text-cool-gray text-[14px] leading-relaxed">
          Pour enregistrer un match, tu dois d'abord rejoindre ou créer un
          événement ou une ligue. L'ELO est toujours local au contexte — pas
          d'event ou de ligue, pas de match.
        </p>
      </Sheet>
    </div>
  );
};


