/**
 * FAB — Floating Action Button for primary actions
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, type TouchableOpacityProps } from 'react-native';
import { palette, radius } from '../../theme/tokens';

interface FABProps extends TouchableOpacityProps {
  label: string;
  icon?: string;
}

export function FAB({ label, icon, style, ...rest }: FABProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.fab, style]}
      testID="fab"
      accessibilityLabel={label}
      {...rest}
    >
      <Text style={styles.label}>
        {icon ? `${icon} ` : '🏓 '}{label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    backgroundColor: palette.electricBlue,
    borderRadius: radius.full,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 8,
    shadowColor: palette.electricBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  label: {
    color: palette.white,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
