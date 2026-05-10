/**
 * Mobile shared-runtime bootstrap.
 *
 * Called once from App.tsx (after the polyfill in index.ts). Reads
 * EXPO_PUBLIC_* env vars exposed via app.config.ts, builds platform
 * URLs around the `elofight://` deep-link scheme, and injects the
 * AsyncStorage KV adapter into shared.
 */

import { initShared } from '@elofight/shared';
import { asyncStorageKV } from './storage';

const APP_SCHEME = 'elofight://';

export function bootstrapShared(): void {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  const supabasePublicKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLIC_KEY ?? '';
  const stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const stripePremiumPriceId = process.env.EXPO_PUBLIC_STRIPE_PREMIUM_PRICE_ID;

  initShared({
    supabaseUrl,
    supabasePublicKey,
    isDev: __DEV__,
    stripe:
      stripePublishableKey && stripePremiumPriceId
        ? {
            publishableKey: stripePublishableKey,
            premiumPriceId: stripePremiumPriceId,
          }
        : null,
    urls: {
      authCallback: `${APP_SCHEME}auth/callback`,
      paymentSuccess: `${APP_SCHEME}payment-success`,
      paymentCancel: `${APP_SCHEME}payment-cancel`,
    },
    storage: asyncStorageKV,
    detectSessionInUrl: false,
  });
}
