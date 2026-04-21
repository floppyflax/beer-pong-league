# Roadmap & vision produit

État consolidé du produit : vision, personas, fonctionnalités livrées, en cours et backlog. Pour le détail technique d'une feature, se référer aux autres docs du dossier.

## Vision

Transformer les soirées beer-pong en mini-championnats persistants. Combiner la spontanéité d'une soirée entre potes avec la profondeur d'un classement ELO individuel et durable, sans sacrifier la simplicité d'entrée pour les joueurs occasionnels.

## Objectifs

### Utilisateur
- Jouer et enregistrer ses matchs sans friction (QR code, identité locale).
- Créer/rejoindre des ligues et événements entre amis.
- Suivre son ELO individuel dans le temps.
- Partager résultats et classements.

### Produit
- Viralité intrinsèque : chaque joueur invite d'autres joueurs.
- UX fluide et visuellement engageante.
- Engagement dans la durée via saisons et progression.
- Extension possible vers formats sponsorisés (bars, BDE, festivals).

## Personas

### Principal : "Le pote compétitif" (20-35 ans)
Étudiant ou jeune actif qui joue régulièrement en soirée. Aime la compétition, les stats, et battre ses potes. Utilise son smartphone en soirée pour organiser.

### Secondaires
- **L'organisateur** : crée les ligues, gère les invitations, affiche les résultats sur écran de projection.
- **Le casual player** : participe ponctuellement, cherche juste le fun, ne veut pas créer de compte.

## Fonctionnalités

Légende : [x] livré · [~] en cours · [ ] backlog

### Identité & comptes
- [x] Identité locale anonyme (UUID + localStorage + device fingerprint).
- [x] Authentification email + OTP (Supabase Auth).
- [x] Fusion identité anonyme → compte authentifié.
- [x] Comptes de test dev (`admin@admin.com`, `test@test.com`).
- [x] Mode offline-first avec fallback localStorage.
- [ ] Avatar utilisateur.
- [ ] Suppression de compte avec anonymisation.

### Ligues
- [x] Création (nom, type `event` / `season`).
- [x] Dashboard league (classement, historique, tournois).
- [x] Ajout de joueur.
- [x] Enregistrement de match.
- [x] Système ELO individuel (K-factor 32 puis 16).
- [x] Anti-cheat optionnel (confirmation de match).
- [ ] Modification / suppression de league.
- [ ] Suppression / modification de joueur.
- [ ] Export (JSON, CSV, PDF, image).
- [ ] Partage par lien / QR code.
- [ ] Onglet Statistiques détaillées.
- [ ] Onglet Paramètres (règles ELO personnalisées, visibilité).

### Tournois
- [x] Création (nom, date, lien optionnel à une league).
- [x] Dashboard tournoi (classement local/global).
- [x] Marquer terminé / en cours.
- [x] Invitation par QR code (page `TournamentInvite`).
- [x] Join via QR (page `TournamentJoin`).
- [x] Vue projection live (`TournamentDisplayView`).
- [x] Formats 1v1 / 2v2 / 3v3.
- [ ] Modification / suppression tournoi.
- [ ] Génération de brackets (élimination directe).
- [ ] Partage résultats / podium final.

### Profils joueurs
- [x] Profil joueur avec stats (ELO, W/L, matchs).
- [x] Profil utilisateur authentifié (`UserProfile`).
- [ ] Graphique d'évolution ELO.
- [ ] Comparaison joueur vs joueur.
- [ ] Tête-à-tête détaillé.
- [ ] Badges / achievements.
- [ ] Historique complet des matchs avec filtres.

### Paiements & Premium
- [x] Intégration Stripe Checkout (edge functions Supabase).
- [x] Paywall création au-delà des limites gratuites.
- [x] Mode simulation dev.
- [x] Pages `payment-success` et `payment-cancel`.
- [ ] Webhook Stripe pour synchronisation DB (remplacer la MAJ localStorage actuelle).
- [ ] Badge Premium visible dans l'UI.
- [ ] Gestion des abonnements récurrents (actuellement paiement unique).

### UX / Design (Epic 14)
- [x] Refonte du design system (couleurs, typo, gradient tokens).
- [x] Landing page refondue.
- [x] Composants `HelpCard`, `PlayerCard`.
- [x] Pages tournois refondues.
- [x] Déconnexion depuis le profil.
- [x] Escape key + focus trap sur les modales.
- [x] Avatar fallback via `onError`.
- [ ] Menu drawer avec accès rapide ligues/tournois.
- [ ] Bottom navigation mobile.
- [ ] Recherche globale (joueurs, ligues, tournois).
- [ ] Animations (confettis victoires, transitions).

### Tests & qualité
- [x] 47 tests unitaires Vitest (services, hooks, utils, composants).
- [x] 18 tests d'intégration (auth flow, identity merge).
- [x] 25 tests E2E Playwright (anonyme, auth, merge).
- [x] Guide tests manuels (25+ scénarios).
- [ ] Mesure systématique de la couverture de code (> 80% auth/identity).
- [ ] CI GitHub Actions (lint + unit sur PR, E2E en nightly).

## Backlog long terme

### Social & viralité
- Système d'invitations avec récompenses.
- Défis entre joueurs.
- Classements publics globaux.
- Partage automatique des highlights sur réseaux.

### Gamification avancée
- Système de niveaux.
- Saisons avec playoffs.
- Événements spéciaux / tournois sponsorisés.
- Récompenses premium.

### Analytics avancés
- Prédictions de matchs.
- Recommandations de matchmaking.
- Tendances et insights par période.

### Collaboration
- Équipes fixes avec capitaines.
- Transferts de joueurs entre saisons.

## Questions ouvertes

1. Limiter la création d'anonymous users par device (anti-spam) ?
2. Avatar dès V2 ou plus tard ?
3. Notifications push réservées aux comptes authentifiés ?
4. Export des stats avant revendication autorisé ?

## Métriques de succès visées

- Taux d'onboarding (% qui rejoignent un tournoi après scan QR) : > 80%.
- Taux de revendication (anonymous → compte) : > 20% après 30 jours.
- Temps moyen d'onboarding : < 30 secondes.
- Taux d'erreur sur les fusions d'identité : < 1%.
