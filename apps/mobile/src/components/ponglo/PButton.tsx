/**
 * PButton — Everything ELO design system button (mobile)
 * Variants: primary (signal-red) | accent (electric-blue) | tertiary (lime) | ghost
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
  type TouchableOpacityProps,
} from 'react-native';
import { palette, radius, typography } from '../../theme/tokens';

type Variant = 'primary' | 'accent' | 'tertiary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface PButtonProps extends TouchableOpacityProps {
  variant?: Variant;
  size?: Size;
  full?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const BG: Record<Variant, string> = {
  primary:  palette.signalRed,
  accent:   palette.electricBlue,
  tertiary: palette.lime,
  ghost:    'transparent',
};

const TEXT_COLOR: Record<Variant, string> = {
  primary:  palette.white,
  accent:   palette.white,
  tertiary: palette.navy,
  ghost:    palette.coolGray,
};

const BORDER: Record<Variant, string | undefined> = {
  primary:  undefined,
  accent:   undefined,
  tertiary: undefined,
  ghost:    palette.cardBorder,
};

const PY: Record<Size, number> = { sm: 8, md: 12, lg: 16 };
const PX: Record<Size, number> = { sm: 14, md: 18, lg: 22 };
const FS: Record<Size, number> = { sm: 12, md: 14, lg: 15 };

export function PButton({
  variant = 'accent',
  size = 'md',
  full = false,
  loading = false,
  icon,
  children,
  disabled,
  style,
  ...rest
}: PButtonProps) {
  const bg        = BG[variant];
  const textColor = TEXT_COLOR[variant];
  const border    = BORDER[variant];

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={disabled || loading}
      style={[
        styles.base,
        {
          backgroundColor: bg,
          paddingVertical: PY[size],
          paddingHorizontal: PX[size],
          alignSelf: full ? 'stretch' : 'flex-start',
          opacity: disabled ? 0.45 : 1,
          borderWidth: border ? 1 : 0,
          borderColor: border,
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={styles.inner}>
          {icon && <View style={styles.iconWrap}>{icon}</View>}
          <Text
            style={[
              styles.label,
              { color: textColor, fontSize: FS[size] },
            ]}
          >
            {children}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.card,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconWrap: {
    flexShrink: 0,
  },
  label: {
    ...typography.label,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
