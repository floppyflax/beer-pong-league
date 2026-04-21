import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme/tokens';

export function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Profil</Text>
      <View style={styles.avatarPlaceholder}>
        <Ionicons name="person" size={48} color={colors.text.muted} />
      </View>
      <View style={styles.userInfoSection}>
        <Text style={styles.sectionTitle}>Informations</Text>
        <Text style={styles.placeholderText}>Nom d'utilisateur</Text>
        <Text style={styles.placeholderText}>Email</Text>
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
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.bg.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.page,
  },
  userInfoSection: {
    backgroundColor: colors.bg.secondary,
    borderRadius: 8,
    padding: spacing.page,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  placeholderText: {
    ...typography.body,
    color: colors.text.muted,
    marginBottom: spacing.xs,
  },
});
