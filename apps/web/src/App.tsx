import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { lazy, Suspense } from "react";
import { Toaster } from "react-hot-toast";
import { LeagueProvider } from "./context/LeagueContext";
import { IdentityProvider } from "./context/IdentityContext";
import { AuthProvider } from "./context/AuthContext";
import { NavigationProvider } from "./context/NavigationContext";
import { SportProvider } from "./context/SportContext";
import { ResponsiveLayout } from "./components/layout/ResponsiveLayout";
import { BottomTabMenu } from "./components/navigation/BottomTabMenu";
import { DevPanel } from "./components/DevPanel";
import { useAuthContext } from "./context/AuthContext";
import { useIdentity } from "./hooks/useIdentity";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import {
  shouldShowBottomMenu,
  getContentPaddingBottom,
  PAGES_WITH_SPECIFIC_MENU,
} from "./utils/navigationHelpers";
import { useNativeInit } from "./hooks/useNativeInit";

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
const Events = lazy(() =>
  import("./pages/Events").then((m) => ({ default: m.Events })),
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
const CreateEvent = lazy(() =>
  import("./pages/CreateEvent").then((m) => ({
    default: m.CreateEvent,
  })),
);
const EventDashboard = lazy(() =>
  import("./pages/EventDashboard").then((m) => ({
    default: m.EventDashboard,
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
const EventDisplayView = lazy(() =>
  import("./pages/EventDisplayView").then((m) => ({
    default: m.EventDisplayView,
  })),
);
const EventInvite = lazy(() =>
  import("./pages/EventInvite").then((m) => ({
    default: m.EventInvite,
  })),
);
const EventJoin = lazy(() =>
  import("./pages/EventJoin").then((m) => ({ default: m.EventJoin })),
);
const LeagueJoin = lazy(() =>
  import("./pages/LeagueJoin").then((m) => ({ default: m.LeagueJoin })),
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

function AppContent() {
  useNativeInit();
  const location = useLocation();
  const { isAuthenticated } = useAuthContext();
  const { localUser } = useIdentity();

  // Check if we're on a display view route
  const isDisplayView = location.pathname.includes("/display");

  // Check if we're on landing page (root with no identity)
  const hasIdentity = isAuthenticated || localUser;
  const isLandingPage = location.pathname === "/" && !hasIdentity;

  return (
    <div className="min-h-screen bg-navy text-white flex flex-col">
      {/* Legacy global header removed — every page owns its own header
          (ContextualHeader / DetailHero / PageHero). Display view stays
          full-screen. */}

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
                    path="/event/:id/display"
                    element={<EventDisplayView />}
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
                    <Route path="/events" element={<Events />} />
                    <Route path="/leagues" element={<Leagues />} />
                    <Route path="/competitions" element={<Competitions />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route
                      path="/payment-success"
                      element={<PaymentSuccess />}
                    />
                    <Route path="/payment-cancel" element={<PaymentCancel />} />
                    <Route path="/create-league" element={<CreateLeague />} />
                    <Route path="/create-event" element={<CreateEvent />} />
                    <Route
                      path="/league/:id"
                      element={
                        <ErrorBoundary>
                          <LeagueDashboard />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/event/:id"
                      element={
                        <ErrorBoundary>
                          <EventDashboard />
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="/event/:id/invite"
                      element={<EventInvite />}
                    />
                    <Route path="/event/:id/join" element={<EventJoin />} />
                    <Route
                      path="/league/:id/join"
                      element={<LeagueJoin />}
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
                      path="/record-match"
                      element={<RecordMatch />}
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
                    {/* Backward-compat redirects from the old /tournament/*
                        URLs were removed: the schema migration renamed every
                        path /tournament → /event, so these redirects became
                        infinite self-loops. EventRedirect can also be removed
                        if no inbound link remains in the wild. */}
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
