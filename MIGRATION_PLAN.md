# Plan de Migration : localStorage → Supabase

## État actuel
- **Stockage** : localStorage uniquement
- **Clés** : `bpl_leagues`, `bpl_tournaments`, `bpl_current_league_id`, `bpl_current_tournament_id`
- **Structure** : Données imbriquées (players et matches dans League/Tournament)

## État cible
- **Stockage** : Supabase (PostgreSQL)
- **Tables existantes** :
  - `leagues` - Informations de base des leagues
  - `tournaments` - Informations de base des tournois
  - `matches` - Matchs (liés à league ou tournament)
  - `league_players` - Joueurs dans une league
  - `tournament_players` - Joueurs dans un tournoi
  - `elo_history` - Historique des changements ELO
- **Structure** : Données normalisées (relations)

## Plan d'action

### Phase 1 : Service de synchronisation (DatabaseService)
1. Créer `DatabaseService` pour gérer les opérations CRUD
2. Transformer les données entre format app (imbriqué) et format DB (normalisé)
3. Implémenter les méthodes :
   - `loadLeagues()` - Charger depuis Supabase
   - `loadTournaments()` - Charger depuis Supabase
   - `saveLeague()` - Sauvegarder une league
   - `saveTournament()` - Sauvegarder un tournoi
   - `saveMatch()` - Sauvegarder un match
   - `deleteLeague()` - Supprimer une league
   - `deleteTournament()` - Supprimer un tournoi

### Phase 2 : Migration des données existantes
1. Détecter les données localStorage
2. Transformer et insérer dans Supabase
3. Marquer comme migré pour éviter les doublons
4. Conserver localStorage comme cache/fallback

### Phase 3 : Modification de LeagueContext
1. Remplacer les appels localStorage par DatabaseService
2. Charger depuis Supabase au démarrage
3. Sauvegarder dans Supabase à chaque modification
4. Gérer les erreurs (offline, conflits)

### Phase 4 : Gestion offline-first
1. Utiliser localStorage comme cache
2. Synchroniser en arrière-plan quand Supabase disponible
3. Gérer les conflits de synchronisation

### Phase 5 : Tests et validation
1. Tester la migration des données existantes
2. Tester les opérations CRUD
3. Tester le mode offline
4. Valider la synchronisation

## Structure des données

### Format App (actuel)
```typescript
League {
  id, name, type, createdAt,
  players: Player[],
  matches: Match[],
  tournaments: string[]
}
```

### Format DB (Supabase)
- `leagues` : id, name, type, created_at, creator_user_id, creator_anonymous_user_id
- `league_players` : id, league_id, user_id, anonymous_user_id, pseudo_in_league, elo, wins, losses, matches_played, streak
- `matches` : id, league_id, tournament_id, team_a_player_ids, team_b_player_ids, score_a, score_b, created_at
- `elo_history` : id, match_id, user_id, anonymous_user_id, elo_before, elo_after, elo_change

## Notes importantes
- Les `Player` dans l'app sont en fait des `league_players` ou `tournament_players` dans la DB
- Les stats ELO sont calculées dynamiquement ou stockées dans `elo_history`
- Le système doit rester fonctionnel même si Supabase n'est pas disponible (offline-first)

