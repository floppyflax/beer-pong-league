/**
 * EventDetailScreen — tournament/event detail with tabs (Phase C.4)
 * Renamed from TournamentDetailScreen.
 */

import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { palette, spacing, radius, typography } from '../theme/tokens';
import { LeaderRow } from '../components/ponglo/LeaderRow';
import { Podium } from '../components/ponglo/Podium';
import { MatchRow } from '../components/ponglo/MatchRow';
import { InfoCard } from '../components/ponglo/InfoCard';
import { FAB } from '../components/ponglo/FAB';

type Props = NativeStackScreenProps<RootStackParamList, 'EventDetail'>;
type Tab = 'ranking' | 'matches' | 'info';

/* Mock data */
const MOCK_EVENT = {
  id: 'evt-1',
  name: 'Tournoi de Printemps',
  format: 'libre',
  status: 'active',
  playerCount: 8,
  matchCount: 12,
};

const MOCK_PLAYERS = [
  { id: 'p1', name: 'Alice',  elo: 1580, delta: 20 },
  { id: 'p2', name: 'Bob',    elo: 1520, delta: -10 },
  { id: 'p3', name: 'Clara',  elo: 1460, delta: 8 },
  { id: 'p4', name: 'David',  elo: 1380, delta: 0 },
];

const MOCK_MATCHES = [
  { id: 'm1', date: new Date().toISOString(), teamA: ['Alice'], teamB: ['Bob'], scoreA: 10, scoreB: 7 },
  { id: 'm2', date: new Date(Date.now() - 86400000).toISOString(), teamA: ['Clara'], teamB: ['David'], scoreA: 10, scoreB: 4 },
];

const TABS: { key: Tab; label: string }[] = [
  { key: 'ranking',  label: 'Classement' },
  { key: 'matches',  label: 'Matchs' },
  { key: 'info',     label: 'Infos' },
];

export function EventDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const [tab, setTab] = useState<Tab>('ranking');
  const event = MOCK_EVENT;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Title */}
      <View style={styles.titleBar}>
        <Text style={styles.title} numberOfLines={1}>{event.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: palette.lime }]}>
          <Text style={[styles.statusText, { color: palette.navy }]}>En cours</Text>
        </View>
      </View>

      {/* Segmented tabs */}
      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityLabel={t.label}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {tab === 'ranking' && (
          <>
            {MOCK_PLAYERS.length >= 3 && (
              <Podium top3={MOCK_PLAYERS.slice(0, 3)} />
            )}
            <View style={styles.list}>
              {MOCK_PLAYERS.map((p, i) => (
                <LeaderRow
                  key={p.id}
                  rank={i + 1}
                  player={p}
                />
              ))}
            </View>
          </>
        )}

        {tab === 'matches' && (
          <View style={styles.list}>
            {MOCK_MATCHES.length === 0 ? (
              <Text style={styles.empty}>Aucun match enregistré</Text>
            ) : (
              MOCK_MATCHES.map((m) => (
                <MatchRow
                  key={m.id}
                  date={m.date}
                  teamA={m.teamA}
                  teamB={m.teamB}
                  scoreA={m.scoreA}
                  scoreB={m.scoreB}
                />
              ))
            )}
          </View>
        )}

        {tab === 'info' && (
          <InfoCard
            badge={{ label: 'En cours', color: palette.lime, textColor: palette.navy }}
            rows={[
              { label: 'Format',  value: 'Libre' },
              { label: 'Joueurs', value: `${event.playerCount} inscrits` },
              { label: 'Matchs',  value: `${event.matchCount} joués` },
              { label: 'ID',      value: id, accent: palette.coolGray },
            ]}
          />
        )}
      </ScrollView>

      {/* FAB — Nouveau match */}
      {tab === 'ranking' && (
        <FAB
          label="Nouveau match"
          onPress={() => navigation.navigate('ScoreRecord', { contextType: 'tournament', id })}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.navy },
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.page,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  title: {
    ...typography.pageTitle,
    color: palette.white,
    flex: 1,
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: radius.full,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.page,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderColor: palette.cardBorder,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
    backgroundColor: palette.navySoft,
    borderWidth: 1,
    borderColor: palette.cardBorder,
  },
  tabActive: {
    backgroundColor: palette.electricBlue,
    borderColor: palette.electricBlue,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: palette.coolGray,
  },
  tabTextActive: { color: palette.white },
  content: {
    paddingHorizontal: spacing.page,
    paddingTop: spacing.md,
    paddingBottom: 120,
    gap: spacing.md,
  },
  list: { gap: spacing.sm },
  empty: { fontSize: 13, color: palette.coolGray, textAlign: 'center', paddingVertical: spacing.xl },
});
