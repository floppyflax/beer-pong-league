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
import { NavigationProvider } from "./context/NavigationContext";
import { SportProvider } from "./context/SportContext";
import { ResponsiveLayout } from "./components/layout/ResponsiveLayout";
import { MenuDrawer } from "./components/layout/MenuDrawer";
import { BottomTabMenu } from "./components/navigation/BottomTabMenu";
import { BackButton } from "./components/navigation/BackButton";
import { DevPanel } from "./components/DevPanel";
import { useAuthContext } from "./context/AuthContext";
import { useIdentity } from "./hooks/useIdentity";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import {
  shouldShowBottomMenu,
  shouldShowBackButton,
  getContentPaddingBottom,
  PAGES_WITH_SPECIFIC_MENU,
} from "./utils/navigationHelpers";
import { useNativeInit } from "./hooks/useNativeInit";
import { Menu, User, LogOut } from "lucide-react";

// Lazy-loaded page components for code splitting
// Note: Using named imports with .then() to convert to default exports for React.lazy()
const LandingPage = lazy(() =>
  import("./pages/LandingPage").then((m) => ({ default: m.LandingPage })),
);
const Home = lazy(() =>
  import("./pages/Home").then((m) => ({ default: m.Home })),
);
const Join = lazy(() =>
  import("./pages/Join").then((m) => ({ default: m.Join })),
);
const Tournaments = lazy(() =>
  import("./pages/Tournaments").then((m) => ({ default: m.Tournaments })),
);
const Leagues = lazy(() =>
  import("./pages/Leagues").then((m) => ({ default: m.Leagues })),
);
const CreateLeague = lazy(() =>
  import("./pages/CreateLeague").then((m) => ({ default: m.CreateLeague })),
);
const LeagueDashboard = lazy(() =>
  import("./pages/LeagueDashboard").then((m) => ({
    default: m.LeagueDashboard,
  })),
);
const CreateTournament = lazy(() =>
  import("./pages/CreateTournament").then((m) => ({
    default: m.CreateTournament,
  })),
);
const TournamentDashboard = lazy(() =>
  import("./pages/TournamentDashboard").then((m) => ({
    default: m.TournamentDashboard,
  })),
);
const PlayerProfile = lazy(() =>
  import("./pages/PlayerProfile").then((m) => ({ default: m.PlayerProfile })),
);
const UserProfile = lazy(() =>
  import("./pages/UserProfile").then((m) => ({ default: m.UserProfile })),
);
const DisplayView = lazy(() =>
  import("./pages/DisplayView").then((m) => ({ default: m.DisplayView })),
);
const TournamentDisplayView = lazy(() =>
  import("./pages/TournamentDisplayView").then((m) => ({
    default: m.TournamentDisplayView,
  })),
);
const TournamentInvite = lazy(() =>
  import("./pages/TournamentInvite").then((m) => ({
    default: m.TournamentInvite,
  })),
);
const TournamentJoin = lazy(() =>
  import("./pages/TournamentJoin").then((m) => ({ default: m.TournamentJoin })),
);
const AuthCallback = lazy(() =>
  import("./pages/AuthCallback").then((m) => ({ default: m.AuthCallback })),
);
const PaymentSuccess = lazy(() =>
  import("./pages/PaymentSuccess").then((m) => ({ default: m.PaymentSuccess })),
);
const PaymentCancel = lazy(() =>
  import("./pages/PaymentCancel").then((m) => ({ default: m.PaymentCancel })),
);
const DesignSystemShowcase = lazy(() =>
  import("./pages/DesignSystemShowcase").then((m) => ({
    default: m.DesignSystemShowcase,
  })),
);
const RecordMatch = lazy(() =>
  import("./pages/RecordMatch").then((m) => ({ default: m.RecordMatch })),
);
const EventDashboard = lazy(() =>
  import("./pages/EventDashboard").then((m) => ({
    default: m.EventDashboard,
  })),
);
const GlobalLeaderboard = lazy(() =>
  import("./pages/GlobalLeaderboard").then((m) => ({
    default: m.GlobalLeaderboard,
  })),
);
const Competitions = lazy(() =>
  import("./pages/Competitions").then((m) => ({
    default: m.Competitions,
  })),
);

function App() {
  return (
    <SportProvider>
      <AuthProvider>
        <IdentityProvider>
          <LeagueProvider>
            <Router>
              <NavigationProvider>
                <AppContent />
              </NavigationProvider>
            </Router>
            <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              // Everything ELO tokens — navy-soft surface, card border, white text,
              // success = lime (positive delta), error = signal-red (alert)
              style: {
                background: "#141D2F", // navy-soft
                color: "#FFFFFF",
                border: "1px solid rgba(168, 176, 192, 0.12)", // card
                borderRadius: "16px", // rounded-card
                padding: "12px 16px",
                fontSize: "14px",
                fontWeight: 500,
                fontFamily:
                  "Sora, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
                boxShadow:
                  "0 10px 30px -10px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(47, 107, 255, 0.08)",
              },
              success: {
                iconTheme: {
                  primary: "#B7FF3B", // lime
                  secondary: "#0B1320", // navy
                },
              },
              error: {
                iconTheme: {
                  primary: "#FF3B3B", // signal-red
                  secondary: "#FFFFFF",
                },
              },
              loading: {
                iconTheme: {
                  primary: "#2F6BFF", // electric-blue
                  secondary: "#141D2F",
                },
              },
            }}
          />
          </LeagueProvider>
        </IdentityProvider>
      </AuthProvider>
    </SportProvider>
  );
}

function HeaderUserInfo() {
  const navigate = useNavigate();
  const { isAuthenticated, user, signOut } = useAuthContext();
  const { localUser } = useIdentity();

  const hasProfile = isAuthenticated || localUser;

  if (!hasProfile) return null;

  const displayName =
    isAuthenticated && user ? user.email?.split("@")[0] : localUser?.pseudo;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => navigate("/user/profile")}
        className="flex items-center gap-2 px-2 py-1 bg-signal-red/20 rounded-lg hover:bg-signal-red/30 transition-colors cursor-pointer"
      >
        <User size={16} className="text-signal-red" />
        <span className="text-xs text-signal-red font-medium">{displayName}</span>
      </button>
      {isAuthenticated && (
        <button
          onClick={signOut}
          className="p-2 hover:bg-navy-deep rounded-lg transition-colors"
          title="Déconnexion"
        >
          <LogOut size={18} />
        </button>
      )}
    </div>
  );
}

function AppContent() {
  useNativeInit();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated } = useAuthContext();
  const { localUser } = useIdentity();

  // Check if we're on a display view route
  const isDisplayView = location.pathname.includes("/display");

  // Check if we're on landing page (root with no identity)
  const hasIdentity = isAuthenticated || localUser;
  const isLandingPage = location.pathname === "/" && !hasIdentity;

  // Hide header on pages with ContextualHeader (Story 13.2)
  // Pages with ContextualHeader: main pages + detail pages + create/invite/join sub-pages
  const pagesWithContextualHeader = [
    "/",
    "/tournaments",
    "/leagues",
    "/competitions",
    "/leaderboard",
    "/join",
    "/user/profile",
    "/create-tournament",
    "/create-league",
  ];
  const hasContextualHeader =
    pagesWithContextualHeader.includes(location.pathname) ||
    location.pathname.startsWith("/tournament/") ||
    location.pathname.startsWith("/league/") ||
    location.pathname.startsWith("/player/") ||
    location.pathname.startsWith("/record-match/");

  const showHeader = !isDisplayView && !isLandingPage && !hasContextualHeader;

  // Determine if back button should be shown instead of hamburger menu
  const showBackBtn = shouldShowBackButton(location.pathname);

  return (
    <div className="min-h-screen bg-navy text-white flex flex-col">
      {showHeader && (
        <>
          <MenuDrawer isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
          <header className="p-4 bg-navy-soft border-b border-card flex justify-between items-center sticky top-0 z-10">
            {/* Left navigation: Back button OR Hamburger menu - hidden on desktop (lg and above) */}
            <div className="lg:hidden">
              {showBackBtn ? (
                <BackButton />
              ) : (
                <button
                  onClick={() => setMenuOpen(true)}
                  className="p-2 hover:bg-navy-deep rounded-lg transition-colors"
                  aria-label="Open menu"
                >
                  <Menu size={24} />
                </button>
              )}
            </div>
            {/* Desktop navigation placeholder - shown on lg and above */}
            <nav className="hidden lg:flex items-center gap-6">
              <Link
                to="/"
                className="text-cool-gray hover:text-signal-red transition-colors"
              >
                Accueil
              </Link>
              <Link
                to="/create-league"
                className="text-cool-gray hover:text-signal-red transition-colors"
              >
                Nouvelle League
              </Link>
              <Link
                to="/create-tournament"
                className="text-cool-gray hover:text-signal-red transition-colors"
              >
                Nouveau Tournoi
              </Link>
            </nav>
            <Link
              to="/"
              className="text-xl font-bold text-signal-red flex items-center gap-2"
            >
              <span>🍺</span> BPL
            </Link>
            <HeaderUserInfo />
          </header>
        </>
      )}

      <main className="flex-grow flex flex-col">
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="flex items-center justify-center flex-grow">
                <LoadingSpinner size={48} />
              </div>
            }
          >
            {/* Display views and Landing page bypass ResponsiveLayout wrapper */}
            {isDisplayView ? (
              <div className="w-full max-w-none mx-0">
                <Routes>
                  <Route path="/league/:id/display" element={<DisplayView />} />
                  <Route
                    path="/tournament/:id/display"
                    element={<TournamentDisplayView />}
                  />
                </Routes>
              </div>
            ) : isLandingPage ? (
              <Routes>
                <Route path="/" element={<LandingPage />} />
              </Routes>
            ) : (
              <ResponsiveLayout showSidebar={false}>
                <div
                  className={`py-4 ${
                    (shouldShowBottomMenu(location.pathname) && hasIdentity) ||
                    (PAGES_WITH_SPECIFIC_MENU as readonly string[]).includes(
                      location.pathname
                    )
                      ? getContentPaddingBottom(location.pathname)
                      : ""
                  }`}
                >
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/join" element={<Join />} />
                    <Route path="/tournaments" element={<Tournaments />} />
                    <Route path="/leagues" element={<Leagues />} />
                    <Route path="/competitions" element={<Competitions />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route
                      path="/payment-success"
                      element={<PaymentSuccess />}
                    />
                    <Route path="/payment-cancel" element={<PaymentCancel />} />
                    <Route path="/create-league" element={<CreateLeague />} />
                    <Route
                      path="/create-tournament"
                      element={<CreateTournament />}
                    />
                    <Route
                      path="/league/:id"
                      element={
                        <ErrorBoundary>
                          <LeagueDashboard />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/tournament/:id"
                      element={
                        <ErrorBoundary>
                          <TournamentDashboard />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/tournament/:id/invite"
                      element={<TournamentInvite />}
                    />
                    <Route
                      path="/tournament/:id/join"
                      element={<TournamentJoin />}
                    />
                    <Route
                      path="/player/:playerId"
                      element={<PlayerProfile />}
                    />
                    <Route path="/user/profile" element={<UserProfile />} />
                    <Route
                      path="/design-system"
                      element={<DesignSystemShowcase />}
                    />
                    <Route
                      path="/record-match/:contextType/:id"
                      element={<RecordMatch />}
                    />
                    {/* D.5: Global cross-league leaderboard */}
                    <Route
                      path="/leaderboard"
                      element={<GlobalLeaderboard />}
                    />
                    {/* B.6: Event = canonical rename of Tournament — redirect for backward compat */}
                    <Route
                      path="/event/:id"
                      element={<EventDashboard />}
                    />
                  </Routes>
                </div>
              </ResponsiveLayout>
            )}
          </Suspense>
        </ErrorBoundary>
      </main>

      {/* Bottom Tab Menu - visible on mobile for main routes, only when user has identity (AC4) */}
      {shouldShowBottomMenu(location.pathname) && hasIdentity && (
        <BottomTabMenu />
      )}

      {/* Dev Panel - only visible in dev mode */}
      <DevPanel />
    </div>
  );
}

// Home is now lazy-loaded from src/pages/Home.tsx

export default App;
