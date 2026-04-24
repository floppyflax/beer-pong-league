/**
 * StatCard — metric tile (ELO / W-L / Win rate / …)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette, radius, spacing, typography } from '../../theme/tokens';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  compact?: boolean;
}

export function StatCard({ label, value, sub, accent, compact = false }: StatCardProps) {
  return (
    <View style={[styles.card, compact && styles.compact]}>
      <Text style={[styles.label, { color: accent ?? palette.coolGray }]}>{label}</Text>
      <Text style={[styles.value, { color: accent ?? palette.white }]}>
        {value}
      </Text>
      {sub && <Text style={styles.sub}>{sub}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: palette.navySoft,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    padding: spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  compact: {
    paddingVertical: spacing.sm,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  value: {
    ...typography.stat,
    fontSize: 22,
  },
  sub: {
    fontSize: 11,
    color: palette.coolGray,
  },
});
