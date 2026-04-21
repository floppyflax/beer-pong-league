/**
 * Design tokens for the mobile app.
 * Mirrors the web design-tokens.css / tailwind.config.js values.
 */

export const colors = {
  bg: {
    primary: '#0f172a',
    secondary: '#1e293b',
    tertiary: '#334155',
  },
  text: {
    primary: '#ffffff',
    secondary: '#cbd5e1',
    tertiary: '#94a3b8',
    muted: '#64748b',
  },
  primary: '#f59e0b',
  success: '#22c55e',
  error: '#ef4444',
  info: '#3b82f6',
  elo: '#f59e0b',
  border: {
    card: '#334155',
    cardMuted: 'rgba(51, 65, 85, 0.5)',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  page: 16,
} as const;

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const typography = {
  pageTitle: { fontSize: 20, fontWeight: '700' as const, lineHeight: 28 },
  sectionTitle: { fontSize: 18, fontWeight: '700' as const, lineHeight: 28 },
  body: { fontSize: 16, lineHeight: 24 },
  bodySm: { fontSize: 14, lineHeight: 20 },
  label: { fontSize: 14, fontWeight: '500' as const, lineHeight: 20 },
  stat: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32 },
  caption: { fontSize: 12, lineHeight: 16 },
} as const;
