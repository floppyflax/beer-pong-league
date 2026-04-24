/**
 * Sparkline — tiny inline trend chart (View-based, no SVG dep)
 * Uses midpoint positioning to approximate correct angle rendering.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { palette } from '../../theme/tokens';

interface SparklineProps {
  points: number[];
  width?: number;
  height?: number;
  color?: string;
}

export function Sparkline({
  points,
  width = 48,
  height = 20,
  color = palette.electricBlue,
}: SparklineProps) {
  if (points.length < 2) return <View style={{ width, height }} />;

  const min   = Math.min(...points);
  const max   = Math.max(...points);
  const range = max - min || 1;
  const norm  = points.map((p) => (p - min) / range);
  const segW  = width / (points.length - 1);

  return (
    <View style={{ width, height, position: 'relative' }}>
      {norm.slice(0, -1).map((y0, i) => {
        const y1   = norm[i + 1];
        const x0   = i * segW;
        const top0 = (1 - y0) * (height - 2) + 1;
        const top1 = (1 - y1) * (height - 2) + 1;
        const dx   = segW;
        const dy   = top1 - top0;
        const len  = Math.sqrt(dx * dx + dy * dy);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        /* Position at midpoint of the segment so center-rotation is correct */
        const midX = x0 + dx / 2 - len / 2;
        const midY = (top0 + top1) / 2 - 0.75;
        return (
          <View
            key={i}
            style={[
              styles.segment,
              {
                width: len,
                left: midX,
                top: midY,
                backgroundColor: color,
                transform: [{ rotate: `${angle}deg` }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  segment: {
    position: 'absolute',
    height: 1.5,
  },
});
