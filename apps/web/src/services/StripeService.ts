/**
 * Re-export of platform-agnostic Stripe helpers from shared.
 * `getStripe()` (web-only, loads @stripe/stripe-js) is kept here.
 */
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { getEnv, hasEnv } from '@elofight/shared';

export { createCheckoutSession, verifyPaymentSession, isStripeConfigured, stripeService } from '@elofight/shared/services/StripeService';

let stripePromise: Promise<Stripe | null>;

export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    const publishableKey = hasEnv() ? getEnv().stripe?.publishableKey : undefined;
    if (!publishableKey) {
      console.error('Stripe publishable key not found');
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};
