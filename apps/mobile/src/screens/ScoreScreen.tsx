/**
 * ScoreScreen — record a match score (Phase C.4)
 * Player chip selection + score stepper + submit
 */

import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
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
import { PButton } from '../components/ponglo/PButton';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'ScoreRecord'>;

/* Mock players — replace with context data */
const MOCK_PLAYERS = [
  { id: 'p1', name: 'Alice' },
  { id: 'p2', name: 'Bob' },
  { id: 'p3', name: 'Clara' },
  { id: 'p4', name: 'David' },
];

function ScoreStepper({
  value,
  onChange,
  label,
  color,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.stepper}>
      <Text style={[styles.stepperLabel, { color }]}>{label}</Text>
      <View style={styles.stepperRow}>
        <TouchableOpacity
          onPress={() => onChange(Math.max(0, value - 1))}
          style={styles.stepBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="remove" size={20} color={palette.coolGray} />
        </TouchableOpacity>
        <Text style={styles.stepValue}>{value}</Text>
        <TouchableOpacity
          onPress={() => onChange(Math.min(10, value + 1))}
          style={styles.stepBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={20} color={palette.coolGray} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function ScoreScreen({ navigation }: Props) {
  const [playerTeams, setPlayerTeams] = useState<Record<string, 'A' | 'B'>>({});
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleToggle = (id: string, current: 'A' | 'B' | null) => {
    setPlayerTeams((prev) => {
      const next = { ...prev };
      if (current === null) {
        const aCount = Object.values(next).filter((t) => t === 'A').length;
        const bCount = Object.values(next).filter((t) => t === 'B').length;
        next[id] = aCount <= bCount ? 'A' : 'B';
      } else if (current === 'A') {
        next[id] = 'B';
      } else {
        delete next[id];
      }
      return next;
    });
  };

  const teamAIds = Object.entries(playerTeams).filter(([, t]) => t === 'A').map(([id]) => id);
  const teamBIds = Object.entries(playerTeams).filter(([, t]) => t === 'B').map(([id]) => id);
  const isValid = teamAIds.length >= 1 && teamBIds.length >= 1 && scoreA !== scoreB;

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);
    try {
      // TODO: call recordMatch context
      navigation.goBack();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Nouveau Match</Text>
          <Text style={styles.hint}>
            Tap → Éq.A (bleu) · Tap → Éq.B (jaune) · Tap → Désélectionner
          </Text>

          {/* Player chips */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>JOUEURS</Text>
            <View style={styles.chips}>
              {MOCK_PLAYERS.map((p) => {
                const team = playerTeams[p.id] ?? null;
                const bg =
                  team === 'A' ? 'rgba(47,107,255,0.2)' :
                  team === 'B' ? 'rgba(255,210,63,0.2)' :
                  palette.navySoft;
                const border =
                  team === 'A' ? palette.electricBlue :
                  team === 'B' ? palette.pingYellow :
                  palette.cardBorder;
                const textColor =
                  team === 'A' ? palette.electricBlue :
                  team === 'B' ? palette.pingYellow :
                  palette.coolGray;

                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.chip, { backgroundColor: bg, borderColor: border }]}
                    onPress={() => handleToggle(p.id, team)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, { color: textColor }]}>
                      {p.name}
                      {team ? ` · ${team === 'A' ? 'Éq.A' : 'Éq.B'}` : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Score */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SCORE</Text>
            <View style={styles.scoreRow}>
              <ScoreStepper value={scoreA} onChange={setScoreA} label="ÉQ. A" color={palette.electricBlue} />
              <Text style={styles.vs}>VS</Text>
              <ScoreStepper value={scoreB} onChange={setScoreB} label="ÉQ. B" color={palette.pingYellow} />
            </View>

            {scoreA === scoreB && (scoreA > 0 || scoreB > 0) && (
              <Text style={styles.noTie}>Match nul non autorisé</Text>
            )}
            {isValid && (
              <Text style={[styles.winner, { color: scoreA > scoreB ? palette.electricBlue : palette.pingYellow }]}>
                Vainqueur : {scoreA > scoreB ? 'Équipe A' : 'Équipe B'}
              </Text>
            )}
          </View>
        </ScrollView>

        {/* Submit bar */}
        <View style={styles.submitBar}>
          <PButton
            variant="accent"
            size="lg"
            full
            loading={submitting}
            disabled={!isValid}
            onPress={handleSubmit}
          >
            Enregistrer le match
          </PButton>
        </View>
      </KeyboardAvoidingView>
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
  title: { ...typography.pageTitle, color: palette.white },
  hint: { fontSize: 12, color: palette.coolGray, lineHeight: 17 },
  section: { gap: spacing.sm },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: palette.coolGray,
    textTransform: 'uppercase',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    backgroundColor: palette.navySoft,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  stepper: { alignItems: 'center', gap: spacing.sm },
  stepperLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.navySoft,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    fontSize: 36,
    fontWeight: '800',
    color: palette.white,
    minWidth: 40,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  vs: { fontSize: 16, fontWeight: '800', color: palette.coolGray },
  noTie: { fontSize: 11, color: palette.signalRed, textAlign: 'center', fontWeight: '600' },
  winner: { fontSize: 12, fontWeight: '800', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 },
  submitBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: palette.navy,
    borderTopWidth: 1,
    borderColor: palette.cardBorder,
    paddingHorizontal: spacing.page,
    paddingVertical: spacing.md,
  },
});
