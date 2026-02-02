import { loadStripe, Stripe } from '@stripe/stripe-js';

/**
 * Stripe Service for handling payment integration
 * Story 7.3: Stripe Payment Integration
 */

let stripePromise: Promise<Stripe | null>;

/**
 * Initialize Stripe with publishable key
 * Call this once at app startup or lazily when needed
 */
export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    
    if (!publishableKey) {
      console.error('Stripe publishable key not found in environment variables');
      return Promise.resolve(null);
    }
    
    stripePromise = loadStripe(publishableKey);
  }
  
  return stripePromise;
};

/**
 * Create a Stripe Checkout session for premium purchase
 * 
 * @param userId - Authenticated user ID (if logged in)
 * @param anonymousUserId - Anonymous user ID (if not logged in)
 * @returns Checkout session URL to redirect to
 */
export const createCheckoutSession = async (
  userId: string | null,
  anonymousUserId: string | null
): Promise<{ url: string; sessionId: string } | null> => {
  try {
    // TODO: Call Supabase Edge Function to create checkout session
    // This needs to be server-side to keep secret key secure
    
    // For now, we'll use a direct API call (NOT PRODUCTION READY)
    // In production, this should call a Supabase Edge Function or backend endpoint
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLIC_KEY}`,
      },
      body: JSON.stringify({
        userId,
        anonymousUserId,
        priceId: import.meta.env.VITE_STRIPE_PREMIUM_PRICE_ID || 'price_default',
        successUrl: `${window.location.origin}/payment-success`,
        cancelUrl: `${window.location.origin}/payment-cancel`,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    const data = await response.json();
    return {
      url: data.url,
      sessionId: data.sessionId,
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return null;
  }
};

/**
 * Verify a payment session after redirect
 * 
 * @param sessionId - Stripe checkout session ID
 * @returns Payment status
 */
export const verifyPaymentSession = async (
  sessionId: string
): Promise<{ success: boolean; customerId?: string }> => {
  try {
    // TODO: Call Supabase Edge Function to verify session
    // This must be server-side to securely verify with Stripe
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-payment-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLIC_KEY}`,
      },
      body: JSON.stringify({ sessionId }),
    });

    if (!response.ok) {
      throw new Error('Failed to verify payment session');
    }

    const data = await response.json();
    return {
      success: data.success,
      customerId: data.customerId,
    };
  } catch (error) {
    console.error('Error verifying payment session:', error);
    return { success: false };
  }
};

/**
 * Check if Stripe is properly configured
 */
export const isStripeConfigured = (): boolean => {
  return !!(
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY &&
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_PUBLIC_KEY
  );
};

export const stripeService = {
  getStripe,
  createCheckoutSession,
  verifyPaymentSession,
  isStripeConfigured,
};
