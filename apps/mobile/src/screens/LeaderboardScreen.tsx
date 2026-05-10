/**
 * LeaderboardScreen — global lifetime-stats leaderboard
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalLeaderboard, type LeaderboardSort, type LeaderboardEntry } from '@elofight/shared';
import { palette, spacing, radius, typography } from '../theme/tokens';
import { Podium } from '../components/ponglo/Podium';
import { PAvatar } from '../components/ponglo/PAvatar';

const SORT_TABS: { key: LeaderboardSort; label: string }[] = [
  { key: 'matches', label: 'Matchs' },
  { key: 'wins',    label: 'Victoires' },
  { key: 'winrate', label: 'Win %' },
];

function primaryStat(entry: LeaderboardEntry, sort: LeaderboardSort): string {
  if (sort === 'matches') return String(entry.matchesPlayed);
  if (sort === 'wins')    return String(entry.wins);
  return `${entry.winRate}%`;
}

function subStat(entry: LeaderboardEntry, sort: LeaderboardSort): string {
  if (sort === 'matches') return `${entry.wins}V · ${entry.losses}D`;
  if (sort === 'wins')    return `${entry.matchesPlayed} matchs`;
  return `${entry.matchesPlayed} matchs · ${entry.wins}V`;
}

const MEDAL_RING = [palette.pingYellow, palette.coolGray, palette.bronze];

interface StatRowProps {
  rank: number;
  entry: LeaderboardEntry;
  sort: LeaderboardSort;
}

function StatRow({ rank, entry, sort }: StatRowProps) {
  const ring = rank <= 3 ? MEDAL_RING[rank - 1] : undefined;
  return (
    <View style={rowStyles.row}>
      <View style={rowStyles.rankBox}>
        <Text style={[rowStyles.rank, rank <= 3 && rowStyles.rankTop]}>{rank}</Text>
      </View>
      <PAvatar name={entry.pseudo} size={32} ring={ring} />
      <View style={rowStyles.info}>
        <Text style={rowStyles.name} numberOfLines={1}>{entry.pseudo}</Text>
        <Text style={rowStyles.sub}>{subStat(entry, sort)}</Text>
      </View>
      <Text style={rowStyles.stat}>{primaryStat(entry, sort)}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: palette.navySoft,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.cardBorder,
  },
  rankBox: { width: 22, alignItems: 'center' },
  rank: { fontSize: 12, fontWeight: '700', color: palette.coolGray },
  rankTop: { color: palette.pingYellow },
  info: { flex: 1, gap: 2 },
  name: {
    fontSize: 13, fontWeight: '700', color: palette.white,
    textTransform: 'uppercase', letterSpacing: 0.3,
  },
  sub: { fontSize: 10, color: palette.coolGray },
  stat: {
    fontSize: 15, fontWeight: '800', color: palette.white,
    fontVariant: ['tabular-nums'],
  },
});

export function LeaderboardScreen() {
  const [sort, setSort] = useState<LeaderboardSort>('matches');
  const { entries, isLoading, error } = useGlobalLeaderboard(sort);

  const top3Podium = entries.slice(0, 3).map((e) => ({
    id: e.id,
    name: e.pseudo,
    elo: sort === 'matches' ? e.matchesPlayed : sort === 'wins' ? e.wins : e.winRate,
  }));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Sort tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.switcher}
        style={styles.switcherBar}
      >
        {SORT_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.pill, sort === tab.key && styles.pillActive]}
            onPress={() => setSort(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, sort === tab.key && styles.pillTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={palette.electricBlue} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={entries.slice(3)}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              <Text style={styles.title}>Classement Global</Text>
              {top3Podium.length >= 3 && <Podium top3={top3Podium} />}
              {entries.length > 3 && (
                <Text style={styles.sectionLabel}>SUITE DU CLASSEMENT</Text>
              )}
            </>
          }
          renderItem={({ item, index }) => (
            <StatRow rank={index + 4} entry={item} sort={sort} />
          )}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🏓</Text>
              <Text style={styles.emptyText}>Aucun joueur dans le classement.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.navy },
  switcherBar: { flexGrow: 0, borderBottomWidth: 1, borderColor: palette.cardBorder },
  switcher: {
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
  pillText: {
    fontSize: 12, fontWeight: '700', color: palette.coolGray,
    textTransform: 'uppercase', letterSpacing: 0.4,
  },
  pillTextActive: { color: palette.white },
  list: { paddingHorizontal: spacing.page, paddingBottom: 100, gap: spacing.sm },
  title: { ...typography.pageTitle, color: palette.white, marginBottom: spacing.sm },
  sectionLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1,
    color: palette.coolGray, textTransform: 'uppercase',
    marginTop: spacing.sm, marginBottom: spacing.xs,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 13, color: palette.signalRed, textAlign: 'center', padding: spacing.lg },
  empty: { alignItems: 'center', paddingVertical: spacing['2xl'], gap: spacing.sm },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 13, color: palette.coolGray },
});
