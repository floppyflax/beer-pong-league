/**
 * HistoryScreen — match history with filter pills (Phase C.4)
 */

import React, { useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette, spacing, radius, typography } from '../theme/tokens';
import { MatchRow } from '../components/ponglo/MatchRow';

type Filter = 'all' | 'win' | 'loss';

const ME = 'p1';

const ALL_MATCHES = [
  { id: 'm1', date: '2026-03-15', teamA: [ME], teamB: ['p2'], scoreA: 10, scoreB: 6, eloChange: 18 },
  { id: 'm2', date: '2026-03-10', teamA: ['p3'], teamB: [ME], scoreA: 10, scoreB: 8, eloChange: -14 },
  { id: 'm3', date: '2026-03-05', teamA: [ME, 'p4'], teamB: ['p2', 'p3'], scoreA: 10, scoreB: 3, eloChange: 22 },
  { id: 'm4', date: '2026-02-28', teamA: ['p2'], teamB: [ME], scoreA: 10, scoreB: 9, eloChange: -8 },
  { id: 'm5', date: '2026-02-20', teamA: [ME], teamB: ['p4'], scoreA: 10, scoreB: 5, eloChange: 15 },
];

function isWin(match: typeof ALL_MATCHES[0]): boolean {
  return (
    (match.teamA.includes(ME) && match.scoreA > match.scoreB) ||
    (match.teamB.includes(ME) && match.scoreB > match.scoreA)
  );
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',  label: 'Tous' },
  { key: 'win',  label: 'Victoires' },
  { key: 'loss', label: 'Défaites' },
];

export function HistoryScreen() {
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = ALL_MATCHES.filter((m) => {
    if (filter === 'win')  return isWin(m);
    if (filter === 'loss') return !isWin(m);
    return true;
  });

  const wins   = ALL_MATCHES.filter(isWin).length;
  const losses = ALL_MATCHES.length - wins;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Historique</Text>
        <Text style={styles.subtitle}>{wins}V · {losses}D</Text>
      </View>

      {/* Filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
        style={styles.filtersBar}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.pill, filter === f.key && styles.pillActive]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, filter === f.key && styles.pillTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Match list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <MatchRow
            date={item.date}
            teamA={item.teamA}
            teamB={item.teamB}
            scoreA={item.scoreA}
            scoreB={item.scoreB}
            perspectiveId={ME}
            eloChange={item.eloChange}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aucun match pour ce filtre</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.navy },
  header: {
    paddingHorizontal: spacing.page,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  title: { ...typography.pageTitle, color: palette.white },
  subtitle: { fontSize: 13, color: palette.coolGray },
  filtersBar: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderColor: palette.cardBorder,
  },
  filters: {
    paddingHorizontal: spacing.page,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    flexDirection: 'row',
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    backgroundColor: palette.navySoft,
    borderWidth: 1,
    borderColor: palette.cardBorder,
  },
  pillActive: { backgroundColor: palette.electricBlue, borderColor: palette.electricBlue },
  pillText: { fontSize: 12, fontWeight: '700', color: palette.coolGray, textTransform: 'uppercase', letterSpacing: 0.4 },
  pillTextActive: { color: palette.white },
  list: {
    paddingHorizontal: spacing.page,
    paddingTop: spacing.md,
    paddingBottom: 100,
  },
  empty: { alignItems: 'center', paddingVertical: spacing['2xl'] },
  emptyText: { fontSize: 13, color: palette.coolGray },
});
