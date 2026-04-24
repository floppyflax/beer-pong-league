/**
 * LeaderRow — ranking list item with rank, avatar, name, badge, ELO, delta
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { palette, radius, spacing } from '../../theme/tokens';
import { PAvatar } from './PAvatar';
import { PRankBadge } from './PRankBadge';
import { EloDelta } from './EloDelta';
import { Sparkline } from './Sparkline';

interface LeaderRowPlayer {
  id: string;
  name: string;
  elo: number;
  delta?: number;
  eloHistory?: number[];
}

interface LeaderRowProps {
  rank: number;
  player: LeaderRowPlayer;
  onPress?: () => void;
}

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export function LeaderRow({ rank, player, onPress }: LeaderRowProps) {
  const medal = MEDAL[rank];
  const ringColor = rank === 1 ? palette.pingYellow : rank === 2 ? palette.coolGray : rank === 3 ? palette.bronze : undefined;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.row}
      testID="leader-row"
    >
      {/* Rank */}
      <View style={styles.rankBox}>
        {medal ? (
          <Text style={styles.medal}>{medal}</Text>
        ) : (
          <Text style={styles.rank}>{rank}</Text>
        )}
      </View>

      {/* Avatar */}
      <PAvatar name={player.name} size={32} ring={ringColor} />

      {/* Name + badge */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{player.name}</Text>
        <PRankBadge elo={player.elo} size="xs" showEmoji={false} />
      </View>

      {/* Sparkline */}
      {player.eloHistory && player.eloHistory.length >= 2 && (
        <Sparkline points={player.eloHistory} width={40} height={18} />
      )}

      {/* ELO + delta */}
      <View style={styles.eloBox}>
        <Text style={styles.elo}>{player.elo}</Text>
        {player.delta !== undefined && player.delta !== 0 && (
          <EloDelta delta={player.delta} size="xs" />
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
  rankBox: {
    width: 24,
    alignItems: 'center',
  },
  medal: {
    fontSize: 16,
  },
  rank: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.coolGray,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.white,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  eloBox: {
    alignItems: 'flex-end',
    gap: 1,
  },
  elo: {
    fontSize: 14,
    fontWeight: '800',
    color: palette.white,
    fontVariant: ['tabular-nums'],
  },
});
