import type { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Beer Pong ELO',
  slug: 'elofight',
  extra: {
    supabaseUrl:              process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabasePublicKey:        process.env.EXPO_PUBLIC_SUPABASE_PUBLIC_KEY,
    stripePublishableKey:     process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    stripePremiumPriceId:     process.env.EXPO_PUBLIC_STRIPE_PREMIUM_PRICE_ID,
    eas: { projectId: process.env.EAS_PROJECT_ID },
  },
});
