# Guide de Test - Intégration Stripe (Story 7.3)

## 🎯 Objectif

Tester que l'intégration Stripe fonctionne correctement du clic sur "upgrade" jusqu'à l'activation Premium.

---

## ✅ Checklist Avant de Tester

- [ ] `npm install @stripe/stripe-js` exécuté
- [ ] Clés Stripe ajoutées dans `.env`:
  ```env
  VITE_STRIPE_PUBLISHABLE_KEY=pk_test_VOTRE_CLE_PUBLIQUE
  VITE_STRIPE_PREMIUM_PRICE_ID=price_VOTRE_PRICE_ID
  ```
- [ ] Edge Functions déployées sur Supabase (voir `SUPABASE_EDGE_FUNCTIONS_SETUP.md`)
- [ ] `npm run dev` lancé

---

## 🧪 Scénarios de Test

### Test 1: Mode Simulation (Stripe non configuré)

**Si tu veux tester sans Stripe configuré:**

1. Ne mets PAS de clés Stripe dans `.env`
2. Lance `npm run dev`
3. Clique sur "CRÉER UN TOURNOI" (en tant qu'utilisateur gratuit)
4. **Résultat attendu:**
   - ✅ Modal de paiement s'ouvre
   - ✅ Message "🧪 Mode développement: Simulation de paiement"
   - ✅ Clic sur "Débloquer Premium" → Simulation (1.5s)
   - ✅ Écran de succès + redirect homepage
   - ✅ Utilisateur devient Premium

---

### Test 2: Mode Production (Stripe configuré)

**Test du flux complet avec Stripe:**

#### A. Paiement Réussi

1. Configure `.env` avec les clés Stripe
2. Relance `npm run dev`
3. Ouvre l'app: `http://localhost:5173`
4. Clique sur "CRÉER UN TOURNOI" (utilisateur gratuit)
5. **Résultat attendu:**
   - ✅ Modal de paiement s'ouvre
   - ✅ Message "Paiement sécurisé via Stripe" (pas de 🧪)
   - ✅ Clic sur "Débloquer Premium" → Console log "🔐 Stripe Mode: Redirecting..."
   - ✅ Redirection vers Stripe Checkout (`checkout.stripe.com`)

6. Sur la page Stripe:
   - Email: `test@example.com`
   - Carte: `4242 4242 4242 4242`
   - Date: N'importe quelle date future (ex: `12/28`)
   - CVC: N'importe quel 3 chiffres (ex: `123`)
   - Nom: N'importe quoi
   - Pays: France

7. Clique "Pay"

8. **Résultat attendu:**
   - ✅ Redirect vers `http://localhost:5173/payment-success?session_id=cs_test_...`
   - ✅ Page "Vérification du paiement..."
   - ✅ Puis "Paiement réussi !"
   - ✅ Liste des bénéfices Premium affichée
   - ✅ Message "Redirection automatique..."
   - ✅ Redirect vers homepage après 2s
   - ✅ Utilisateur est maintenant Premium

#### B. Paiement Annulé

1. Refais les étapes 1-5 ci-dessus
2. Sur la page Stripe, clique **"← Back"** (en haut à gauche)
3. **Résultat attendu:**
   - ✅ Redirect vers `http://localhost:5173/payment-cancel`
   - ✅ Message "Paiement annulé"
   - ✅ "Tu as annulé le paiement. Aucun montant n'a été débité."
   - ✅ Boutons "Retour à l'accueil" et "Réessayer le paiement"

#### C. Paiement Échoué

1. Refais les étapes 1-5
2. Sur la page Stripe:
   - Carte: `4000 0000 0000 0002` (carte refusée)
   - Remplis le reste
3. Clique "Pay"
4. **Résultat attendu:**
   - ✅ Erreur Stripe: "Your card was declined"
   - ✅ Reste sur la page Stripe
   - ✅ Possibilité de réessayer avec une autre carte

---

### Test 3: Vérification Dashboard Stripe

Après chaque paiement test:

1. **Va sur:** https://dashboard.stripe.com/test/payments
2. **Tu devrais voir:**
   - ✅ Un paiement de 3.00 EUR
   - ✅ Status: "Succeeded" (paiement réussi) ou "Incomplete" (annulé)
   - ✅ Customer créé automatiquement

3. **Clique sur le paiement pour voir:**
   - ✅ Metadata: `user_id` ou `anonymous_user_id`
   - ✅ Metadata: `source: beer-pong-league`
   - ✅ Product: "Beer Pong League Premium"

---

## 🐛 Troubleshooting

### "Stripe is not configured"

**Problème:** Le log console affiche "🧪 Simulation Mode"

**Solution:**
1. Vérifie `.env`:
   ```env
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```
2. Redémarre le dev server (`npm run dev`)
3. Vide le cache du navigateur (Cmd+Shift+R)

---

### "Failed to create checkout session"

**Problème:** Erreur lors du clic sur "Débloquer Premium"

**Solutions possibles:**
1. **Edge Functions pas déployées:**
   - Lance `supabase functions list`
   - Si vide → Déploie avec `supabase functions deploy create-checkout-session`

2. **Secret Stripe manquant:**
   - Vérifie dans Supabase Dashboard > Settings > Vault
   - Doit contenir `STRIPE_SECRET_KEY`

3. **URL Supabase incorrecte:**
   - Vérifie `.env`: `VITE_SUPABASE_URL=https://[project-ref].supabase.co`

---

### "Payment not verified"

**Problème:** Après redirect, page "Le paiement n'a pas pu être vérifié"

**Solutions:**
1. Vérifie que `verify-payment-session` est déployée
2. Regarde la console navigateur pour les erreurs
3. Vérifie les logs Supabase:
   - Dashboard > Functions > verify-payment-session > Logs

---

### Le statut Premium ne se met pas à jour

**Problème:** Paiement réussi mais utilisateur pas Premium

**Note:** C'est normal pour l'instant ! Le webhook (Story 7.4) n'est pas encore implémenté.

**Workaround actuel:**
- Le code met à jour `localStorage` directement
- En production, le webhook Stripe (Story 7.4) mettra à jour la DB

---

## ✅ Résultat Attendu Final

Après Test 2A (Paiement Réussi):

1. ✅ Paiement visible dans Stripe Dashboard (test mode)
2. ✅ Utilisateur marqué Premium dans l'app
3. ✅ Peut créer des tournois/ligues sans limite
4. ✅ Badge "Premium" visible (Story 7.10 - à venir)

---

## 📊 Cartes de Test Stripe

### ✅ Succès
```
4242 4242 4242 4242  →  Paiement réussi
```

### ❌ Échec
```
4000 0000 0000 0002  →  Carte refusée
4000 0000 0000 9995  →  Fonds insuffisants
4000 0000 0000 0069  →  Carte expirée
```

### 🔐 3D Secure
```
4000 0025 0000 3155  →  Requiert authentification
```

Plus de cartes: https://stripe.com/docs/testing#cards

---

## 🎉 Test Réussi ?

Si tous les tests passent:
- ✅ Story 7.3 complète!
- ✅ Paiements Stripe fonctionnels
- ⏭️ Prochaine étape: Story 7.4 (Webhook Handler)

**Félicitations ! 🚀**
