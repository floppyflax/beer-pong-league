/**
 * CreateLeagueScreen — create a new league (Phase C.3)
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

type LeagueType = 'season' | 'event' | 'permanent';

export function CreateLeagueScreen() {
  const [name, setName] = useState('');
  const [type, setType] = useState<LeagueType>('season');
  const [loading, setLoading] = useState(false);

  const isValid = name.trim().length >= 2;

  const handleCreate = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      // TODO: call context/service to create league
    } finally {
      setLoading(false);
    }
  };

  const types: { value: LeagueType; label: string; icon: string; desc: string }[] = [
    { value: 'season',    label: 'Par Saison', icon: '📅', desc: 'Saison avec début et fin définis' },
    { value: 'event',     label: 'Événement',  icon: '🏆', desc: 'Tournoi ponctuel à durée limitée' },
    { value: 'permanent', label: 'Permanent',  icon: '∞',  desc: 'Ligue continue sans date de fin' },
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
          <Text style={styles.title}>Nouvelle Ligue</Text>

          {/* Name */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>NOM DE LA LIGUE</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="ex: Ligue des Pingouins"
              placeholderTextColor={palette.coolGray}
              maxLength={50}
              returnKeyType="next"
            />
          </View>

          {/* Type */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>TYPE</Text>
            <View style={styles.typeGrid}>
              {types.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[
                    styles.typeCard,
                    type === t.value && styles.typeCardActive,
                  ]}
                  onPress={() => setType(t.value)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.typeIcon}>{t.icon}</Text>
                  <Text style={[styles.typeLabel, type === t.value && styles.typeLabelActive]}>
                    {t.label}
                  </Text>
                  <Text style={styles.typeDesc}>{t.desc}</Text>
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
            Créer la ligue
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
  typeGrid: { gap: spacing.sm },
  typeCard: {
    backgroundColor: palette.navySoft,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    padding: spacing.md,
    gap: spacing.xs,
  },
  typeCardActive: { borderColor: palette.electricBlue, backgroundColor: 'rgba(47,107,255,0.08)' },
  typeIcon: { fontSize: 20 },
  typeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.coolGray,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  typeLabelActive: { color: palette.white },
  typeDesc: { fontSize: 11, color: palette.coolGray, lineHeight: 15 },
});
