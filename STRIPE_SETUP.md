# Stripe Setup Guide - Story 7.3

## 📋 Prérequis

1. Compte Stripe (gratuit): https://dashboard.stripe.com/register
2. Node.js et npm installés

---

## 🔧 Installation

### 1. Installer le SDK Stripe

```bash
npm install @stripe/stripe-js
```

### 2. Configurer les Variables d'Environnement

Ajoute ces lignes dans ton fichier `.env` (à la racine du projet):

```env
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXXXXXXXXXXXXXX
VITE_STRIPE_PREMIUM_PRICE_ID=price_XXXXXXXXXXXXXXXXXXXXXXXX  # Optionnel
```

**⚠️ Important:**
- Ne JAMAIS commit le fichier `.env` (déjà dans `.gitignore`)
- Utilise les clés **TEST** (pk_test_...) pour le développement
- Les clés **LIVE** (pk_live_...) sont pour la production uniquement

---

## 🎯 Récupérer les Clés Stripe

### Option 1: Mode Rapide (Clé Publishable uniquement)

Si tu veux juste tester l'intégration:

1. **Va sur**: https://dashboard.stripe.com/test/apikeys
2. **Active "Mode Test"** (toggle en haut à droite du dashboard)
3. **Copie** la "Publishable key" (commence par `pk_test_...`)
4. **Colle** dans `.env`:
   ```env
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51...
   ```

### Option 2: Mode Complet (avec Produit)

Pour utiliser Stripe Checkout avec un produit configuré:

#### A. Créer un Produit Premium

1. **Va sur**: https://dashboard.stripe.com/test/products
2. **Clique** "Add product"
3. **Remplis**:
   - **Name**: Beer Pong League Premium
   - **Description**: Accès illimité à toutes les fonctionnalités
   - **Pricing**: One-time payment
   - **Price**: 3.00 EUR
4. **Clique** "Save product"
5. **Copie** le "Price ID" (commence par `price_...`)

#### B. Récupérer les Clés

1. **Va sur**: https://dashboard.stripe.com/test/apikeys
2. **Copie** "Publishable key" (`pk_test_...`)
3. **Copie** "Secret key" (`sk_test_...`) - **IMPORTANT**: Ne la partage JAMAIS!

#### C. Configurer `.env`

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51...
VITE_STRIPE_PREMIUM_PRICE_ID=price_1...
```

---

## 🧪 Test

Pour vérifier que Stripe est bien configuré:

```bash
npm run dev
```

Puis:
1. Ouvre l'app
2. Clique sur "CRÉER UN TOURNOI" ou "CRÉER UNE LIGUE" (en tant qu'utilisateur gratuit)
3. Dans la modal de paiement, tu devrais voir:
   - ✅ Mode DEV: Message "🧪 Simulation Mode" (si Stripe non configuré)
   - ✅ Mode PROD: Redirection vers Stripe Checkout (si Stripe configuré)

---

## 🔐 Cartes de Test Stripe

Stripe fournit des cartes de test pour simuler des paiements:

### ✅ Paiement Réussi
```
Numéro: 4242 4242 4242 4242
Date: N'importe quelle date future (ex: 12/25)
CVC: N'importe quel 3 chiffres (ex: 123)
```

### ❌ Paiement Refusé
```
Numéro: 4000 0000 0000 0002
Date: N'importe quelle date future
CVC: N'importe quel 3 chiffres
```

### 🔁 Authentification 3D Secure Requise
```
Numéro: 4000 0025 0000 3155
Date: N'importe quelle date future
CVC: N'importe quel 3 chiffres
```

Plus de cartes de test: https://stripe.com/docs/testing#cards

---

## 📊 Vérifier les Paiements

Après un paiement test:

1. **Va sur**: https://dashboard.stripe.com/test/payments
2. **Tu verras** tous les paiements test avec leur statut
3. **Clique** sur un paiement pour voir les détails (montant, date, métadonnées)

---

## 🚀 Mode Production (Plus tard)

⚠️ **N'active JAMAIS le mode production sans avoir testé en profondeur!**

Quand tu seras prêt:

1. **Désactive "Mode Test"** dans le dashboard Stripe
2. **Récupère** les clés LIVE (`pk_live_...` et `sk_live_...`)
3. **Mets à jour** les variables d'environnement en production (Vercel, etc.)
4. **Configure** le webhook en production (Story 7.4)
5. **Teste** avec de VRAIS paiements (petits montants d'abord!)

---

## ❓ FAQ

### Le paiement ne fonctionne pas ?

1. Vérifie que `VITE_STRIPE_PUBLISHABLE_KEY` est bien dans `.env`
2. Vérifie que tu as bien installé `@stripe/stripe-js`
3. Vérifie que tu es en "Mode Test" dans le dashboard Stripe
4. Regarde la console du navigateur pour les erreurs

### Je vois "🧪 Simulation Mode" ?

C'est normal! Ça signifie que Stripe n'est pas configuré (pas de clé dans `.env`).
L'app fonctionne en mode simulation pour le développement.

### Où trouver mes clés Stripe ?

https://dashboard.stripe.com/test/apikeys (Mode Test)
https://dashboard.stripe.com/apikeys (Mode Live - NE PAS UTILISER pour dev!)

---

## 📚 Ressources

- **Stripe Dashboard**: https://dashboard.stripe.com
- **Stripe Docs**: https://stripe.com/docs
- **Stripe Checkout**: https://stripe.com/docs/payments/checkout
- **Cartes de Test**: https://stripe.com/docs/testing
- **Webhooks**: https://stripe.com/docs/webhooks (Story 7.4)
