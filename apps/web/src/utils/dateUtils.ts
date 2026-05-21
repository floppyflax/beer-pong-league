/**
 * Format joined_at for "Membre depuis" display (e.g. "Membre depuis janvier 2025")
 */
export const formatJoinedSince = (dateString: string): string => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Membre depuis —";
  const month = date.toLocaleDateString("fr-FR", { month: "long" });
  const year = date.getFullYear();
  return `Membre depuis ${month} ${year}`;
};

/**
 * Format a date string as relative time in French
 * (e.g. "Il y a 2 heures", "Il y a 4 jours", "Hier"). Unités écrites
 * en toutes lettres pour la lisibilité (vs. abréviations « 2h / 4j »
 * qui se confondent avec un score).
 */
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) {
    return diffHours === 1 ? "Il y a 1 heure" : `Il y a ${diffHours} heures`;
  }
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  return date.toLocaleDateString("fr-FR");
};
