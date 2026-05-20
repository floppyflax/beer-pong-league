import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  BarChart2,
  Swords,
  User,
  type LucideIcon,
} from "lucide-react";

/**
 * BottomTabMenu Component
 *
 * Bottom navigation menu for mobile with 4 main tabs (per design spec) :
 *   ACCUEIL · JOUER · CLASSEMENT · PROFIL
 *
 * "Rejoindre" n'est plus un onglet — c'est une page (`/join`) ouverte via
 * des CTAs (bouton rejoindre sur l'empty state, scan QR, invitation).
 *
 * Features :
 * - Fixed bottom position on mobile
 * - Active state: gradient (bg-gradient-tab-active) per design-system-convergence 2.1
 * - Navigation on tab click
 * - Hidden on desktop (lg:hidden)
 * - Accessible with ARIA labels and proper touch targets
 * - previewMode: for isolated showcase (absolute positioning, controlled active route)
 */

interface Tab {
  id: string;
  label: string;
  icon: LucideIcon;
  route: string;
  ariaLabel: string;
}

const tabs: Tab[] = [
  { id: "home", label: "ACCUEIL", icon: Home, route: "/", ariaLabel: "Home" },
  {
    id: "play",
    label: "JOUER",
    icon: Swords,
    route: "/competitions",
    ariaLabel: "Jouer",
  },
  {
    id: "stats",
    label: "STATS",
    icon: BarChart2,
    route: "/stats",
    ariaLabel: "Mes stats",
  },
  {
    id: "profile",
    label: "PROFIL",
    icon: User,
    route: "/user/profile",
    ariaLabel: "Profile",
  },
];

/**
 * Matches path to tab per design-system-convergence 2.1.
 *
 * "Jouer" = screen hub des compétitions (événements + leagues) et tout ce
 * qui s'y rattache : détails, création, flow Rejoindre (pas d'onglet dédié).
 * Note: /player/:id reste sur Profil (fiche joueur, pas du jeu).
 */
function isTabActive(pathname: string, tab: Tab): boolean {
  switch (tab.id) {
    case "home":
      return pathname === "/";
    case "play":
      return (
        pathname === "/competitions" ||
        pathname === "/leagues" ||
        pathname === "/events" ||
        pathname === "/join" ||
        pathname.startsWith("/join/") ||
        pathname.startsWith("/league/") ||
        pathname.startsWith("/event/") ||
        pathname.startsWith("/event/") ||
        pathname === "/create-league" ||
        pathname === "/create-event"
      );
    case "stats":
      return pathname === "/stats";
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
      className={`${positionClass} bg-navy-soft border-t border-card z-40 ${!previewMode ? "lg:hidden" : ""}`}
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
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-blue focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800
                ${
                  isActive
                    ? "border-transparent bg-gradient-tab-active text-white"
                    : "border-transparent text-cool-gray hover:text-cool-gray"
                }
              `}
              aria-label={tab.ariaLabel}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={isActive ? "text-white" : "text-cool-gray"}
                size={24}
              />
              <span className="text-[10px] font-medium whitespace-nowrap">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
