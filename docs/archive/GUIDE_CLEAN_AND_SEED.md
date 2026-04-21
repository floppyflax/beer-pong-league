# 🧹 Guide : Nettoyage et Génération de Données de Test

Ce guide explique comment nettoyer la base de données et générer des données de test réalistes.

## 📋 Vue d'ensemble

Le script `CLEAN_AND_SEED_DB.sql` effectue les opérations suivantes :

1. ✅ **Conserve** les utilisateurs de test (`admin@admin.com` et `test@test.com`)
2. 🧹 **Nettoie** toutes les données existantes (matchs, tournois, ligues, etc.)
3. 🌱 **Génère** des données de test réalistes

## 🎯 Données générées

### Ligues (2)
- 🏆 **Ligue Elite Paris** (season) - créée par Admin
- 🎉 **Ligue Amicale Lyon** (event) - créée par Test User

### Tournois (4)
- 🎯 **Tournoi Championnat Hiver** (terminé, avec matchs, ligue Elite)
- ⚡ **Tournoi Sprint Printemps** (terminé, avec matchs, ligue Elite)
- 🎉 **Tournoi Fun & Friends** (en cours, ligue Amicale)
- 🔥 **Beer Pong Masters 2026** (terminé, standalone)

### Participants
- 2 utilisateurs authentifiés (admin@admin.com, test@test.com)
- 4 utilisateurs anonymes :
  - 🎯 Alex Pro
  - ⚡ Jordan Fast
  - 🔥 Sam Champion
  - 💪 Morgan Strong

### Matchs (5)
- 3 matchs de tournoi (format 1v1)
- 2 matchs casual dans une ligue
- Historique ELO complet pour les matchs principaux

## 🚀 Comment utiliser

### Prérequis

1. Les comptes test doivent exister dans Supabase :
   - `admin@admin.com` (password: admin123)
   - `test@test.com` (password: test123)

   Si ce n'est pas le cas, utilisez d'abord `CREATE_TEST_ACCOUNTS.sql`

### Étapes d'exécution

1. **Ouvrir Supabase Dashboard**
   - Aller sur https://supabase.com
   - Sélectionner le projet **beer-pong-league**

2. **Accéder au SQL Editor**
   - Dans le menu de gauche, cliquer sur **SQL Editor**
   - Cliquer sur **New Query**

3. **Copier le script**
   - Ouvrir le fichier `CLEAN_AND_SEED_DB.sql`
   - Copier tout le contenu

4. **Exécuter le script**
   - Coller le contenu dans le SQL Editor
   - Cliquer sur **Run** (ou `Cmd+Enter` / `Ctrl+Enter`)

5. **Vérifier l'exécution**
   - Le script affichera des messages de progression
   - À la fin, vous verrez un résumé des données créées

### Messages attendus

```
✅ Users de test trouvés:
   - admin@admin.com: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   - test@test.com: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

🧹 Nettoyage de la base de données...
   ✓ elo_history nettoyé
   ✓ matches nettoyé
   ✓ tournament_players nettoyé
   ✓ league_players nettoyé
   ✓ tournaments nettoyé
   ✓ leagues nettoyé
   ✓ user_identity_merges nettoyé
   ✓ anonymous_users nettoyé

✅ Nettoyage terminé

🌱 Création des données de test...
   ✓ 4 utilisateurs anonymes créés
   ✓ 2 ligues créées
   ✓ 6 joueurs ajoutés aux ligues
   ✓ 4 tournois créés (créateurs auto-ajoutés)
   ✓ 13 participants additionnels ajoutés aux tournois
   ✓ 3 matchs créés pour Tournoi 1
   ✓ 2 matchs casual créés pour Ligue 2
   ✓ Historique ELO créé pour les matchs

✅ =================================
✅ Génération des données terminée !
✅ =================================
```

## 🔍 Requêtes de vérification

Le script inclut des requêtes de vérification à la fin. Vous pouvez les exécuter séparément pour inspecter les données :

### Voir les ligues
```sql
SELECT 
  l.name,
  u.pseudo as creator,
  COUNT(DISTINCT lp.id) as players_count,
  COUNT(DISTINCT t.id) as tournaments_count
FROM leagues l
LEFT JOIN users u ON l.creator_user_id = u.id
LEFT JOIN league_players lp ON l.id = lp.league_id
LEFT JOIN tournaments t ON l.id = t.league_id
GROUP BY l.id, l.name, u.pseudo
ORDER BY l.created_at;
```

### Voir les tournois
```sql
SELECT 
  t.name,
  t.date,
  t.is_finished,
  l.name as league_name,
  COUNT(DISTINCT tp.id) as participants_count,
  COUNT(DISTINCT m.id) as matches_count
FROM tournaments t
LEFT JOIN leagues l ON t.league_id = l.id
LEFT JOIN tournament_players tp ON t.id = tp.tournament_id
LEFT JOIN matches m ON t.id = m.tournament_id
GROUP BY t.id, t.name, t.date, t.is_finished, l.name
ORDER BY t.date DESC;
```

### Voir le leaderboard
Le script affiche automatiquement le leaderboard de la "Ligue Elite Paris" avec :
- Nom des joueurs
- Nombre de matchs joués
- Nombre de victoires
- ELO actuel

## 🧪 Tester dans l'application

Après avoir exécuté le script :

1. **Se connecter en tant qu'Admin**
   ```
   Email: admin@admin.com
   Password: admin123
   ```

2. **Vérifier les données**
   - Voir les 2 ligues créées
   - Voir les 4 tournois (3 terminés, 1 en cours)
   - Consulter les matchs et l'historique ELO

3. **Se connecter en tant qu'Test User**
   ```
   Email: test@test.com
   Password: test123
   ```

4. **Tester les fonctionnalités**
   - Rejoindre le tournoi "Fun & Friends" en cours
   - Créer un nouveau match casual dans la ligue
   - Voir les statistiques et le classement

## ⚠️ Notes importantes

- ⚠️ **Ce script supprime TOUTES les données** sauf les users de test
- ⚠️ **Irréversible** : assurez-vous de vouloir vraiment nettoyer la DB
- ✅ Les users de test (`admin@admin.com` et `test@test.com`) sont préservés
- ✅ Les données générées sont cohérentes (dates, scores, ELO)
- ✅ Peut être exécuté plusieurs fois sans problème

## 🔄 Réexécution

Vous pouvez réexécuter le script autant de fois que nécessaire :
- Il nettoiera les données précédentes
- Il régénérera des données fraîches
- Les IDs changeront mais la structure restera la même

## 📊 Structure des données

```
Users de test (conservés)
├── admin@admin.com
│   ├── Créateur de la Ligue Elite Paris
│   ├── Créateur de 3 tournois
│   └── Participant à 4 tournois
│
└── test@test.com
    ├── Créateur de la Ligue Amicale Lyon
    ├── Créateur de 1 tournoi
    └── Participant à 3 tournois

Utilisateurs anonymes (générés)
├── 🎯 Alex Pro
├── ⚡ Jordan Fast
├── 🔥 Sam Champion
└── 💪 Morgan Strong

Ligues
├── 🏆 Ligue Elite Paris (4 joueurs, 2 tournois)
└── 🎉 Ligue Amicale Lyon (2 joueurs, 1 tournoi)

Tournois
├── 🎯 Championnat Hiver (terminé, 4 joueurs, 3 matchs)
├── ⚡ Sprint Printemps (terminé, 4 joueurs, 0 matchs)
├── 🎉 Fun & Friends (en cours, 3 joueurs, 0 matchs)
└── 🔥 Beer Pong Masters (terminé, 6 joueurs, 0 matchs)
```

## 🐛 Dépannage

### Erreur : "Les comptes test n'existent pas"
**Solution** : Exécutez d'abord `CREATE_TEST_ACCOUNTS.sql` pour créer les comptes

### Erreur : "Foreign key violation"
**Solution** : Le script gère les dépendances automatiquement. Si l'erreur persiste, vérifiez que la structure de la DB correspond aux migrations

### Les données ne s'affichent pas dans l'app
**Solution** : 
1. Rafraîchissez la page (Cmd+R / Ctrl+R)
2. Déconnectez-vous et reconnectez-vous
3. Videz le cache du navigateur

### Je veux des données différentes
**Solution** : Modifiez le script `CLEAN_AND_SEED_DB.sql` :
- Changez les noms des tournois/ligues
- Ajoutez plus de participants
- Créez plus de matchs
- Ajustez les dates

## 📚 Fichiers associés

- `CLEAN_AND_SEED_DB.sql` - Le script principal
- `CREATE_TEST_ACCOUNTS.sql` - Création des comptes test
- `DEV_TEST_ACCOUNTS_SETUP.md` - Guide des comptes test

## ✅ Checklist avant exécution

- [ ] Les comptes test existent (admin@admin.com, test@test.com)
- [ ] Vous êtes prêt à supprimer toutes les données existantes
- [ ] Vous avez accès au Supabase Dashboard
- [ ] Vous avez lu et compris ce guide

---

**🎉 Prêt à démarrer ?** Exécutez le script et profitez de vos données de test !
