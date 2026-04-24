/**
 * InfoCard — labelled info display card (status badge, format, player count…)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette, radius, spacing } from '../../theme/tokens';

interface InfoRow {
  label: string;
  value: string;
  accent?: string;
}

interface InfoCardProps {
  rows: InfoRow[];
  badge?: { label: string; color: string; textColor?: string };
}

export function InfoCard({ rows, badge }: InfoCardProps) {
  return (
    <View style={styles.card}>
      {badge && (
        <View style={[styles.badge, { backgroundColor: badge.color }]}>
          <Text style={[styles.badgeText, { color: badge.textColor ?? palette.white }]}>
            {badge.label}
          </Text>
        </View>
      )}
      {rows.map((row, i) => (
        <View key={i} style={styles.row}>
          <Text style={styles.label}>{row.label}</Text>
          <Text style={[styles.value, { color: row.accent ?? palette.white }]}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.navySoft,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    padding: spacing.md,
    gap: spacing.sm,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingVertical: 3,
    paddingHorizontal: 10,
    marginBottom: spacing.xs,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: palette.coolGray,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.white,
  },
});
