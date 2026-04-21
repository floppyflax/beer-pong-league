---
name: stripe-premium
description: Stripe checkout, premium entitlement logic, and Supabase edge functions for payments. Use when touching StripeService, PremiumService, checkout/verify edge functions, or premium gating in the UI.
---

# Stripe & Premium — Beer Pong League

## Architecture

```
Client (StripeService)
    ↓ POST with anon key
Supabase Edge Function (create-checkout-session)
    ↓ Stripe SDK (STRIPE_SECRET_KEY)
Stripe Checkout
    ↓ user pays, redirect success_url
Client (verify-payment-session)
    ↓ Edge Function verifies session + marks user premium
Supabase: users.is_premium = true (or anonymous_users.is_premium)
```

## Fichiers clés

- `src/services/StripeService.ts` — lazy client init, `createCheckoutSession`, `verifyPaymentSession`, `isStripeConfigured`
- `src/services/PremiumService.ts` — singleton, entitlement checks, localStorage fallback
- `supabase/functions/create-checkout-session/index.ts` — Deno, Stripe SDK server-side
- `supabase/functions/verify-payment-session/index.ts` — vérification session + update DB

## Règles d'entitlement

| Feature | Free | Premium |
|---|---|---|
| Tournaments | 2 max | illimité |
| Joueurs par tournoi | 6 max | illimité |
| Leagues | ❌ | ✅ |

Toute nouvelle gate **doit** passer par `PremiumService` (pas de check inline).

## Variables d'env

Client (Vite, exposées) :
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_STRIPE_PREMIUM_PRICE_ID`

Edge function (secrètes) :
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET` (si webhook ajouté)

## Checklist modifications Stripe

1. [ ] Jamais de `STRIPE_SECRET_KEY` côté client.
2. [ ] Edge function déployée : `npx supabase functions deploy <name>`.
3. [ ] Si nouveau price : mettre à jour `VITE_STRIPE_PREMIUM_PRICE_ID` dans Vercel env + `.env.local`.
4. [ ] Tester en mode test Stripe (clé `pk_test_*`, `sk_test_*`) avant prod.
5. [ ] `PremiumService` refresh après retour de paiement (éviter cache stale).
6. [ ] Gérer le cas anonymous_user : le flag `is_premium` est sur `anonymous_users` tant que pas mergé.

## Pour vérifier l'état du déploiement

```bash
npx supabase functions list
```
