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

// Stripe session IDs are typed `cs_test_...` / `cs_live_...` — accept a generic
// shape with a tight upper bound to prevent abuse.
const RequestBody = z.object({
  sessionId: z.string().min(8).max(256),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  // 1. Parse + validate body
  let payload: z.infer<typeof RequestBody>;
  try {
    payload = RequestBody.parse(await req.json());
  } catch (err) {
    return jsonResponse(400, {
      error: 'Invalid request body',
      details: err instanceof z.ZodError ? err.issues : undefined,
    });
  }

  // 2. Stripe init
  const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY') || '';
  if (!stripeSecret) {
    console.error('verify-payment-session: STRIPE_SECRET_KEY missing');
    return jsonResponse(500, { error: 'Server misconfigured' });
  }
  const stripe = new Stripe(stripeSecret, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
  });

  // 3. Retrieve session from Stripe
  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(payload.sessionId, {
      expand: ['payment_intent', 'customer'],
    });
  } catch (err) {
    console.error('verify-payment-session: Stripe retrieve error:', err);
    return jsonResponse(404, { error: 'Session not found' });
  }

  const success = session.payment_status === 'paid';
  const metadata = session.metadata ?? {};
  const sessionUserId =
    typeof metadata.user_id === 'string' ? metadata.user_id : null;
  const sessionAnonId =
    typeof metadata.anonymous_user_id === 'string'
      ? metadata.anonymous_user_id
      : null;

  // 4. If the caller carries a JWT, verify they own the session.
  //    Anonymous flow (no JWT) is allowed but bound to the anonymous_user_id
  //    embedded in the Stripe metadata (signed by the create-checkout-session
  //    flow which already vetted that id).
  const authHeader = req.headers.get('Authorization') || '';
  const jwt = authHeader.replace(/^Bearer\s+/i, '');
  let callerUserId: string | null = null;
  if (jwt) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    if (supabaseUrl && anonKey) {
      const supabase = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: `Bearer ${jwt}` } },
      });
      const { data, error } = await supabase.auth.getUser(jwt);
      if (!error && data.user) {
        callerUserId = data.user.id;
        if (sessionUserId && callerUserId !== sessionUserId) {
          return jsonResponse(403, {
            error: 'Session does not belong to the caller',
          });
        }
      }
    }
  }

  // 5. If the payment is confirmed, mark the user premium in our DB via the
  //    SECURITY DEFINER RPC (mig 031). Idempotent.
  let premiumUpdated = false;
  if (success && (sessionUserId || sessionAnonId)) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (supabaseUrl && serviceKey) {
      const admin = createClient(supabaseUrl, serviceKey);
      const targetUserId = sessionUserId ?? sessionAnonId;
      const { error: rpcErr } = await admin.rpc('mark_user_premium', {
        p_user_id: targetUserId,
      });
      if (rpcErr) {
        console.error('verify-payment-session: mark_user_premium failed:', rpcErr);
        // Don't leak the underlying error to the client.
      } else {
        premiumUpdated = true;
      }
    }
  }

  return jsonResponse(200, {
    success,
    paymentStatus: session.payment_status,
    premiumUpdated,
    // Return metadata only when the caller is the legitimate owner. Anonymous
    // callers without a JWT only get the boolean status. This prevents
    // session-id enumeration from leaking customer/metadata to strangers.
    metadata: callerUserId ? metadata : undefined,
    customerId: callerUserId ? session.customer : undefined,
  });
});
