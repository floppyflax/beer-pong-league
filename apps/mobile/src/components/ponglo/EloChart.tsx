/**
 * EloChart — ELO history line chart (View-based, no SVG dependency)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette, radius, spacing } from '../../theme/tokens';

export interface EloChartPoint {
  date: string;
  elo: number;
}

interface EloChartProps {
  points: EloChartPoint[];
  width?: number;
  height?: number;
}

export function EloChart({ points, width = 300, height = 72 }: EloChartProps) {
  if (points.length < 2) {
    return (
      <View testID="elo-chart-empty" style={[styles.empty, { width, height }]}>
        <Text style={styles.emptyText}>Pas encore d'historique ELO</Text>
      </View>
    );
  }

  const elos = points.map((p) => p.elo);
  const min   = Math.min(...elos);
  const max   = Math.max(...elos);
  const range = max - min || 1;
  const norm  = elos.map((e) => (e - min) / range);
  const segW  = width / (points.length - 1);

  return (
    <View testID="elo-chart" style={{ width, height, position: 'relative' }}>
      {/* Baseline */}
      <View style={[styles.baseline, { width, bottom: 0 }]} />

      {/* Segments */}
      {norm.slice(0, -1).map((y0, i) => {
        const y1  = norm[i + 1];
        const x0  = i * segW;
        const top0 = (1 - y0) * (height - 4) + 2;
        const top1 = (1 - y1) * (height - 4) + 2;
        const dx  = segW;
        const dy  = top1 - top0;
        const len = Math.sqrt(dx * dx + dy * dy);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        const isUp  = elos[i + 1] >= elos[i];
        const midX  = x0 + segW / 2 - len / 2;
        const midY  = (top0 + top1) / 2 - 1;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              width: len,
              height: 2,
              left: midX,
              top: midY,
              backgroundColor: isUp ? palette.lime : palette.signalRed,
              transform: [{ rotate: `${angle}deg` }],
            }}
          />
        );
      })}

      {/* Current ELO dot */}
      <View
        style={[
          styles.dot,
          {
            left: (points.length - 1) * segW - 4,
            top: (1 - norm[norm.length - 1]) * (height - 4) - 2,
            backgroundColor: palette.electricBlue,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    backgroundColor: palette.navySoft,
    borderRadius: radius.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 11,
    color: palette.coolGray,
  },
  baseline: {
    position: 'absolute',
    height: 1,
    backgroundColor: palette.cardBorder,
  },
  dot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
