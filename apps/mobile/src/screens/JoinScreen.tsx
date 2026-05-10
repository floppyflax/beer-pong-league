/**
 * JoinScreen — QR scanner + manual code entry
 */

import React, { useState, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { parseQRData } from '@elofight/shared';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { palette, spacing, radius, typography } from '../theme/tokens';
import { PButton } from '../components/ponglo/PButton';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Mode = 'qr' | 'manual';

const VALID_CODE_RE = /^[A-Z0-9]{6,8}$/i;

export function JoinScreen() {
  const navigation = useNavigation<Nav>();
  const [mode, setMode]           = useState<Mode>('qr');
  const [code, setCode]           = useState('');
  const [scanError, setScanError] = useState<string | null>(null);
  const scannedRef                = useRef(false);

  const [permission, requestPermission] = useCameraPermissions();

  const handleBarcode = (data: string) => {
    if (scannedRef.current) return;
    scannedRef.current = true;

    const result = parseQRData(data);

    if (result.type === 'tournament_url' && result.entityId) {
      navigation.navigate('EventDetail', { id: result.entityId });
    } else if (result.type === 'league_url' && result.entityId) {
      navigation.navigate('LeagueDetail', { id: result.entityId });
    } else if (result.type === 'code' && result.code) {
      setMode('manual');
      setCode(result.code);
    } else {
      setScanError('QR code non reconnu. Essayez le code manuel.');
      setTimeout(() => {
        scannedRef.current = false;
        setScanError(null);
      }, 2000);
    }
  };

  const handleJoin = () => {
    const trimmed = code.trim().toUpperCase();
    if (!VALID_CODE_RE.test(trimmed)) return;
    // TODO: resolve code via LeagueContext (pending extraction)
    // For now, this is a no-op placeholder
  };

  const handleModeSwitch = (next: Mode) => {
    setMode(next);
    scannedRef.current = false;
    setScanError(null);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Rejoindre</Text>
        <Text style={styles.subtitle}>
          Scannez un QR code ou saisissez le code manuellement
        </Text>

        {/* Mode toggle */}
        <View style={styles.modeRow}>
          {(['qr', 'manual'] as Mode[]).map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.modeTab, mode === m && styles.modeTabActive]}
              onPress={() => handleModeSwitch(m)}
            >
              <Text style={[styles.modeLabel, mode === m && styles.modeLabelActive]}>
                {m === 'qr' ? 'QR Code' : 'Code manuel'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {mode === 'qr' ? (
          <View style={styles.qrBox}>
            {!permission ? (
              <View style={styles.qrFrame}>
                <Text style={styles.permText}>Chargement…</Text>
              </View>
            ) : !permission.granted ? (
              <View style={styles.qrFrame}>
                <Text style={styles.permText}>
                  La caméra est requise pour scanner un QR code.
                </Text>
                <PButton variant="accent" size="md" full onPress={requestPermission}>
                  Autoriser la caméra
                </PButton>
              </View>
            ) : (
              <View style={styles.qrFrame}>
                <CameraView
                  style={styles.camera}
                  facing="back"
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                  onBarcodeScanned={(result) => handleBarcode(result.data)}
                />
                <View style={[styles.qrCorner, styles.qrTL]} />
                <View style={[styles.qrCorner, styles.qrTR]} />
                <View style={[styles.qrCorner, styles.qrBL]} />
                <View style={[styles.qrCorner, styles.qrBR]} />
              </View>
            )}

            {scanError ? (
              <Text style={styles.errorText}>{scanError}</Text>
            ) : (
              <Text style={styles.qrHint}>
                Pointez vers le QR code du tournoi ou de la ligue
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.manualBox}>
            <Text style={styles.inputLabel}>CODE D'INVITATION</Text>
            <TextInput
              style={styles.input}
              value={code}
              onChangeText={(t) => setCode(t.toUpperCase())}
              placeholder="ex: ABC123"
              placeholderTextColor={palette.coolGray}
              autoCapitalize="characters"
              maxLength={8}
              returnKeyType="go"
              onSubmitEditing={handleJoin}
              autoFocus={!!code}
            />
            {code.length > 0 && !VALID_CODE_RE.test(code) && (
              <Text style={styles.errorText}>Code invalide (6-8 caractères)</Text>
            )}
            <PButton
              variant="accent"
              size="lg"
              full
              disabled={!VALID_CODE_RE.test(code)}
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
  safe: { flex: 1, backgroundColor: palette.navy },
  content: {
    paddingHorizontal: spacing.page,
    paddingTop: spacing.lg,
    paddingBottom: 100,
    gap: spacing.lg,
  },
  title: { ...typography.pageTitle, color: palette.white },
  subtitle: { fontSize: 13, color: palette.coolGray, lineHeight: 18 },
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
  modeTabActive: { backgroundColor: palette.electricBlue },
  modeLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: palette.coolGray,
  },
  modeLabelActive: { color: palette.white },
  qrBox: { gap: spacing.md, alignItems: 'center' },
  qrFrame: {
    width: 260,
    height: 260,
    backgroundColor: palette.navySoft,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  camera: { ...StyleSheet.absoluteFillObject },
  permText: { fontSize: 13, color: palette.coolGray, textAlign: 'center', lineHeight: 18 },
  qrCorner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: palette.electricBlue,
  },
  qrTL: { top: 12, left: 12, borderTopWidth: 3, borderLeftWidth: 3 },
  qrTR: { top: 12, right: 12, borderTopWidth: 3, borderRightWidth: 3 },
  qrBL: { bottom: 12, left: 12, borderBottomWidth: 3, borderLeftWidth: 3 },
  qrBR: { bottom: 12, right: 12, borderBottomWidth: 3, borderRightWidth: 3 },
  qrHint: {
    fontSize: 13, color: palette.coolGray,
    textAlign: 'center', lineHeight: 18,
  },
  errorText: { fontSize: 13, color: palette.signalRed, textAlign: 'center' },
  manualBox: { gap: spacing.md },
  inputLabel: {
    fontSize: 10, fontWeight: '700',
    letterSpacing: 1, color: palette.coolGray,
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
