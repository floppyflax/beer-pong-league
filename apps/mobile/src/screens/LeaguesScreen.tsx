import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../theme/tokens';

export function LeaguesScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Mes Ligues</Text>
      <FlatList
        data={[]}
        keyExtractor={() => ''}
        renderItem={() => null}
        ListEmptyComponent={
          <View style={styles.emptyPlaceholder}>
            <Text style={styles.placeholderText}>Aucune ligue</Text>
          </View>
        }
      />
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
  emptyPlaceholder: {
    padding: spacing.page,
    alignItems: 'center',
  },
  placeholderText: {
    ...typography.body,
    color: colors.text.muted,
  },
});
