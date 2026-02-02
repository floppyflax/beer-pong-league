import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useState, lazy, Suspense } from "react";
import { Toaster } from "react-hot-toast";
import { LeagueProvider } from "./context/LeagueContext";
import { IdentityProvider } from "./context/IdentityContext";
import { AuthProvider } from "./context/AuthContext";
import { MenuDrawer } from "./components/layout/MenuDrawer";
import { DevPanel } from "./components/DevPanel";
import { useAuthContext } from "./context/AuthContext";
import { useIdentity } from "./hooks/useIdentity";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Menu, User, LogOut } from "lucide-react";

// Lazy-loaded page components for code splitting
// Note: Using named imports with .then() to convert to default exports for React.lazy()
const Home = lazy(() => import("./pages/Home").then(m => ({ default: m.Home })));
const CreateLeague = lazy(() => import("./pages/CreateLeague").then(m => ({ default: m.CreateLeague })));
const LeagueDashboard = lazy(() => import("./pages/LeagueDashboard").then(m => ({ default: m.LeagueDashboard })));
const CreateTournament = lazy(() => import("./pages/CreateTournament").then(m => ({ default: m.CreateTournament })));
const TournamentDashboard = lazy(() => import("./pages/TournamentDashboard").then(m => ({ default: m.TournamentDashboard })));
const PlayerProfile = lazy(() => import("./pages/PlayerProfile").then(m => ({ default: m.PlayerProfile })));
const UserProfile = lazy(() => import("./pages/UserProfile").then(m => ({ default: m.UserProfile })));
const DisplayView = lazy(() => import("./pages/DisplayView").then(m => ({ default: m.DisplayView })));
const TournamentDisplayView = lazy(() => import("./pages/TournamentDisplayView").then(m => ({ default: m.TournamentDisplayView })));
const TournamentInvite = lazy(() => import("./pages/TournamentInvite").then(m => ({ default: m.TournamentInvite })));
const TournamentJoin = lazy(() => import("./pages/TournamentJoin").then(m => ({ default: m.TournamentJoin })));
const AuthCallback = lazy(() => import("./pages/AuthCallback").then(m => ({ default: m.AuthCallback })));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess").then(m => ({ default: m.PaymentSuccess })));
const PaymentCancel = lazy(() => import("./pages/PaymentCancel").then(m => ({ default: m.PaymentCancel })));

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
            {/* Hamburger menu - hidden on desktop (lg and above) */}
            <button
              onClick={() => setMenuOpen(true)}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
            {/* Desktop navigation placeholder - shown on lg and above */}
            <nav className="hidden lg:flex items-center gap-6">
              <Link
                to="/"
                className="text-slate-300 hover:text-primary transition-colors"
              >
                Accueil
              </Link>
              <Link
                to="/create-league"
                className="text-slate-300 hover:text-primary transition-colors"
              >
                Nouvelle League
              </Link>
              <Link
                to="/create-tournament"
                className="text-slate-300 hover:text-primary transition-colors"
              >
                Nouveau Tournoi
              </Link>
            </nav>
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

      <main className={`flex-grow flex flex-col ${
        isDisplayView 
          ? "w-full max-w-none mx-0" 
          : "w-full max-w-md mx-auto lg:max-w-4xl xl:max-w-6xl px-4 md:px-6 lg:px-8"
      }`}>
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="flex items-center justify-center flex-grow">
                <LoadingSpinner size={48} />
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment-cancel" element={<PaymentCancel />} />
              <Route path="/create-league" element={<CreateLeague />} />
              <Route path="/create-tournament" element={<CreateTournament />} />
              <Route 
                path="/league/:id" 
                element={
                  <ErrorBoundary>
                    <LeagueDashboard />
                  </ErrorBoundary>
                } 
              />
              <Route path="/league/:id/display" element={<DisplayView />} />
              <Route 
                path="/tournament/:id" 
                element={
                  <ErrorBoundary>
                    <TournamentDashboard />
                  </ErrorBoundary>
                } 
              />
              <Route path="/tournament/:id/display" element={<TournamentDisplayView />} />
              <Route path="/tournament/:id/invite" element={<TournamentInvite />} />
              <Route path="/tournament/:id/join" element={<TournamentJoin />} />
              <Route path="/player/:playerId" element={<PlayerProfile />} />
              <Route path="/user/profile" element={<UserProfile />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>

      {/* Dev Panel - only visible in dev mode */}
      <DevPanel />
    </div>
  );
}

// Home is now lazy-loaded from src/pages/Home.tsx

export default App;
