---
name: edge-function
description: Create or harden a Supabase edge function for this project — Deno + Stripe / Supabase SDK, Bearer JWT auth, Zod payload validation, env-var whitelist, CORS preflight. Trigger on requests touching supabase/functions/* or "create edge function" / "harden edge function".
---

# Edge functions — Beer Pong League

Generic skill for any new edge function. The **Stripe-specific entitlement
flow** lives in the [`stripe-premium`](../stripe-premium/SKILL.md) skill —
read both when touching `create-checkout-session` or `verify-payment-session`.

## Skeleton — copy this for new functions

```ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3.23.8';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// 1. Payload schema — validate everything that comes from the client.
const PayloadSchema = z.object({
  userId: z.string().uuid().nullable().optional(),
  anonymousUserId: z.string().uuid().nullable().optional(),
  // ... feature-specific fields, all narrowly typed
}).refine(
  (p) => Boolean(p.userId) !== Boolean(p.anonymousUserId),
  { message: 'Provide exactly one of userId / anonymousUserId' },
);

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // 2. Validate payload
    const raw = await req.json();
    const parsed = PayloadSchema.safeParse(raw);
    if (!parsed.success) {
      return json({ error: 'Invalid payload', details: parsed.error.flatten() }, 400);
    }
    const { userId, anonymousUserId /* ... */ } = parsed.data;

    // 3. Identity check
    if (userId) {
      // Auth user: verify the JWT really belongs to that userId.
      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return json({ error: 'Missing Bearer token for authenticated request' }, 401);
      }
      const jwt = authHeader.slice('Bearer '.length);
      const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${jwt}` } },
      });
      const { data, error } = await userClient.auth.getUser();
      if (error || data.user?.id !== userId) {
        return json({ error: 'JWT does not match userId' }, 403);
      }
    } else if (anonymousUserId) {
      // Anonymous user: just verify the row exists in `users` (mig 022 unified anon into users).
      const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data, error } = await admin
        .from('users')
        .select('id, is_anonymous')
        .eq('id', anonymousUserId)
        .eq('is_anonymous', true)
        .maybeSingle();
      if (error || !data) return json({ error: 'Unknown anonymous user' }, 403);
    }

    // 4. Whitelist any client-supplied externally-meaningful id (priceId, etc.)
    //    via env var, parsed once at module top.
    //    e.g. const ALLOWED = (Deno.env.get('STRIPE_ALLOWED_PRICE_IDS') ?? '').split(',').filter(Boolean);

    // 5. Business logic — call the third-party SDK or DB with the SERVICE-ROLE
    //    client when you need to bypass RLS (e.g. write to a privileged table).

    return json({ ok: true /* result */ }, 200);
  } catch (err) {
    // 6. Never leak the internal error message to the client.
    console.error('edge-function failed:', err);
    return json({ error: 'Internal error' }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
```

## Auto-injected secrets (no need to set)

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — Supabase
populates these on every project's edge runtime. Don't redeclare in
`supabase secrets set`.

## Secrets you must set

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_…
supabase secrets set STRIPE_PREMIUM_PRICE_ID=price_…
supabase secrets set STRIPE_ALLOWED_PRICE_IDS=price_xxx,price_yyy   # csv whitelist
```

## Deploy

```bash
supabase functions deploy <name>
```

The `--no-verify-jwt` flag is **not** appropriate for new functions — we
authenticate via our own logic (step 3) and want the platform to keep its
default behaviour (function reachable from `apikey` only).

## Canonical example

`supabase/functions/create-checkout-session/index.ts` (post audit-wave-1)
implements the full pattern. Mirror it.

## Anti-patterns

- ❌ Trusting `userId` from the body without checking the JWT — that's the
  bug we fixed in audit wave 1.2.
- ❌ Accepting `priceId`, `webhookUrl`, anything externally meaningful from
  the client without whitelisting.
- ❌ Returning `error.message` from a Stripe / Supabase SDK error verbatim
  — leaks internals. Return a generic message + log the real error
  server-side.
- ❌ Setting CORS via `Access-Control-Allow-Origin: '*'` on functions that
  read user data — restrict to the deployed origin(s) once a stable list
  exists.
