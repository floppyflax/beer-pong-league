# QA Test Plan — Beer Pong League

> Plan de test exhaustif. Chaque scénario contient : **préconditions**, **étapes exactes**, **résultat attendu**, **données de test**.
>
> **Légende priorité** : `P0` bloquant release · `P1` critique fonctionnel · `P2` edge case / qualité.
>
> **Environnements de référence** :
> - Web : Chrome 120+, Safari 17+, Firefox 121+ (desktop + mobile)
> - Mobile : iOS 16+, Android 12+
> - Backend : Supabase (prod + branche staging)

---

## Sommaire

1. [Smoke tests](#1-smoke-tests-p0)
2. [Authentification & Identité](#2-authentification--identité)
3. [Leagues](#3-leagues)
4. [Events / Tournaments](#4-events--tournaments)
5. [Matches & ELO](#5-matches--elo)
6. [Premium / Stripe](#6-premium--stripe)
7. [Profile & Leaderboard](#7-profile--leaderboard)
8. [Display views](#8-display-views)
9. [Mobile (apps/mobile)](#9-mobile)
10. [Edge cases transverses](#10-edge-cases-transverses)
11. [Sécurité](#11-sécurité)
12. [Performance & Accessibilité](#12-performance--accessibilité)
13. [Cadence d'exécution](#13-cadence-dexécution)

---

## 1. Smoke tests (P0)

À exécuter avant chaque release. Objectif < 10 min.

### S01 — Boot non-authentifié
**Préconditions** : navigateur en mode privé (aucun `localStorage`).
**Étapes** :
1. Ouvrir `https://<env>/`
2. Observer la console développeur (onglet Console)
3. Observer l'onglet Network
**Attendu** :
- Page Landing s'affiche en < 2s
- Aucune erreur rouge en console
- Aucune requête réseau en 4xx/5xx
- Bouton CTA "Commencer à jouer" visible

### S02 — Boot avec identité anonyme
**Préconditions** : avoir cliqué CTA "Commencer" → identité créée.
**Étapes** :
1. Recharger la page (F5)
2. Inspecter `localStorage` → clé `bpl_anonymous_user`
**Attendu** :
- Home dashboard s'affiche
- QR code personnel visible
- Pseudo + UUID présents en `localStorage`
- BottomTabMenu affiche 4 onglets

### S03 — Routing principal
**Étapes** : naviguer successivement vers `/leagues`, `/events`, `/leaderboard`, `/competitions`, `/user/profile`.
**Attendu** : chaque route charge en < 1s, aucune erreur, BottomTabMenu reste sticky.

### S04 — Build & lint
**Étapes** :
```bash
npm run build
npm run lint
npm run test -- --run
```
**Attendu** : exit code 0 sur les 3 commandes, 0 warning TS, 100% tests pass.

### S05 — Edge functions Supabase
**Étapes** : `supabase functions list` → vérifier `create-checkout` et `verify-payment` deployed.
**Attendu** : statut `ACTIVE` sur les deux.

### S06 — Healthcheck Supabase
**Étapes** : depuis `/leagues`, créer une league test "Smoke-{timestamp}".
**Attendu** : league créée en DB (vérifier dashboard Supabase), apparaît immédiatement dans la liste.

---

## 2. Authentification & Identité

### 2.1 Identité anonyme

#### A01 — Création initiale (P0)
**Préconditions** : `localStorage` vide.
**Étapes** :
1. Ouvrir `/`
2. Cliquer "Commencer à jouer"
3. Saisir pseudo "TestUser01" → valider
4. Inspecter `localStorage.bpl_anonymous_user`
5. Inspecter table `anonymous_users` dans Supabase
**Attendu** :
- `localStorage` contient `{ id: <uuid>, pseudo: "TestUser01", created_at: <iso> }`
- Ligne correspondante en DB avec même UUID
- Redirection vers `/`

#### A02 — Persistance (P0)
**Préconditions** : A01 effectué.
**Étapes** : fermer l'onglet → rouvrir `/`.
**Attendu** : pas de prompt pseudo, dashboard direct.

#### A03 — Reset (P1)
**Étapes** : `localStorage.clear()` puis recharger.
**Attendu** : retour Landing, pas de crash, pas de réutilisation de l'ancien UUID.

#### A04 — Device fingerprint (P2)
**Étapes** : depuis 2 onglets de la même machine → comparer `device_fingerprint` envoyé.
**Attendu** : identique (UA + résolution + timezone + canvas hash).

### 2.2 OTP / Magic link

#### B01 — Email valide (P0)
**Étapes** :
1. `/user/profile` → "Claim account"
2. Saisir `qa+otp@example.com` → "Envoyer"
**Attendu** : toast "Email envoyé", aucune erreur. Email reçu sous 30s.

#### B02 — Email invalide (P1)
**Données** : `foo@`, `(vide)`, `   `, `not-an-email`.
**Étapes** : pour chaque valeur → soumettre.
**Attendu** : message d'erreur sous le champ, bouton submit reste désactivé ou re-focus champ.

#### B03 — Magic link OK (P0)
**Étapes** :
1. Recevoir email B01
2. Cliquer le lien → ouvre `/auth/callback?token_hash=...`
**Attendu** : redirection vers `/` ou `/user/profile`, session active (`supabase.auth.getSession()` retourne user), badge "Authentifié".

#### B04 — Magic link expiré (P1)
**Étapes** : attendre > 1h, cliquer le lien.
**Attendu** : page d'erreur "Lien expiré, redemander" + CTA retour login.

#### B05 — Magic link réutilisé (P1)
**Étapes** : cliquer le lien une 1re fois (succès) → cliquer une 2e fois.
**Attendu** : 2e clic refusé, message "déjà utilisé".

#### B06 — Test accounts (P1)
**Étapes** :
- En dev (`import.meta.env.DEV=true`) : login `admin@admin.com` / `test@test.com` sans OTP
- En prod : tenter pareil
**Attendu** : succès en dev, échec en prod (compte introuvable).

### 2.3 Merge anonyme → authentifié

#### M01 — Merge nominal (P0 — critique données)
**Préconditions** : user anonyme `Anon-1` ayant créé 1 league + 2 events + 5 matches.
**Étapes** :
1. Cliquer "Claim account"
2. Email `qa+merge@example.com` → magic link → `/auth/callback`
3. Inspecter Supabase :
   - Table `users` : nouvelle ligne avec UUID auth
   - Tables `leagues`, `events`, `matches`, `*_participants` : `user_id` rempli, `anonymous_user_id` à NULL
**Attendu** :
- Toutes les données apparaissent dans `/leagues`, `/events`, profil
- Aucune ligne avec les 2 IDs simultanés (CHECK constraint respecté)
- Ligne `anonymous_users` marquée `merged_into=<auth_user_id>`

#### M02 — Merge interrompu (P1)
**Étapes** :
1. Démarrer flow merge
2. Fermer l'onglet pendant `/auth/callback` (avant fin migration)
3. Rouvrir → re-cliquer le magic link (s'il est encore valide) ou re-login
**Attendu** : reprise du merge, aucune duplication de données, état final identique à M01.

#### M03 — Email déjà utilisé sur autre device (P1)
**Préconditions** : compte auth `qa+exists@example.com` existe avec data sur device A.
**Étapes** : sur device B, créer identité anonyme `Anon-B` avec data, claim avec le même email.
**Attendu** : data A et B fusionnées sous le même user, pas d'écrasement.

#### M04 — Vérif intégrité post-merge (P0)
**Étapes SQL** :
```sql
SELECT * FROM matches WHERE user_id IS NOT NULL AND anonymous_user_id IS NOT NULL;
SELECT * FROM events WHERE user_id IS NOT NULL AND anonymous_user_id IS NOT NULL;
-- attendu : 0 ligne
```

#### M05 — Pseudos par-league préservés (P1)
**Préconditions** : user anonyme avec pseudo "Anon" dans League A et "Marcel" dans League B.
**Étapes** : merger.
**Attendu** : Player.pseudo reste "Anon" dans A, "Marcel" dans B (la table `league_participants` conserve les pseudos par contexte).

### 2.4 Edge cases auth

#### A-EC01 — Redirect URL non whitelistée (P1)
**Étapes** : modifier l'URL du magic link pour pointer un domaine non whitelisté Supabase.
**Attendu** : Supabase refuse, erreur claire.

#### A-EC02 — Logout (P1)
**Étapes** : `/user/profile` → "Se déconnecter" → recharger.
**Attendu** : session purgée, retour Landing OU identité anonyme régénérée selon spec produit (à confirmer en équipe).

#### A-EC03 — Token JWT expiré pendant session (P2)
**Étapes** : forcer expiration (modifier expiry dans Supabase) → tenter une action DB.
**Attendu** : refresh silencieux ou prompt re-login, pas de crash, pas de perte de form.

---

## 3. Leagues

### 3.1 Création

#### L01 — Création nominale (P0)
**Étapes** :
1. `/create-league` → nom "QA League {timestamp}"
2. Toggle anti-cheat = OFF
3. Submit
**Attendu** : redirection `/league/:id`, code de partage visible, QR généré, ligne en DB avec `creator_id` = user courant.

#### L02 — Validation nom (P1)
**Données** : `""`, `" "` (espaces), 256 chars, `<script>alert(1)</script>`.
**Étapes** : pour chaque, tenter create.
**Attendu** : vide/espaces refusés, longueur capée, HTML échappé à l'affichage.

#### L03 — Anti-cheat ON (P1)
**Étapes** : créer avec toggle ON → vérifier DB `requires_match_confirmation=true`.
**Attendu** : flag persisté, matches futurs en `pending`.

#### L04 — Création offline (P2)
**Préconditions** : couper réseau (DevTools → Offline).
**Étapes** : tenter création.
**Attendu** : league sauvée en `localStorage`, toast "Mode hors-ligne", sync auto au retour réseau, pas de doublon.

### 3.2 Join

#### L05 — Join via QR (P0)
**Préconditions** : League existante avec code `ABC123`.
**Étapes** :
1. User B sur `/join` → scan QR
2. Confirmer modal "Rejoindre QA League ?"
**Attendu** : redirect `/league/:id`, ligne `league_participants` créée, leaderboard inclut User B.

#### L06 — Join via code manuel (P0)
**Étapes** : `/join` → saisir `ABC123` → submit.
**Attendu** : idem L05.

#### L07 — Code invalide (P1)
**Données** : `XXXXX`, `ABC` (trop court), `   `.
**Attendu** : erreur "League introuvable", pas de redirect.

#### L08 — Déjà membre (P1)
**Étapes** : User B (déjà membre L05) re-tente le join.
**Attendu** : redirect direct vers la league sans nouvel insert, toast "Déjà membre".

#### L09 — Pseudo déjà pris dans la league (P1)
**Préconditions** : User A pseudo "Marcel" dans League X.
**Étapes** : User B tente join League X avec pseudo "Marcel".
**Attendu** : prompt "Pseudo pris, choisissez-en un autre" avant insert.

#### L10 — Même pseudo cross-league (P2)
**Étapes** : User A pseudo "Marcel" dans League X. Crée League Y avec pseudo "Marcel".
**Attendu** : autorisé (pseudo unique par league seulement).

### 3.3 Dashboard

#### L11 — Tri leaderboard (P0)
**Préconditions** : league avec 5 players d'ELO 1200, 1400, 1100, 1500, 1300.
**Attendu** : ordre 1500 → 1400 → 1300 → 1200 → 1100.

#### L12 — Cohérence stats (P1)
**Étapes** : vérifier matches joués, win rate, dernière activité ↔ DB.
**Attendu** : valeurs identiques.

#### L13 — Empty state (P1)
**Préconditions** : league nouvellement créée, 0 match.
**Attendu** : message "Aucun match enregistré" + CTA "Enregistrer un match".

#### L14 — Scale 100+ joueurs (P2)
**Préconditions** : seed league avec 150 players.
**Attendu** : leaderboard charge < 2s, pas de freeze scroll, virtualisation ou pagination effective.

---

## 4. Events / Tournaments

### 4.1 Création (gated premium)

#### E01 — Free user bloqué (P0)
**Préconditions** : user free (no `premium=true` en `localStorage`).
**Étapes** : cliquer "Créer un event".
**Attendu** : `PaymentModal` s'ouvre, pas de redirect `/create-event`.

#### E02 — Premium user → form (P0)
**Préconditions** : `localStorage.bpl_premium=true`.
**Étapes** : cliquer "Créer un event".
**Attendu** : redirect `/create-event`, formulaire complet visible.

#### E03 — Validation date (P1)
**Données** : date passée (J-1), date 2050.
**Attendu** : J-1 refusé avec message clair, 2050 accepté.

#### E04 — Event lié à une league (P1)
**Étapes** : depuis `/league/:id`, "Créer un event" → form pré-rempli avec `parent_league_id`.
**Attendu** : event créé avec `parent_league_id` correct, visible dans onglet "Events" de la league.

#### E05 — Format participants (P1)
**Cas** : 1v1 / 2v2 / 3v3.
**Attendu** : champ "format" propose les 3 options, sauvegardé en DB.

### 4.2 Join & participation

#### E06 — Join via code (P0)
**Étapes** : User B sur `/event/:id/join` → confirmer.
**Attendu** : ligne `event_participants` créée.

#### E07 — Auto-participant créateur (P1)
**Étapes** : créer event en cochant "Je participe".
**Attendu** : créateur ajouté en `event_participants` automatiquement.

#### E08 — Quitter event (P1)
**Cas a** : avant 1er match → quitter OK.
**Cas b** : après matchs joués → modal de confirmation, suppression participant mais matches passés conservés.

#### E09 — Capacité max (P2)
**Préconditions** : event format 1v1, max 8 participants, déjà 8 inscrits.
**Étapes** : User 9 tente join.
**Attendu** : refus "Event complet".

### 4.3 Display view

#### E10 — Accès public (P1)
**Étapes** : ouvrir `/event/:id/display` en navigation privée (sans auth).
**Attendu** : scoreboard visible, pas de prompt login.

#### E11 — Mise à jour live (P1)
**Étapes** : depuis un autre onglet, enregistrer un match dans cet event.
**Attendu** : scoreboard se rafraîchit en < 5s (realtime ou polling).

#### E12 — Plein écran (P2)
**Attendu** : pas de BottomTabMenu, pas de header, layout occupe 100vh.

### 4.4 Backward-compat

#### E13 — `/tournaments` redirect (P1)
**Étapes** : ouvrir `/tournaments`.
**Attendu** : 301/302 → `/events`.

#### E14 — `/tournament/:id/*` redirect (P1)
**Étapes** : ouvrir `/tournament/abc123/join?source=qr`.
**Attendu** : redirect `/event/abc123/join?source=qr` (params préservés).

---

## 5. Matches & ELO

### 5.1 Recording

#### R01 — Record global (P0)
**Étapes** : `/record-match` → choisir league + event manuellement → 2 teams → scores 11-7 → submit.
**Attendu** : match créé, status `pending` (si anti-cheat) ou `confirmed`, ELO recalculé.

#### R02 — Record contextualisé (P0)
**Étapes** : depuis `/league/:id`, cliquer "Match rapide" → form pré-rempli `contextType=league&id=X`.
**Attendu** : league pré-sélectionnée non modifiable.

#### R03 — Égalité (P1)
**Données** : team A 10, team B 10.
**Attendu** : refus avec message OU acceptation selon spec (à confirmer — par défaut beer pong = pas d'égalité, donc refuser).

#### R04 — Scores invalides (P1)
**Données** : `-1`, `99999`, `abc`, vide.
**Attendu** : validation HTML5 + JS, pas de submit.

#### R05 — Joueur dans 2 teams (P1)
**Étapes** : sélectionner User A dans Team1 ET Team2.
**Attendu** : refus "Un joueur ne peut pas être dans les deux équipes".

#### R06 — Joueur non-membre (P1)
**Étapes** : tenter d'ajouter un user non-inscrit à la league sélectionnée.
**Attendu** : invisible dans la liste OU refusé au submit.

### 5.2 Confirmation & anti-cheat

#### R07 — Match pending (P0)
**Préconditions** : league anti-cheat ON.
**Étapes** : User A enregistre match A vs B 11-5.
**Attendu** : `matches.status='pending'`, ELO inchangé pour les 2 joueurs.

#### R08 — Confirmation (P0)
**Étapes** : User B (loser) ouvre l'app → notif/badge "Match à confirmer" → "Confirmer".
**Attendu** : `status='confirmed'`, ELO recalculé pour les 2 (gain pour A, perte pour B), `elo_history` insérée.

#### R09 — Reject (P0)
**Étapes** : User B → "Contester".
**Attendu** : `status='rejected'`, ELO inchangé, match marqué disputé visible aux 2 joueurs.

#### R10 — ELO server-side (P0 — anti-cheat)
**Étapes** :
1. Intercepter requête `confirm_match` (DevTools → Network)
2. Modifier la réponse pour fake un ELO élevé
3. Vérifier en DB
**Attendu** : DB contient l'ELO calculé serveur, pas le ELO falsifié client.

#### R11 — Match casual (P1)
**Étapes** : créer match avec `is_ranked=false` → confirmer.
**Attendu** : status passe `confirmed`, ELO **inchangé**.

#### R12 — League sans anti-cheat (P1)
**Étapes** : league anti-cheat OFF → enregistrer match.
**Attendu** : `status='confirmed'` direct, ELO recalculé immédiatement.

### 5.3 ELO edge cases

#### E-EC01 — K-factor transition (P2)
**Préconditions** : 2 users, ELO 1499 et 1501.
**Étapes** : enregistrer match, observer delta ELO.
**Attendu** : delta calculé avec K=32 pour le 1499 et K=16 pour le 1501.

#### E-EC02 — Format 2v2 (P1)
**Étapes** : match 2v2, team gagnante.
**Attendu** : chaque joueur gagnant reçoit `delta/2` (ou selon formule définie), même logique côté perdant.

#### E-EC03 — ELO history complète (P1)
**Étapes** : SQL `SELECT * FROM elo_history WHERE match_id = X`.
**Attendu** : 1 ligne par participant avec `elo_before`, `elo_after`, `delta`.

#### E-EC04 — Rollback ELO (P1)
**Étapes** : match confirmé → admin le passe `rejected` → vérifier ELO.
**Attendu** : ELO des joueurs revient à valeur pré-match, `elo_history` purge ou flag invalide.

---

## 6. Premium / Stripe

### 6.1 Checkout

#### P01 — Démarrage checkout (P0)
**Étapes** : free user → click "Unlock Premium" → bouton "Payer".
**Attendu** : redirect Stripe Checkout (`checkout.stripe.com/...`), session ID en URL.

#### P02 — Carte succès (P0)
**Données** : `4242 4242 4242 4242`, exp `12/34`, CVC `123`, ZIP `12345`.
**Étapes** : payer.
**Attendu** : redirect `/payment-success?session_id=cs_test_...`, badge premium activé, `localStorage.bpl_premium=true`.

#### P03 — Carte refusée (P1)
**Données** : `4000 0000 0000 0002`.
**Attendu** : Stripe affiche "Card declined", retour à BPL avec état free.

#### P04 — 3DS challenge (P1)
**Données** : `4000 0027 6000 3184`.
**Étapes** : valider le challenge 3DS.
**Attendu** : success comme P02.

#### P05 — Cancel (P0)
**Étapes** : sur Stripe Checkout, cliquer "←" ou "Annuler".
**Attendu** : redirect `/payment-cancel`, état free préservé.

#### P06 — Mode simulation dev (P1)
**Préconditions** : `VITE_STRIPE_PUBLISHABLE_KEY=""` en `.env.local`.
**Étapes** : click "Unlock Premium".
**Attendu** : pas de redirect Stripe, modal de simulation, click "Simuler succès" → premium activé.

#### P07 — Webhook idempotent (P1)
**Étapes** :
1. Stripe CLI : `stripe trigger checkout.session.completed`
2. Rejouer le même event 3 fois
**Attendu** : entitlement activé une seule fois, pas de doublon en DB `premium_subscriptions`.

### 6.2 Gating

#### P08 — Bypass URL (P0)
**Préconditions** : user free.
**Étapes** : taper directement `/create-event` dans l'URL.
**Attendu** : `PaymentModal` s'ouvre OU redirect `/`. Pas d'accès au form.

#### P09 — Premium full access (P0)
**Préconditions** : user premium.
**Étapes** : naviguer vers toutes les routes.
**Attendu** : aucune feature bloquée.

#### P10 — Tampering localStorage (P1)
**Étapes** : `localStorage.setItem('bpl_premium', 'true')` manuellement.
**Attendu** : à la prochaine action serveur, vérification cross-check avec `verify-payment` → si pas de session valide → revert à free + toast "Premium expiré".

---

## 7. Profile & Leaderboard

#### PR01 — Profile authentifié (P1)
**Étapes** : `/user/profile` après auth.
**Attendu** : email, pseudo global, avatar, badge "Authentifié", date de création.

#### PR02 — Édition pseudo (P1)
**Étapes** : modifier pseudo "Marcel" → "Marcel-2".
**Attendu** : update DB, propagation à toutes les vues (header, leaderboards) ou par-league selon spec.

#### PR03 — Upload avatar (P1)
**Étapes** : "Changer photo" → WebcamCaptureSheet → capture → confirmer.
**Attendu** : upload bucket Supabase Storage, URL persistée sur user, avatar visible dans header.

#### PR04 — Profile autre joueur (P1)
**Étapes** : depuis leaderboard, click sur un autre user → `/player/:id`.
**Attendu** : ELO, stats publiques, historique matches visibles. Email **masqué**.

#### PR05 — Leaderboard global (P0)
**Étapes** : `/leaderboard`.
**Attendu** : top users tous leagues confondues, tri ELO desc, badges rank (Bronze/Silver/Gold/...).

#### PR06 — Leaderboard vide (P2)
**Préconditions** : env staging fraîchement seedé.
**Attendu** : empty state "Aucun joueur classé" + CTA.

---

## 8. Display views

#### D01 — Accès public league display (P1)
**Étapes** : navigation privée → `/league/:id/display`.
**Attendu** : scoreboard sans login.

#### D02 — Live update (P1)
**Étapes** : ouvrir display sur écran 1, enregistrer match depuis écran 2.
**Attendu** : scoreboard 1 actualisé en < 5s.

#### D03 — Responsive grand écran (P2)
**Étapes** : ouvrir display sur 1080p, 4K, projecteur 1024×768.
**Attendu** : layout adapté, texte lisible à 5m, pas de scrollbar.

---

## 9. Mobile

> Couvre les 9 screens miroirs de `apps/mobile`. Tester sur 1 device iOS + 1 Android.

#### MB01 — HomeScreen
**Attendu** : identité chargée, QR généré, navigation tabs OK.

#### MB02 — AuthScreen — OTP
**Étapes** : email → recevoir OTP → ouvrir le lien depuis l'email mobile.
**Attendu** : deep link ouvre l'app, session active.

#### MB03 — Leagues create + join
**Attendu** : parité fonctionnelle avec web (sections L01, L05).

#### MB04 — Events create + join
**Attendu** : parité avec sections E01-E06.

#### MB05 — ScoreScreen — record match
**Attendu** : parité avec R01.

#### MB06 — ProfileScreen + merge
**Attendu** : parité avec section 2.3.

#### MB07 — Leaderboard
**Attendu** : tri + navigation profile OK.

#### MB08 — Deep links
**Étapes** : depuis Notes/SMS, taper un lien `bpl://event/abc123` → ouvrir.
**Attendu** : app ouvre directement la screen Event correspondante.

#### MB09 — Offline
**Étapes** : mode avion → utiliser l'app.
**Attendu** : lecture des données cached, écriture queueée, sync au retour réseau.

---

## 10. Edge cases transverses

### 10.1 Réseau

#### N01 — Supabase down au boot (P1)
**Étapes** : bloquer `*.supabase.co` via DevTools.
**Attendu** : `isSupabaseAvailable()` retourne false, app fonctionne en localStorage, toast "Mode hors-ligne".

#### N02 — Recover Supabase (P1)
**Étapes** : N01 → enregistrer 2 leagues offline → débloquer Supabase.
**Attendu** : sync auto, leagues présentes en DB, pas de doublon.

#### N03 — 3G simulé (P2)
**Étapes** : DevTools → throttle "Slow 3G".
**Attendu** : loaders affichés sur chaque action, boutons `disabled` pendant submit, pas de double-submit.

#### N04 — RLS direct curl (P0 sécurité)
**Étapes** :
```bash
curl -X POST https://<ref>.supabase.co/rest/v1/leagues \
  -H "apikey: <anon>" \
  -H "Authorization: Bearer <fake_jwt>" \
  -d '{"name":"hack"}'
```
**Attendu** : 401 ou 403, aucune ligne créée.

### 10.2 Données

#### DT01 — Round-trip snake/camel (P1)
**Étapes** : créer entité depuis UI → SELECT direct DB → relire via app.
**Attendu** : champs DB en snake_case, champs UI en camelCase, valeurs identiques.

#### DT02 — Dates ISO 8601 (P2)
**Étapes** : injecter `"23/01/2026"` via Postman → API.
**Attendu** : rejet 400.

#### DT03 — Champs null (P2)
**Étapes** : créer event sans description (champ optionnel).
**Attendu** : UI affiche "Aucune description" ou rien, pas de crash.

#### DT04 — Strings très longues (P2)
**Données** : pseudo de 500 chars.
**Attendu** : tronqué à la limite DB ou rejet validation côté client.

### 10.3 État UI

#### UI01 — Pas de `any` (P1)
**Étapes** : `grep -r ": any" apps/web/src --include="*.ts" --include="*.tsx"`.
**Attendu** : 0 résultat (sauf cas justifiés en commentaire).

#### UI02 — Couleurs palette (P1)
**Étapes** : `grep -rE "#[0-9a-fA-F]{3,6}" apps/web/src/components apps/web/src/pages --include="*.tsx"`.
**Attendu** : 0 résultat hors fichiers de tokens.

#### UI03 — Erreurs user-friendly (P1)
**Étapes** : provoquer une 500 (ex: scope invalide).
**Attendu** : `toast.error("Une erreur est survenue, réessayez")`, jamais `Error: TypeError...` exposé.

#### UI04 — State updates immutables (P1)
**Étapes** : audit code `apps/web/src` `grep -rn "\.push\(\|\.splice\(\|\.sort\(" --include="*.tsx"`.
**Attendu** : aucune mutation directe d'état React.

#### UI05 — ErrorBoundary (P1)
**Étapes** : injecter `throw new Error("test")` dans un composant enfant.
**Attendu** : ErrorBoundary affiche fallback "Une erreur est survenue", bouton "Recharger".

#### UI06 — Sticky CTA forms (P2)
**Étapes** : `/create-league` sur mobile → scroller le form.
**Attendu** : bouton submit reste sticky en bas.

---

## 11. Sécurité

#### SEC01 — RLS exhaustif (P0)
**Étapes SQL** :
```sql
SELECT tablename FROM pg_tables WHERE schemaname='public'
EXCEPT
SELECT tablename FROM pg_policies WHERE schemaname='public';
```
**Attendu** : 0 ligne.

#### SEC02 — XSS pseudo (P0)
**Données** : pseudo `<img src=x onerror=alert(1)>`.
**Étapes** : créer user → afficher dans leaderboard.
**Attendu** : rendu en texte, pas d'exécution JS.

#### SEC03 — SQL injection params URL (P0)
**Données** : `/league/'; DROP TABLE leagues;--`.
**Attendu** : 404 ou erreur "ID invalide", aucune action DB.

#### SEC04 — Secrets en bundle (P0)
**Étapes** :
```bash
npm run build
grep -rE "sk_live|sk_test|service_role" apps/web/dist
```
**Attendu** : 0 résultat.

#### SEC05 — CSP headers (P1)
**Étapes** : `curl -I https://<env>.vercel.app/` → header `Content-Security-Policy`.
**Attendu** : présent, `default-src 'self'`, `script-src` sans `unsafe-inline` injustifié.

#### SEC06 — Magic link single-use (P0)
Voir B05.

---

## 12. Performance & Accessibilité

### Performance

#### PERF01 — Lighthouse mobile (P1)
**Étapes** : Lighthouse → mobile → Performance.
**Attendu** : score ≥ 80, LCP < 2.5s.

#### PERF02 — Bundle size (P1)
**Étapes** : `npm run build` → vérifier `dist/assets/index-*.js`.
**Attendu** : < 500 KB gzipped.

#### PERF03 — Scale leaderboard (P2)
**Préconditions** : seed league avec 1000 matches.
**Attendu** : leaderboard charge < 2s.

#### PERF04 — Re-renders (P2)
**Étapes** : React DevTools Profiler → enregistrer un confirm match.
**Attendu** : pas de cascade re-render de composants non concernés.

### Accessibilité

#### A11Y01 — Navigation clavier (P1)
**Étapes** : Tab à travers `/`, `/leagues`, `/record-match`.
**Attendu** : tous les éléments interactifs accessibles, ordre logique, pas de piège focus.

#### A11Y02 — Contraste WCAG AA (P1)
**Étapes** : axe DevTools sur chaque page principale.
**Attendu** : 0 violation contraste.

#### A11Y03 — Labels inputs (P1)
**Attendu** : tous `<input>` ont `<label>` associé ou `aria-label`.

#### A11Y04 — Focus visible (P1)
**Attendu** : outline visible au tab sur tous éléments interactifs.

#### A11Y05 — Lecteur d'écran (P2)
**Étapes** : VoiceOver / NVDA → naviguer.
**Attendu** : routes annoncées, modales annoncées (`role=dialog`, `aria-modal`).

### Compat navigateurs

#### BR01 — Cross-browser (P1)
**Étapes** : exécuter S01-S03 sur Chrome, Safari, Firefox, Edge (desktop + mobile).
**Attendu** : parité fonctionnelle.

#### BR02 — Caméra Safari iOS (P1)
**Étapes** : `/join` → scanner QR depuis iPhone Safari.
**Attendu** : permission caméra demandée, scan fonctionne.

#### BR03 — PWA install (P2)
**Étapes** : Chrome desktop → menu → "Installer Beer Pong League".
**Attendu** : prompt apparaît, app installable, icône correcte.

---

## 13. Cadence d'exécution

| Cadence | Périmètre |
|---|---|
| **Pre-commit** | Lint + unit (`npm test -- --run`) |
| **Pre-merge PR** | + E2E Playwright + smoke S01-S06 |
| **Pre-release** | Section 1 (smoke) + tous les `P0` des sections 2-6 |
| **Hebdomadaire** | Edge cases (sec 10) + sécurité P1 |
| **Mensuel** | Audit RLS complet + audit secrets bundle + Lighthouse + accessibilité full |

---

## 14. Gaps de couverture automatisée

Tests manuels prioritaires à automatiser :

1. **E2E paiement Stripe** complet (test cards) — actuellement absent
2. **E2E confirmation match + anti-cheat** — actuellement absent
3. **RLS policy tests** (pgTAP ou SQL pur en CI)
4. **Mobile E2E** (Detox ou Maestro) — aucun test E2E mobile aujourd'hui
5. **Display views** — aucun test
6. **Backward-compat redirects** `/tournament*`
7. **Offline → online sync**
8. **Performance budget en CI** (Lighthouse CI ou bundle-size action)

---

**Maintenance** : ce document évolue avec chaque feature. Maj via skill `doc-curator` ou PR dédiée. Version actuelle : 2026-04-26.
