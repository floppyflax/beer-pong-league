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

---

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
- [x] Dashboard league (classement, historique, événements liés).
- [x] Ajout de joueur.
- [x] Modification du nom d'un joueur (inline edit dans Paramètres).
- [x] Suppression de joueur.
- [x] Suppression de league.
- [x] Enregistrement de match.
- [x] Système ELO individuel (K-factor 32 puis 16).
- [x] Anti-cheat optionnel (confirmation de match).
- [x] Export données (JSON complet + CSV joueurs + CSV matchs).
- [ ] Partage par lien / QR code.
- [ ] Onglet Statistiques détaillées (win streak, top scorers, head-to-head **par contexte** — pas d'ELO global agrégé).
- [ ] Paramètres avancés (règles ELO personnalisées, visibilité publique/privée).

### Événements
- [x] Création (nom, date, lien optionnel à une league).
- [x] Dashboard événement (classement local/global).
- [x] Marquer terminé / en cours.
- [x] Invitation par QR code (page `TournamentInvite`).
- [x] Rejoindre via QR ou code (page `TournamentJoin`, `Join`).
- [x] Vue projection live (`TournamentDisplayView`) — variants Split et Drama.
- [x] Formats 1v1 / 2v2 / 3v3.
- [ ] Modification / suppression d'un événement.
- [ ] Génération de brackets (élimination directe).
- [ ] Partage résultats / podium final (image partageable).

### Profils joueurs
- [x] Profil joueur avec stats (ELO, W/L, matchs, streak).
- [x] Profil utilisateur authentifié (`UserProfile`).
- [x] Graphique d'évolution ELO (`EloChart` — calculé depuis les matchs).
- [x] Tête-à-tête (top 5 adversaires avec W/L).
- [x] Succès / achievements (3 MVP : Premier match, 5 victoires, En feu !).
- [ ] Évolution ELO persistée en DB (actuellement calculée à la volée).
- [ ] Comparaison joueur vs joueur (`/compare/:id1/:id2`).
- [ ] Historique complet des matchs avec filtres.

### Classement
- [x] Classement par événement (dashboard événement).
- [x] Classement par league (dashboard league — LeaderRow + Podium).
- [x] Page `/leaderboard` (« Stats globales ») — classement par activité (matchs / wins / win rate). **Pas de classement ELO global** (cf. `architecture.md` §Modèle ELO : l'ELO n'est calibré que par contexte).
- [ ] Classements publics par contexte (visibles sans compte).
- [ ] Filtres saison / période.

#### ✅ Event ELO indépendant (mig 023)
L'invariant produit est désormais implémenté : chaque match dans un événement met à jour le ELO de l'événement, et propage optionnellement vers la ligue selon le paramétrage `propagates_to_league_elo`.

- [x] Migration 023 : `tournament_memberships.elo` (default 1000) + W/L/streak/matches_played + index.
- [x] `tournaments.propagates_to_league_elo BOOLEAN DEFAULT TRUE` + UI toggle dans SettingsSheet (visible quand event lié à une ligue).
- [x] `MatchesRepository.recordTournamentMatch` : delta event séparé du delta league. 2 lignes `elo_history` par joueur quand propagation active (une `tournament_id` only, une `league_id` only).
- [x] Auto-add à la ligue : (a) au join d'un event lié, le joueur est ajouté à la ligue ; (b) au rattachement a posteriori d'un event à une ligue, tous les joueurs sont synchronisés.
- [x] Inheritance d'ELO : un joueur déjà membre de la ligue garde son ELO ligue comme baseline event ; un nouveau player démarre à 1000 dans les deux contextes.
- [x] `useHomeData` dedupe par `match_id` pour ne pas compter 2x un match propagé dans les stats lifetime.
- [ ] **Reste à faire** : Profil joueur — surface ELO **par contexte** dans `EloChart` + tableau (actuellement agrégé). Bracket/recalc service à adapter au modèle dual.

### Paiements & Premium
- [x] Intégration Stripe Checkout (edge functions Supabase).
- [x] Paywall création au-delà des limites gratuites.
- [x] Mode simulation dev.
- [x] Pages `payment-success` et `payment-cancel`.
- [ ] Webhook Stripe pour synchronisation DB (remplacer la MAJ localStorage actuelle).
- [ ] Badge Premium visible dans l'UI (profil, leaderboard).
- [ ] Gestion des abonnements récurrents (actuellement paiement unique).

### UX / Design (Epic 14 · Legacy)
- [x] Refonte design system initiale (couleurs, typo, gradient tokens).
- [x] Landing page.
- [x] Composants `HelpCard`, `PlayerCard`.
- [x] Déconnexion depuis le profil.
- [x] Escape key + focus trap sur les modales.
- [x] Avatar fallback via `onError`.

### UX / Design (Epic 15 · Everything ELO — Beer Pong ELO)
- [x] Palette Everything ELO (`navy`, `electric-blue`, `ping-yellow`, `signal-red`, `lime`, `cool-gray`, `bronze`).
- [x] Typographies Sora + Teko + JetBrains Mono (+ Archivo conservé).
- [x] Primitives Ponglo (`PongloWordmark`, `PButton`, `EloDelta`, `PRankBadge` 7 tiers boisson).
- [x] Primitives DS Everything ELO (`Sparkline`, `EloChart`, `PAvatar`, `LeaderRow`, `Podium`, `MatchRow`, `DayGroup`, `FormField`, `ToggleRow`, `CodeInput`).
- [x] `ScreenLayout` wrapper (header + max-width + overlay factorisés).
- [x] Showcase `/design-system` complet (palette, typo, tous les composants, section Phase D).
- [x] Reskin toutes les pages web (Home, Leagues, Événements, Join, Create*, Dashboards, PlayerProfile, UserProfile, Payment*, Landing, Leaderboard).
- [x] Display TV — variant `Split` (classement + match feed + QR).
- [x] Display TV — variant `Drama` (score géant `?variant=drama`).
- [x] Bottom navigation mobile (5 onglets : Accueil · Rejoindre · Classement · Leagues · Profil).
- [x] Rebrand Ponglo → **Beer Pong ELO** (manifest PWA, meta OG, labels UI).
- [x] Rename UI "Tournoi" → **"Événement"** (toutes les pages web + mobile).
- [x] Live match tracking (`is_live`, `balloon_possession`, `is_match_point`) + `LiveMatchBadge`.
- [x] Succès / achievements DB (migration, trigger PostgreSQL, `AchievementCard`).
- [x] Export données league (JSON + CSV — client-side, `ExportService`).
- [ ] Menu drawer avec accès rapide ligues/événements récents.
- [ ] Recherche globale (joueurs, ligues, événements).
- [ ] Animations (confettis victoire, transitions de page).

### Tests & qualité
- [x] 85 fichiers de tests Vitest (unit + intégration).
- [x] Tests E2E Playwright (anonyme, auth, merge — 3 spec files).
- [x] Guide tests manuels (25+ scénarios).
- [x] CI GitHub Actions (lint + unit sur PR, E2E en nightly) — `.github/workflows/`.
- [ ] Mesure systématique de la couverture de code (cible > 80% sur auth/identity).
- [ ] Stabilisation des suites avec ~91 tests cassés préexistants (dérive du rebrand Ponglo → Beer Pong ELO).
- [ ] Tests directs des services (`AuthService`, `IdentityMergeService`, `EloRecalcService`, `PremiumService`, `StripeService`, repositories).

---

## Backlog long terme

### Social & viralité
- Système d'invitations avec récompenses.
- Défis entre joueurs.
- Partage automatique des highlights sur réseaux.
- Page événement publique (résultats visibles sans compte).

### Gamification avancée
- Système de niveaux (XP en plus de l'ELO).
- Saisons avec playoffs et date de clôture.
- Événements spéciaux / compétitions sponsorisées (bars, BDE, festivals).
- Récompenses premium.
- Achievements avancés (au-delà des 3 MVP).

### Analytics avancés
- Prédictions de matchs (probabilité de victoire pré-match).
- Recommandations de matchmaking.
- Tendances et insights par période (mois, saison).

### Collaboration
- Équipes fixes avec capitaines.
- Transferts de joueurs entre saisons.

---

## Questions ouvertes

1. Limiter la création d'anonymous users par device (anti-spam) ?
2. Avatar dès la prochaine itération ou plus tard ?
3. Notifications push réservées aux comptes authentifiés ?
4. Export des stats d'un joueur avant revendication de compte autorisé ?
5. Classements d'événements publics (sans auth) — impact vie privée ?

## Métriques de succès visées

- Taux d'onboarding (% qui rejoignent un événement après scan QR) : > 80%.
- Taux de revendication (anonymous → compte) : > 20% après 30 jours.
- Temps moyen d'onboarding : < 30 secondes.
- Taux d'erreur sur les fusions d'identité : < 1%.
