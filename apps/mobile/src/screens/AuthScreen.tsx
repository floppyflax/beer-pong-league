/**
 * AuthScreen — OTP / anonymous auth (Phase C.2)
 */

import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette, spacing, radius, typography } from '../theme/tokens';
import { PButton } from '../components/ponglo/PButton';

type Step = 'email' | 'otp';

interface AuthScreenProps {
  onSuccess?: () => void;
}

export function AuthScreen({ onSuccess }: AuthScreenProps) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      // TODO: call supabase signInWithOTP
      setStep('otp');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length < 6) return;
    setLoading(true);
    try {
      // TODO: call supabase verifyOtp
      onSuccess?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo / title */}
          <View style={styles.hero}>
            <Text style={styles.wordmark}>🏓 Beer Pong</Text>
            <Text style={styles.wordmarkAccent}>ELO</Text>
            <Text style={styles.tagline}>Votre ligue, votre classement.</Text>
          </View>

          {step === 'email' ? (
            <View style={styles.form}>
              <Text style={styles.formTitle}>Connexion</Text>
              <Text style={styles.formDesc}>
                Entrez votre email pour recevoir un code de connexion.
              </Text>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>EMAIL</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="vous@exemple.fr"
                  placeholderTextColor={palette.coolGray}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  returnKeyType="next"
                  onSubmitEditing={handleSendOTP}
                />
              </View>

              <PButton
                variant="accent"
                size="lg"
                full
                loading={loading}
                disabled={!email.trim()}
                onPress={handleSendOTP}
              >
                Envoyer le code
              </PButton>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>ou</Text>
                <View style={styles.dividerLine} />
              </View>

              <PButton variant="ghost" size="md" full onPress={onSuccess}>
                Continuer sans compte
              </PButton>
            </View>
          ) : (
            <View style={styles.form}>
              <Text style={styles.formTitle}>Vérification</Text>
              <Text style={styles.formDesc}>
                Un code à 6 chiffres a été envoyé à{' '}
                <Text style={{ color: palette.electricBlue }}>{email}</Text>
              </Text>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>CODE OTP</Text>
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="000000"
                  placeholderTextColor={palette.coolGray}
                  keyboardType="number-pad"
                  maxLength={6}
                  returnKeyType="go"
                  onSubmitEditing={handleVerifyOTP}
                />
              </View>

              <PButton
                variant="accent"
                size="lg"
                full
                loading={loading}
                disabled={otp.length < 6}
                onPress={handleVerifyOTP}
              >
                Vérifier
              </PButton>

              <PButton
                variant="ghost"
                size="sm"
                full
                onPress={() => { setStep('email'); setOtp(''); }}
              >
                ← Changer l'email
              </PButton>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: palette.navy,
  },
  kav: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.page,
    paddingTop: spacing['3xl'],
    paddingBottom: 60,
    gap: spacing['2xl'],
  },
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  wordmark: {
    fontSize: 32,
    fontWeight: '800',
    color: palette.white,
    letterSpacing: -1,
  },
  wordmarkAccent: {
    fontSize: 32,
    fontWeight: '800',
    color: palette.electricBlue,
    letterSpacing: -1,
    marginTop: -12,
  },
  tagline: {
    fontSize: 13,
    color: palette.coolGray,
    letterSpacing: 0.3,
    marginTop: spacing.xs,
  },
  form: {
    gap: spacing.md,
  },
  formTitle: {
    ...typography.pageTitle,
    color: palette.white,
  },
  formDesc: {
    fontSize: 13,
    color: palette.coolGray,
    lineHeight: 18,
  },
  field: {
    gap: spacing.xs,
  },
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
  otpInput: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 8,
    textAlign: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: palette.cardBorder,
  },
  dividerText: {
    fontSize: 11,
    color: palette.coolGray,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
