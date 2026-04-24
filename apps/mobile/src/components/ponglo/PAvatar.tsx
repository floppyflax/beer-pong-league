/**
 * PAvatar — avatar initials + optional photo ring (mobile)
 */

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { palette, radius } from '../../theme/tokens';

interface PAvatarProps {
  name: string;
  size?: number;
  imageUrl?: string;
  ring?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function PAvatar({ name, size = 40, imageUrl, ring }: PAvatarProps) {
  const initials = getInitials(name);
  const fontSize = Math.round(size * 0.36);
  const borderWidth = ring ? 2 : 0;

  return (
    <View
      style={[
        styles.wrapper,
        {
          width: size + borderWidth * 2,
          height: size + borderWidth * 2,
          borderRadius: (size + borderWidth * 2) / 2,
          borderWidth,
          borderColor: ring ?? 'transparent',
        },
      ]}
    >
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: palette.navySoft,
          },
        ]}
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={{ width: size, height: size, borderRadius: size / 2 }}
          />
        ) : (
          <Text style={[styles.initials, { fontSize, color: palette.coolGray }]}>
            {initials}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
