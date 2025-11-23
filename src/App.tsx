import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useState } from "react";
import { Toaster } from "react-hot-toast";
import { LeagueProvider, useLeague } from "./context/LeagueContext";
import { IdentityProvider } from "./context/IdentityContext";
import { AuthProvider } from "./context/AuthContext";
import { CreateLeague } from "./pages/CreateLeague";
import { LeagueDashboard } from "./pages/LeagueDashboard";
import { CreateTournament } from "./pages/CreateTournament";
import { TournamentDashboard } from "./pages/TournamentDashboard";
import { PlayerProfile } from "./pages/PlayerProfile";
import { UserProfile } from "./pages/UserProfile";
import { DisplayView } from "./pages/DisplayView";
import { TournamentDisplayView } from "./pages/TournamentDisplayView";
import { AuthCallback } from "./pages/AuthCallback";
import { MenuDrawer } from "./components/layout/MenuDrawer";
import { IdentityInitializer } from "./components/IdentityInitializer";
import { useAuthContext } from "./context/AuthContext";
import { useIdentity } from "./hooks/useIdentity";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { Menu, User, LogOut } from "lucide-react";

function App() {
  return (
    <AuthProvider>
      <IdentityProvider>
        <LeagueProvider>
          <Router>
            <AppContent />
          </Router>
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: "#1e293b",
                color: "#fff",
                border: "1px solid #334155",
                borderRadius: "0.75rem",
              },
              success: {
                iconTheme: {
                  primary: "#f59e0b",
                  secondary: "#fff",
                },
              },
              error: {
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#fff",
                },
              },
            }}
          />
        </LeagueProvider>
      </IdentityProvider>
    </AuthProvider>
  );
}

function HeaderUserInfo() {
  const navigate = useNavigate();
  const { isAuthenticated, user, signOut } = useAuthContext();
  const { localUser } = useIdentity();

  const hasProfile = isAuthenticated || localUser;

  if (!hasProfile) return null;

  const displayName = isAuthenticated && user
    ? user.email?.split("@")[0]
    : localUser?.pseudo;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => navigate("/user/profile")}
        className="flex items-center gap-2 px-2 py-1 bg-primary/20 rounded-lg hover:bg-primary/30 transition-colors cursor-pointer"
      >
        <User size={16} className="text-primary" />
        <span className="text-xs text-primary font-medium">
          {displayName}
        </span>
      </button>
      {isAuthenticated && (
        <button
          onClick={signOut}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          title="Déconnexion"
        >
          <LogOut size={18} />
        </button>
      )}
    </div>
  );
}

function AppContent() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  
  // Check if we're on a display view route
  const isDisplayView = location.pathname.includes("/display");

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {!isDisplayView && (
        <>
          <MenuDrawer isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
          <header className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center sticky top-0 z-10">
            <button
              onClick={() => setMenuOpen(true)}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>
            <Link
              to="/"
              className="text-xl font-bold text-primary flex items-center gap-2"
            >
              <span>🍺</span> BPL
            </Link>
            <HeaderUserInfo />
          </header>
        </>
      )}

      <IdentityInitializer>
        <main className={`flex-grow flex flex-col ${isDisplayView ? "w-full max-w-none mx-0" : "max-w-md mx-auto w-full"}`}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/create-league" element={<CreateLeague />} />
            <Route path="/create-tournament" element={<CreateTournament />} />
            <Route path="/league/:id" element={<LeagueDashboard />} />
            <Route path="/league/:id/display" element={<DisplayView />} />
            <Route path="/tournament/:id" element={<TournamentDashboard />} />
            <Route path="/tournament/:id/display" element={<TournamentDisplayView />} />
            <Route path="/player/:playerId" element={<PlayerProfile />} />
            <Route path="/user/profile" element={<UserProfile />} />
          </Routes>
        </main>
      </IdentityInitializer>
    </div>
  );
}

const Home = () => {
  const { leagues, tournaments, isLoadingInitialData } = useLeague();
  const navigate = useNavigate();

  if (isLoadingInitialData) {
    return (
      <div className="flex items-center justify-center flex-grow">
        <LoadingSpinner size={48} />
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
      </div>
    </div>
  );
};

export default App;
