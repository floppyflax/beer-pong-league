/**
 * Format a date string as relative time in French (e.g. "Il y a 2h", "Hier")
 */
export const formatRelativeTime = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString('fr-FR');
};

/**
 * Format a date as "Membre depuis X" (e.g. "Membre depuis 2 mois")
 */
export const formatJoinedSince = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffDays < 1) return 'Membre depuis aujourd\'hui';
  if (diffDays < 30) return `Membre depuis ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  if (diffMonths < 12) return `Membre depuis ${diffMonths} mois`;
  return `Membre depuis ${diffYears} an${diffYears > 1 ? 's' : ''}`;
};
