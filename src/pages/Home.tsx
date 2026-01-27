import { Link, useNavigate } from "react-router-dom";
import { useLeague } from "../context/LeagueContext";
import { useAuthContext } from "../context/AuthContext";
import { useIdentity } from "../hooks/useIdentity";
import { LoadingSpinner } from "../components/LoadingSpinner";

export const Home = () => {
  const { leagues, tournaments, isLoadingInitialData } = useLeague();
  const { isAuthenticated } = useAuthContext();
  const { localUser } = useIdentity();
  const navigate = useNavigate();

  const hasData = leagues.length > 0 || tournaments.length > 0;
  const hasIdentity = isAuthenticated || localUser;

  if (isLoadingInitialData) {
    return (
      <div className="flex items-center justify-center flex-grow">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  // If no identity and no data, show welcome message
  if (!hasIdentity && !hasData) {
    return (
      <div className="flex flex-col items-center justify-center flex-grow space-y-8 py-12 px-6">
        <div className="space-y-4 text-center">
          <h1 className="text-5xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent leading-tight">
            BEER PONG
            <br />
            LEAGUE
          </h1>
          <p className="text-slate-400 text-lg max-w-xs mx-auto">
            Deviens une légende. <br />
            Gère tes tournois et écrase tes potes.
          </p>
        </div>

        <div className="w-full max-w-sm space-y-4">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 text-center">
            <p className="text-slate-300 mb-4">
              Connecte-toi pour créer et gérer tes ligues et tournois.
            </p>
            <p className="text-sm text-slate-500 mb-4">
              Ou rejoins un tournoi via un lien partagé.
            </p>
            <button
              onClick={() => navigate("/user/profile")}
              className="w-full bg-primary hover:bg-primary/80 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              Se connecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center flex-grow space-y-10 py-12 px-6">
      <div className="space-y-4 text-center">
        <h1 className="text-5xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent leading-tight">
          BEER PONG
          <br />
          LEAGUE
        </h1>
        <p className="text-slate-400 text-lg max-w-xs mx-auto">
          Deviens une légende. <br />
          Gère tes tournois et écrase tes potes.
        </p>
      </div>

      <div className="w-full space-y-4">
        {tournaments.length > 0 && (
          <div className="pt-4 w-full">
            <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-4 text-center">
              Mes Tournois
            </h3>
            <div className="space-y-3">
              {tournaments.map((tournament) => (
                <div
                  key={tournament.id}
                  onClick={() => navigate(`/tournament/${tournament.id}`)}
                  className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center hover:border-accent cursor-pointer transition-colors"
                >
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      {tournament.name}
                      {tournament.isFinished && (
                        <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded">
                          Terminé
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">
                      {new Date(tournament.date).toLocaleDateString("fr-FR")} •{" "}
                      {tournament.matches.length} matchs
                    </div>
                  </div>
                  <div className="text-slate-500">→</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {leagues.length > 0 && (
          <div className="pt-4 w-full">
            <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-4 text-center">
              Mes Leagues
            </h3>
            <div className="space-y-3">
              {leagues.map((league) => (
                <div
                  key={league.id}
                  onClick={() => navigate(`/league/${league.id}`)}
                  className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center hover:border-primary cursor-pointer transition-colors"
                >
                  <div>
                    <div className="font-bold text-white">{league.name}</div>
                    <div className="text-xs text-slate-400">
                      {league.players.length} joueurs •{" "}
                      {league.type === "season" ? "Saison" : "Continue"}
                    </div>
                  </div>
                  <div className="text-slate-500">→</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasIdentity && (
          <div className="grid grid-cols-2 gap-3 pt-4">
            <Link
              to="/create-league"
              className="block bg-primary hover:bg-amber-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg transform transition active:scale-95 text-center text-sm"
            >
              NOUVELLE LIGUE
            </Link>
            <Link
              to="/create-tournament"
              className="block bg-accent hover:bg-red-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg transform transition active:scale-95 text-center text-sm"
            >
              NOUVEAU TOURNOI
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
