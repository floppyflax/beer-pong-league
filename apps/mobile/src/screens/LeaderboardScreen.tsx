/**
 * LeaderboardScreen — global leaderboard with league switcher (Phase C.3)
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
import { LeaderRow } from '../components/ponglo/LeaderRow';
import { Podium } from '../components/ponglo/Podium';

/* Mock data — replace with real context hook */
const MOCK_PLAYERS = [
  { id: '1', name: 'Alice Dupont',  elo: 1620, delta:  15, eloHistory: [1500, 1530, 1560, 1590, 1620] },
  { id: '2', name: 'Bob Martin',   elo: 1540, delta: -10, eloHistory: [1550, 1545, 1535, 1540, 1540] },
  { id: '3', name: 'Clara Roy',    elo: 1480, delta:   8, eloHistory: [1420, 1440, 1455, 1470, 1480] },
  { id: '4', name: 'David Petit',  elo: 1320, delta:   0, eloHistory: [1310, 1315, 1320, 1315, 1320] },
  { id: '5', name: 'Emma Blanc',   elo: 1280, delta: -5,  eloHistory: [1300, 1290, 1285, 1280, 1280] },
  { id: '6', name: 'Frank Noir',   elo: 1200, delta:  20, eloHistory: [1100, 1130, 1160, 1180, 1200] },
];

const MOCK_LEAGUES = [
  { id: 'all',      name: 'Global' },
  { id: 'league-1', name: 'Ligue des Pingouins' },
  { id: 'league-2', name: 'Tournoi Été 2026' },
];

export function LeaderboardScreen() {
  const [selectedLeague, setSelectedLeague] = useState('all');

  const top3 = MOCK_PLAYERS.slice(0, 3);
  const rest  = MOCK_PLAYERS.slice(3);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* League switcher */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.switcher}
        style={styles.switcherBar}
      >
        {MOCK_LEAGUES.map((league) => (
          <TouchableOpacity
            key={league.id}
            style={[
              styles.pill,
              selectedLeague === league.id && styles.pillActive,
            ]}
            onPress={() => setSelectedLeague(league.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, selectedLeague === league.id && styles.pillTextActive]}>
              {league.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={rest}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Classement</Text>
            {top3.length >= 3 && (
              <Podium
                top3={top3}
                scope={MOCK_LEAGUES.find((l) => l.id === selectedLeague)?.name}
              />
            )}
            <Text style={styles.sectionLabel}>SUITE DU CLASSEMENT</Text>
          </>
        }
        renderItem={({ item, index }) => (
          <LeaderRow
            rank={index + 4}
            player={item}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aucun joueur dans ce classement.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.navy },
  switcherBar: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderColor: palette.cardBorder,
  },
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
  pillActive: {
    backgroundColor: palette.electricBlue,
    borderColor: palette.electricBlue,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.coolGray,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  pillTextActive: { color: palette.white },
  list: {
    paddingHorizontal: spacing.page,
    paddingBottom: 100,
    gap: spacing.sm,
  },
  title: { ...typography.pageTitle, color: palette.white, marginBottom: spacing.sm },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: palette.coolGray,
    textTransform: 'uppercase',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  empty: { alignItems: 'center', paddingVertical: spacing['2xl'] },
  emptyText: { fontSize: 13, color: palette.coolGray },
});
