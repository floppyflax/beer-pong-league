import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Zap, Radio, Diamond, Trophy, ChevronRight } from "lucide-react";
import { useAuthContext } from "../context/AuthContext";
import { useIdentity } from "../hooks/useIdentity";
import { useHomeData } from "../hooks/useHomeData";
import { usePremium } from "../hooks/usePremium";
import { usePremiumLimits } from "../hooks/usePremiumLimits";
import { PaymentModal } from "../components/PaymentModal";
import { PongloGlyph } from "../components/ponglo/Wordmark";
import { PButton } from "../components/ponglo/PButton";
import { EloDelta } from "../components/ponglo/EloDelta";

export const Home = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const { localUser } = useIdentity();
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const userId = user?.id ?? localUser?.anonymousUserId ?? null;

  const { lastTournament, personalStats, recentMatches, isLoading, error } =
    useHomeData(userId);

  const { isPremium: _isPremium, refetch: refetchPremium } = usePremium(userId);
  const { canCreateLeague, isAtLeagueLimit: _isAtLeagueLimit } = usePremiumLimits();

  const pseudo =
    localUser?.pseudo ?? user?.email?.split("@")[0] ?? "Champion";
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

  const activeTournament =
    lastTournament && !lastTournament.isFinished ? lastTournament : null;

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
        {/* Stats hero card — lifetime activity (no global ELO, cf. docs §ELO model) */}
        <div className="relative overflow-hidden bg-electric-blue text-navy rounded-xl p-[22px] shadow-card-lg">
          <div className="flex justify-between items-start mb-3.5">
            <div className="font-mono text-[10px] uppercase tracking-[1.5px] opacity-55">
              {isLoading ? "Matchs joués · —" : "Matchs joués · Lifetime"}
            </div>
          </div>
          <div
            className="font-archivo font-black text-lime"
            style={{ fontSize: 72, lineHeight: 0.9, letterSpacing: -2 }}
          >
            {totalMatches}
          </div>
          <div className="text-xs opacity-60 mt-1 font-mono">
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

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-2.5 mt-4">
          <QuickAction
            label="Nouveau match"
            sub="+/- ELO instant"
            icon={<Zap size={22} strokeWidth={2.2} />}
            bg="bg-ping-yellow"
            color="text-navy"
            onClick={() =>
              activeTournament
                ? navigate(`/event/${activeTournament.id}`)
                : navigate("/competitions?tab=events")
            }
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
            onClick={() =>
              canCreateLeague
                ? navigate("/competitions?tab=leagues")
                : setShowPaymentModal(true)
            }
          />
        </div>

        {/* Active tournament banner */}
        {activeTournament && (
          <button
            className="mt-5 w-full bg-navy-soft border-[1.5px] border-white rounded-lg p-4 shadow-[0_3px_0_#F4F2E8] flex items-center gap-3 text-left"
            onClick={() => navigate(`/event/${activeTournament.id}`)}
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
                {activeTournament.name}
              </div>
              <div className="text-[13px] text-cool-gray mt-0.5 flex items-center gap-1.5">
                <span>{activeTournament.playerCount} {activeTournament.playerCount === 1 ? "joueur" : "joueurs"}</span>
                <span className="opacity-40">·</span>
                <span>{activeTournament.matchCount} {activeTournament.matchCount === 1 ? "match" : "matchs"}</span>
                <span className="opacity-40">·</span>
                <span>{activeTournament.format}</span>
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
    </div>
  );
};

function QuickAction({
  label,
  sub,
  icon,
  bg,
  color,
  border,
  onClick,
}: {
  label: string;
  sub: string;
  icon: React.ReactNode;
  bg: string;
  color: string;
  border?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`${bg} ${color} ${
        border ? "border-[1.5px] border-card" : ""
      } rounded-lg p-3.5 flex flex-col justify-between gap-[22px] min-h-[86px] text-left transition-transform active:scale-[0.98]`}
    >
      <div className="opacity-80">{icon}</div>
      <div>
        <div className="font-archivo font-extrabold text-sm tracking-[-0.2px]">
          {label}
        </div>
        <div className="font-mono text-[11px] uppercase tracking-[0.5px] opacity-70 mt-0.5">
          {sub}
        </div>
      </div>
    </button>
  );
}

