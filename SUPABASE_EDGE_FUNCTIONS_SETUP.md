# Supabase Edge Functions Setup - Story 7.3

Ce guide explique comment déployer les Edge Functions Supabase pour gérer les paiements Stripe de manière sécurisée.

## 📋 Prérequis

1. ✅ Compte Supabase actif
2. ✅ Projet Supabase créé
3. ✅ Supabase CLI installé
4. ✅ Clés Stripe (voir `STRIPE_SETUP.md`)

---

## 🛠️ Installation Supabase CLI

Si pas encore installé:

```bash
# macOS
brew install supabase/tap/supabase

# Windows
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# NPM (tous OS)
npm install -g supabase
```

Vérifie l'installation:
```bash
supabase --version
```

---

## 🔐 Configuration des Secrets

Les Edge Functions ont besoin de la clé secrète Stripe. Configure-la dans Supabase:

### Option 1: Via Dashboard Supabase (Recommandé)

1. **Va sur** https://supabase.com/dashboard/project/[ton-projet]/settings/vault
2. **Clique** "New secret"
3. **Nom**: `STRIPE_SECRET_KEY`
4. **Valeur**: `sk_test_VOTRE_CLE_SECRETE` (ta clé secrète Stripe)
5. **Clique** "Add secret"

### Option 2: Via CLI

```bash
# Login Supabase
supabase login

# Link ton projet
supabase link --project-ref [ton-project-ref]

# Set secret (remplace par ta vraie clé)
supabase secrets set STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_SECRETE_STRIPE
supabase secrets set STRIPE_PREMIUM_PRICE_ID=price_VOTRE_PRICE_ID
```

---

## 🚀 Déploiement des Edge Functions

### 1. Login et Link

```bash
# Login à Supabase
supabase login

# Link ton projet local avec ton projet Supabase
supabase link --project-ref [ton-project-ref]
```

**Pour trouver ton project-ref:**
- Va sur https://supabase.com/dashboard/project/[ton-projet]/settings/general
- Copie "Reference ID"

### 2. Déployer les Functions

```bash
# Déployer create-checkout-session
supabase functions deploy create-checkout-session

# Déployer verify-payment-session
supabase functions deploy verify-payment-session
```

### 3. Vérifier le Déploiement

```bash
# Lister les functions déployées
supabase functions list
```

Tu devrais voir:
```
┌────────────────────────────┬─────────┬─────────────────────┐
│ NAME                       │ STATUS  │ DEPLOYED AT         │
├────────────────────────────┼─────────┼─────────────────────┤
│ create-checkout-session    │ ACTIVE  │ 2026-01-30 ...      │
│ verify-payment-session     │ ACTIVE  │ 2026-01-30 ...      │
└────────────────────────────┴─────────┴─────────────────────┘
```

---

## 🧪 Test Local (Optionnel)

Tu peux tester les functions localement avant de déployer:

```bash
# Start local Supabase (Docker requis)
supabase start

# Serve functions localement
supabase functions serve
```

Puis test avec curl:
```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/create-checkout-session' \
  --header 'Authorization: Bearer [ton-anon-key]' \
  --header 'Content-Type: application/json' \
  --data '{
    "userId": "test-user-id",
    "priceId": "price_VOTRE_PRICE_ID"
  }'
```

---

## 🔗 URLs des Edge Functions

Après déploiement, tes functions sont disponibles à:

```
https://[ton-project-ref].supabase.co/functions/v1/create-checkout-session
https://[ton-project-ref].supabase.co/functions/v1/verify-payment-session
```

Ces URLs sont automatiquement utilisées par `StripeService.ts` via:
```typescript
`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`
```

---

## 📝 Variables d'Environnement Nécessaires

### Local (`.env`)
```env
VITE_SUPABASE_URL=https://[ton-project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_VOTRE_CLE_PUBLIQUE
VITE_STRIPE_PREMIUM_PRICE_ID=price_VOTRE_PRICE_ID
```

### Supabase Secrets (via Dashboard/CLI)
```
STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_SECRETE
STRIPE_PREMIUM_PRICE_ID=price_VOTRE_PRICE_ID
```

---

## 🐛 Troubleshooting

### "Function not found"
- ✅ Vérifie que tu as bien déployé: `supabase functions list`
- ✅ Vérifie l'URL dans `StripeService.ts`

### "Unauthorized"
- ✅ Vérifie `VITE_SUPABASE_ANON_KEY` dans `.env`
- ✅ Vérifie que l'anon key a les permissions sur les functions

### "Stripe error: No API key provided"
- ✅ Vérifie que `STRIPE_SECRET_KEY` est défini dans Supabase secrets
- ✅ Redéploie la function après avoir ajouté le secret

### "Cannot connect to local Supabase"
- ✅ Docker doit être lancé
- ✅ Lance `supabase start` avant `supabase functions serve`

---

## 📚 Documentation

- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions
- **Supabase CLI**: https://supabase.com/docs/reference/cli
- **Deno Deploy**: https://deno.com/deploy/docs
- **Stripe API**: https://stripe.com/docs/api

---

## ✅ Checklist de Déploiement

Avant de considérer le déploiement terminé:

- [ ] Supabase CLI installé (`supabase --version`)
- [ ] Logged in (`supabase login`)
- [ ] Project linked (`supabase link`)
- [ ] Secret `STRIPE_SECRET_KEY` configuré
- [ ] Secret `STRIPE_PREMIUM_PRICE_ID` configuré (optionnel)
- [ ] Function `create-checkout-session` déployée
- [ ] Function `verify-payment-session` déployée
- [ ] Test réussi: paiement test avec carte Stripe de test
- [ ] Variables `.env` correctes localement

---

## 🎯 Commandes Rapides

```bash
# Setup complet
supabase login
supabase link --project-ref [ton-project-ref]
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_PREMIUM_PRICE_ID=price_...
supabase functions deploy create-checkout-session
supabase functions deploy verify-payment-session
supabase functions list
```

**C'est prêt ! 🎉**
