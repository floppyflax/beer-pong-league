/**
 * StripeService — platform-agnostic Stripe session management.
 * Creates checkout sessions via the Supabase Edge Function and verifies them.
 * Platform-specific redirect (web: window.location / mobile: WebBrowser) is
 * handled by the caller.
 */

import { getSupabase } from '../lib/supabase';
import { getEnv, hasEnv } from '../runtime/env';

const resolveAnonKey = (): string => (hasEnv() ? getEnv().supabasePublicKey : '');
const resolveSupabaseUrl = (): string => (hasEnv() ? getEnv().supabaseUrl : '');

const resolveBearerToken = async (): Promise<string> => {
  const supabase = getSupabase();
  if (!supabase) return resolveAnonKey();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || resolveAnonKey();
};

export const createCheckoutSession = async (
  userId: string | null,
  anonymousUserId: string | null,
): Promise<{ url: string; sessionId: string } | null> => {
  const env = getEnv();
  try {
    const bearer = await resolveBearerToken();
    const response = await fetch(`${resolveSupabaseUrl()}/functions/v1/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bearer}`,
        apikey: resolveAnonKey(),
      },
      body: JSON.stringify({
        userId,
        anonymousUserId,
        priceId: env.stripe?.premiumPriceId ?? '',
        successUrl: env.urls.paymentSuccess,
        cancelUrl: env.urls.paymentCancel,
      }),
    });

    if (!response.ok) throw new Error('Failed to create checkout session');
    const data = await response.json();
    return { url: data.url, sessionId: data.sessionId };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return null;
  }
};

export const verifyPaymentSession = async (
  sessionId: string,
): Promise<{ success: boolean; customerId?: string }> => {
  try {
    const bearer = await resolveBearerToken();
    const response = await fetch(`${resolveSupabaseUrl()}/functions/v1/verify-payment-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bearer}`,
        apikey: resolveAnonKey(),
      },
      body: JSON.stringify({ sessionId }),
    });

    if (!response.ok) throw new Error('Failed to verify payment session');
    const data = await response.json();
    return { success: data.success, customerId: data.customerId };
  } catch (error) {
    console.error('Error verifying payment session:', error);
    return { success: false };
  }
};

export const isStripeConfigured = (): boolean => {
  if (!hasEnv()) return false;
  const env = getEnv();
  return !!(env.stripe?.publishableKey && env.supabaseUrl && env.supabasePublicKey);
};

export const stripeService = {
  createCheckoutSession,
  verifyPaymentSession,
  isStripeConfigured,
};
