import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Zap, Radio, Diamond, Trophy } from "lucide-react";
import { useAuthContext } from "../context/AuthContext";
import { useIdentity } from "../hooks/useIdentity";
import { useHomeData } from "../hooks/useHomeData";
import { usePremium } from "../hooks/usePremium";
import { usePremiumLimits } from "../hooks/usePremiumLimits";
import { PaymentModal } from "../components/PaymentModal";
import { PongloGlyph } from "../components/ponglo/Wordmark";
import { PButton } from "../components/ponglo/PButton";
import { EloDelta } from "../components/ponglo/EloDelta";
import { PRankBadge } from "../components/ponglo/PRankBadge";

export const Home = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const { localUser } = useIdentity();
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const userId = user?.id ?? localUser?.anonymousUserId ?? null;

  const { lastTournament, lastLeague, personalStats, isLoading, error } =
    useHomeData(userId);

  const { isPremium: _isPremium, refetch: refetchPremium } = usePremium(userId);
  const { canCreateLeague, isAtLeagueLimit: _isAtLeagueLimit } = usePremiumLimits();

  const pseudo =
    localUser?.pseudo ?? user?.email?.split("@")[0] ?? "Champion";
  const initials = pseudo.slice(0, 2).toUpperCase();
  const elo = Math.round(personalStats?.averageElo ?? 1000);
  const totalMatches = personalStats?.totalMatches ?? 0;
  const wins = Math.round(totalMatches * (personalStats?.winRate ?? 0) / 100);
  const losses = Math.max(0, totalMatches - wins);

  const handleUpgradeClick = () => setShowPaymentModal(true);
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
      <div className="min-h-screen bg-cream text-ink flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-ruby mb-4 font-archivo font-extrabold uppercase tracking-tight">
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
    <div className="min-h-screen bg-cream text-ink flex flex-col">
      {/* Top nav */}
      <div className="flex items-center gap-2.5 px-[18px] pt-14 pb-3.5">
        <PongloGlyph size={32} />
        <h1 className="flex-1 font-archivo font-extrabold uppercase text-[17px] tracking-[-0.3px] text-ink">
          Salut {pseudo} <span className="normal-case">👋</span>
        </h1>
        <div className="w-9 h-9 rounded-full bg-forest text-cream flex items-center justify-center font-archivo font-extrabold text-[13px]">
          {initials}
        </div>
      </div>

      {/* Main scroll area */}
      <div className="flex-1 px-[18px] pb-[110px] overflow-auto">
        {/* ELO hero card */}
        <div className="relative overflow-hidden bg-forest text-cream rounded-xl p-[22px] shadow-card-lg">
          <div className="flex justify-between items-start mb-3.5">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[1.5px] opacity-55">
                {isLoading ? "ELO · —" : `ELO · ${lastLeague?.name ?? "Ta saison"}`}
              </div>
              <div className="mt-1.5">
                <PRankBadge elo={elo} size="sm" />
              </div>
            </div>
            <EloDelta value={0} />
          </div>
          <div
            className="font-archivo font-black text-lime"
            style={{ fontSize: 72, lineHeight: 0.9, letterSpacing: -2 }}
          >
            {elo}
          </div>
          <div className="text-xs opacity-60 mt-1 font-mono">
            {totalMatches > 0
              ? `${wins}W — ${losses}L · ${totalMatches} matchs`
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
            bg="bg-lime"
            color="text-ink"
            onClick={() =>
              activeTournament
                ? navigate(`/tournament/${activeTournament.id}`)
                : navigate("/tournaments")
            }
          />
          <QuickAction
            label="Rejoindre"
            sub="code / QR"
            icon={<Radio size={22} strokeWidth={2.2} />}
            bg="bg-terracotta"
            color="text-cream"
            onClick={() => navigate("/join")}
          />
          <QuickAction
            label="Tournoi"
            sub="bracket live"
            icon={<Diamond size={22} strokeWidth={2.2} fill="currentColor" />}
            bg="bg-paper"
            color="text-ink"
            border
            onClick={() => navigate("/tournaments")}
          />
          <QuickAction
            label="Ligue"
            sub="saison longue"
            icon={<Trophy size={22} strokeWidth={2.2} />}
            bg="bg-paper"
            color="text-ink"
            border
            onClick={() =>
              canCreateLeague ? navigate("/leagues") : setShowPaymentModal(true)
            }
          />
        </div>

        {/* Active tournament banner */}
        {activeTournament && (
          <div className="mt-5 bg-paper border-[1.5px] border-ink rounded-lg p-4 shadow-[0_3px_0_#F4F2E8]">
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="w-2 h-2 rounded-full bg-ruby"
                style={{ boxShadow: "0 0 0 4px rgba(255,68,56,0.18)" }}
              />
              <span className="font-mono text-[10px] tracking-[1.5px] uppercase text-ruby font-bold">
                En direct
              </span>
            </div>
            <div className="font-archivo font-extrabold text-xl tracking-[-0.4px]">
              {activeTournament.name}
            </div>
            <div className="text-[13px] text-ink-soft mt-0.5">
              {activeTournament.playerCount} joueurs
            </div>
            <div className="mt-3 flex gap-2">
              <PButton
                size="sm"
                variant="primary"
                onClick={() => navigate(`/tournament/${activeTournament.id}`)}
              >
                Voir le tournoi →
              </PButton>
              <PButton
                size="sm"
                variant="ghost"
                onClick={handleUpgradeClick}
              >
                Partager
              </PButton>
            </div>
          </div>
        )}

        {/* Last activity */}
        {(lastTournament || lastLeague) && (
          <div className="mt-6">
            <div className="flex justify-between items-baseline mb-2.5">
              <h2 className="font-archivo font-extrabold text-[14px] uppercase tracking-[0.5px]">
                Dernière activité
              </h2>
            </div>
            <div className="flex flex-col gap-2">
              {lastTournament && (
                <ActivityRow
                  label={lastTournament.name}
                  sub={`${lastTournament.playerCount} joueurs · ${
                    lastTournament.isFinished ? "Terminé" : "En cours"
                  }`}
                  onClick={() =>
                    navigate(`/tournament/${lastTournament.id}`)
                  }
                  accent={lastTournament.isFinished ? "ink" : "forest"}
                />
              )}
              {lastLeague && (
                <ActivityRow
                  label={lastLeague.name}
                  sub={`${lastLeague.memberCount} membres · Ligue`}
                  onClick={() => navigate(`/league/${lastLeague.id}`)}
                  accent="forest"
                />
              )}
            </div>
          </div>
        )}
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

function ActivityRow({
  label,
  sub,
  onClick,
  accent,
}: {
  label: string;
  sub: string;
  onClick: () => void;
  accent: "forest" | "ink";
}) {
  return (
    <button
      onClick={onClick}
      className="bg-paper border border-card-muted rounded-md p-3 flex items-center gap-2.5 text-left"
    >
      <div className="flex-1 min-w-0">
        <div
          className={`text-[14px] font-semibold truncate ${
            accent === "forest" ? "text-forest" : "text-ink"
          }`}
        >
          {label}
        </div>
        <div className="text-[11px] text-ink-mute mt-0.5 font-mono">
          {sub}
        </div>
      </div>
      <span className="text-ink-mute font-mono text-sm">→</span>
    </button>
  );
}
