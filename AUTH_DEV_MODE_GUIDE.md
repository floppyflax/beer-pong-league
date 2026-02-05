# 🔐 Guide d'Authentification en Mode Développement

## ✅ Ce qui a été corrigé

J'ai corrigé le système d'authentification avec les comptes test (`admin@admin.com`) pour qu'il fonctionne correctement en mode développement.

### Modifications apportées :

1. **AuthModal.tsx mis à jour** :
   - Détecte automatiquement les comptes test (`admin@admin.com`, `test@test.com`)
   - Affiche un message "🧪 Compte test détecté - Connexion directe" quand vous entrez un email test
   - Change le texte du bouton de "Envoyer le lien magique" à "Se connecter"
   - Ferme automatiquement le modal après connexion réussie (pas besoin d'attendre un email !)
   - Affiche un encadré bleu en mode dev qui liste les comptes test disponibles

2. **Nouvelle page d'accueil** :
   - Un seul bouton "CRÉER TOURNOI / LIGUE" qui ouvre un menu modal
   - Si vous n'êtes pas connecté, ça ouvre d'abord l'AuthModal
   - Après connexion, ça ouvre le CreateMenuModal avec les options

3. **DevPanel existant** :
   - Le bouton 🧪 en bas à droite est déjà configuré
   - Propose "Login as Admin" et "Login as Test User" pour connexion rapide

## 🚀 Comment utiliser

### Méthode 1 : Via AuthModal (Interface normale)

1. Cliquez sur le bouton "CRÉER TOURNOI / LIGUE" sur la page d'accueil
2. L'AuthModal s'ouvre
3. Vous verrez un encadré bleu avec les comptes test disponibles :
   ```
   🧪 Mode développement
   Comptes test disponibles :
   • admin@admin.com
   • test@test.com
   (connexion instantanée)
   ```
4. Entrez `admin@admin.com` dans le champ email
5. Un message vert apparaît : "🧪 Compte test détecté - Connexion directe"
6. Le bouton change en "Se connecter"
7. Cliquez sur "Se connecter"
8. **✨ Connexion instantanée !** (pas d'email requis)
9. Le modal se ferme et le CreateMenuModal s'ouvre

### Méthode 2 : Via DevPanel (Plus rapide)

1. Cliquez sur le bouton 🧪 en bas à droite
2. Cliquez sur "👨‍💻 Login as Admin"
3. **✨ Connexion instantanée !**
4. Redirection vers la page d'accueil, connecté

## ⚠️ IMPORTANT : Créer les comptes test dans Supabase

Pour que ça fonctionne, les comptes test doivent exister dans votre base Supabase. Suivez le guide complet dans `DEV_TEST_ACCOUNTS_SETUP.md`.

### Vérification rapide :

1. Allez sur https://supabase.com → votre projet
2. **Authentication** → **Users**
3. Vérifiez que vous avez :
   - ✅ `admin@admin.com` - Confirmed
   - ✅ `test@test.com` - Confirmed

### Si les comptes n'existent pas :

Utilisez cette requête SQL dans le **SQL Editor** de Supabase :

\`\`\`sql
-- Créer le test account Admin
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@admin.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  'authenticated',
  'authenticated'
);

-- Créer le test account Test User
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'test@test.com',
  crypt('test123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  'authenticated',
  'authenticated'
);
\`\`\`

## 🧪 Test du système

### Test 1 : AuthModal avec admin@admin.com

\`\`\`
1. Page d'accueil → Cliquez "CRÉER TOURNOI / LIGUE"
2. AuthModal s'ouvre
3. Entrez "admin@admin.com"
4. Message vert s'affiche : "🧪 Compte test détecté"
5. Cliquez "Se connecter"
6. ✅ Connexion instantanée
7. ✅ CreateMenuModal s'ouvre
\`\`\`

### Test 2 : DevPanel Login

\`\`\`
1. Cliquez bouton 🧪 (bas droite)
2. Cliquez "Login as Admin"
3. ✅ Toast "Connecté! Redirection..."
4. ✅ Redirigé vers home, authentifié
\`\`\`

## 🔍 Dépannage

### "Invalid login credentials" lors de la connexion

**Cause** : Les comptes test n'existent pas dans Supabase  
**Solution** : Exécutez le SQL ci-dessus pour créer les comptes

### Le modal reste sur "Email envoyé" au lieu de se fermer

**Cause** : Bug corrigé dans cette mise à jour  
**Solution** : Le code a été mis à jour pour fermer automatiquement le modal pour les comptes test

### Rien ne se passe quand je clique sur "Se connecter"

**Cause** : Erreur JavaScript ou problème Supabase  
**Solution** :
1. Ouvrez la console du navigateur (F12)
2. Cherchez les erreurs
3. Vérifiez que Supabase est correctement configuré
4. Vérifiez les variables d'environnement

### En production, les comptes test fonctionnent

**Cause** : Bug de détection du mode dev  
**Solution** : Le code vérifie `import.meta.env.DEV` qui devrait être `false` en production. Si ça arrive, c'est un problème de build Vite.

## 📋 Checklist de vérification

- [ ] Les comptes test existent dans Supabase Auth
- [ ] Les emails sont confirmés (✅ dans Users list)
- [ ] `npm run dev` démarre sans erreur
- [ ] Le DevPanel (🧪) est visible en bas à droite
- [ ] L'AuthModal affiche l'encadré bleu avec les comptes test
- [ ] Entrer `admin@admin.com` affiche le message vert
- [ ] Cliquer sur "Se connecter" connecte instantanément
- [ ] Le DevPanel montre l'identité authentifiée après login
- [ ] Le CreateMenuModal s'ouvre après connexion via AuthModal

## 🎯 Résumé des fichiers modifiés

1. **src/components/AuthModal.tsx**
   - Ajout détection comptes test
   - Ajout message visuel "Compte test détecté"
   - Ajout encadré bleu listant les comptes test
   - Fermeture automatique du modal après connexion test
   - Changement du texte du bouton selon le type de compte

2. **src/pages/Home.tsx**
   - Refonte complète de l'UI
   - Un seul bouton "CRÉER TOURNOI / LIGUE"
   - Intégration avec CreateMenuModal
   - Gestion du flow d'authentification

3. **src/components/CreateMenuModal.tsx** (nouveau)
   - Modal pour choisir entre tournoi et ligue
   - Affiche les limites (gratuit vs premium)
   - Intégration avec PremiumService

4. **src/components/PaymentModal.tsx** (nouveau)
   - Modal de paiement pour passer premium
   - Pour l'instant en mode simulation

## 📚 Références

- Guide complet : `DEV_TEST_ACCOUNTS_SETUP.md`
- Code AuthService : `src/services/AuthService.ts` (lignes 11-63)
- Code DevPanel : `src/components/DevPanel.tsx`
- Code AuthModal : `src/components/AuthModal.tsx`

---

**🎉 Le système est maintenant opérationnel !** Tant que les comptes test existent dans Supabase, vous pouvez vous connecter instantanément en mode dev sans recevoir d'email.
