/**
 * HomeScreen — Dashboard (identity-aware)
 */

import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthContext, useIdentityContext } from '@elofight/shared';
import { palette, spacing, radius, typography } from '../theme/tokens';
import { StatCard } from '../components/ponglo/StatCard';

export function HomeScreen() {
  const { user, isAuthenticated, userProfile } = useAuthContext();
  const { localUser } = useIdentityContext();

  const displayName =
    userProfile?.pseudo ??
    user?.email?.split('@')[0] ??
    localUser?.pseudo ??
    'Joueur';

  const isAnonymous = !isAuthenticated;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.wordmark}>🏓 Beer Pong <Text style={styles.wordmarkAccent}>ELO</Text></Text>
            <Text style={styles.greeting}>
              {isAnonymous ? `Bonjour, ${displayName}` : `Bonjour, ${displayName} 👋`}
            </Text>
          </View>
          {isAnonymous && (
            <View style={styles.anonBadge}>
              <Text style={styles.anonBadgeText}>Anonyme</Text>
            </View>
          )}
        </View>

        {/* Quick stats — placeholder until useHomeData is ported */}
        <View style={styles.statsRow}>
          <StatCard label="Ligues" value="—" sub="Bientôt" compact />
          <StatCard label="Événements" value="—" sub="Bientôt" compact />
          <StatCard label="Matchs" value="—" sub="Bientôt" compact />
        </View>

        {/* Recent activity */}
        <Text style={styles.sectionTitle}>Activité récente</Text>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🍺</Text>
          <Text style={styles.emptyTitle}>Aucune activité</Text>
          <Text style={styles.emptyText}>
            Rejoignez une ligue ou un événement pour commencer à jouer.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.navy },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.page,
    paddingTop: spacing.lg,
    paddingBottom: 100,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  wordmark: { fontSize: 22, fontWeight: '800', color: palette.white, letterSpacing: -0.5 },
  wordmarkAccent: { color: palette.electricBlue },
  greeting: { fontSize: 13, color: palette.coolGray, marginTop: 2 },
  anonBadge: {
    backgroundColor: palette.navySoft,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 2,
  },
  anonBadgeText: { fontSize: 11, color: palette.coolGray, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  sectionTitle: { ...typography.sectionTitle, color: palette.coolGray },
  emptyCard: {
    backgroundColor: palette.navySoft,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    padding: spacing['2xl'],
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyIcon: { fontSize: 40 },
  emptyTitle: {
    fontSize: 16, fontWeight: '700', color: palette.white,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  emptyText: { fontSize: 13, color: palette.coolGray, textAlign: 'center', lineHeight: 18 },
});
