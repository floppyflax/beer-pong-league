import { useNavigate } from "react-router-dom";
import { BarChart3, Lock, ArrowUpCircle, ArrowRight } from "lucide-react";
import { PButton } from "../ponglo/PButton";

interface PersonalStats {
  totalMatches: number;
  winRate: number;
  /** Plus longue série de victoires consécutives. Remplace l'ancien `averageElo`
   *  (méta agrégée trompeuse — l'ELO se calibre par contexte, pas globalement). */
  bestStreak: number;
}

interface PersonalStatsSummaryProps {
  stats?: PersonalStats;
  isLoading?: boolean;
  isPremium: boolean;
  onUpgradeClick?: () => void;
}

const SkeletonCard = () => (
  <div className="bg-navy-soft rounded-card p-6 border border-card animate-pulse">
    <div className="h-5 bg-navy/60 rounded w-1/2 mb-6" />
    <div className="space-y-3">
      <div className="h-16 bg-navy/60 rounded-card" />
      <div className="h-16 bg-navy/60 rounded-card" />
      <div className="h-16 bg-navy/60 rounded-card" />
    </div>
  </div>
);

const EmptyState = () => (
  <div className="bg-navy-soft rounded-card p-6 border border-card text-center">
    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-cool-gray/10 mb-3">
      <BarChart3 size={22} className="text-cool-gray" />
    </div>
    <h3 className="font-archivo font-extrabold uppercase tracking-[-0.3px] text-white text-base mb-1">
      Aucun match joué
    </h3>
    <p className="text-sm text-cool-gray">
      Commence à jouer pour voir tes stats.
    </p>
  </div>
);

interface KpiProps {
  label: string;
  value: string | number;
  accent?: "white" | "lime" | "electric-blue" | "ping-yellow";
}

const accentClass: Record<NonNullable<KpiProps["accent"]>, string> = {
  white: "text-white",
  lime: "text-lime",
  "electric-blue": "text-electric-blue",
  "ping-yellow": "text-ping-yellow",
};

const Kpi = ({ label, value, accent = "white" }: KpiProps) => (
  <div className="flex items-baseline justify-between bg-navy/60 border border-card rounded-card px-4 py-3">
    <span className="text-[11px] uppercase tracking-[1.5px] font-bold text-cool-gray">
      {label}
    </span>
    <span
      className={`font-archivo font-extrabold text-2xl tracking-[-0.5px] ${accentClass[accent]}`}
    >
      {value}
    </span>
  </div>
);

export const PersonalStatsSummary = ({
  stats,
  isLoading,
  isPremium,
  onUpgradeClick,
}: PersonalStatsSummaryProps) => {
  const navigate = useNavigate();

  if (isLoading) return <SkeletonCard />;

  if (!stats || stats.totalMatches === 0) return <EmptyState />;

  if (!isPremium) {
    return (
      <div className="bg-navy-soft rounded-card border border-card p-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-ping-yellow/15 mb-3">
          <Lock size={22} className="text-ping-yellow" />
        </div>
        <h2 className="font-archivo font-extrabold uppercase tracking-[-0.4px] text-white text-xl mb-2">
          Fonctionnalité Premium
        </h2>
        <p className="text-cool-gray text-sm leading-relaxed mb-5">
          Débloque tes statistiques personnelles pour suivre ta progression à
          travers tous tes événements et ligues.
        </p>

        <ul className="bg-navy/60 border border-card rounded-card p-4 mb-5 text-left space-y-2">
          {[
            "Évolution ELO par ligue / event",
            "Taux de victoire détaillé",
            "Statistiques par adversaire",
            "Graphiques de performance",
          ].map((feature) => (
            <li
              key={feature}
              className="flex items-center gap-2 text-sm text-white"
            >
              <span className="text-lime font-bold">✓</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <PButton
          variant="primary"
          size="md"
          full
          icon={<ArrowUpCircle size={18} />}
          onClick={onUpgradeClick}
        >
          Passer au Premium
        </PButton>
      </div>
    );
  }

  return (
    <div className="bg-navy-soft rounded-card border border-card p-6">
      <h2 className="font-archivo font-extrabold uppercase tracking-[-0.4px] text-white text-xl mb-4">
        Mes Stats
      </h2>

      <div className="space-y-2.5">
        <Kpi label="Matchs joués" value={stats.totalMatches} />
        <Kpi label="Taux de victoire" value={`${stats.winRate}%`} accent="lime" />
        <Kpi label="Meilleure série" value={stats.bestStreak} accent="ping-yellow" />
      </div>

      <button
        onClick={() => navigate("/profile?tab=stats")}
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-archivo font-bold uppercase tracking-[-0.2px] text-ping-yellow hover:brightness-110 transition-[filter]"
      >
        Voir toutes mes stats
        <ArrowRight size={14} />
      </button>
    </div>
  );
};
