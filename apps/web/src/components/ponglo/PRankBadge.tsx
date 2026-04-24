import clsx from "clsx";

export type RankTier = {
  min: number;
  name: string;
  /** Couleur du badge (background). */
  color: string;
  /** Couleur du texte (contrast). */
  textColor: string;
};

/**
 * Tiers de rang par ELO — noms inspirés contenants de bière.
 * Ordre croissant de minima. `rankOf(elo)` retourne le tier le plus haut atteint.
 *
 * Colors reference Everything ELO canonical tokens (§2.3 redesign-spec.md).
 * Inline styles are used because Tailwind purge cannot detect dynamic class names.
 * Token mapping: ink-mute / lime / signal-red / signal-red-deep /
 *                electric-blue / electric-blue-deep / ping-yellow
 */
export const RANKS: RankTier[] = [
  { min: 0,    name: "MOUSSE",  color: "#6B7280", textColor: "#FFFFFF" },  // ink-mute  / white
  { min: 900,  name: "PICHET",  color: "#B7FF3B", textColor: "#0B1320" },  // lime      / navy
  { min: 1100, name: "DEMI",    color: "#FF3B3B", textColor: "#FFFFFF" },  // signal-red / white
  { min: 1300, name: "PINTE",   color: "#D32828", textColor: "#FFFFFF" },  // signal-red-deep / white
  { min: 1500, name: "MAGNUM",  color: "#2F6BFF", textColor: "#FFFFFF" },  // electric-blue / white
  { min: 1700, name: "METEORE", color: "#1E4CD9", textColor: "#FFFFFF" },  // electric-blue-deep / white
  { min: 1900, name: "LEGENDE", color: "#FFD400", textColor: "#0B1320" },  // ping-yellow / navy
];

/**
 * Retourne le tier le plus haut atteint pour un ELO donné.
 */
export function rankOf(elo: number): RankTier {
  let tier: RankTier = RANKS[0];
  for (const r of RANKS) {
    if (elo >= r.min) tier = r;
  }
  return tier;
}

export interface PRankBadgeProps {
  elo: number;
  size?: "sm" | "md" | "lg";
  /** Affiche l'étoile à gauche du nom. */
  showStar?: boolean;
  className?: string;
}

const sizeClasses: Record<NonNullable<PRankBadgeProps["size"]>, string> = {
  sm: "text-[9px] px-1.5 py-0.5 gap-1",
  md: "text-[10px] px-2 py-[3px] gap-1",
  lg: "text-xs px-2.5 py-1 gap-1.5",
};

/**
 * Badge de rang ELO (ex. `★ PINTE`, `★ LEGENDE`).
 * Couleurs dynamiques selon le tier atteint.
 */
export function PRankBadge({
  elo,
  size = "md",
  showStar = true,
  className,
}: PRankBadgeProps) {
  const tier = rankOf(elo);
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-sm font-archivo font-extrabold uppercase tracking-[0.6px]",
        sizeClasses[size],
        className,
      )}
      style={{
        background: tier.color,
        color: tier.textColor,
      }}
      data-testid="rank-badge"
      data-tier={tier.name}
    >
      {showStar && <span aria-hidden="true">★</span>}
      <span>{tier.name}</span>
    </span>
  );
}
