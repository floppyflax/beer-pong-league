/**
 * Design tokens — Everything ELO palette (Phase C.1)
 * Mirrors apps/web/tailwind.config.js canonical tokens.
 */

/* ── Palette ──────────────────────────────────────────────────────────────── */
export const palette = {
  navy:          '#0F1923',
  navyDeep:      '#090E15',
  navySoft:      '#162030',
  electricBlue:  '#2F6BFF',
  pingYellow:    '#FFD23F',
  signalRed:     '#E63946',
  coolGray:      '#8A99AA',
  lime:          '#B7FF3B',
  bronze:        '#CD7F32',
  white:         '#FFFFFF',
  black:         '#000000',
  cardBorder:    '#1E2D3D',
  cardMuted:     'rgba(30,45,61,0.6)',
} as const;

/* ── Semantic aliases ─────────────────────────────────────────────────────── */
export const colors = {
  bg: {
    primary:   palette.navy,
    secondary: palette.navySoft,
    tertiary:  palette.navyDeep,
    card:      palette.navySoft,
  },
  text: {
    primary:   palette.white,
    secondary: palette.coolGray,
    muted:     '#5A6A7A',
  },
  accent:       palette.electricBlue,
  warning:      palette.pingYellow,
  danger:       palette.signalRed,
  success:      palette.lime,
  elo:          palette.electricBlue,
  border: {
    card:      palette.cardBorder,
    cardMuted: palette.cardMuted,
  },
} as const;

/* ── Spacing ──────────────────────────────────────────────────────────────── */
export const spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  '2xl': 24,
  '3xl': 32,
  page:  16,
} as const;

/* ── Radius ───────────────────────────────────────────────────────────────── */
export const radius = {
  sm:   6,
  md:   8,
  lg:   12,
  xl:   16,
  card: 12,
  full: 9999,
} as const;

/* ── Typography ───────────────────────────────────────────────────────────── */
export const typography = {
  display:      { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.5 },
  pageTitle:    { fontSize: 20, fontWeight: '700' as const, lineHeight: 28 },
  sectionTitle: { fontSize: 16, fontWeight: '700' as const, lineHeight: 24, letterSpacing: 0.5, textTransform: 'uppercase' as const },
  body:         { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodySm:       { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  label:        { fontSize: 13, fontWeight: '600' as const, lineHeight: 18 },
  mono:         { fontSize: 11, fontWeight: '700' as const, letterSpacing: 1, textTransform: 'uppercase' as const },
  stat:         { fontSize: 28, fontWeight: '800' as const, lineHeight: 36 },
  caption:      { fontSize: 11, fontWeight: '400' as const, lineHeight: 15 },
} as const;

/* ── Shadows ──────────────────────────────────────────────────────────────── */
export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
} as const;
