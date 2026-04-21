import { useNavigate } from "react-router-dom";
import { Award } from "lucide-react";
import { formatRelativeTime } from "../../utils/dateUtils";

interface League {
  id: string;
  name: string;
  memberCount: number;
  updatedAt: string;
  status: "active" | "finished";
}

interface LastLeagueCardProps {
  league?: League;
  isLoading?: boolean;
  /** AC3: When empty, callback for "Créer une league" (checks premium limit when provided) */
  onEmptyAction?: () => void;
  /** Show lock icon on empty CTA when at premium limit */
  emptyActionLocked?: boolean;
}

const EmptyCard = ({
  onAction,
  showLock,
}: {
  onAction: () => void;
  showLock?: boolean;
}) => (
  <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 text-center">
    <Award size={32} className="mx-auto mb-4 text-slate-600" />
    <h3 className="text-lg font-bold text-white mb-2">Aucune league</h3>
    <p className="text-sm text-slate-400 mb-4">
      Créez une league pour jouer avec vos amis régulièrement
    </p>
    <button
      onClick={onAction}
      className="w-full bg-primary hover:bg-amber-600 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
    >
      Créer une league
      {showLock && <span>🔒</span>}
    </button>
  </div>
);

const SkeletonCard = () => (
  <div className="bg-slate-800/90 rounded-xl p-6 border border-slate-700/50 animate-pulse">
    <div className="h-6 bg-slate-700 rounded w-3/4 mb-4"></div>
    <div className="h-4 bg-slate-700 rounded w-1/2 mb-4"></div>
    <div className="h-10 bg-slate-700 rounded"></div>
  </div>
);

export const LastLeagueCard = ({
  league,
  isLoading,
  onEmptyAction,
  emptyActionLocked,
}: LastLeagueCardProps) => {
  const navigate = useNavigate();

  if (isLoading) {
    return <SkeletonCard />;
  }

  if (!league) {
    return (
      <EmptyCard
        onAction={onEmptyAction ?? (() => navigate("/create-league"))}
        showLock={emptyActionLocked}
      />
    );
  }

  return (
    <div
      className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 hover:border-primary/50 transition-all cursor-pointer"
      onClick={() => navigate(`/league/${league.id}`)}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">{league.name}</h3>
          <p className="text-sm text-slate-400 mt-1">
            {league.memberCount} membres
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold ${
            league.status === "finished"
              ? "bg-slate-700 text-slate-400"
              : "bg-primary/20 text-primary"
          }`}
        >
          {league.status === "finished" ? "Terminée" : "Active"}
        </span>
      </div>

      <p className="text-xs text-slate-500 mb-4">
        Dernière activité: {formatRelativeTime(league.updatedAt)}
      </p>

      <button className="w-full bg-primary hover:bg-amber-600 text-white font-bold py-3 rounded-lg transition-all">
        VOIR LE CLASSEMENT
      </button>
    </div>
  );
};
