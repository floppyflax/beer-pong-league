/**
 * MatchRow — match history list item
 * Variants: history (result) | live (score only)
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { palette, radius, spacing } from '../../theme/tokens';

interface MatchRowProps {
  date: string;
  teamA: string[];
  teamB: string[];
  scoreA?: number;
  scoreB?: number;
  /** player id to determine win/loss perspective */
  perspectiveId?: string;
  eloChange?: number;
  onPress?: () => void;
}

export function MatchRow({
  date,
  teamA,
  teamB,
  scoreA,
  scoreB,
  perspectiveId,
  eloChange,
  onPress,
}: MatchRowProps) {
  const hasScore = scoreA !== undefined && scoreB !== undefined;
  const isWin = perspectiveId
    ? hasScore && (
        (teamA.includes(perspectiveId) && scoreA! > scoreB!) ||
        (teamB.includes(perspectiveId) && scoreB! > scoreA!)
      )
    : null;

  const resultColor =
    isWin === true ? palette.lime : isWin === false ? palette.signalRed : palette.coolGray;
  const resultLabel =
    isWin === true ? 'Victoire' : isWin === false ? 'Défaite' : '';

  const dateStr = new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.row} testID="match-row">
      {/* Date */}
      <Text style={styles.date}>{dateStr}</Text>

      {/* Teams */}
      <View style={styles.center}>
        <Text style={styles.team} numberOfLines={1}>{teamA.join(' · ')}</Text>
        {hasScore && (
          <Text style={styles.score}>
            {scoreA} <Text style={styles.vs}>VS</Text> {scoreB}
          </Text>
        )}
        <Text style={styles.team} numberOfLines={1}>{teamB.join(' · ')}</Text>
      </View>

      {/* Result + delta */}
      <View style={styles.right}>
        {resultLabel ? (
          <Text style={[styles.result, { color: resultColor }]}>{resultLabel}</Text>
        ) : null}
        {eloChange !== undefined && eloChange !== 0 && (
          <Text style={[styles.delta, { color: eloChange > 0 ? palette.lime : palette.signalRed }]}>
            {eloChange > 0 ? '+' : ''}{eloChange} ELO
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: palette.navySoft,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.cardBorder,
  },
  date: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: palette.coolGray,
    textTransform: 'uppercase',
    width: 36,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  team: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.white,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  score: {
    fontSize: 16,
    fontWeight: '800',
    color: palette.white,
    fontVariant: ['tabular-nums'],
  },
  vs: {
    fontSize: 10,
    fontWeight: '700',
    color: palette.coolGray,
  },
  right: {
    alignItems: 'flex-end',
    gap: 2,
    width: 56,
  },
  result: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  delta: {
    fontSize: 10,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
