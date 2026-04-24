/**
 * CreateEventScreen — create a new tournament/event (Phase C.3)
 * Renamed from CreateTournamentScreen to align with "Event" terminology.
 */

import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette, spacing, radius, typography } from '../theme/tokens';
import { PButton } from '../components/ponglo/PButton';

type Format = 'libre' | 'round-robin' | 'elimination';

export function CreateEventScreen() {
  const [name, setName] = useState('');
  const [format, setFormat] = useState<Format>('libre');
  const [teamSize, setTeamSize] = useState<1 | 2>(2);
  const [loading, setLoading] = useState(false);

  const isValid = name.trim().length >= 2;

  const handleCreate = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      // TODO: call context/service to create tournament
    } finally {
      setLoading(false);
    }
  };

  const formats: { value: Format; label: string; desc: string }[] = [
    { value: 'libre', label: 'Libre', desc: 'Matchs enregistrés sans structure' },
    { value: 'round-robin', label: 'Round Robin', desc: 'Chacun affronte tout le monde' },
    { value: 'elimination', label: 'Élimination', desc: 'Bracket à élimination directe' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Nouvel Événement</Text>

          {/* Name */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>NOM DE L'ÉVÉNEMENT</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="ex: Tournoi de printemps"
              placeholderTextColor={palette.coolGray}
              maxLength={50}
              returnKeyType="next"
            />
          </View>

          {/* Format */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>FORMAT</Text>
            <View style={styles.optionsList}>
              {formats.map((f) => (
                <TouchableOpacity
                  key={f.value}
                  style={[
                    styles.option,
                    format === f.value && styles.optionActive,
                  ]}
                  onPress={() => setFormat(f.value)}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionRow}>
                    <View
                      style={[
                        styles.radio,
                        format === f.value && styles.radioActive,
                      ]}
                    />
                    <View style={styles.optionText}>
                      <Text style={[styles.optionLabel, format === f.value && styles.optionLabelActive]}>
                        {f.label}
                      </Text>
                      <Text style={styles.optionDesc}>{f.desc}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Team size */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>TAILLE DES ÉQUIPES</Text>
            <View style={styles.teamSizeRow}>
              {([1, 2] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.sizeBtn,
                    teamSize === s && styles.sizeBtnActive,
                  ]}
                  onPress={() => setTeamSize(s)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.sizeBtnText, teamSize === s && styles.sizeBtnTextActive]}>
                    {s} vs {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Submit */}
          <PButton
            variant="primary"
            size="lg"
            full
            loading={loading}
            disabled={!isValid}
            onPress={handleCreate}
          >
            Créer l'événement
          </PButton>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.navy },
  kav: { flex: 1 },
  content: {
    paddingHorizontal: spacing.page,
    paddingTop: spacing.lg,
    paddingBottom: 60,
    gap: spacing.lg,
  },
  title: { ...typography.pageTitle, color: palette.white },
  field: { gap: spacing.xs },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: palette.coolGray,
  },
  input: {
    backgroundColor: palette.navySoft,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    fontSize: 15,
    color: palette.white,
  },
  optionsList: { gap: spacing.sm },
  option: {
    backgroundColor: palette.navySoft,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    padding: spacing.md,
  },
  optionActive: { borderColor: palette.electricBlue },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: palette.coolGray,
  },
  radioActive: { borderColor: palette.electricBlue, backgroundColor: palette.electricBlue },
  optionText: { flex: 1, gap: 2 },
  optionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.coolGray,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  optionLabelActive: { color: palette.white },
  optionDesc: { fontSize: 11, color: palette.coolGray },
  teamSizeRow: { flexDirection: 'row', gap: spacing.sm },
  sizeBtn: {
    flex: 1,
    backgroundColor: palette.navySoft,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  sizeBtnActive: { borderColor: palette.electricBlue, backgroundColor: 'rgba(47,107,255,0.12)' },
  sizeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.coolGray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sizeBtnTextActive: { color: palette.electricBlue },
});
