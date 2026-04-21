/**
 * String utilities
 */

/**
 * Returns initials from a name (e.g. "Jean Dupont" → "JD", "Alice" → "AL")
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  const first = parts[0] || "";
  return first.slice(0, 2).toUpperCase() || "?";
}
