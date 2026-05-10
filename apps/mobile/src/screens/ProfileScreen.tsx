/**
 * ProfileScreen — user profile with identity-aware state
 */

import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthContext, useIdentityContext } from '@elofight/shared';
import { palette, spacing, radius, typography } from '../theme/tokens';
import { PAvatar } from '../components/ponglo/PAvatar';
import { StatCard } from '../components/ponglo/StatCard';

type RootStackParams = { Auth: undefined };

export function ProfileScreen() {
  const { user, isAuthenticated, userProfile, signOut } = useAuthContext();
  const { localUser } = useIdentityContext();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParams>>();

  const displayName =
    userProfile?.pseudo ??
    user?.email?.split('@')[0] ??
    localUser?.pseudo ??
    'Joueur';

  const handleSignOut = async () => {
    await signOut();
  };

  const handleSignIn = () => {
    navigation.navigate('Auth');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <PAvatar name={displayName} size={64} ring={palette.electricBlue} />
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{displayName}</Text>
            {isAuthenticated && user?.email ? (
              <Text style={styles.email}>{user.email}</Text>
            ) : (
              <View style={styles.anonBadge}>
                <Text style={styles.anonBadgeText}>Compte anonyme</Text>
              </View>
            )}
          </View>
        </View>

        {/* Lifetime stats — placeholder until ported from web */}
        <View style={styles.statsRow}>
          <StatCard label="Matchs" value="—" sub="Bientôt" compact />
          <StatCard label="Win rate" value="—" sub="Bientôt" compact />
          <StatCard label="Série" value="—" sub="Bientôt" compact />
        </View>

        {/* CTA depending on auth state */}
        {!isAuthenticated ? (
          <View style={styles.ctaCard}>
            <Text style={styles.ctaTitle}>Sauvegardez votre profil</Text>
            <Text style={styles.ctaDesc}>
              Connectez-vous pour synchroniser vos stats sur tous vos appareils.
            </Text>
            <TouchableOpacity style={styles.ctaButton} onPress={handleSignIn} activeOpacity={0.8}>
              <Text style={styles.ctaButtonText}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.signOut} onPress={handleSignOut} activeOpacity={0.7}>
            <Text style={styles.signOutText}>Se déconnecter</Text>
          </TouchableOpacity>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerInfo: { flex: 1, gap: spacing.xs },
  name: {
    fontSize: 18, fontWeight: '800', color: palette.white,
    textTransform: 'uppercase', letterSpacing: -0.3,
  },
  email: { fontSize: 12, color: palette.coolGray },
  anonBadge: {
    backgroundColor: palette.navySoft,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  anonBadgeText: { fontSize: 10, color: palette.coolGray, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  ctaCard: {
    backgroundColor: palette.navySoft,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.electricBlue,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  ctaTitle: { fontSize: 15, fontWeight: '800', color: palette.white },
  ctaDesc: { fontSize: 13, color: palette.coolGray, lineHeight: 18 },
  ctaButton: {
    backgroundColor: palette.electricBlue,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  ctaButtonText: { fontSize: 14, fontWeight: '700', color: palette.white },
  signOut: {
    backgroundColor: palette.navySoft,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: palette.signalRed,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 13, fontWeight: '700', color: palette.signalRed,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
});
