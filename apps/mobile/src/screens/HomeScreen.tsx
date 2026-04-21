import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../theme/tokens';

export function HomeScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Accueil</Text>
      <Text style={styles.welcome}>Bienvenue sur Beer Pong League</Text>
      <View style={styles.activityPlaceholder}>
        <Text style={styles.placeholderText}>Activité récente</Text>
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
  welcome: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.page,
  },
  activityPlaceholder: {
    flex: 1,
    backgroundColor: colors.bg.secondary,
    borderRadius: 8,
    padding: spacing.page,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    ...typography.body,
    color: colors.text.muted,
  },
});
