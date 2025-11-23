import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { useLeague } from "../context/LeagueContext";
import { useIdentity } from "../hooks/useIdentity";
import { ArrowLeft, Trophy, Calendar, Users } from "lucide-react";
import { useMemo } from "react";

export const UserProfile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut } = useAuthContext();
  const { localUser } = useIdentity();
  const { leagues, tournaments } = useLeague();

  // Calculate user stats
  const userStats = useMemo(() => {
    const userLeagues = leagues.filter(
      (league) =>
        (isAuthenticated && user && league.creator_user_id === user.id) ||
        (!isAuthenticated && localUser && league.creator_anonymous_user_id === localUser.anonymousUserId)
    );

    const userTournaments = tournaments.filter(
      (tournament) =>
        (isAuthenticated && user && tournament.creator_user_id === user.id) ||
        (!isAuthenticated && localUser && tournament.creator_anonymous_user_id === localUser.anonymousUserId)
    );

    const totalMatches = leagues.reduce(
      (acc, league) => acc + league.matches.length,
      0
    );

    return {
      leagues: userLeagues.length,
      tournaments: userTournaments.length,
      totalMatches,
      userLeagues,
      userTournaments,
    };
  }, [leagues, tournaments, user, isAuthenticated, localUser]);

  const displayName = isAuthenticated && user
    ? user.email?.split("@")[0] || "Utilisateur"
    : localUser?.pseudo || "Invité";

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 bg-slate-800/50 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">Mon Profil</h2>
          <div className="text-xs text-slate-400">
            {isAuthenticated ? "Compte authentifié" : "Mode local"}
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="p-4 space-y-4">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
              <User size={32} className="text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold">{displayName}</h3>
              {isAuthenticated && user && (
                <div className="text-sm text-slate-400 flex items-center gap-2 mt-1">
                  <Mail size={14} />
                  {user.email}
                </div>
              )}
              {!isAuthenticated && localUser && (
                <div className="text-sm text-slate-400 flex items-center gap-2 mt-1">
                  <span>📱 Mode local</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-800 p-4 rounded-xl text-center border border-slate-700/50">
            <div className="text-2xl font-bold text-primary">
              {userStats.leagues}
            </div>
            <div className="text-[10px] text-slate-400 uppercase font-bold mt-1">
              Leagues
            </div>
          </div>
          <div className="bg-slate-800 p-4 rounded-xl text-center border border-slate-700/50">
            <div className="text-2xl font-bold text-accent">
              {userStats.tournaments}
            </div>
            <div className="text-[10px] text-slate-400 uppercase font-bold mt-1">
              Tournois
            </div>
          </div>
          <div className="bg-slate-800 p-4 rounded-xl text-center border border-slate-700/50">
            <div className="text-2xl font-bold text-white">
              {userStats.totalMatches}
            </div>
            <div className="text-[10px] text-slate-400 uppercase font-bold mt-1">
              Matchs
            </div>
          </div>
        </div>

        {/* My Leagues */}
        {userStats.userLeagues.length > 0 && (
          <div>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Trophy size={20} className="text-primary" />
              Mes Leagues
            </h3>
            <div className="space-y-2">
              {userStats.userLeagues.map((league) => (
                <div
                  key={league.id}
                  onClick={() => navigate(`/league/${league.id}`)}
                  className="bg-slate-800 p-4 rounded-xl border border-slate-700/50 hover:border-primary cursor-pointer transition-colors"
                >
                  <div className="font-bold text-white">{league.name}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {league.players.length} joueurs • {league.matches.length} matchs
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Tournaments */}
        {userStats.userTournaments.length > 0 && (
          <div>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Calendar size={20} className="text-accent" />
              Mes Tournois
            </h3>
            <div className="space-y-2">
              {userStats.userTournaments.map((tournament) => (
                <div
                  key={tournament.id}
                  onClick={() => navigate(`/tournament/${tournament.id}`)}
                  className="bg-slate-800 p-4 rounded-xl border border-slate-700/50 hover:border-accent cursor-pointer transition-colors"
                >
                  <div className="font-bold text-white flex items-center gap-2">
                    {tournament.name}
                    {tournament.isFinished && (
                      <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded">
                        Terminé
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {new Date(tournament.date).toLocaleDateString("fr-FR")} • {tournament.matches.length} matchs
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 pt-4">
          {isAuthenticated && (
            <button
              onClick={async () => {
                await signOut();
                navigate("/");
              }}
              className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-500 font-bold py-3 rounded-xl border border-red-500/50 flex items-center justify-center gap-2"
            >
              <LogOut size={18} />
              <span>Déconnexion</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

