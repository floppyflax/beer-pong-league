/**
 * MobileStripeRedirector — open Stripe Checkout in in-app browser,
 * then verify the session when the user returns via deep link.
 */

import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { createCheckoutSession, verifyPaymentSession } from '@elofight/shared';

export interface StripeRedirectResult {
  success: boolean;
  error?: string;
}

export async function startStripeCheckout(
  userId: string,
  anonymousUserId: string | null,
): Promise<StripeRedirectResult> {
  const successUrl = Linking.createURL('payment-success');
  const cancelUrl  = Linking.createURL('payment-cancel');

  const sessionResult = await createCheckoutSession(userId, anonymousUserId);

  if (!sessionResult?.url) {
    return { success: false, error: 'Impossible de créer la session de paiement.' };
  }

  const browserResult = await WebBrowser.openAuthSessionAsync(
    sessionResult.url,
    successUrl,
  );

  if (browserResult.type !== 'success') {
    return { success: false, error: 'Paiement annulé.' };
  }

  const parsed = Linking.parse(browserResult.url);
  const sessionId = parsed.queryParams?.session_id as string | undefined;

  if (!sessionId) {
    return { success: false, error: 'Session de paiement introuvable.' };
  }

  const verified = await verifyPaymentSession(sessionId);
  if (!verified.success) {
    return { success: false, error: 'Impossible de vérifier le paiement.' };
  }

  return { success: true };
}
