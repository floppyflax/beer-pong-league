import React, { ReactNode } from 'react';

/**
 * BottomMenuSpecific Component
 * 
 * Context-specific bottom menu for list pages (Join, Tournaments, Leagues)
 * Replaces the Bottom Tab Menu Principal on pages where a primary action is more important than navigation
 * 
 * Features (AC1-AC6):
 * - Fixed bottom position on mobile (hidden on desktop with lg:hidden)
 * - 1-2 primary action buttons with responsive layout
 * - Full-width button for single action, 50/50 split for two actions
 * - Supports icons, disabled state, and premium lock indicator
 * - Consistent visual design with backdrop blur and shadow
 */

export interface Action {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  premium?: boolean;
}

interface BottomMenuSpecificProps {
  actions: Action[];
}

export const BottomMenuSpecific: React.FC<BottomMenuSpecificProps> = ({ actions }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/80 backdrop-blur-md border-t border-slate-800 z-30 lg:hidden">
      <div className={`flex gap-3 max-w-md mx-auto ${
        actions.length === 1 ? 'justify-center' : 'justify-between'
      }`}>
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            disabled={action.disabled}
            className={`${
              actions.length === 1 ? 'w-full' : 'flex-1'
            } bg-primary hover:bg-amber-600 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {action.icon}
            <span>{action.label}</span>
            {action.premium && <span>🔒</span>}
          </button>
        ))}
      </div>
    </div>
  );
};
