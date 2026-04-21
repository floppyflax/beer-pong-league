import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MoreVertical } from 'lucide-react';

/**
 * ContextualHeader Component
 * 
 * Single contextual header that displays the current page title dynamically,
 * removing redundant local headers and saving vertical space (~60px per page).
 * 
 * Features (Story 13.2):
 * - AC1: Component renders with title, optional back button, optional action buttons (desktop), optional menu button
 * - AC2: Single source of truth for page title (no duplicate local headers)
 * - AC3: Back button navigation (navigates to list page)
 * - AC4: Responsive actions - desktop shows buttons, mobile hides them
 * - AC5: Responsive actions - mobile shows menu button if menuItems provided
 * - AC6: Menu dropdown functionality (open, close, click outside)
 * - AC7: Premium indicators (lock icon for premium actions)
 * - AC9: Accessibility (keyboard navigation, ARIA labels, focusable elements)
 * - AC10: Title truncation (ellipsis for long names, title attribute for full name)
 * 
 * Visual Specs:
 * - Height: 64px (fixed)
 * - Background: bg-slate-900
 * - Border: border-b border-slate-800
 * - Position: sticky top-0 z-30
 * - Back button: 40x40px, ArrowLeft icon
 * - Title: text-xl (mobile) / text-2xl (desktop), bold, truncate with ellipsis
 * - Actions: Desktop only (lg:flex), hidden on mobile
 * - Menu button: 40x40px, MoreVertical icon, dropdown on click
 */

export interface ContextualHeaderAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  premium?: boolean;
}

export interface ContextualHeaderMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
}

export interface ContextualHeaderProps {
  // Page title (dynamic based on route)
  title: string;
  
  // Optional back button (for detail pages)
  showBackButton?: boolean;
  onBack?: () => void;
  
  // Optional actions (buttons on the right, desktop only)
  actions?: ContextualHeaderAction[];
  
  // Optional menu button (3-dot menu)
  menuItems?: ContextualHeaderMenuItem[];
}

export const ContextualHeader: React.FC<ContextualHeaderProps> = ({
  title,
  showBackButton = false,
  onBack,
  actions = [],
  menuItems = [],
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside (AC6)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  // Close menu on Escape key (AC9 - Accessibility)
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && menuOpen) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4">
      {/* Left: Back Button + Title */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {showBackButton && (
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800 active:scale-95"
            aria-label="Retour"
            tabIndex={0}
          >
            <ArrowLeft size={24} />
          </button>
        )}
        
        <h1 
          className="text-xl lg:text-2xl font-bold text-white truncate" 
          title={title}
        >
          {title}
        </h1>
      </div>

      {/* Right: Actions (Desktop) + Menu Button */}
      <div className="flex items-center gap-2">
        {/* Desktop Actions (AC4 - hidden on mobile) */}
        {actions.length > 0 && (
          <div className="hidden lg:flex items-center gap-2">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                disabled={action.disabled}
                className={`
                  flex items-center gap-2 px-4 py-2 font-semibold rounded-lg transition-all active:scale-95
                  ${getButtonVariantClasses(action.variant)}
                  ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                aria-label={action.label}
                tabIndex={0}
              >
                {action.icon}
                <span className="whitespace-nowrap">{action.label}</span>
                {action.premium && <span className="ml-1" aria-label="Premium">🔒</span>}
              </button>
            ))}
          </div>
        )}

        {/* Menu Button (AC5, AC6 - if menuItems provided) */}
        {menuItems.length > 0 && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800 active:scale-95"
              aria-label="Menu"
              aria-expanded={menuOpen}
              aria-haspopup="true"
              tabIndex={0}
            >
              <MoreVertical size={24} />
            </button>

            {/* Dropdown Menu (AC6) */}
            {menuOpen && (
              <div 
                className="absolute right-0 top-12 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-40"
                role="menu"
                aria-orientation="vertical"
              >
                {menuItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      item.onClick();
                      setMenuOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-700 transition-colors
                      ${item.destructive ? 'text-red-400' : 'text-white'}
                      ${index === 0 ? 'rounded-t-lg' : ''}
                      ${index === menuItems.length - 1 ? 'rounded-b-lg' : 'border-b border-slate-700'}
                    `}
                    role="menuitem"
                    tabIndex={0}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

/**
 * Helper function to get button variant classes
 * 
 * @param variant - Button variant ('primary' | 'secondary' | 'ghost')
 * @returns Tailwind classes for the button variant
 */
const getButtonVariantClasses = (variant?: string): string => {
  switch (variant) {
    case 'primary':
      return 'bg-primary hover:bg-amber-600 text-white';
    case 'secondary':
      return 'bg-slate-700 hover:bg-slate-600 text-white';
    case 'ghost':
      return 'text-slate-400 hover:text-white hover:bg-slate-800';
    default:
      return 'bg-primary hover:bg-amber-600 text-white';
  }
};
