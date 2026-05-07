# Legacy fix notes (BMAD-era, février 2026)

> Notes ponctuelles datant de l'ère BMAD (jan-fév 2026), conservées pour mémoire historique. Le contenu fait souvent référence à des noms de tables ou de pages obsolètes (`tournaments` → renommé `events` en mig 024, `league_players` / `tournament_players` → fusionnés dans `*_memberships` en mig 022). À lire avec ce contexte en tête. Ces fichiers ont été regroupés ici pour aplatir l'index `docs/archive/`.

---

## 1. Hotfix : boucle infinie sur la Home Page (2026-02-04 / 2026-02-05)

### Problème
La page Home chargeait en boucle infinie, causant de multiples appels API répétés.

### Causes identifiées
1. Utilisation de `.single()` sans gestion d'erreur — Supabase lance une exception sans résultat → boucle infinie avec React Query.
2. Noms de tables incorrects : `league_members` au lieu de `league_players`.
3. Noms de colonnes incorrects : `player_id` au lieu de `user_id` / `anonymous_user_id`.
4. Table mal nommée : `player_elo_history` au lieu de `elo_history`.
5. Structure `matches` incompatible : pas de `winner_id`/`loser_id`, mais `team_a_player_ids[]` / `team_b_player_ids[]` + scores.

### Corrections appliquées (`src/hooks/useHomeData.ts`, `src/pages/Home.tsx`)
- Suppression de `.single()` → `.limit(1)` + check de longueur.
- Correction des noms de tables et colonnes.
- Refonte des stats personnelles (`elo_history`, winrate basé sur `elo_change > 0`).
- Try-catch global pour éviter les crashes.
- React Query : `retry: 1`, `refetchOnWindowFocus: false`.
- Suppression du blocage `hasIdentity` dans `Home.tsx`.

### Hotfix 2 : header et tournois créés
- Header global caché sur `/` quand l'utilisateur a une identité.
- Récupération des tournois CRÉÉS + PARTICIPÉS (sélection du plus récent).
- Suppression du champ `status` de la requête `leagues` (n'existait pas dans le schéma).

### Bug découvert : créateur non-participant
Les créateurs de tournois n'étaient pas auto-ajoutés comme participants. Workaround temporaire dans `useHomeData`. Solution définitive (recommandée) : trigger PG (devenu mig `007_auto_add_creator_as_participant.sql`).

---

## 2. Solution finale : authentification par mot de passe (dev accounts)

### Cause racine
Les comptes créés manuellement via SQL direct dans `auth.users` ne sont **pas reconnus** par Supabase Auth (erreurs 500 "Database error querying schema" / "Database error finding user"). Il manque les métadonnées internes que seule l'API Auth crée correctement.

### Solution
Créer les comptes via **Dashboard Supabase → Authentication → Users → Add user** avec **Auto Confirm User** activé. Comptes créés :
- `devadmin@test.com` / `admin123`
- `devtest@test.com` / `test123`

Code mis à jour : `AuthService.ts` (`TEST_ACCOUNTS`), `AuthModal.tsx` (liste), `DevPanel.tsx` (boutons "Login as Dev Admin" / "Login as Dev Test").

### Bonnes pratiques
- ❌ Ne jamais créer un user `auth.users` via SQL direct.
- ✅ Toujours utiliser le Dashboard, ou l'API `supabase.auth.admin.createUser()` (avec service role key) pour les scripts.

---

## 3. Solution résumé : fallback OTP (intermédiaire avant la solution finale)

Avant la migration vers la création via Dashboard, un fallback automatique vers OTP a été câblé dans `AuthService.ts` / `AuthModal.tsx` / `DevPanel.tsx` : si `signInWithPassword` échoue, l'app envoie un magic link à l'adresse de test. Cette logique reste utile en cas de provider password désactivé.

---

## 4. Recréer les comptes de test via Dashboard

Procédure officielle (toujours valable) :
1. Ouvrir [Supabase Dashboard](https://supabase.com/dashboard) → projet **beer-pong-league** → **Authentication → Users**.
2. Supprimer les anciens comptes éventuels (trois points → Delete user).
3. **Add user** avec :
   - Email + Password
   - **Auto Confirm User ✅**
4. Vérifier que les comptes apparaissent en `Confirmed`.
5. Tester la connexion via le DevPanel (`🧪` en bas à droite → "Login as Admin").

Alternative pour automatisation (script Node) :

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // SERVICE_ROLE, pas ANON
);

await supabase.auth.admin.createUser({
  email: 'admin@admin.com',
  password: 'admin123',
  email_confirm: true,
  user_metadata: { pseudo: '👨‍💻 Admin Dev' },
});
```

---

## 5. Guide : nettoyage et seed de la DB de dev

Référence : `supabase/scripts/CLEAN_AND_SEED_DB.sql`. Conserve les comptes de test, nettoie tout le reste, regénère un dataset cohérent (2 ligues, 4 tournois, 5 matchs, 4 anonymous users, historique ELO).

### Procédure
1. Pré-requis : les comptes test (`admin@admin.com`, `test@test.com`) doivent exister via Dashboard.
2. Supabase Dashboard → SQL Editor → New Query → coller le contenu de `CLEAN_AND_SEED_DB.sql` → Run.
3. Le script affiche un résumé final (utilisateurs trouvés, tables nettoyées, données créées).

### Données générées
- **Ligues** : `Ligue Elite Paris` (season, par Admin), `Ligue Amicale Lyon` (event, par Test).
- **Tournois** : Championnat Hiver (terminé, 3 matchs), Sprint Printemps (terminé), Fun & Friends (en cours), Beer Pong Masters 2026 (terminé, standalone).
- **Anonymous users** : Alex Pro, Jordan Fast, Sam Champion, Morgan Strong.
- **Matchs** : 3 tournois (1v1) + 2 casual ligue + historique ELO.

### ⚠️ Précautions
- Supprime toutes les données sauf les users de test — irréversible.
- À jour pour le schéma pré-mig 022/024 : les noms de tables (`tournaments`, `tournament_players`, `league_players`) sont obsolètes et le script doit être ré-aligné si on veut le rejouer aujourd'hui.
