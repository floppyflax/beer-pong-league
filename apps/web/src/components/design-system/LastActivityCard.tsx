import { useNavigate } from "react-router-dom";
import { Award, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatRelativeTime } from "@/utils/dateUtils";

export type LastActivityKind = "league" | "tournament";

export interface LastActivity {
  id: string;
  name: string;
  /** members (league) ou joueurs (tournament) */
  count: number;
  /** ISO date of last activity */
  updatedAt: string;
  finished: boolean;
}

export interface LastActivityCardProps {
  kind: LastActivityKind;
  activity?: LastActivity;
  isLoading?: boolean;
  /** Override du CTA empty-state (league). Checke premium limit quand fourni. */
  onEmptyAction?: () => void;
  /** Affiche un cadenas sur le CTA empty quand au plafond free. */
  emptyActionLocked?: boolean;
}

interface KindConfig {
  Icon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  emptyCta: string;
  emptyHref: string;
  countLabel: (count: number) => string;
  detailHref: (id: string) => string;
  finishedLabel: string;
  activeLabel: string;
}

const CONFIG: Record<LastActivityKind, KindConfig> = {
  league: {
    Icon: Award,
    emptyTitle: "Aucune league",
    emptyDescription: "Créez une league pour jouer avec vos amis régulièrement",
    emptyCta: "Créer une league",
    emptyHref: "/create-league",
    countLabel: (n) => `${n} membre${n > 1 ? "s" : ""}`,
    detailHref: (id) => `/league/${id}`,
    finishedLabel: "Terminée",
    activeLabel: "Active",
  },
  tournament: {
    Icon: Trophy,
    emptyTitle: "Aucun tournoi",
    emptyDescription: "Rejoignez un tournoi pour commencer à jouer",
    emptyCta: "Rejoindre un tournoi",
    emptyHref: "/join",
    countLabel: (n) => `${n} joueur${n > 1 ? "s" : ""}`,
    detailHref: (id) => `/tournament/${id}`,
    finishedLabel: "Terminé",
    activeLabel: "En cours",
  },
};

const Skeleton = () => (
  <div className="bg-paper rounded-card p-6 border border-card animate-pulse">
    <div className="h-6 bg-cream-deep rounded w-3/4 mb-4" />
    <div className="h-4 bg-cream-deep rounded w-1/2 mb-4" />
    <div className="h-10 bg-cream-deep rounded" />
  </div>
);

export function LastActivityCard({
  kind,
  activity,
  isLoading,
  onEmptyAction,
  emptyActionLocked,
}: LastActivityCardProps) {
  const navigate = useNavigate();
  const cfg = CONFIG[kind];
  const Icon = cfg.Icon;

  if (isLoading) return <Skeleton />;

  if (!activity) {
    const handleEmpty = onEmptyAction ?? (() => navigate(cfg.emptyHref));
    return (
      <div
        className="bg-paper rounded-card p-6 border border-card text-center"
        data-testid="last-activity-card-empty"
      >
        <Icon size={32} className="mx-auto mb-4 text-ink-mute" aria-hidden />
        <h3 className="text-lg font-archivo font-extrabold uppercase tracking-tight text-ink mb-2">
          {cfg.emptyTitle}
        </h3>
        <p className="text-sm text-ink-soft mb-4">{cfg.emptyDescription}</p>
        <button
          type="button"
          onClick={handleEmpty}
          className="w-full bg-cup-red text-ink border-[1.5px] border-cup-red-deep shadow-[0_3px_0_#C42418] hover:brightness-110 active:translate-y-[2px] active:shadow-[0_1px_0_#C42418] font-archivo font-bold uppercase tracking-tight py-3 rounded-full transition-[transform,box-shadow,filter] duration-75 flex items-center justify-center gap-2"
        >
          {cfg.emptyCta}
          {emptyActionLocked && <span aria-label="Premium requis">🔒</span>}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => navigate(cfg.detailHref(activity.id))}
      className="w-full text-left bg-paper rounded-card p-6 border border-card hover:border-card-muted transition-colors cursor-pointer"
      data-testid="last-activity-card"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-archivo font-extrabold uppercase tracking-tight text-ink">
            {activity.name}
          </h3>
          <p className="text-sm text-ink-soft mt-1">
            {cfg.countLabel(activity.count)}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-sm text-xs font-archivo font-extrabold uppercase tracking-[0.6px] ${
            activity.finished
              ? "bg-cream-deep text-ink-soft border border-card"
              : "bg-lime/20 text-lime"
          }`}
        >
          {activity.finished ? cfg.finishedLabel : cfg.activeLabel}
        </span>
      </div>

      <p className="text-xs text-ink-mute mb-4">
        Dernière activité : {formatRelativeTime(activity.updatedAt)}
      </p>

      <div className="w-full bg-cup-red text-ink border-[1.5px] border-cup-red-deep shadow-[0_3px_0_#C42418] font-archivo font-bold uppercase tracking-tight py-3 rounded-full text-center">
        Voir le classement
      </div>
    </button>
  );
}
