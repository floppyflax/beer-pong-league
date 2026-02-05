import { useNavigate, useLocation } from 'react-router-dom';
import { Home, QrCode, Trophy, Users, User } from 'lucide-react';

/**
 * BottomTabMenu Component
 * 
 * Bottom navigation menu for mobile with 5 main tabs
 * 
 * Features (AC1-AC6):
 * - Fixed bottom position on mobile
 * - 5 tabs with icons and labels
 * - Active state highlighting with primary color and top border
 * - Navigation on tab click
 * - Hidden on desktop (lg:hidden)
 * - Accessible with ARIA labels and proper touch targets
 */

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  route: string;
  ariaLabel: string;
}

const tabs: Tab[] = [
  { id: 'home', label: 'ACCUEIL', icon: Home, route: '/', ariaLabel: 'Home' },
  { id: 'join', label: 'REJOINDRE', icon: QrCode, route: '/join', ariaLabel: 'Join' },
  { id: 'tournaments', label: 'TOURNOIS', icon: Trophy, route: '/tournaments', ariaLabel: 'Tournaments' },
  { id: 'leagues', label: 'LEAGUES', icon: Users, route: '/leagues', ariaLabel: 'Leagues' },
  { id: 'profile', label: 'PROFIL', icon: User, route: '/user/profile', ariaLabel: 'Profile' },
];

export const BottomTabMenu: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const handleTabClick = (route: string) => {
    navigate(route);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 lg:hidden z-40"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-stretch h-16">
        {tabs.map((tab) => {
          const isActive = currentPath === tab.route;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.route)}
              className={`
                flex-1 flex flex-col items-center justify-center gap-1
                border-t-2 transition-all duration-200
                min-h-[48px] active:scale-95
                ${isActive 
                  ? 'border-primary text-white' 
                  : 'border-transparent text-slate-400 hover:text-slate-300'
                }
              `}
              aria-label={tab.ariaLabel}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={isActive ? 'text-primary' : 'text-slate-400'} size={24} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
