import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/context/AuthContext";
import { useLeague } from "@/context/LeagueContext";
import { useIdentity } from "@/hooks/useIdentity";
import { useFullDisconnect } from "@/hooks/useFullDisconnect";
import { ContextualHeader } from "@/components/navigation/ContextualHeader";
import { StatCard } from "@/components/design-system/StatCard";
import { Trophy, Calendar, User, Mail, LogOut } from "lucide-react";
import { useMemo, useState } from "react";

export const UserProfile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthContext();
  const { localUser } = useIdentity();
  const { fullDisconnect } = useFullDisconnect();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const { leagues, tournaments } = useLeague();

  // Calculate user stats
  const userStats = useMemo(() => {
    const userLeagues = leagues.filter(
      (league) =>
        (isAuthenticated && user && league.creator_user_id === user.id) ||
        (!isAuthenticated &&
          localUser &&
          league.creator_anonymous_user_id === localUser.anonymousUserId),
    );

    const userTournaments = tournaments.filter(
      (tournament) =>
        (isAuthenticated && user && tournament.creator_user_id === user.id) ||
        (!isAuthenticated &&
          localUser &&
          tournament.creator_anonymous_user_id === localUser.anonymousUserId),
    );

    const totalMatches =
      userLeagues.reduce((acc, l) => acc + l.matches.length, 0) +
      userTournaments.reduce((acc, t) => acc + t.matches.length, 0);

    return {
      leagues: userLeagues.length,
      tournaments: userTournaments.length,
      totalMatches,
      userLeagues,
      userTournaments,
    };
  }, [leagues, tournaments, user, isAuthenticated, localUser]);

  const displayName =
    isAuthenticated && user
      ? user.email?.split("@")[0] || "Utilisateur"
      : localUser?.pseudo || "Invité";

  return (
    <div className="min-h-0 flex flex-col">
      {/* Contextual Header (design system 2.4) */}
      <ContextualHeader
        title="Mon Profil"
        showBackButton={true}
        onBack={() => navigate(-1)}
      />

      {/* Content: p-4 mobile, p-6 desktop (design system 3.4) */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {/* User status badge */}
        <div className="text-xs text-slate-400 text-center">
          {isAuthenticated ? "Compte authentifié" : "Mode local"}
        </div>

        {/* Profile Info card (bg-slate-800, design system 3.7) */}
        <div className="bg-slate-800 rounded-xl p-4 md:p-6 border border-slate-700/50">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-tab-active rounded-full flex items-center justify-center shrink-0">
              <User size={32} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-white truncate">
                {displayName}
              </h3>
              {isAuthenticated && user && (
                <div className="text-sm text-slate-400 flex items-center gap-2 mt-1 truncate">
                  <Mail size={14} className="shrink-0" />
                  <span className="truncate">{user.email}</span>
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

        {/* StatCards (design system 4.1) */}
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          <StatCard
            value={userStats.leagues}
            label="Leagues"
            variant="primary"
          />
          <StatCard
            value={userStats.tournaments}
            label="Tournois"
            variant="accent"
          />
          <StatCard value={userStats.totalMatches} label="Matchs" />
        </div>

        {/* My Leagues */}
        {userStats.userLeagues.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Trophy size={20} className="text-info" />
              Mes Leagues
            </h3>
            <div className="space-y-2">
              {userStats.userLeagues.map((league) => (
                <div
                  key={league.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/league/${league.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/league/${league.id}`);
                    }
                  }}
                  className="bg-gradient-card rounded-xl p-4 border border-slate-700/50 hover:border-slate-600 cursor-pointer transition-colors"
                >
                  <div className="font-bold text-white">{league.name}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {league.players.length} joueurs • {league.matches.length}{" "}
                    matchs
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Tournaments */}
        {userStats.userTournaments.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Calendar size={20} className="text-info" />
              Mes Tournois
            </h3>
            <div className="space-y-2">
              {userStats.userTournaments.map((tournament) => (
                <div
                  key={tournament.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/tournament/${tournament.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/tournament/${tournament.id}`);
                    }
                  }}
                  className="bg-gradient-card rounded-xl p-4 border border-slate-700/50 hover:border-slate-600 cursor-pointer transition-colors"
                >
                  <div className="font-bold text-white flex items-center gap-2">
                    {tournament.name}
                    {tournament.isFinished && (
                      <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                        Terminé
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {tournament.date
                      ? new Date(tournament.date).toLocaleDateString("fr-FR")
                      : "—"}{" "}
                    • {tournament.matches.length} matchs
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 pt-4">
          {(isAuthenticated || localUser) && (
            <button
              onClick={async () => {
                setIsDisconnecting(true);
                try {
                  await fullDisconnect();
                } finally {
                  setIsDisconnecting(false);
                }
              }}
              disabled={isDisconnecting}
              className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-500 font-bold py-3 rounded-xl border border-red-500/50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogOut size={18} />
              <span>{isDisconnecting ? "Déconnexion…" : "Déconnexion"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
