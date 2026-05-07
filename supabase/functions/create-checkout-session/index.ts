import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { z } from 'https://esm.sh/zod@4.3.6';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const RequestBody = z
  .object({
    userId: z.string().uuid().nullable().optional(),
    anonymousUserId: z.string().uuid().nullable().optional(),
    priceId: z.string().min(1).optional(),
    successUrl: z.string().url().optional(),
    cancelUrl: z.string().url().optional(),
  })
  .refine((b) => Boolean(b.userId) || Boolean(b.anonymousUserId), {
    message: 'userId or anonymousUserId required',
  });

const allowedPriceIds = (Deno.env.get('STRIPE_ALLOWED_PRICE_IDS') || '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);

const defaultPriceId = Deno.env.get('STRIPE_PREMIUM_PRICE_ID') || '';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  let payload: z.infer<typeof RequestBody>;
  try {
    payload = RequestBody.parse(await req.json());
  } catch (err) {
    return jsonResponse(400, {
      error: 'Invalid request body',
      details: err instanceof z.ZodError ? err.issues : undefined,
    });
  }

  const priceId = payload.priceId || defaultPriceId;
  if (!priceId) {
    return jsonResponse(400, { error: 'priceId required' });
  }
  if (allowedPriceIds.length > 0 && !allowedPriceIds.includes(priceId)) {
    return jsonResponse(403, { error: 'priceId not allowed' });
  }

  // If a userId is claimed, verify the caller's JWT proves ownership of it.
  // Anonymous users skip this check (their flow has no JWT yet) but the
  // anonymous_users row is verified to exist below.
  if (payload.userId) {
    const authHeader = req.headers.get('Authorization') || '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    if (!supabaseUrl || !anonKey || !jwt) {
      return jsonResponse(401, { error: 'Authentication required' });
    }
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { data, error } = await supabase.auth.getUser(jwt);
    if (error || !data.user || data.user.id !== payload.userId) {
      return jsonResponse(401, { error: 'Invalid session for userId' });
    }
  } else if (payload.anonymousUserId) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (!supabaseUrl || !serviceKey) {
      return jsonResponse(500, { error: 'Server misconfigured' });
    }
    const admin = createClient(supabaseUrl, serviceKey);
    const { data, error } = await admin
      .from('anonymous_users')
      .select('id')
      .eq('id', payload.anonymousUserId)
      .maybeSingle();
    if (error || !data) {
      return jsonResponse(404, { error: 'Anonymous user not found' });
    }
  }

  const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY') || '';
  if (!stripeSecret) {
    return jsonResponse(500, { error: 'Server misconfigured' });
  }

  const stripe = new Stripe(stripeSecret, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
  });

  const metadata: Record<string, string> = { source: 'beer-pong-league' };
  if (payload.userId) metadata.user_id = payload.userId;
  if (payload.anonymousUserId)
    metadata.anonymous_user_id = payload.anonymousUserId;

  const origin = req.headers.get('origin') || '';
  const successUrl =
    payload.successUrl ||
    `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = payload.cancelUrl || `${origin}/payment-cancel`;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
      customer_creation: 'always',
    });

    return jsonResponse(200, { url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return jsonResponse(500, { error: 'Checkout creation failed' });
  }
});
