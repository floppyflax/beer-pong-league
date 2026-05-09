---
name: stripe-premium
description: Stripe checkout, premium entitlement logic, and the hardened edge functions for payments. Use when touching StripeService, PremiumService, create-checkout-session / verify-payment-session edge functions, or premium gating in the UI.
---

# Stripe & Premium — Beer Pong League

For the **generic edge function pattern** (Bearer auth, Zod, whitelist,
CORS), see [`edge-function`](../edge-function/SKILL.md) — this skill only
covers what's specific to Stripe + premium entitlement.

## Architecture (post audit-wave 1.2 hardening)

```
Client (StripeService)
    ↓ POST with Authorization: Bearer <user JWT>     ← (anon key fallback for anonymous users)
    ↓ apikey: <anon key>                              ← always
Supabase Edge Function (create-checkout-session)
    ↓ 1. Zod-validate payload (uuids, urls)
    ↓ 2. JWT.getUser → assert userId match    OR    admin.users.where(is_anonymous).maybeSingle()
    ↓ 3. Whitelist priceId vs STRIPE_ALLOWED_PRICE_IDS
    ↓ 4. Stripe SDK (STRIPE_SECRET_KEY)
Stripe Checkout
    ↓ user pays, redirect success_url
Client (verify-payment-session)
    ↓ Edge Function verifies session + marks user premium
Supabase: users.is_premium = true (mig 022 unified anon and auth users)
```

The pre-hardening flow trusted `userId` and `priceId` from the body — a
malicious client could create sessions for anyone or substitute price IDs.
Audit wave 1.2 closed both gaps.

## Fichiers clés

- `apps/web/src/services/StripeService.ts` — lazy client init, sends the
  user JWT in `Authorization: Bearer …` (or anon key fallback for
  anonymous users), `createCheckoutSession`, `verifyPaymentSession`,
  `isStripeConfigured`.
- `apps/web/src/services/PremiumService.ts` — singleton, entitlement
  checks, localStorage fallback.
- `supabase/functions/create-checkout-session/index.ts` — hardened, see
  Architecture above. Canonical example for the [`edge-function`](../edge-function/SKILL.md) skill.
- `supabase/functions/verify-payment-session/index.ts` — vérification
  session + update DB. ⚠️ **Pas encore durci** côté JWT/Zod — à passer
  au pattern `edge-function` la prochaine fois qu'on touche.

## Règles d'entitlement

| Feature | Free | Premium |
|---|---|---|
| Events | 2 max | illimité |
| Joueurs par event | 6 max | illimité |
| Leagues | ❌ | ✅ |

Toute nouvelle gate **doit** passer par `PremiumService` (pas de check
inline). Le hook `usePremiumLimits` expose les flags (`canCreateEvent`,
`isAtEventLimit`, etc.) — l'utiliser plutôt que dériver de `usePremium`.

## Variables d'env

Client (Vite, exposées) :
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_STRIPE_PREMIUM_PRICE_ID`

Edge function (secrets, via `supabase secrets set`) :
- `STRIPE_SECRET_KEY` (`sk_live_*` ou `sk_test_*`)
- `STRIPE_PREMIUM_PRICE_ID` (default si client n'envoie rien)
- `STRIPE_ALLOWED_PRICE_IDS` (csv) — whitelist anti-substitution
- `STRIPE_WEBHOOK_SECRET` (si webhook ajouté un jour)

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` sont
auto-injectés par la plateforme — pas besoin de les `secrets set`.

## Checklist modifications Stripe

1. [ ] Jamais de `STRIPE_SECRET_KEY` côté client (test guard `no-hardcoded-tailwind-colors` + grep grepable).
2. [ ] Edge function déployée : `supabase functions deploy <name>`.
3. [ ] Si nouveau price : mettre à jour `VITE_STRIPE_PREMIUM_PRICE_ID`
   dans Vercel env + `.env.local` **ET** ajouter à `STRIPE_ALLOWED_PRICE_IDS`.
4. [ ] Tester en mode test Stripe (clé `pk_test_*`, `sk_test_*`) avant prod.
5. [ ] `PremiumService` refresh après retour de paiement (éviter cache stale).
6. [ ] Gérer le cas anonymous user : `is_premium` est sur `users` (mig 022
   a unifié anonymous_users dans users avec `is_anonymous=true`).

## Pour vérifier l'état du déploiement

```bash
supabase functions list
```

## Anti-patterns

- ❌ Faire confiance au `userId` du body sans JWT check — bug fixé en wave 1.2, ne pas y revenir.
- ❌ Faire confiance au `priceId` du body sans whitelist.
- ❌ Renvoyer `error.message` du Stripe SDK verbatim au client (leak d'internals).
- ❌ Marquer `is_premium=true` côté client en optimiste sans webhook ou
  verify-payment-session — la source de vérité doit toujours être la DB
  après une vérification serveur.
