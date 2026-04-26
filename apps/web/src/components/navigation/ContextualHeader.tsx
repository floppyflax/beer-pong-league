import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MoreVertical, Lock } from 'lucide-react';
import { PButton, type PButtonVariant } from '../ponglo/PButton';

/**
 * ContextualHeader — sticky header ponglo.
 *
 * Same public API as before, restyled with ponglo tokens (Archivo black uppercase
 * title, navy/80 backdrop-blur, PButton for desktop actions).
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
  title: string;
  showBackButton?: boolean;
  onBack?: () => void;
  actions?: ContextualHeaderAction[];
  menuItems?: ContextualHeaderMenuItem[];
  /**
   * When true, the title is rendered as `sr-only` (kept for accessibility but
   * hidden visually). Use on detail pages that render the title inside a
   * `PageHero` block below.
   */
  hideTitle?: boolean;
}

const variantToPButton: Record<NonNullable<ContextualHeaderAction['variant']>, PButtonVariant> = {
  primary: 'primary',
  secondary: 'ghost',
  ghost: 'ghost',
};

export const ContextualHeader: React.FC<ContextualHeaderProps> = ({
  title,
  showBackButton = false,
  onBack,
  actions = [],
  menuItems = [],
  hideTitle = false,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    <header className="sticky top-0 z-30 h-16 bg-navy/85 backdrop-blur-md flex items-center justify-between px-4">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {showBackButton && (
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center text-cool-gray hover:text-white rounded-full hover:bg-white/5 active:scale-95 transition-colors"
            aria-label="Retour"
          >
            <ArrowLeft size={22} />
          </button>
        )}

        <h1
          className={
            hideTitle
              ? 'sr-only'
              : 'font-archivo font-extrabold uppercase tracking-[-0.4px] text-white text-[18px] lg:text-2xl truncate'
          }
          title={title}
        >
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {actions.length > 0 && (
          <div className="hidden lg:flex items-center gap-2">
            {actions.map((action, index) => (
              <PButton
                key={index}
                variant={variantToPButton[action.variant ?? 'primary']}
                size="sm"
                disabled={action.disabled}
                onClick={action.onClick}
                icon={action.icon}
                aria-label={action.label}
              >
                <span className="whitespace-nowrap">{action.label}</span>
                {action.premium && (
                  <Lock size={12} className="ml-1 opacity-80" aria-label="Premium" />
                )}
              </PButton>
            ))}
          </div>
        )}

        {menuItems.length > 0 && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-10 h-10 flex items-center justify-center text-cool-gray hover:text-white rounded-full hover:bg-white/5 active:scale-95 transition-colors"
              aria-label="Menu"
              aria-expanded={menuOpen}
              aria-haspopup="true"
            >
              <MoreVertical size={22} />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-12 w-52 bg-navy-soft border border-card rounded-card shadow-modal overflow-hidden z-40"
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
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium hover:bg-white/5 transition-colors ${
                      item.destructive ? 'text-signal-red' : 'text-white'
                    } ${index < menuItems.length - 1 ? 'border-b border-card' : ''}`}
                    role="menuitem"
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
