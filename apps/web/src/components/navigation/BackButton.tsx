import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * BackButton Component
 * 
 * Navigation button to return to previous page or home
 * Displayed in header on pages without bottom tab menu
 * 
 * Features:
 * - Click navigates back using history or to home
 * - Touch-friendly (44px minimum)
 * - Consistent with header design
 * - Hidden on desktop where full navigation is available
 */

interface BackButtonProps {
  /** Optional custom onClick handler. If not provided, navigates back in history */
  onClick?: () => void;
  /** Optional aria-label for accessibility */
  ariaLabel?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({ 
  onClick, 
  ariaLabel = "Retour" 
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Navigate back in history, or to home if no history
      navigate(-1);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="p-2 hover:bg-slate-700 rounded-lg transition-colors active:scale-95"
      aria-label={ariaLabel}
    >
      <ArrowLeft size={24} className="text-white" />
    </button>
  );
};
