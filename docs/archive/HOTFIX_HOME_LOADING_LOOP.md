# Hotfix: Résolution de la boucle infinie sur la Home Page

## Problème
La page Home chargeait en boucle infinie, causant de multiples appels API répétés.

## Causes Identifiées

### 1. Utilisation de `.single()` sans gestion d'erreur
Les requêtes Supabase avec `.single()` lancent une erreur quand il n'y a pas de résultat, causant une boucle infinie avec React Query.

### 2. Noms de tables incorrects
- ❌ `league_members` (n'existe pas)
- ✅ `league_players` (table correcte)

### 3. Noms de colonnes incorrects  
- ❌ `player_id` (n'existe pas)
- ✅ `user_id` et `anonymous_user_id` (colonnes correctes)

### 4. Table elo_history mal nommée
- ❌ `player_elo_history` (n'existe pas)
- ✅ `elo_history` (table correcte)

### 5. Structure matches incompatible
La table `matches` n'a pas de colonnes `winner_id`/`loser_id`, mais utilise:
- `team_a_player_ids` / `team_b_player_ids` (arrays)
- `score_a` / `score_b`

## Corrections Appliquées

### `src/hooks/useHomeData.ts`

1. **Suppression de `.single()`**: Utilisation de `.limit(1)` + vérification de longueur
2. **Correction des noms de tables**: `league_members` → `league_players`
3. **Correction des colonnes**: `player_id` → `user_id`
4. **Refonte des stats personnelles**: 
   - Utilisation de `elo_history` au lieu de `player_elo_history`
   - Calcul du winrate basé sur `elo_change > 0` (indicateur de victoire)
   - Calcul de l'ELO moyen à partir de `elo_after`
5. **Ajout de gestion d'erreur**: Try-catch global pour éviter les crashes
6. **Configuration React Query**: 
   - `retry: 1` (limite les tentatives)
   - `refetchOnWindowFocus: false` (évite les refetch intempestifs)

### `src/pages/Home.tsx`

1. **Suppression de la vérification `hasIdentity`** qui bloquait le rendu
2. **Simplification du flux de rendu**: Le composant rend toujours, même avec userId=null

## Résultat Attendu

La page Home devrait maintenant:
- ✅ Charger une seule fois au lieu de boucler
- ✅ Afficher l'état vide pour les nouveaux utilisateurs
- ✅ Afficher le dashboard avec les dernières données pour les utilisateurs actifs
- ✅ Gérer gracieusement les erreurs sans crasher

## Tests

Les 64 tests unitaires de Story 10.1 passent toujours:
- ✅ LastTournamentCard: 13 tests
- ✅ LastLeagueCard: 13 tests
- ✅ PersonalStatsSummary: 13 tests
- ✅ NewUserWelcome: 11 tests
- ✅ useHomeData: 5 tests
- ✅ Home: 9 tests

## Hotfix 2: Header et Affichage des Tournois Créés

### Problèmes Additionnels
1. **Header toujours visible** sur la page Home alors qu'elle devrait avoir son propre header intégré
2. **Tournois créés non affichés**: Le hook ne cherchait que les tournois où l'utilisateur PARTICIPE, pas ceux qu'il a CRÉÉS
3. **Champ `status` inexistant**: La table `leagues` n'a pas de colonne `status`

### Corrections Supplémentaires

#### `src/App.tsx`
- Ajout d'une condition `!isHomePage` pour cacher le header global sur `/` quand l'utilisateur a une identité
- La Home page affiche maintenant son propre header intégré

#### `src/hooks/useHomeData.ts`
- **Tournois**: Récupération des tournois CRÉÉS + PARTICIPÉS, puis sélection du plus récent
- **Leagues**: Récupération des leagues CRÉÉES + JOINTES, puis sélection de la plus récente  
- **Fix colonne `status`**: Supprimée de la requête leagues (n'existe pas dans le schéma), retourne 'active' par défaut

## Bug Découvert: Créateur Non-Participant

### Problème Identifié
Lors des tests de la Home page, nous avons découvert que **les créateurs de tournois ne sont PAS automatiquement ajoutés comme participants**.

**Impact:**
- Les tournois créés n'apparaissent pas dans "Mon dernier tournoi" sur le dashboard
- Le créateur doit manuellement "rejoindre" son propre tournoi
- Mauvaise UX

### Solution Proposée
**Story 8.6 créée**: Auto-add Tournament Creator as Participant

Deux approches possibles:
1. **Application-level**: Modifier `DatabaseService.createTournament()` pour ajouter le créateur dans `tournament_players`
2. **Database trigger** (RECOMMANDÉ): Trigger PostgreSQL qui ajoute automatiquement le créateur après l'INSERT du tournoi

**Recommandation:** Utiliser un trigger database pour:
- ✅ Opération atomique
- ✅ Fonctionne pour tous les clients
- ✅ Ne peut pas être oublié

### Workaround Temporaire (Appliqué dans Hotfix 2)
Le hook `useHomeData` cherche maintenant les tournois CRÉÉS **OU** PARTICIPÉS pour afficher le dernier tournoi de l'utilisateur.

## Dates
- Hotfix 1: 2026-02-04 23:50
- Hotfix 2: 2026-02-05 00:10
- Story 8.6 créée: 2026-02-05 00:15
