# 🍺 Beer Pong League - Roadmap des Fonctionnalités

## 📱 Navigation & Structure

### Menu Principal (Drawer/Sidebar)

- **Accès rapide aux Leagues** (liste avec recherche)
- **Accès rapide aux Tournois** (liste avec filtres : en cours/terminés)
- **Créer une League** (bouton rapide)
- **Créer un Tournoi** (bouton rapide)
- **Statistiques Globales** (vue d'ensemble de toutes les stats)
- **Paramètres** (configuration app)

---

## 🏆 Pages & Vues Principales

### 1. Page Home/Dashboard

- Vue d'ensemble des Leagues et Tournois actifs
- Statistiques globales (total matchs, joueurs, etc.)
- Accès rapide aux actions fréquentes
- Widgets de stats personnelles (si utilisateur identifié)

### 2. League Dashboard

**Onglets :**

- **Classement** (actuel)
- **Historique** (actuel)
- **Tournois** (actuel)
- **Joueurs** (nouveau - gestion complète)
- **Statistiques** (nouveau - graphiques, tendances)
- **Paramètres** (nouveau - configuration)

**Actions disponibles :**

- ✅ Ajouter un joueur
- ✅ Enregistrer un match
- ✅ Créer un tournoi
- ⚠️ Modifier la League (nom, type, description)
- ⚠️ Supprimer la League
- ⚠️ Exporter les données (JSON, CSV)
- ⚠️ Partager la League (lien, QR code)
- ⚠️ Archiver la League
- ⚠️ Voir les statistiques détaillées

### 3. Tournament Dashboard

**Onglets :**

- **Classement** (local/global - actuel)
- **Historique** (nouveau - matchs du tournoi)
- **Statistiques** (nouveau - stats du tournoi)
- **Paramètres** (nouveau - configuration)

**Actions disponibles :**

- ✅ Ajouter un joueur (si lié à une League)
- ✅ Enregistrer un match (si en cours)
- ✅ Marquer comme terminé/en cours
- ⚠️ Modifier le tournoi (nom, date, joueurs)
- ⚠️ Supprimer le tournoi
- ⚠️ Exporter les résultats
- ⚠️ Partager le tournoi (lien, QR code)
- ⚠️ Voir le podium final (si terminé)

### 4. Player Profile Page (NOUVEAU)

**Informations :**

- Nom, avatar (optionnel)
- ELO actuel et historique
- Statistiques globales (toutes Leagues/Tournois)
- Statistiques par League
- Graphique d'évolution ELO dans le temps
- Historique des matchs
- Badges/Achievements
- Rivalités (joueurs les plus joués contre)
- Tête-à-tête (stats contre chaque joueur)

**Actions :**

- ⚠️ Modifier le nom
- ⚠️ Supprimer le joueur (avec confirmation)
- ⚠️ Voir tous les matchs du joueur
- ⚠️ Comparer avec un autre joueur

---

## ⚙️ Actions & Fonctionnalités Détaillées

### Gestion des Leagues

#### Création/Modification

- Nom de la League
- Type (Continue / Par Saison)
- Description (optionnel)
- Date de début/fin (pour saisons)
- Paramètres ELO (K-factor personnalisé ?)
- Règles personnalisées (optionnel)

#### Gestion des Joueurs

- ✅ Ajouter un joueur
- ⚠️ Modifier un joueur (nom)
- ⚠️ Supprimer un joueur (avec gestion des matchs existants)
- ⚠️ Importer des joueurs (CSV, liste)
- ⚠️ Fusionner des joueurs (si doublons)
- ⚠️ Réinitialiser les stats d'un joueur
- ⚠️ Voir le profil d'un joueur

#### Gestion des Matchs

- ✅ Enregistrer un match
- ⚠️ Modifier un match (corriger une erreur)
- ⚠️ Supprimer un match (avec recalcul ELO)
- ⚠️ Annuler le dernier match (undo)
- ⚠️ Voir les détails d'un match
- ⚠️ Filtrer les matchs (par joueur, date, format)
- ⚠️ Exporter l'historique

#### Partage & Invitation

- ⚠️ Générer un lien de partage
- ⚠️ Générer un QR code
- ⚠️ Inviter par email/SMS (si backend)
- ⚠️ Partager sur réseaux sociaux (image du classement)

### Gestion des Tournois

#### Création/Modification

- Nom du tournoi
- Date
- Association à une League (ou autonome)
- Sélection des joueurs participants
- Format du tournoi (élimination directe, round-robin, etc.)
- Règles spécifiques

#### Actions

- ✅ Marquer comme terminé/en cours
- ⚠️ Modifier les paramètres
- ⚠️ Ajouter/retirer des joueurs
- ⚠️ Réinitialiser le classement local
- ⚠️ Générer un bracket (si format tournoi)

### Statistiques & Analytics

#### Vue Globale

- Nombre total de matchs joués
- Nombre total de joueurs
- Nombre de Leagues/Tournois
- Joueur le plus actif
- Plus long streak
- Plus gros gain/perte ELO en un match

#### Par League

- Graphique d'évolution ELO (tous joueurs)
- Taux de participation
- Matchs les plus serrés
- Rivalités (paires de joueurs qui jouent souvent)
- Distribution des scores
- Tendances temporelles

#### Par Tournoi

- Classement final
- Podium
- Matchs les plus importants
- Évolution du classement pendant le tournoi
- Statistiques par format (1v1, 2v2, 3v3)

#### Par Joueur

- Évolution ELO dans le temps (graphique)
- Stats par format de jeu
- Tête-à-tête contre chaque adversaire
- Performance par période (semaine, mois)
- Records personnels
- Badges obtenus

### Badges & Achievements (FUTUR)

#### Badges de Performance

- "Premier Match" - Jouer son premier match
- "10 Victoires" - Atteindre 10 victoires
- "Streak Master" - 5 victoires d'affilée
- "Comeback King" - Gagner après être en retard
- "ELO 1200" - Atteindre 1200 ELO
- "Invincible" - 10 matchs sans défaite
- "Marathon" - 50 matchs joués
- "Champion" - Gagner un tournoi
- "Rival" - Jouer 10 fois contre le même joueur

#### Badges de Participation

- "Organisateur" - Créer 5 Leagues
- "Social" - Inviter 10 joueurs
- "Fidèle" - Jouer dans 10 tournois différents

### Modes de Jeu (FUTUR)

#### Match Classé

- Impacte le ELO
- Compte dans les stats
- Visible dans l'historique

#### Match Amical

- N'impacte pas le ELO
- Compte dans les stats (séparément)
- Option "juste pour le fun"

#### Match d'Entraînement

- N'impacte rien
- Pour tester des équipes

### Export & Partage

#### Formats d'Export

- JSON (données brutes)
- CSV (pour Excel)
- PDF (rapport formaté)
- Image (classement, stats)

#### Partage

- Lien de partage (si backend)
- QR code pour rejoindre
- Image du classement
- Story Instagram/Facebook
- Export vers calendrier

### Paramètres & Configuration

#### Paramètres de l'App

- Thème (sombre/clair)
- Langue
- Notifications (si backend)
- Sauvegarde automatique
- Export automatique

#### Paramètres de League

- Nom, type, description
- Règles ELO personnalisées
- Visibilité (publique/privée)
- Permissions (qui peut ajouter des matchs)

#### Paramètres de Tournoi

- Nom, date, description
- Format du tournoi
- Règles spécifiques
- Visibilité

---

## 🎨 Améliorations UX/UI

### Navigation

- **Menu Drawer** (hamburger) avec accès rapide
- **Bottom Navigation** (mobile) pour actions principales
- **Breadcrumbs** pour navigation hiérarchique
- **Recherche globale** (joueurs, leagues, tournois)

### Actions Rapides

- **FAB (Floating Action Button)** contextuel selon la page
- **Swipe actions** sur les listes (supprimer, modifier)
- **Actions groupées** (sélection multiple)

### Feedback & Animations

- ✅ Animation ELO changes (déjà fait)
- ⚠️ Confettis pour victoires importantes
- ⚠️ Animations de transition
- ⚠️ Loading states
- ⚠️ Messages de succès/erreur

### Responsive Design

- Mobile-first (déjà fait)
- Tablette optimisée
- Desktop avec sidebar

---

## 🔮 Fonctionnalités Futures (Post-MVP)

### Social & Viralité

- Système d'invitations avec récompenses
- Défis entre joueurs
- Classements publics
- Leaderboards globaux
- Partage automatique des highlights

### Gamification Avancée

- Système de niveaux
- Progression par saison
- Événements spéciaux
- Tournois sponsorisés
- Récompenses/badges premium

### Analytics Avancés

- Prédictions de matchs
- Analyse de performance
- Recommandations de matchmaking
- Tendances et insights

### Collaboration

- Équipes fixes
- Capitaines d'équipe
- Transferts de joueurs
- Saisons avec playoffs

---

## 📋 Priorités d'Implémentation

### Phase 1 - Navigation & Structure (URGENT)

1. Menu drawer avec accès rapide
2. Page de profil joueur
3. Onglet Paramètres dans League/Tournament
4. Amélioration de la navigation

### Phase 2 - Actions Manquantes (IMPORTANT)

1. Modifier League/Tournament
2. Modifier/Supprimer joueur
3. Modifier/Supprimer match
4. Export de données
5. Partage (lien, QR code)

### Phase 3 - Statistiques (NICE TO HAVE)

1. Graphiques d'évolution ELO
2. Statistiques détaillées
3. Comparaisons joueurs
4. Vue d'ensemble globale

### Phase 4 - Gamification (FUTUR)

1. Badges système
2. Achievements
3. Modes de jeu (amical, entraînement)
4. Social features

---

## 🎯 Structure de Navigation Proposée

```
Home
├── Mes Leagues
│   ├── League 1
│   │   ├── Classement
│   │   ├── Historique
│   │   ├── Tournois
│   │   ├── Joueurs
│   │   ├── Statistiques
│   │   └── Paramètres
│   └── League 2...
├── Mes Tournois
│   ├── Tournoi 1
│   │   ├── Classement
│   │   ├── Historique
│   │   ├── Statistiques
│   │   └── Paramètres
│   └── Tournoi 2...
├── Profils Joueurs
│   └── Joueur X
│       ├── Vue d'ensemble
│       ├── Statistiques
│       ├── Historique
│       └── Graphiques
└── Statistiques Globales
    ├── Vue d'ensemble
    ├── Graphiques
    └── Records
```

---

## 💡 Notes d'Implémentation

### Menu Drawer

- S'ouvre depuis le header (icône hamburger)
- Liste des Leagues avec recherche
- Liste des Tournois avec filtres
- Actions rapides en bas
- Overlay sombre quand ouvert

### Actions Contextuelles

- Menu "..." sur chaque item (League, Tournament, Player, Match)
- Actions selon le contexte
- Confirmation pour actions destructives

### Modals & Overlays

- Modals pour modifications
- Bottom sheets pour actions rapides (mobile)
- Toasts pour feedback

### Performance

- Lazy loading des graphiques
- Pagination pour longues listes
- Cache des calculs de stats


