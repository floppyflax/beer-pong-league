/**
 * PRankBadge — 7-tier ELO rank badge (mobile mirror)
 * Tiers (§2.3): MOUSSE / PICHET / DEMI / PINTE / MAGNUM / MÉTÉORE / LÉGENDE
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette, radius } from '../../theme/tokens';

export interface RankTier {
  label: string;
  minElo: number;
  bg: string;
  text: string;
  emoji: string;
}

export const RANK_TIERS: RankTier[] = [
  { label: 'LÉGENDE',  minElo: 2000, bg: '#7B2FBE', text: palette.white,     emoji: '👑' },
  { label: 'MÉTÉORE',  minElo: 1700, bg: palette.electricBlue, text: palette.white, emoji: '☄️' },
  { label: 'MAGNUM',   minElo: 1500, bg: palette.pingYellow,   text: palette.navy,  emoji: '🏆' },
  { label: 'PINTE',    minElo: 1300, bg: palette.lime,          text: palette.navy,  emoji: '🍺' },
  { label: 'DEMI',     minElo: 1100, bg: palette.coolGray,      text: palette.white, emoji: '🍻' },
  { label: 'PICHET',   minElo: 900,  bg: palette.bronze,        text: palette.white, emoji: '🥂' },
  { label: 'MOUSSE',   minElo: 0,    bg: '#374151',             text: palette.coolGray, emoji: '🫧' },
];

export function rankOf(elo: number): RankTier {
  return RANK_TIERS.find((t) => elo >= t.minElo) ?? RANK_TIERS[RANK_TIERS.length - 1];
}

interface PRankBadgeProps {
  elo: number;
  size?: 'xs' | 'sm' | 'md';
  showEmoji?: boolean;
}

const FONT_SIZE: Record<string, number> = { xs: 8, sm: 9, md: 10 };
const PY: Record<string, number>        = { xs: 2, sm: 3, md: 4 };
const PX: Record<string, number>        = { xs: 5, sm: 7, md: 10 };

export function PRankBadge({ elo, size = 'sm', showEmoji = true }: PRankBadgeProps) {
  const tier = rankOf(elo);
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: tier.bg,
          paddingVertical: PY[size],
          paddingHorizontal: PX[size],
        },
      ]}
    >
      <Text style={[styles.label, { color: tier.text, fontSize: FONT_SIZE[size] }]}>
        {showEmoji ? `${tier.emoji} ` : ''}{tier.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
