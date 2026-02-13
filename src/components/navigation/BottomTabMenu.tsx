import { useNavigate, useLocation } from "react-router-dom";
import { Home, QrCode, Trophy, Medal, User } from "lucide-react";

/**
 * BottomTabMenu Component
 *
 * Bottom navigation menu for mobile with 5 main tabs
 *
 * Features (AC1-AC6):
 * - Fixed bottom position on mobile
 * - 5 tabs with icons and labels
 * - Active state: gradient (bg-gradient-tab-active) per design-system-convergence 2.1
 * - Navigation on tab click
 * - Hidden on desktop (lg:hidden)
 * - Accessible with ARIA labels and proper touch targets
 * - previewMode: for isolated showcase (absolute positioning, controlled active route)
 */

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  route: string;
  ariaLabel: string;
}

const tabs: Tab[] = [
  { id: "home", label: "ACCUEIL", icon: Home, route: "/", ariaLabel: "Home" },
  {
    id: "join",
    label: "REJOINDRE",
    icon: QrCode,
    route: "/join",
    ariaLabel: "Join",
  },
  {
    id: "tournaments",
    label: "TOURNOIS",
    icon: Trophy,
    route: "/tournaments",
    ariaLabel: "Tournaments",
  },
  {
    id: "leagues",
    label: "LEAGUES",
    icon: Medal,
    route: "/leagues",
    ariaLabel: "Leagues",
  },
  {
    id: "profile",
    label: "PROFIL",
    icon: User,
    route: "/user/profile",
    ariaLabel: "Profile",
  },
];

/** Matches path to tab per design-system-convergence 2.1 (nested routes: /tournament/:id, /league/:id, /player/:id) */
function isTabActive(pathname: string, tab: Tab): boolean {
  switch (tab.id) {
    case "home":
      return pathname === "/";
    case "join":
      return pathname === "/join" || pathname.startsWith("/join/");
    case "tournaments":
      return (
        pathname === "/tournaments" || pathname.startsWith("/tournament/")
      );
    case "leagues":
      return pathname === "/leagues" || pathname.startsWith("/league/");
    case "profile":
      return (
        pathname === "/user/profile" ||
        pathname.startsWith("/user/profile") ||
        pathname.startsWith("/player/")
      );
    default:
      return pathname === tab.route;
  }
}

interface BottomTabMenuProps {
  /** When true, uses absolute positioning for containment in preview frames (e.g. DesignSystemShowcase) */
  previewMode?: boolean;
  /** In preview mode: overrides active route for demo (avoids nested Router) */
  previewActiveRoute?: string;
  /** In preview mode: called when tab is clicked. If omitted, clicks do nothing (no navigation). */
  previewOnTabClick?: (route: string) => void;
}

export const BottomTabMenu: React.FC<BottomTabMenuProps> = ({
  previewMode = false,
  previewActiveRoute,
  previewOnTabClick,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath =
    previewMode && previewActiveRoute !== undefined
      ? previewActiveRoute
      : location.pathname;

  const handleTabClick = (route: string) => {
    if (previewMode) {
      previewOnTabClick?.(route);
    } else {
      navigate(route);
    }
  };

  const positionClass = previewMode
    ? "absolute bottom-0 left-0 right-0"
    : "fixed bottom-0 left-0 right-0";

  return (
    <nav
      className={`${positionClass} bg-slate-800 border-t border-slate-700 z-40 ${!previewMode ? "lg:hidden" : ""}`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-stretch h-16">
        {tabs.map((tab) => {
          const isActive = isTabActive(currentPath, tab);
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.route)}
              className={`
                flex-1 flex flex-col items-center justify-center gap-1
                border-t-2 transition-all duration-200
                min-h-[48px] active:scale-95
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800
                ${
                  isActive
                    ? "border-transparent bg-gradient-tab-active text-white"
                    : "border-transparent text-slate-400 hover:text-slate-300"
                }
              `}
              aria-label={tab.ariaLabel}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={isActive ? "text-white" : "text-slate-400"}
                size={24}
              />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
