/**
 * Podium — top-3 visual with pedestals
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette, radius, spacing } from '../../theme/tokens';
import { PAvatar } from './PAvatar';
import { PRankBadge } from './PRankBadge';

interface PodiumPlayer {
  id: string;
  name: string;
  elo: number;
}

interface PodiumProps {
  top3: PodiumPlayer[];
  scope?: string;
}

const POSITIONS = [1, 0, 2]; // display order: 2nd, 1st, 3rd
const HEIGHTS   = [80, 110, 60];
const MEDALS    = ['🥇', '🥈', '🥉'];
const RINGS     = [palette.pingYellow, palette.coolGray, palette.bronze];

export function Podium({ top3, scope }: PodiumProps) {
  if (top3.length < 3) return null;

  return (
    <View style={styles.container}>
      {scope && <Text style={styles.scope}>{scope}</Text>}
      <View style={styles.stage}>
        {POSITIONS.map((pos, displayIdx) => {
          const player = top3[pos];
          if (!player) return null;
          const height = HEIGHTS[displayIdx];
          const medal  = MEDALS[pos];
          const ring   = RINGS[pos];
          const isFirst = pos === 0;

          return (
            <View key={player.id} style={styles.slot}>
              {/* Player info above pedestal */}
              <View style={styles.playerInfo}>
                <Text style={styles.medal}>{medal}</Text>
                <PAvatar name={player.name} size={isFirst ? 44 : 36} ring={ring} />
                <Text style={styles.name} numberOfLines={1}>{player.name}</Text>
                <PRankBadge elo={player.elo} size="xs" showEmoji={false} />
                <Text style={styles.elo}>{player.elo}</Text>
              </View>

              {/* Pedestal */}
              <View
                style={[
                  styles.pedestal,
                  {
                    height,
                    backgroundColor: isFirst ? palette.pingYellow : palette.navySoft,
                    borderTopWidth: isFirst ? 0 : 1,
                    borderColor: isFirst ? undefined : palette.cardBorder,
                  },
                ]}
              >
                <Text style={[styles.pedestalRank, { color: isFirst ? palette.navy : palette.coolGray }]}>
                  {pos + 1}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  scope: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: palette.coolGray,
    marginBottom: spacing.sm,
  },
  stage: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  slot: {
    alignItems: 'center',
    width: 90,
  },
  playerInfo: {
    alignItems: 'center',
    gap: 3,
    marginBottom: spacing.xs,
  },
  medal: {
    fontSize: 18,
  },
  name: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.white,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    maxWidth: 80,
    textAlign: 'center',
  },
  elo: {
    fontSize: 12,
    fontWeight: '800',
    color: palette.electricBlue,
  },
  pedestal: {
    width: '100%',
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing.xs,
  },
  pedestalRank: {
    fontSize: 20,
    fontWeight: '800',
  },
});
