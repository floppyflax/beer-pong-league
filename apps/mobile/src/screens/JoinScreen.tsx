/**
 * JoinScreen — QR scanner + manual code entry (Phase C.2)
 */

import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius, typography } from '../theme/tokens';
import { PButton } from '../components/ponglo/PButton';

type Mode = 'qr' | 'manual';

export function JoinScreen() {
  const [mode, setMode] = useState<Mode>('qr');
  const [code, setCode] = useState('');

  const handleJoin = () => {
    if (!code.trim()) return;
    // TODO: navigate to tournament/league by code
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Text style={styles.title}>Rejoindre</Text>
        <Text style={styles.subtitle}>
          Scannez un QR code ou saisissez le code manuellement
        </Text>

        {/* Mode toggle */}
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeTab, mode === 'qr' && styles.modeTabActive]}
            onPress={() => setMode('qr')}
          >
            <Text style={[styles.modeLabel, mode === 'qr' && styles.modeLabelActive]}>
              QR Code
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeTab, mode === 'manual' && styles.modeTabActive]}
            onPress={() => setMode('manual')}
          >
            <Text style={[styles.modeLabel, mode === 'manual' && styles.modeLabelActive]}>
              Code manuel
            </Text>
          </TouchableOpacity>
        </View>

        {mode === 'qr' ? (
          /* QR Scanner placeholder */
          <View style={styles.qrBox}>
            <View style={styles.qrFrame}>
              <Ionicons name="qr-code-outline" size={80} color={palette.coolGray} />
              <View style={[styles.qrCorner, styles.qrTL]} />
              <View style={[styles.qrCorner, styles.qrTR]} />
              <View style={[styles.qrCorner, styles.qrBL]} />
              <View style={[styles.qrCorner, styles.qrBR]} />
            </View>
            <Text style={styles.qrHint}>Pointez vers le QR code du tournoi ou de la ligue</Text>
            <PButton variant="accent" size="lg" full onPress={() => {}}>
              Activer la caméra
            </PButton>
          </View>
        ) : (
          /* Manual entry */
          <View style={styles.manualBox}>
            <Text style={styles.inputLabel}>CODE D'INVITATION</Text>
            <TextInput
              style={styles.input}
              value={code}
              onChangeText={setCode}
              placeholder="ex: ABC123"
              placeholderTextColor={palette.coolGray}
              autoCapitalize="characters"
              maxLength={8}
              returnKeyType="go"
              onSubmitEditing={handleJoin}
            />
            <PButton
              variant="accent"
              size="lg"
              full
              disabled={!code.trim()}
              onPress={handleJoin}
            >
              Rejoindre
            </PButton>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: palette.navy,
  },
  content: {
    paddingHorizontal: spacing.page,
    paddingTop: spacing.lg,
    paddingBottom: 100,
    gap: spacing.lg,
  },
  title: {
    ...typography.pageTitle,
    color: palette.white,
  },
  subtitle: {
    fontSize: 13,
    color: palette.coolGray,
    lineHeight: 18,
  },
  modeRow: {
    flexDirection: 'row',
    backgroundColor: palette.navySoft,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    padding: 4,
    gap: 4,
  },
  modeTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  modeTabActive: {
    backgroundColor: palette.electricBlue,
  },
  modeLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: palette.coolGray,
  },
  modeLabelActive: {
    color: palette.white,
  },
  qrBox: {
    gap: spacing.lg,
    alignItems: 'center',
  },
  qrFrame: {
    width: 200,
    height: 200,
    backgroundColor: palette.navySoft,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  qrCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: palette.electricBlue,
  },
  qrTL: { top: 12, left: 12, borderTopWidth: 3, borderLeftWidth: 3 },
  qrTR: { top: 12, right: 12, borderTopWidth: 3, borderRightWidth: 3 },
  qrBL: { bottom: 12, left: 12, borderBottomWidth: 3, borderLeftWidth: 3 },
  qrBR: { bottom: 12, right: 12, borderBottomWidth: 3, borderRightWidth: 3 },
  qrHint: {
    fontSize: 13,
    color: palette.coolGray,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.lg,
  },
  manualBox: {
    gap: spacing.md,
  },
  inputLabel: {
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
    fontSize: 22,
    fontWeight: '800',
    color: palette.white,
    letterSpacing: 4,
    textAlign: 'center',
  },
});
