import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { colors, spacing, typography } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'TournamentDetail'>;

export function TournamentDetailScreen({ route }: Props) {
  const { id } = route.params;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Événement</Text>
      <Text style={styles.id}>ID: {id}</Text>
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
  id: {
    ...typography.body,
    color: colors.text.secondary,
  },
});
