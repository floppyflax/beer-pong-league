import React, { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useAuthContext } from "@/context/AuthContext";
import { useIdentity } from "@/hooks/useIdentity";
import { shouldShowBottomMenu } from "@/utils/navigationHelpers";

/**
 * BottomMenuSpecific Component
 *
 * Context-specific bottom menu for list pages (Join, Tournaments, Leagues)
 * Coexists with BottomTabMenu (Story 14-10): stacks above when both visible
 *
 * Features (AC1-AC6):
 * - Fixed bottom position on mobile (hidden on desktop with lg:hidden)
 * - Stacks above BottomTabMenu when on core routes AND user has identity (bottom: 4rem)
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
  /** When true, uses absolute positioning for containment in preview frames (e.g. DesignSystemShowcase) */
  previewMode?: boolean;
  /** Button style: 'primary' (amber) or 'gradient' (blue-violet, design system 2.2) */
  variant?: "primary" | "gradient";
}

export const BottomMenuSpecific: React.FC<BottomMenuSpecificProps> = ({
  actions,
  previewMode = false,
  variant = "primary",
}) => {
  const location = useLocation();
  const { isAuthenticated } = useAuthContext();
  const { localUser } = useIdentity();
  const hasIdentity = isAuthenticated || localUser;
  const stackAboveBottomNav =
    !previewMode && shouldShowBottomMenu(location.pathname) && hasIdentity;

  const positionClass = previewMode
    ? "absolute left-0 right-0"
    : "fixed left-0 right-0";
  const bottomClass = previewMode
    ? "bottom-0"
    : stackAboveBottomNav
      ? "bottom-16"
      : "bottom-0";

  return (
    <div
      className={`${positionClass} ${bottomClass} p-4 bg-slate-900/80 backdrop-blur-md border-t border-slate-800 z-30 ${!previewMode ? "lg:hidden" : ""}`}
    >
      <div
        className={`flex gap-3 max-w-md mx-auto ${
          actions.length === 1 ? "justify-center" : "justify-between"
        }`}
      >
        {actions.map((action, index) => (
          <button
            key={`${action.label}-${index}`}
            onClick={action.onClick}
            disabled={action.disabled}
            className={`${
              actions.length === 1 ? "w-full" : "flex-1"
            } ${
              variant === "gradient"
                ? "bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700"
                : "bg-primary hover:bg-amber-600"
            } text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
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
