import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Target, Trophy, Award, User } from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';
import { useIdentity } from '../../hooks/useIdentity';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  route: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home, route: '/' },
  { id: 'join', label: 'Rejoindre', icon: Target, route: '/join' },
  { id: 'tournaments', label: 'Tournois', icon: Trophy, route: '/tournaments' },
  { id: 'leagues', label: 'Leagues', icon: Award, route: '/leagues' },
  { id: 'profile', label: 'Profil', icon: User, route: '/user/profile' },
];

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuthContext();
  const { localUser } = useIdentity();
  
  const getActiveItem = (pathname: string): string => {
    // Main pages
    if (pathname === '/') return 'home';
    if (pathname.startsWith('/join')) return 'join';
    if (pathname.startsWith('/tournaments')) return 'tournaments';
    if (pathname.startsWith('/leagues')) return 'leagues';
    if (pathname.startsWith('/user/profile')) return 'profile';
    
    // Detail pages - no active item in sidebar
    return '';
  };
  
  const activeItem = getActiveItem(location.pathname);
  
  // Determine user display info
  const hasIdentity = isAuthenticated || localUser;
  const displayName = isAuthenticated && user?.email
    ? user.email.split('@')[0]
    : localUser?.displayName || 'Utilisateur';
  const isPremium = user?.user_metadata?.isPremium || false;
  
  return (
    <aside className="hidden lg:flex lg:flex-col w-60 h-screen bg-slate-800 border-r border-slate-700 fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-slate-700 text-primary border-l-4 border-primary font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
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
          className="p-4 border-t border-slate-700 cursor-pointer hover:bg-slate-700/50 transition-colors"
          onClick={() => navigate('/user/profile')}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <User size={20} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {displayName}
              </div>
              {isPremium && (
                <div className="text-xs text-primary">
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
