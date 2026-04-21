import React from "react";

/**
 * BeerPongMatchIcon — Icône identitaire pour l'action « Nouveau match »
 *
 * Représente un gobelet de beer pong avec une balle de ping-pong.
 * Utilisée sur les dashboards tournoi/league pour renforcer l'identité visuelle.
 *
 * @see design-system-convergence.md section 2.3
 */
export interface BeerPongMatchIconProps {
  size?: number;
  className?: string;
  /** Couleur de la balle (blanc par défaut sur fond sombre) */
  ballColor?: string;
  /** Couleur du gobelet (hérite de currentColor par défaut) */
  cupColor?: string;
}

export const BeerPongMatchIcon: React.FC<BeerPongMatchIconProps> = ({
  size = 24,
  className = "",
  ballColor = "currentColor",
  cupColor = "currentColor",
}) => {
  const strokeWidth = Math.max(1, size / 24);
  const viewBox = 24;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${viewBox} ${viewBox}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* Gobelet (cup) — trapèze, forme typique gobelet beer pong */}
      <path
        d="M6 6 L18 6 L16 19 L8 19 Z"
        stroke={cupColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Balle de ping-pong — au-dessus du gobelet, suggère le lancer */}
      <circle
        cx="15"
        cy="4"
        r="2.5"
        fill={ballColor}
        stroke={cupColor}
        strokeWidth={strokeWidth * 0.6}
      />
    </svg>
  );
};
