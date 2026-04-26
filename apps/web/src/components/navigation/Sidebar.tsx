import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Swords, BarChart2, User, type LucideIcon } from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';
import { useIdentity } from '../../hooks/useIdentity';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  route: string;
}

// Aligned with BottomTabMenu: 4 entries — Accueil · Jouer · Stats · Profil.
// "Rejoindre" is NOT a menu entry; it's a page (/join) reached from CTAs.
const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Accueil', icon: Home, route: '/' },
  { id: 'play', label: 'Jouer', icon: Swords, route: '/competitions' },
  { id: 'leaderboard', label: 'Stats', icon: BarChart2, route: '/leaderboard' },
  { id: 'profile', label: 'Profil', icon: User, route: '/user/profile' },
];

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuthContext();
  const { localUser } = useIdentity();

  /**
   * Determines which navigation item should be highlighted based on current route.
   * "Jouer" = hub compétitions (inclut legacy /tournaments, /leagues, détails, flow /join).
   */
  const getActiveItem = (pathname: string): string => {
    if (pathname === '/') return 'home';
    if (
      pathname === '/competitions' ||
      pathname === '/events' ||
      pathname === '/leagues' ||
      pathname.startsWith('/join') ||
      pathname.startsWith('/event/') ||
      pathname.startsWith('/league/') ||
      pathname.startsWith('/event/') ||
      pathname === '/create-event' ||
      pathname === '/create-league'
    ) {
      return 'play';
    }
    if (pathname === '/leaderboard') return 'leaderboard';
    if (
      pathname === '/user/profile' ||
      pathname.startsWith('/user/profile') ||
      pathname.startsWith('/profile') ||
      pathname.startsWith('/player/')
    ) {
      return 'profile';
    }

    // Detail pages without match - no active nav item
    return '';
  };
  
  const activeItem = getActiveItem(location.pathname);
  
  // Determine user display info
  const hasIdentity = isAuthenticated || localUser;
  const displayName = isAuthenticated && user?.email
    ? user.email.split('@')[0]
    : localUser?.pseudo || 'Utilisateur';
  // Premium status from user object (verified by backend)
  const isPremium = (user as any)?.isPremium || false;
  
  return (
    <aside className="hidden lg:flex lg:flex-col w-60 h-screen bg-navy-soft border-r border-card fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-card">
        <h1 className="text-2xl font-bold text-signal-red flex items-center gap-2">
          <span>🍺</span> BPL
        </h1>
      </div>
      
      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.route)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-navy-deep text-electric-blue border-l-4 border-electric-blue font-bold'
                  : 'text-cool-gray hover:text-white hover:bg-navy-deep/50'
              }`}
            >
              <Icon size={20} />
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>
      
      {/* User Info */}
      {hasIdentity && (
        <div 
          className="p-4 border-t border-card cursor-pointer hover:bg-navy-deep/50 transition-colors"
          onClick={() => navigate('/profile')}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-signal-red/20 flex items-center justify-center">
              <User size={20} className="text-signal-red" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {displayName}
              </div>
              {isPremium && (
                <div className="text-xs text-signal-red">
                  💎 Premium
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
