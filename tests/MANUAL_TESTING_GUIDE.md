# Guide de Tests Manuels - EPIC 2: Identity & Authentication

Ce guide fournit des instructions détaillées pour tester manuellement le système d'identité dual et d'authentification de l'application Beer Pong League.

## 📋 Pré-requis

- [ ] Application déployée en local (`npm run dev`) ou en staging
- [ ] Accès à Supabase Dashboard pour vérifier les données
- [ ] Navigateurs: Chrome, Firefox, Safari (minimum)
- [ ] Devices: Desktop + Mobile (iOS et Android si possible)
- [ ] Connexion Internet stable (pour tester aussi le mode offline)

---

## 🧪 Groupe 1: Tests d'Utilisateur Anonyme

### Test 1.1: Création d'Utilisateur Anonyme au Premier Lancement

**Objectif:** Vérifier qu'un utilisateur anonyme est créé automatiquement lors de la première visite.

**Étapes:**
1. Ouvrir navigateur en mode **navigation privée**
2. Aller à l'URL de l'app
3. Ouvrir DevTools > Application > Local Storage
4. Vérifier la présence de:
   - `device_fingerprint`: doit contenir un UUID
   - `local_user`: doit contenir un objet JSON avec `id`, `pseudo`, `created_at`

**Résultat Attendu:**
- ✅ `device_fingerprint` existe et n'est pas vide
- ✅ `local_user` existe avec un `id` UUID valide
- ✅ `local_user.pseudo` commence par "Joueur" ou "Anonyme"
- ✅ Pas d'erreur dans la console

**Vérification Supabase:**
- Aller dans Supabase Dashboard > Table `anonymous_users`
- Vérifier qu'un nouveau record a été créé avec le `device_fingerprint`

---

### Test 1.2: Persistance des Données Anonymes après Refresh

**Objectif:** Vérifier que l'utilisateur anonyme persiste après un rechargement de page.

**Étapes:**
1. Répéter Test 1.1 (créer utilisateur anonyme)
2. Noter le `local_user.id` actuel
3. Rafraîchir la page (F5 ou Cmd+R)
4. Vérifier à nouveau `local_user.id` dans localStorage

**Résultat Attendu:**
- ✅ Le `local_user.id` est **identique** avant et après refresh
- ✅ Pas de nouvel utilisateur créé
- ✅ Pas d'erreur dans la console

---

### Test 1.3: Création de Tournoi en tant qu'Anonyme

**Objectif:** Vérifier qu'un utilisateur anonyme peut créer un tournoi.

**Étapes:**
1. En mode navigation privée, aller à l'app
2. Cliquer sur **"Créer un tournoi"**
3. Remplir le formulaire:
   - Nom: "Test Tournoi Anonyme"
   - Lieu: "Bar de Test"
   - (autres champs si nécessaire)
4. Cliquer **"Créer"**
5. Vérifier la redirection vers la page du tournoi

**Résultat Attendu:**
- ✅ Tournoi créé avec succès
- ✅ Redirigé vers `/tournament/[id]`
- ✅ Nom du tournoi affiché: "Test Tournoi Anonyme"
- ✅ QR Code visible pour inviter d'autres joueurs

**Vérification Supabase:**
- Table `tournaments`: vérifier que `creator_anonymous_user_id` = ID de l'utilisateur anonyme
- `creator_user_id` doit être `null`

---

### Test 1.4: Persistance du Tournoi après Refresh

**Objectif:** Vérifier que le tournoi créé par un anonyme est toujours accessible après refresh.

**Étapes:**
1. Après Test 1.3, rester sur la page du tournoi
2. Noter l'URL du tournoi
3. Rafraîchir la page
4. Vérifier que le tournoi est toujours affiché

**Résultat Attendu:**
- ✅ Tournoi toujours affiché avec le même nom
- ✅ Données du tournoi intactes
- ✅ QR Code toujours visible

---

### Test 1.5: Mode Offline - Création Locale

**Objectif:** Vérifier que l'app fonctionne en mode offline.

**Étapes:**
1. Ouvrir DevTools > Network
2. Cocher **"Offline"** dans le dropdown
3. Rafraîchir la page
4. Observer le comportement

**Résultat Attendu:**
- ✅ App affiche un message "Mode hors ligne" ou équivalent
- ✅ Données en localStorage toujours accessibles
- ✅ Peut voir les tournois créés précédemment
- ❌ Impossible de créer de nouvelles données (ou créées localement uniquement)

**Retour Online:**
5. Décocher "Offline"
6. Rafraîchir la page
7. Vérifier que les données se synchronisent

**Résultat Attendu:**
- ✅ Synchronisation automatique avec Supabase
- ✅ Données locales envoyées au serveur
- ✅ Pas de perte de données

---

## 🔐 Groupe 2: Tests d'Authentification

### Test 2.1: Ouverture du Modal d'Authentification

**Objectif:** Vérifier que le modal d'authentification s'ouvre correctement.

**Étapes:**
1. Aller sur l'app (mode normal ou incognito)
2. Chercher le bouton **"Se connecter"** (dans menu ou header)
3. Cliquer dessus

**Résultat Attendu:**
- ✅ Modal s'ouvre (overlay visible)
- ✅ Champ email visible
- ✅ Bouton "Envoyer le lien magique" visible
- ✅ Bouton de fermeture (X) visible

---

### Test 2.2: Validation de l'Email

**Objectif:** Vérifier la validation côté client de l'email.

**Étapes:**
1. Ouvrir le modal d'auth
2. Entrer un email invalide:
   - Test 1: "invalidemail" (sans @)
   - Test 2: "test@" (sans domaine)
   - Test 3: "test@invalide" (pas de TLD)
3. Cliquer **"Envoyer"**

**Résultat Attendu:**
- ✅ Message d'erreur affiché: "Email invalide"
- ✅ Formulaire ne se soumet pas
- ❌ Pas d'appel réseau (vérifier Network tab)

**Étapes (email valide):**
4. Entrer un email valide: "test@example.com"
5. Observer que le bouton devient actif

**Résultat Attendu:**
- ✅ Pas de message d'erreur
- ✅ Bouton "Envoyer" activé

---

### Test 2.3: Envoi de l'OTP

**Objectif:** Vérifier l'envoi du lien magique par email.

**Étapes:**
1. Ouvrir le modal d'auth
2. Entrer un **email valide réel** (accessible)
3. Cliquer **"Envoyer le lien magique"**
4. Observer l'état du bouton pendant l'envoi
5. Attendre la réponse

**Résultat Attendu:**
- ✅ Bouton montre un état "loading" (spinner ou désactivé)
- ✅ Message de succès affiché: "Email envoyé ! Vérifiez votre boîte mail"
- ✅ Instructions visibles pour cliquer sur le lien

**Vérification Email:**
6. Ouvrir la boîte mail
7. Vérifier la réception de l'email Supabase

**Résultat Attendu:**
- ✅ Email reçu de Supabase
- ✅ Contient un lien "magic link"
- ✅ Lien pointe vers l'app avec token

---

### Test 2.4: Callback d'Authentification (Magic Link)

**Objectif:** Vérifier que le lien magique authentifie l'utilisateur.

**Étapes:**
1. Après Test 2.3, ouvrir l'email
2. Cliquer sur le **lien magique**
3. Observer la redirection

**Résultat Attendu:**
- ✅ Redirigé vers `/auth/callback?token=...`
- ✅ Puis redirigé vers dashboard ou home
- ✅ Message "Authentification réussie" ou équivalent
- ✅ Bouton "Se connecter" remplacé par nom d'utilisateur ou menu utilisateur

**Vérification Supabase:**
- Table `users`: nouveau user créé avec l'email
- Table `user_profiles`: profil créé avec pseudo

---

### Test 2.5: Persistance de la Session

**Objectif:** Vérifier que la session persiste après un refresh.

**Étapes:**
1. Après Test 2.4 (authentifié)
2. Vérifier qu'on voit le nom d'utilisateur dans l'UI
3. Rafraîchir la page (F5)
4. Observer l'état d'authentification

**Résultat Attendu:**
- ✅ Utilisateur toujours authentifié après refresh
- ✅ Nom d'utilisateur toujours visible
- ✅ Pas de demande de re-authentification
- ✅ Session Supabase valide (vérifier dans DevTools > Application > Cookies)

---

### Test 2.6: Déconnexion

**Objectif:** Vérifier que la déconnexion fonctionne correctement.

**Étapes:**
1. Authentifié (après Test 2.4)
2. Cliquer sur le menu utilisateur
3. Cliquer **"Déconnexion"**

**Résultat Attendu:**
- ✅ Redirigé vers page d'accueil
- ✅ Bouton "Se connecter" réapparaît
- ✅ Nom d'utilisateur disparu
- ✅ Session Supabase supprimée (vérifier cookies)

**Vérification:**
4. Rafraîchir la page
5. Vérifier qu'on reste déconnecté

**Résultat Attendu:**
- ✅ Toujours déconnecté après refresh
- ✅ Nouveau `local_user` anonyme pourrait être créé

---

## 🔄 Groupe 3: Tests de Merge d'Identité

### Test 3.1: Merge Simple (Anonyme → Authentifié)

**Objectif:** Vérifier qu'un utilisateur anonyme qui s'authentifie voit ses données migrées.

**Étapes:**
1. En **navigation privée**, aller sur l'app
2. Créer un tournoi en tant qu'anonyme: "Tournoi Pre-Auth"
3. Noter l'ID du tournoi et le `local_user.id`
4. S'authentifier avec un email
5. Cliquer sur le magic link
6. Attendre la redirection et le merge

**Résultat Attendu:**
- ✅ Redirigé vers dashboard ou home
- ✅ Message "Fusion de vos données en cours..." ou équivalent
- ✅ Tournoi "Tournoi Pre-Auth" toujours visible dans la liste
- ✅ Ownership du tournoi transféré à l'utilisateur authentifié

**Vérification Supabase:**
- Table `tournaments`: `creator_user_id` = ID du user authentifié
- Table `tournaments`: `creator_anonymous_user_id` = `null`
- Table `anonymous_users`: record avec `merged_to_user_id` rempli
- Table `user_identity_merges`: nouveau record du merge

---

### Test 3.2: Merge avec Données Multiples

**Objectif:** Vérifier que TOUTES les données anonymes sont migrées.

**Étapes:**
1. En navigation privée, aller sur l'app
2. Créer **2 tournois** distincts
3. Rejoindre **1 ligue** (si feature disponible)
4. Jouer **3 matches** (si feature disponible)
5. Noter toutes les données créées
6. S'authentifier
7. Vérifier la présence de toutes les données

**Résultat Attendu:**
- ✅ Les 2 tournois visibles et owned
- ✅ La ligue toujours accessible
- ✅ Les 3 matches dans l'historique
- ✅ ELO calculé et migré correctement

**Vérification Supabase:**
- Table `tournaments`: 2 records avec `creator_user_id` = user authentifié
- Table `league_players`: record avec `user_id` = user authentifié
- Table `matches`: 3 records avec `team_*_player_ids` contenant user authentifié (plus anonymous ID)
- Table `elo_history`: records avec `user_id` = user authentifié

---

### Test 3.3: Merge avec Conflit (User déjà dans League)

**Objectif:** Vérifier le comportement quand l'utilisateur authentifié est déjà dans une ligue que l'anonyme a rejoint.

**Étapes (Setup complexe):**
1. **Session 1** (Authentifié): Se connecter avec email A, rejoindre "League Test"
2. Se déconnecter
3. **Session 2** (Anonyme): En navigation privée, rejoindre "League Test"
4. S'authentifier avec le **même email A**
5. Observer le merge

**Résultat Attendu:**
- ✅ Pas de doublon dans `league_players`
- ✅ Un seul record pour email A dans League Test
- ✅ Stats cumulées ou écrasées selon la logique métier (à définir)
- ✅ Pas d'erreur

**Vérification Supabase:**
- Table `league_players`: un seul record pour (league_id + user_id)
- L'ancien record anonyme supprimé

---

### Test 3.4: Temps de Merge

**Objectif:** Vérifier que le merge est rapide même avec beaucoup de données.

**Étapes:**
1. En navigation privée, créer beaucoup de données:
   - 5 tournois
   - 10 matches
   - Plusieurs ELO updates
2. S'authentifier
3. **Chronométrer** le temps du merge

**Résultat Attendu:**
- ✅ Merge complété en **< 5 secondes**
- ✅ Feedback visuel pendant le merge (spinner, progress bar)
- ✅ Toutes les données migrées correctement
- ✅ Pas d'erreur ou timeout

---

## 📱 Groupe 4: Tests Multi-Device

### Test 4.1: Deux Devices, Deux Anonymous Users

**Objectif:** Vérifier que deux devices ont des identités anonymes différentes.

**Étapes:**
1. **Device A** (Chrome Desktop): Aller sur l'app en navigation privée
2. Noter le `device_fingerprint` et `local_user.id`
3. **Device B** (Firefox ou Mobile): Aller sur l'app en navigation privée
4. Noter le `device_fingerprint` et `local_user.id`

**Résultat Attendu:**
- ✅ `device_fingerprint` **différent** sur Device A et B
- ✅ `local_user.id` **différent** sur Device A et B
- ✅ Pas de collision

**Vérification Supabase:**
- Table `anonymous_users`: 2 records distincts avec des `device_fingerprint` différents

---

### Test 4.2: Auth sur Device A, puis Device B

**Objectif:** Vérifier qu'on peut s'authentifier sur plusieurs devices avec le même compte.

**Étapes:**
1. **Device A**: Créer données anonymes, puis s'authentifier avec email X
2. Vérifier données migrées sur Device A
3. **Device B**: Aller sur l'app (nouvel anonyme créé)
4. S'authentifier avec le **même email X**
5. Vérifier les données

**Résultat Attendu:**
- ✅ Device A: données de l'anonyme A migrées vers user X
- ✅ Device B: données de l'anonyme B migrées vers user X
- ✅ User X a maintenant les données de A + B combinées
- ✅ Pas de perte de données

**Vérification Supabase:**
- Table `user_identity_merges`: 2 records (un pour anonyme A, un pour anonyme B)
- Table `tournaments` (ou autres): tous les records ont `creator_user_id` = user X

---

### Test 4.3: Isolation des Données Anonymes

**Objectif:** Vérifier qu'un utilisateur anonyme ne peut pas voir les données d'un autre.

**Étapes:**
1. **Device A**: Anonyme A crée "Tournoi A"
2. **Device B**: Anonyme B ne devrait PAS voir "Tournoi A"
3. Anonyme B crée "Tournoi B"
4. Vérifier que A ne voit pas "Tournoi B"

**Résultat Attendu:**
- ✅ Anonyme A voit seulement ses propres tournois
- ✅ Anonyme B voit seulement ses propres tournois
- ✅ Aucune fuite de données entre anonymes

---

## 🌐 Groupe 5: Tests Réseau & Performance

### Test 5.1: Connexion Instable

**Objectif:** Vérifier la robustesse face à une connexion instable.

**Étapes:**
1. Ouvrir DevTools > Network > Throttling > "Slow 3G"
2. Essayer de:
   - Créer un tournoi
   - S'authentifier
   - Naviguer dans l'app
3. Observer les temps de chargement

**Résultat Attendu:**
- ✅ App reste utilisable (pas de crash)
- ✅ Loading states appropriés
- ✅ Messages d'erreur clairs si timeout
- ✅ Retry automatique ou manuel proposé

---

### Test 5.2: Perte de Connexion Pendant OTP

**Objectif:** Vérifier le comportement si la connexion est perdue pendant l'envoi d'OTP.

**Étapes:**
1. Ouvrir le modal d'auth
2. Entrer un email
3. **Juste avant** de cliquer "Envoyer", aller offline (DevTools > Network > Offline)
4. Cliquer "Envoyer"
5. Observer l'erreur

**Résultat Attendu:**
- ✅ Message d'erreur: "Erreur réseau" ou "Pas de connexion"
- ✅ Bouton revient à l'état initial
- ✅ Peut réessayer une fois online

**Étapes (retry):**
6. Revenir online
7. Cliquer à nouveau "Envoyer"

**Résultat Attendu:**
- ✅ OTP envoyé avec succès

---

### Test 5.3: Temps de Chargement Initial

**Objectif:** Vérifier les performances de chargement initial.

**Étapes:**
1. Ouvrir un **nouvel onglet en navigation privée**
2. Ouvrir DevTools > Network
3. Cocher "Disable cache"
4. Charger l'app
5. Observer le temps de chargement total

**Résultat Attendu:**
- ✅ Page chargée en **< 2 secondes** (sur connexion normale)
- ✅ First Contentful Paint (FCP) < 1s
- ✅ Time to Interactive (TTI) < 3s
- ✅ Pas de ressources bloquantes excessives

---

## 🔒 Groupe 6: Tests de Sécurité

### Test 6.1: Impossible d'Accéder aux Données d'un Autre User

**Objectif:** Vérifier que les RLS policies Supabase protègent les données.

**Étapes:**
1. **User A**: S'authentifier, créer "Tournoi A"
2. Noter l'ID du tournoi dans l'URL
3. Se déconnecter
4. **User B**: S'authentifier avec un autre email
5. Essayer d'accéder directement à l'URL du "Tournoi A"

**Résultat Attendu:**
- ✅ User B ne peut PAS voir le tournoi A (si privé)
- OU
- ✅ User B peut voir mais ne peut PAS éditer/supprimer
- ✅ Erreur 403 ou redirection si accès non autorisé

**Vérification Supabase:**
- Tester manuellement une query SQL:
```sql
-- En tant que User B
SELECT * FROM tournaments WHERE id = 'tournoi-a-id';
```
- Devrait retourner vide ou erreur RLS

---

### Test 6.2: Tokens JWT Non Altérables

**Objectif:** Vérifier qu'on ne peut pas manipuler les tokens.

**Étapes:**
1. S'authentifier
2. Ouvrir DevTools > Application > Cookies
3. Trouver le cookie de session Supabase
4. Modifier légèrement le token (changer 1 caractère)
5. Rafraîchir la page
6. Observer le comportement

**Résultat Attendu:**
- ✅ Session invalidée
- ✅ Utilisateur déconnecté automatiquement
- ✅ Redirigé vers page de login ou home
- ✅ Message d'erreur approprié

---

### Test 6.3: Pas de Data Leakage dans localStorage

**Objectif:** Vérifier qu'aucune donnée sensible n'est stockée en localStorage.

**Étapes:**
1. Créer utilisateur anonyme et authentifié
2. Ouvrir DevTools > Application > Local Storage
3. Inspecter toutes les clés

**Résultat Attendu:**
- ✅ Seulement des IDs (UUIDs) stockés
- ❌ PAS d'emails, passwords, tokens JWT
- ❌ PAS de données personnelles sensibles
- ✅ Device fingerprint OK (non-sensible)

---

## ✅ Checklist Finale

Après avoir complété tous les tests ci-dessus, compléter cette checklist:

### Utilisateurs Anonymes
- [ ] Création automatique au premier lancement
- [ ] Persistance après refresh
- [ ] Peut créer des tournois
- [ ] Données synchronisées avec Supabase
- [ ] Mode offline fonctionne

### Authentification
- [ ] Modal s'ouvre correctement
- [ ] Validation email côté client
- [ ] Envoi d'OTP réussi
- [ ] Magic link fonctionne
- [ ] Session persiste après refresh
- [ ] Déconnexion fonctionne

### Merge d'Identité
- [ ] Données anonymes migrées après auth
- [ ] Toutes les tables migrées (tournaments, matches, ELO)
- [ ] Pas de doublons dans les leagues
- [ ] Temps de merge < 5s
- [ ] Records créés dans `user_identity_merges`

### Multi-Device
- [ ] Devices ont des fingerprints différents
- [ ] Peut s'auth sur plusieurs devices
- [ ] Données isolées entre anonymes

### Performance
- [ ] Chargement initial < 2s
- [ ] Connexion instable gérée
- [ ] Erreurs réseau affichées clairement

### Sécurité
- [ ] RLS policies appliquées
- [ ] Tokens JWT non altérables
- [ ] Pas de data leakage en localStorage

---

## 📝 Rapport de Bugs

Si vous trouvez un bug, notez:
1. **Numéro de Test** (ex: Test 3.2)
2. **Étape où le bug survient**
3. **Comportement Attendu**
4. **Comportement Observé**
5. **Captures d'écran** (si applicable)
6. **Erreurs Console** (copier/coller)
7. **Navigateur/Device**

---

## 🚀 Prochaines Étapes

Une fois tous les tests manuels complétés:
1. Reporter tous les bugs trouvés
2. Fixer les bugs critiques
3. Re-tester les scenarios qui ont échoué
4. Automatiser les tests critiques (E2E avec Playwright)
5. Mettre en place CI/CD pour exécuter tests automatiquement

**Bonne chance avec les tests!** 🎯
