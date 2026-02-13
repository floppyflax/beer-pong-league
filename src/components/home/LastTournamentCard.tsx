import { useNavigate } from "react-router-dom";
import { Trophy } from "lucide-react";
import { formatRelativeTime } from "../../utils/dateUtils";

interface Tournament {
  id: string;
  name: string;
  isFinished: boolean;
  playerCount: number;
  updatedAt: string;
}

interface LastTournamentCardProps {
  tournament?: Tournament;
  isLoading?: boolean;
}

const SkeletonCard = () => (
  <div className="bg-slate-800/90 rounded-xl p-6 border border-slate-700/50 animate-pulse">
    <div className="h-6 bg-slate-700 rounded w-3/4 mb-4"></div>
    <div className="h-4 bg-slate-700 rounded w-1/2 mb-4"></div>
    <div className="h-10 bg-slate-700 rounded"></div>
  </div>
);

const EmptyCard = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 text-center">
      <Trophy size={32} className="mx-auto mb-4 text-slate-600" />
      <h3 className="text-lg font-bold text-white mb-2">Aucun tournoi</h3>
      <p className="text-sm text-slate-400 mb-4">
        Rejoignez un tournoi pour commencer à jouer
      </p>
      <button
        onClick={() => navigate("/join")}
        className="w-full bg-primary hover:bg-amber-600 text-white font-bold py-3 rounded-lg transition-all"
      >
        Rejoindre un tournoi
      </button>
    </div>
  );
};

export const LastTournamentCard = ({
  tournament,
  isLoading,
}: LastTournamentCardProps) => {
  const navigate = useNavigate();

  if (isLoading) {
    return <SkeletonCard />;
  }

  if (!tournament) {
    return <EmptyCard />;
  }

  return (
    <div
      className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 hover:border-primary/50 transition-all cursor-pointer"
      onClick={() => navigate(`/tournament/${tournament.id}`)}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">{tournament.name}</h3>
          <p className="text-sm text-slate-400 mt-1">
            {tournament.playerCount} joueurs
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold ${
            tournament.isFinished
              ? "bg-slate-700 text-slate-400"
              : "bg-primary/20 text-primary"
          }`}
        >
          {tournament.isFinished ? "Terminé" : "En cours"}
        </span>
      </div>

      <p className="text-xs text-slate-500 mb-4">
        Dernière activité: {formatRelativeTime(tournament.updatedAt)}
      </p>

      <button className="w-full bg-primary hover:bg-amber-600 text-white font-bold py-3 rounded-lg transition-all">
        VOIR LE CLASSEMENT
      </button>
    </div>
  );
};
