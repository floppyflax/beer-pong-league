import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../theme/tokens';

export function CreateLeagueScreen() {
  const [leagueName, setLeagueName] = useState('');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Nouvelle Ligue</Text>
      <View style={styles.form}>
        <Text style={styles.label}>Nom de la ligue</Text>
        <TextInput
          style={styles.input}
          value={leagueName}
          onChangeText={setLeagueName}
          placeholder="Entrez le nom de la ligue"
          placeholderTextColor={colors.text.muted}
        />
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
  form: {
    marginTop: spacing.page,
  },
  label: {
    ...typography.label,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  input: {
    ...typography.body,
    color: colors.text.primary,
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.page,
    paddingVertical: spacing.md,
  },
});
