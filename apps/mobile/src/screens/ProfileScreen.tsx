/**
 * ProfileScreen — user profile with ELO chart and stats (Phase C.4)
 */

import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette, spacing, radius, typography } from '../theme/tokens';
import { PAvatar } from '../components/ponglo/PAvatar';
import { PRankBadge } from '../components/ponglo/PRankBadge';
import { StatCard } from '../components/ponglo/StatCard';
import { EloChart, type EloChartPoint } from '../components/ponglo/EloChart';
import { MatchRow } from '../components/ponglo/MatchRow';

/* Mock data — replace with auth context + supabase */
const MOCK_USER = {
  id: 'u1',
  name: 'Marc Dupont',
  elo: 1540,
  wins: 14,
  losses: 6,
  matchesPlayed: 20,
  streak: 3,
};

const MOCK_ELO_HISTORY: EloChartPoint[] = [
  { date: '2025-10-01', elo: 1000 },
  { date: '2025-11-01', elo: 1120 },
  { date: '2025-12-01', elo: 1080 },
  { date: '2026-01-01', elo: 1320 },
  { date: '2026-02-01', elo: 1460 },
  { date: '2026-03-01', elo: 1540 },
];

const MOCK_MATCHES = [
  { id: 'm1', date: '2026-03-15', teamA: ['Marc'], teamB: ['Alice'], scoreA: 10, scoreB: 6, eloChange: 18 },
  { id: 'm2', date: '2026-03-10', teamA: ['Bob'], teamB: ['Marc'], scoreA: 10, scoreB: 8, eloChange: -14 },
];

export function ProfileScreen() {
  const user = MOCK_USER;
  const winRate = user.matchesPlayed > 0
    ? Math.round((user.wins / user.matchesPlayed) * 100)
    : 0;
  const streakLabel =
    user.streak >= 3 ? `🔥 En feu ! ${user.streak}V` :
    user.streak > 0  ? `${user.streak} victoire${user.streak > 1 ? 's' : ''} d'affilée` :
    user.streak < 0  ? `${Math.abs(user.streak)} défaite${Math.abs(user.streak) > 1 ? 's' : ''} d'affilée` :
    'Aucune série';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <PAvatar name={user.name} size={64} ring={palette.electricBlue} />
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{user.name}</Text>
            <View style={styles.badgeRow}>
              <PRankBadge elo={user.elo} size="sm" />
            </View>
            <Text style={styles.streak}>{streakLabel}</Text>
          </View>
        </View>

        {/* Stat cards */}
        <View style={styles.statsRow}>
          <StatCard label="ELO" value={user.elo} accent={palette.electricBlue} />
          <StatCard
            label="W/L"
            value={`${user.wins}V - ${user.losses}D`}
            accent={palette.lime}
            compact
          />
          <StatCard label="Win rate" value={`${winRate}%`} compact />
        </View>

        {/* ELO chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Évolution ELO</Text>
          <View style={styles.chartBox}>
            <EloChart points={MOCK_ELO_HISTORY} width={320} height={80} />
            <View style={styles.chartFooter}>
              <Text style={styles.chartMin}>
                {Math.min(...MOCK_ELO_HISTORY.map((p) => p.elo))}
              </Text>
              <Text style={styles.chartCurrent}>{user.elo} pts</Text>
              <Text style={styles.chartMax}>
                {Math.max(...MOCK_ELO_HISTORY.map((p) => p.elo))}
              </Text>
            </View>
          </View>
        </View>

        {/* Recent matches */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Matchs récents</Text>
          <View style={styles.matchList}>
            {MOCK_MATCHES.map((m) => (
              <MatchRow
                key={m.id}
                date={m.date}
                teamA={m.teamA}
                teamB={m.teamB}
                scoreA={m.scoreA}
                scoreB={m.scoreB}
                perspectiveId={user.id}
                eloChange={m.eloChange}
              />
            ))}
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOut} activeOpacity={0.7}>
          <Text style={styles.signOutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.navy },
  content: {
    paddingHorizontal: spacing.page,
    paddingTop: spacing.lg,
    paddingBottom: 100,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.white,
    textTransform: 'uppercase',
    letterSpacing: -0.3,
  },
  badgeRow: { flexDirection: 'row' },
  streak: {
    fontSize: 12,
    color: palette.coolGray,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  section: { gap: spacing.sm },
  sectionTitle: { ...typography.sectionTitle, color: palette.coolGray },
  chartBox: {
    backgroundColor: palette.navySoft,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    padding: spacing.md,
    gap: spacing.sm,
    alignItems: 'center',
  },
  chartFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  chartMin:  { fontSize: 10, color: palette.coolGray },
  chartMax:  { fontSize: 10, color: palette.coolGray },
  chartCurrent: { fontSize: 12, fontWeight: '800', color: palette.electricBlue },
  matchList: { gap: spacing.sm },
  signOut: {
    backgroundColor: palette.navySoft,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.signalRed,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.signalRed,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
