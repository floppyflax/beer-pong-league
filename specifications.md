# PRD — Application Beer Pong League

1. Vision produit

Créer une application mobile simple, fun et compétitive qui transforme les soirées de beer-pong en véritables championnats entre amis, sur la durée ou le temps d’un événement ponctuel.
L’app doit combiner la spontanéité d’une soirée entre potes avec la profondeur d’un classement ELO individuel et persistant.

Objectif :
Donner une dimension sociale et compétitive à un jeu festif, en permettant aux utilisateurs de suivre leurs performances, d’organiser des ligues ou événements, et de comparer leurs classements dans le temps.

2. Objectifs clés

Objectifs utilisateurs
- Jouer et enregistrer facilement leurs matchs, sans friction.
- Créer et rejoindre des ligues/événements entre amis.
- Suivre leur classement individuel basé sur un système ELO/Glicko.
- Partager les résultats et classements sur leurs réseaux.
- Revivre les moments forts : streaks, badges, classements par saison.

Objectifs produit
- Créer une app virale par nature (chaque joueur en invite d’autres).
- Offrir une UX fluide et visuellement engageante.
- Maintenir l’engagement dans le temps via un système de progression et de saisons.
- Permettre une extension naturelle vers des formats sponsorisés ou communautaires (bars, BDE, festivals).

3. Personas & contextes d’usage

Persona principal : “Le pote compétitif” (20–35 ans, étudiant ou jeune actif)
- Joue régulièrement au beer-pong en soirée ou en afterwork.
- Aime la compétition, les stats, et battre ses amis.
- Utilise son smartphone en soirée pour organiser les activités et poster sur les réseaux.

Personas secondaires :
- L’organisateur : crée les ligues, gère les invitations, affiche les résultats sur écran.
- Le casual player : participe ponctuellement à des événements, cherche juste le fun.

4. Fonctionnalités principales (MVP)

4.1. Création et gestion de ligues / événements
- Création d’un championnat (nom, type, durée).
- Deux modes :
  - Événement ponctuel : classement local, reset après la soirée.
  - Ligue récurrente : classement persistant sur plusieurs semaines/mois.
- Génération d’un lien ou QR code d’invitation.
- Gestion de la liste des joueurs.

4.2. Enregistrement des matchs
- Choix du format : 1v1, 2v2, ou 3v3.
- Sélection des joueurs ou équipes depuis la ligue.
- Saisie rapide du score final (optionnel : écart de points).
- Validation du match par les deux équipes (confirmation simple).
- Mise à jour automatique du classement ELO individuel.

4.3. Classement et profil joueur
- Classement global de la ligue / événement.
- Fiche joueur : Rating ELO/Glicko, Stats (V/D, streaks), Historique.
- Évolution graphique dans le temps.

4.4. Social & engagement
- Partage du classement ou d’un match sur réseaux.
- Notifications push (classement, défis).
- Badges et trophées.

4.5. Modes de jeu
- Classé : impacte le rating individuel.
- Fun / amical : sans impact.

5. Parcours utilisateur (UX)
(Voir détail PRD original)

6. Règles de calcul du classement
- Système ELO individuel.
- Rating équipe = moyenne des membres.
- Facteur K ajusté (32 au début, 16 ensuite).

7. Saisons et événements
- Événement unique ou Saison longue.

8. Design et tonalité
- Fun, compétitif, énergique.
- UX fluide et rapide.

9. Monétisation (post-MVP)
- Freemium / Sponsoring / Marketplace.

10. Indicateurs de succès
- Engagement, Viralité, Satisfaction.

---

## 11. Gestion de l'identité & comptes joueurs (V2)

**Voir PRD détaillé :** `PRD_IDENTITY_MANAGEMENT.md`

### 11.1. Objectif
Permettre aux utilisateurs de jouer instantanément sans compte (identité locale) tout en offrant la possibilité de créer un compte Supabase pour synchroniser leurs stats entre appareils.

### 11.2. Fonctionnalités clés
- **Identité locale** : UUID anonyme stocké dans localStorage, permet de jouer immédiatement
- **Rejoindre via QR code** : Scan → rejoindre Tournament/League instantanément
- **Revendication de compte** : Optionnel, via email + OTP Supabase
- **Sync multi-device** : Une fois le compte créé, stats synchronisées
- **Zero-friction** : Aucune barrière d'entrée pour les casual players

### 11.3. Architecture technique
- **Backend** : Supabase (PostgreSQL + Auth)
- **Frontend** : React + localStorage (offline-first)
- **Sync** : Hybride (localStorage ↔ Supabase)
- **Auth** : Supabase Auth avec OTP (magic link)

### 11.4. Statut
- **Phase** : À implémenter (V2)
- **Priorité** : Haute (améliore significativement l'UX)
- **Dépendances** : Setup Supabase, migrations DB
