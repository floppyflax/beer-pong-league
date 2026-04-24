/**
 * EloDelta — inline ELO change indicator ±N
 */

import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { palette } from '../../theme/tokens';

interface EloDeltaProps {
  delta: number;
  size?: 'xs' | 'sm' | 'md';
}

const FS: Record<string, number> = { xs: 10, sm: 12, md: 14 };

export function EloDelta({ delta, size = 'sm' }: EloDeltaProps) {
  if (delta === 0) return null;
  const color = delta > 0 ? palette.lime : palette.signalRed;
  const sign  = delta > 0 ? '+' : '';
  return (
    <Text style={[styles.text, { color, fontSize: FS[size] }]}>
      {sign}{delta}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontWeight: '700',
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
  },
});
