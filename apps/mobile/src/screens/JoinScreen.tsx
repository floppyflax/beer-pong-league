import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme/tokens';

export function JoinScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Rejoindre</Text>
      <View style={styles.content}>
        <View style={styles.qrPlaceholder}>
          <Ionicons name="qr-code-outline" size={80} color={colors.text.muted} />
        </View>
        <TouchableOpacity style={styles.button} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Scanner un QR code</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
    paddingHorizontal: spacing.page,
  },
  title: {
    ...typography.pageTitle,
    color: colors.text.primary,
    marginBottom: spacing.page,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrPlaceholder: {
    width: 160,
    height: 160,
    backgroundColor: colors.bg.secondary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.page,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.page * 2,
    paddingVertical: spacing.page,
    borderRadius: 8,
  },
  buttonText: {
    ...typography.body,
    color: colors.bg.primary,
    fontWeight: '600',
  },
});
