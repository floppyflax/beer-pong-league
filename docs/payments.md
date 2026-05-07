# Paiements Stripe

Le passage Premium utilise Stripe Checkout. Côté client, `@stripe/stripe-js` redirige vers la page hébergée par Stripe. Côté serveur, deux edge functions Supabase gèrent la création de session et la vérification du paiement.

## Architecture

```
Client (PaymentModal)
  → StripeService.createCheckoutSession()
  → Supabase Edge Function  create-checkout-session
  → Stripe Checkout (checkout.stripe.com)
  → redirect /payment-success?session_id=cs_test_...
  → StripeService.verifyPaymentSession()
  → Supabase Edge Function  verify-payment-session
  → Activation Premium côté app
```

En l'absence de clé Stripe configurée, l'app bascule sur un mode **simulation** (dev only) : faux délai puis activation Premium locale. Pratique pour itérer sur l'UX sans configurer Stripe.

## Variables d'environnement

### Client (`.env.local`)

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
VITE_STRIPE_PREMIUM_PRICE_ID=price_xxx
```

- Laisser vide pour forcer le mode simulation.
- Toujours utiliser les clés **test** (`pk_test_*`) hors production.

### Secrets Supabase (edge functions)

Configurer côté Supabase (Dashboard → Settings → Vault ou via CLI) :

```
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PREMIUM_PRICE_ID=price_xxx
STRIPE_ALLOWED_PRICE_IDS=price_xxx,price_yyy   # optionnel — whitelist csv pour bloquer les priceId arbitraires envoyés par le client
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY` sont injectés automatiquement par Supabase dans le runtime des edge functions — pas besoin de les configurer manuellement. Ils sont utilisés pour :
- vérifier le JWT du caller via `supabase.auth.getUser(jwt)` quand un `userId` est passé ;
- valider l'existence d'un `anonymous_users.id` côté admin avant de créer la session Stripe.

Via CLI :

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx
supabase secrets set STRIPE_PREMIUM_PRICE_ID=price_xxx
supabase secrets set STRIPE_ALLOWED_PRICE_IDS=price_xxx
```

### Sécurité des edge functions

- **`create-checkout-session`** valide le payload via `zod`, refuse les `priceId` hors de `STRIPE_ALLOWED_PRICE_IDS` (si défini), et exige un JWT Supabase valide quand un `userId` est passé. Les flows anonymes (sans JWT) sont acceptés mais l'`anonymousUserId` doit exister en DB.
- Le client envoie le JWT user (`supabase.auth.getSession().access_token`) en `Authorization: Bearer ...` quand l'utilisateur est connecté, sinon la publishable key. Le header `apikey` reste toujours la publishable key.

## Setup Stripe

1. Créer un compte sur [dashboard.stripe.com](https://dashboard.stripe.com) et activer le **mode Test**.
2. Dashboard → Products → Add product :
   - Name : `Beer Pong League Premium`
   - Pricing : One-time payment, `3.00 EUR`
   - Copier le **Price ID** (`price_...`).
3. Dashboard → Developers → API keys :
   - Copier la **Publishable key** (`pk_test_...`) pour `.env.local`.
   - Copier la **Secret key** (`sk_test_...`) pour les secrets Supabase (ne JAMAIS la commit).

## Déploiement des Edge Functions

Prérequis : Supabase CLI installé et projet lié (voir [supabase.md](./supabase.md)).

```bash
supabase functions deploy create-checkout-session
supabase functions deploy verify-payment-session
supabase functions list
```

URLs résultantes :
```
https://<project-ref>.supabase.co/functions/v1/create-checkout-session
https://<project-ref>.supabase.co/functions/v1/verify-payment-session
```

Le client les appelle via `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/<name>`.

## Cartes de test Stripe

| Scénario | Numéro |
|----------|--------|
| Paiement réussi | `4242 4242 4242 4242` |
| Carte refusée | `4000 0000 0000 0002` |
| Fonds insuffisants | `4000 0000 0000 9995` |
| Carte expirée | `4000 0000 0000 0069` |
| 3D Secure requise | `4000 0025 0000 3155` |

Date : n'importe quelle date future. CVC : n'importe quel trois chiffres. Plus de cartes sur [stripe.com/docs/testing](https://stripe.com/docs/testing#cards).

## Tests manuels

### Paiement réussi
1. `npm run dev` avec `.env.local` configuré.
2. Cliquer "Créer un tournoi" en tant qu'utilisateur gratuit → `PaymentModal`.
3. Cliquer "Débloquer Premium" → redirection Stripe Checkout.
4. Carte `4242 4242 4242 4242`, date future, CVC au hasard.
5. Pay → redirect `/payment-success?session_id=cs_test_...`.
6. "Vérification du paiement..." → "Paiement réussi !" → redirect home. L'utilisateur est Premium.

### Paiement annulé
- Cliquer ← Back sur la page Stripe → redirect `/payment-cancel`.
- Message "Tu as annulé le paiement. Aucun montant n'a été débité." + boutons Retour / Réessayer.

### Vérification dashboard
Dashboard Stripe → Test mode → Payments : paiement visible, metadata `user_id` ou `anonymous_user_id`, `source: beer-pong-league`.

## Dépannage

- **Message "Simulation Mode" alors qu'on veut tester avec Stripe** → `VITE_STRIPE_PUBLISHABLE_KEY` manquant dans `.env.local`, redémarrer le dev server.
- **"Failed to create checkout session"** → edge functions non déployées (`supabase functions list`) ou `STRIPE_SECRET_KEY` manquant côté Supabase.
- **"Payment not verified"** après redirect → `verify-payment-session` non déployée, vérifier les logs dans Dashboard Supabase → Functions.
- **Statut Premium non persisté en base** → la synchronisation DB via webhook n'est pas encore active ; l'app met à jour `localStorage` et côté session. L'implémentation webhook est en backlog.
