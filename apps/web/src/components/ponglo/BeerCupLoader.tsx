export interface BeerCupLoaderProps {
  size?: number;
  /** Couleur du cup. Défaut: rouge Solo cup. */
  color?: string;
  className?: string;
}

/**
 * Loader animé — un cup de beer pong qui tourne sur lui-même (rotateY).
 * Réutilisable partout où on a besoin d'un état de chargement plein écran ou inline.
 */
export function BeerCupLoader({
  size = 64,
  color = "#FF4438",
  className = "",
}: BeerCupLoaderProps) {
  return (
    <div
      className={`inline-block animate-cup-spin ${className}`}
      style={{
        width: size,
        height: size,
        transformStyle: "preserve-3d",
        perspective: size * 4,
      }}
      role="status"
      aria-label="Chargement"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
        style={{ display: "block" }}
      >
        {/* Corps du cup tronconique */}
        <path
          d="M16 14 L48 14 L42 56 L22 56 Z"
          fill={color}
        />
        {/* Lèvre/rebord supérieur (ellipse claire) */}
        <ellipse cx="32" cy="14" rx="16" ry="4" fill={color} />
        <ellipse
          cx="32"
          cy="13"
          rx="14"
          ry="3"
          fill="rgba(0,0,0,0.25)"
        />
        {/* Highlight vertical pour donner du volume */}
        <path
          d="M20 16 L24 54"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Fond du cup (ellipse plus sombre) */}
        <ellipse
          cx="32"
          cy="56"
          rx="10"
          ry="2.2"
          fill="rgba(0,0,0,0.3)"
        />
      </svg>
    </div>
  );
}
