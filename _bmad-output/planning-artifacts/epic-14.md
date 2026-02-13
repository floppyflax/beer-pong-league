# Epic 14: Refonte intégrale du design system

**Goal:** Réaliser la refonte complète de l'application selon le nouveau design system, en créant d'abord tous les assets atomiques et composants, puis en migrant chaque page pour intégrer les éléments des designs de référence (Frame 1–11).

**User Outcome:** L'application adopte une identité visuelle cohérente et forte, alignée sur les maquettes, avec des composants réutilisables, une navigation unifiée, et les fonctionnalités enrichies (flow match, modales).

**Scope:**

1. **Fondations** — Design tokens + composants atomiques (StatCard, SegmentedTabs, ListRow, InfoCard, FAB, Banner, SearchBar) + icône BeerPongMatchIcon + règles navigation
2. **Modales** — Bouton X obligatoire (appliqué tôt pour cohérence dès les premières migrations)
3. **Migration pages** — Chaque page migrée selon design-system-convergence
4. **Flow match enrichi** — Choix gagnant, gobelets restants, photo souvenir

**FRs covered:** FR5 (Interface Utilisateur), design-system-convergence.md (intégralité), ux-design-specification.md

**Implementation Notes:**

- Référence : `design-system-convergence.md` + screens Frame 1–11 dans `assets/`
- Ordre : fondations (tokens, composants) → modales (X obligatoire) → migration page par page → flow match enrichi
- Chaque composant doit être isolé, testable, documenté

**Dependencies:** Epic 9 (Navigation), Epic 10 (Pages listes)

**Related Documents:**

- `_bmad-output/planning-artifacts/design-system-convergence.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- Screens Frame 1–11 (assets/)

---

## Phase 1 — Fondations (assets + tokens + composants atomiques)

---

## Story 14.1: Design tokens dans Tailwind / thème

As a developer,
I want design tokens centralisés (couleurs, typo, radius, espacements),
So that l'application a une base visuelle cohérente et facile à maintenir.

**Acceptance Criteria:**

**Given** le design system (design-system-convergence.md section 3)
**When** j'implémente les tokens
**Then** les couleurs sont définies (fond slate-900/800/700, texte, accents primaire/succès/erreur/ELO)
**And** les gradients sont définis (CTA, FAB, onglet actif)
**And** la typographie est définie (titres page, section, corps, labels, stats)
**And** les espacements sont définis (padding page, gap cartes, margin bottom nav)
**And** les radius et bordures sont définis (cartes, boutons, inputs)
**And** les tokens sont dans `tailwind.config.js` ou fichier thème dédié
**And** les tokens sont utilisables via classes Tailwind existantes ou variables CSS

**Technical Notes:**

- Section 3 design-system-convergence : 3.1 Couleurs, 3.2 Gradients, 3.3 Typo, 3.4 Espacements, 3.5 Bordures, 3.6 Élévations
- Vérifier cohérence avec screens Frame 1–11

---

## Story 14.1b: Page Design System (showcase)

As a developer,
I want une page Design System qui affiche et permet de tester les composants atomiques,
So que je puisse visualiser et valider chaque composant au fur et à mesure de leur création.

**Acceptance Criteria:**

**Given** la route `/design-system`
**When** j'accède à cette page
**Then** une page showcase s'affiche avec :
**And** section **Design Tokens** (Story 14-1) en tête : couleurs, gradients, typographie, espacements, radius, bordures
**And** sections **Composants** : StatCard, SegmentedTabs, ListRow, InfoCard, FAB, Banner, SearchBar
**And** chaque section composant affiche le composant s'il existe, ou un placeholder "À venir"
**And** les variantes sont testables (ex. StatCard primary/success/accent)
**And** la page est accessible via le DevPanel en mode dev
**And** la bottom nav est masquée sur cette page

**Technical Notes:**

- `src/pages/DesignSystemShowcase.tsx`
- Route `/design-system`, lien dans DevPanel
- Section tokens : swatches couleurs, barres gradients, exemples typo/espacements/radius/bordures
- Chaque story 14-2 à 14-8 ajoute sa démo dans la section correspondante

---

## Story 14.2: Composant StatCard

As a developer,
I want un composant StatCard réutilisable,
So que les résumés chiffrés (Joueurs, Matchs, ELO, etc.) soient cohérents partout.

**Acceptance Criteria:**

**Given** le design system (section 4.1)
**When** j'utilise StatCard
**Then** le composant affiche une valeur (texte ou nombre) et un label
**And** les variantes : primary, success, accent (couleurs sémantiques)
**And** structure : `bg-slate-800 p-3 rounded-xl text-center`
**And** valeur : `text-2xl font-bold` + couleur selon variante
**And** label : `text-[10px] text-slate-400 uppercase font-bold`
**And** le composant est exporté et documenté

**Technical Notes:**

- `src/components/design-system/StatCard.tsx`
- Props : value, label, variant? ('primary' | 'success' | 'accent')

---

## Story 14.3: Composant SegmentedTabs

As a developer,
I want un composant SegmentedTabs réutilisable,
So que les filtres (Tous/Actifs/Terminés) et onglets (Classement/Matchs/Paramètres) soient cohérents.

**Acceptance Criteria:**

**Given** le design system (section 4.2)
**When** j'utilise SegmentedTabs
**Then** le composant affiche une liste d'onglets
**And** onglet actif : `bg-primary text-white` ou gradient
**And** onglet inactif : `bg-slate-800 text-slate-400 hover:bg-slate-700`
**And** structure : `flex gap-2`, `px-4 py-2 rounded-lg font-semibold`
**And** callback onClick pour changement d'onglet
**And** le composant est exporté et documenté

**Technical Notes:**

- `src/components/design-system/SegmentedTabs.tsx`
- Props : tabs: { id, label }[], activeId, onChange

---

## Story 14.4: Composant ListRow

As a developer,
I want un composant ListRow réutilisable,
So que les lignes de liste (joueur, tournoi, league) soient cohérentes.

**Acceptance Criteria:**

**Given** le design system (section 4.3)
**When** j'utilise ListRow (joueur)
**Then** avatar circulaire ou placeholder initiales
**And** rang en pastille (1, 2, 3 avec or/argent/bronze)
**And** nom + sous-texte (W/L, winrate)
**And** ELO à droite + delta (vert/rouge)
**And** chevron ou flèche droite
**When** j'utilise ListRow (carte tournoi/league)
**Then** nom, date, statut (badge)
**And** métriques : Matchs, Joueurs, Format
**And** chevron droite
**And** le composant supporte variants et est cliquable

**Technical Notes:**

- `src/components/design-system/ListRow.tsx`
- Props selon variant (player, tournament, league)
- Référence : screens Frame 3 (Mes tournois), Frame 7 (Mes leagues)

---

## Story 14.5: Composant InfoCard

As a developer,
I want un composant InfoCard réutilisable,
So que les bandeaux de contexte (dashboard tournoi/league) soient cohérents.

**Acceptance Criteria:**

**Given** le design system (section 4.4)
**When** j'utilise InfoCard
**Then** structure : `bg-slate-800/50 rounded-xl p-4 border border-slate-700/50`
**And** titre + badge statut
**And** ligne d'infos avec icônes (calendrier, users, format)
**And** le composant est flexible (children ou props structurées)
**And** le composant est exporté et documenté

**Technical Notes:**

- `src/components/design-system/InfoCard.tsx`
- Référence : screens Frame 4 (Dashboard tournoi), Frame 8 (Dashboard league)

---

## Story 14.6: Composant FAB (Floating Action Button)

As a developer,
I want un composant FAB réutilisable,
So que les actions principales (Créer tournoi, Nouveau match) soient cohérentes.

**Acceptance Criteria:**

**Given** le design system (sections 2.2, 4.5)
**When** j'utilise FAB
**Then** taille : 56px (mobile), 64px (desktop)
**And** fond : gradient `from-blue-500 to-violet-600`
**And** icône : blanche, 24px
**And** ombre : `shadow-lg`
**And** position : `fixed bottom-20 right-4` (au-dessus bottom nav)
**And** props : icon, onClick, ariaLabel, variant? (primary, secondary)
**And** le composant est exporté et documenté

**Technical Notes:**

- `src/components/design-system/FAB.tsx`
- Intégrer BeerPongMatchIcon pour action "Nouveau match"

---

## Story 14.7: Composant Banner (feedback)

As a developer,
I want un composant Banner réutilisable pour les feedbacks (succès, erreur),
So que les toasts et bannières soient cohérents.

**Acceptance Criteria:**

**Given** le design system (section 4.6)
**When** j'utilise Banner
**Then** structure : fond vert (succès) ou rouge (erreur)
**And** icône + texte
**And** position : top ou inline selon contexte
**And** props : message, variant ('success' | 'error'), onDismiss?
**And** le composant est exporté et documenté

**Technical Notes:**

- `src/components/design-system/Banner.tsx`
- Peut compléter ou remplacer react-hot-toast pour certains cas

---

## Story 14.8: Composant SearchBar

As a developer,
I want un composant SearchBar réutilisable,
So que les recherches (tournois, leagues) soient cohérentes.

**Acceptance Criteria:**

**Given** le design system (section 4.7)
**When** j'utilise SearchBar
**Then** icône loupe à gauche
**And** input : `bg-slate-800 border border-slate-700 rounded-lg pl-12`
**And** debounce 300ms
**And** props : value, onChange, placeholder
**And** le composant est exporté et documenté

**Technical Notes:**

- `src/components/design-system/SearchBar.tsx`
- Référence : screens Frame 3, Frame 7

---

## Story 14.9: Icône identitaire BeerPongMatchIcon

**Status:** done ✅

As a user,
I want the "Nouveau match" button to display an icon with a beer pong cup and ping-pong ball,
So that the app has a stronger visual identity.

**Implementation:** Déjà fait — `src/components/icons/BeerPongMatchIcon.tsx`

---

## Story 14.10: Règles navigation (bottom nav toujours visible)

As a developer,
I want la bottom nav visible sur toutes les routes core,
So que la navigation soit cohérente avec le design system.

**Acceptance Criteria:**

**Given** le design system (section 2.1)
**When** l'utilisateur est sur une route core
**Then** la bottom nav est affichée
**And** routes core : `/`, `/join`, `/tournaments`, `/leagues`, `/user/profile`, `/tournament/:id`, `/league/:id`, `/player/:id`
**And** exclusions : Landing (non connecté), Display views, Auth callback, modales plein écran
**And** `shouldShowBottomMenu` (ou équivalent) retourne true pour tous les cas core
**And** le padding bottom du contenu (`pb-20` ou `pb-24`) est appliqué

**Technical Notes:**

- `src/utils/navigationHelpers.ts` — `shouldShowBottomMenu`, `shouldShowBackButton`
- Vérifier BottomTabMenu, BottomMenuSpecific

---

## Story 14.11: Bouton fermer modales (design system)

As a user,
I want un bouton X sur toutes les modales,
So que je puisse toujours fermer sans être bloqué.

**Acceptance Criteria:**

**Given** toute modale de l'app
**When** la modale est affichée
**Then** bouton X visible en haut à droite
**And** clic sur X ferme la modale
**And** modales concernées : Nouveau match, Saisir code, Limite atteinte, Ajouter joueur, etc.

**Technical Notes:**

- design-system-convergence section 6.1
- Audit : MatchRecordingForm, CodeInputModal, PaymentModal, AddPlayerModal
- Appliqué tôt pour cohérence dès les migrations de pages

---

## Phase 2 — Flow tournoi

---

## Story 14.12: Page Mes tournois (refonte)

As a user,
I want la page Mes tournois alignée sur le design system,
So que les éléments des designs (recherche, filtres, cartes, FAB) soient présents.

**Acceptance Criteria:**

**Given** le design system (section 5.1)

**When** je consulte Mes tournois
**Then** header : titre + bouton + search (ou barre dédiée)
**And** SearchBar (debounce 300ms)
**And** SegmentedTabs (Tous / Actifs / Terminés)
**And** liste ou grille de cartes (ListRow ou TournamentCard)
**And** FAB : Créer un tournoi
**And** bottom nav visible
**And** la page correspond aux designs Frame 3

**Technical Notes:**

- `src/pages/Tournaments.tsx`
- Réutiliser StatCard, SegmentedTabs, ListRow, SearchBar, FAB

---

## Story 14.13: Page Dashboard tournoi (refonte)

As a user,
I want le dashboard tournoi aligné sur le design system,
So que InfoCard, StatCards, tabs et classement soient cohérents.

**Acceptance Criteria:**

**Given** le design system (section 5.2)

**When** je consulte un tournoi
**Then** header : nom + retour + actions (+, …)
**And** InfoCard (statut, code, format, date)
**And** StatCards (3 colonnes)
**And** SegmentedTabs (Classement / Matchs / Paramètres)
**And** liste classement avec ListRow (avatar, rang, ELO, delta)
**And** FAB : Nouveau match (BeerPongMatchIcon)
**And** bottom nav visible
**And** la page correspond aux designs Frame 4

**Technical Notes:**

- `src/pages/TournamentDashboard.tsx`
- Réutiliser InfoCard, StatCard, SegmentedTabs, ListRow, FAB

---

## Story 14.14: Page Inviter des joueurs (refonte)

As a user,
I want la page Inviter alignée sur le design system,
So que QR code, lien et partage soient cohérents.

**Acceptance Criteria:**

**Given** le design system (section 5.5)

**When** je consulte Inviter des joueurs
**Then** header : titre + retour
**And** carte récap tournoi
**And** QR code (grand, lisible)
**And** lien + Copier / Partager
**And** bloc « Comment ça marche ? »
**And** bottom nav visible
**And** la page correspond aux designs Frame 5

**Technical Notes:**

- Page invitation tournoi
- Référence : Frame 5

---

## Story 14.15: Page Rejoindre (via lien)

As a user,
I want la page Rejoindre (lien) alignée sur le design system,
So que le flow soit cohérent avec les designs.

**Acceptance Criteria:**

**Given** le design system

**When** je rejoins via lien
**Then** la page est alignée sur Frame 6
**And** bottom nav visible si pertinent

**Technical Notes:**

- Flow rejoindre via lien (vs scan QR)

---

## Phase 3 — Flow league

---

## Story 14.16: Page Mes leagues (refonte)

As a user,
I want la page Mes leagues alignée sur le design system,
So que recherche, filtres, cartes et FAB soient cohérents.

**Acceptance Criteria:**

**Given** le design system (section 5.1)

**When** je consulte Mes leagues
**Then** header : titre + bouton + search
**And** SearchBar
**And** SegmentedTabs (Tous / Actifs / Terminés)
**And** liste ou grille de cartes (ListRow ou LeagueCard)
**And** FAB : Créer une league
**And** bottom nav visible
**And** la page correspond aux designs Frame 7

**Technical Notes:**

- `src/pages/Leagues.tsx`

---

## Story 14.17: Page Dashboard league (refonte)

As a user,
I want le dashboard league aligné sur le design system,
So que InfoCard, StatCards, tabs et classement soient cohérents.

**Acceptance Criteria:**

**Given** le design system (section 5.2)

**When** je consulte une league
**Then** header : nom + retour + actions
**And** InfoCard (statut, format, date)
**And** StatCards (3 colonnes)
**And** SegmentedTabs (Classement / Matchs / Paramètres)
**And** liste classement avec ListRow
**And** FAB : Nouveau match (BeerPongMatchIcon)
**And** bottom nav visible
**And** la page correspond aux designs Frame 8

**Technical Notes:**

- `src/pages/LeagueDashboard.tsx`

---

## Story 14.18: Page Créer league (refonte)

As a user,
I want la page Créer league alignée sur le design system,
So que le formulaire soit cohérent.

**Acceptance Criteria:**

**Given** le design system (section 5.3)

**When** je crée une league
**Then** header : titre + retour
**And** champs avec labels, validation inline
**And** CTA principal en bas
**And** bottom nav visible (ou masquée selon choix)
**And** la page correspond aux designs Frame 9

**Technical Notes:**

- `src/pages/CreateLeague.tsx`

---

## Phase 4 — Reste

---

## Story 14.19: Page Créer tournoi (refonte)

As a user,
I want la page Créer tournoi alignée sur le design system,
So que le formulaire soit cohérent.

**Acceptance Criteria:**

**Given** le design system (section 5.3)

**When** je crée un tournoi
**Then** header : titre + retour
**And** champs avec labels, validation inline
**And** CTA principal en bas
**And** la page correspond aux designs Frame 10

**Technical Notes:**

- `src/pages/CreateTournament.tsx`

---

## Story 14.20: Page Profil joueur (refonte)

As a user,
I want la page Profil joueur alignée sur le design system,
So que avatar, StatCards, streak et sections soient cohérents.

**Acceptance Criteria:**

**Given** le design system (section 5.4)

**When** je consulte un profil joueur
**Then** header : nom + retour
**And** avatar + infos
**And** StatCards (ELO, W/L, Win rate)
**And** carte streak
**And** sections : Évolution ELO, Stats par league, Tête-à-tête, Matchs récents
**And** bottom nav visible
**And** la page correspond aux designs Frame 11

**Technical Notes:**

- `src/pages/PlayerProfile.tsx`

---

## Story 14.21: Page Mon profil (refonte)

As a user,
I want la page Mon profil alignée sur le design system,
So que les éléments soient cohérents.

**Acceptance Criteria:**

**Given** le design system

**When** je consulte Mon profil
**Then** la page est alignée sur les designs
**And** bottom nav visible

**Technical Notes:**

- `src/pages/UserProfile.tsx`

---

## Story 14.22: Page Landing (refonte)

As a user,
I want la page Landing alignée sur le design system,
So que l'onboarding soit cohérent.

**Acceptance Criteria:**

**Given** le design system

**When** je suis sur la Landing (non connecté)
**Then** la page correspond aux designs Frame 1

**Technical Notes:**

- `src/pages/LandingPage.tsx`

---

## Story 14.23: Page Rejoindre (scan + code)

As a user,
I want la page Rejoindre (scan, code) alignée sur le design system,
So que le flow d'entrée soit cohérent.

**Acceptance Criteria:**

**Given** le design system

**When** je suis sur Rejoindre (scan + code)
**Then** la page correspond aux designs Frame 2

**Technical Notes:**

- `src/pages/Join.tsx`

---

## Phase 5 — Flow match enrichi

---

## Story 14.24: Schéma base de données pour match enrichi

As a developer,
I want le schéma DB pour cups_remaining et photo_url,
So que les matchs puissent stocker ces données optionnelles.

**Acceptance Criteria:**

**Given** le besoin de données enrichies
**When** je crée la migration
**Then** `matches` a `cups_remaining` (integer, nullable)
**And** `matches` a `photo_url` (text, nullable)
**And** migration dans `supabase/migrations/`
**And** schémas Zod et types TypeScript mis à jour

**Technical Notes:**

- design-system-convergence section 7

---

## Story 14.25: Choix de l'équipe gagnante (obligatoire)

As a player,
I want choisir l'équipe gagnante au lieu des scores,
So que je valide un match rapidement.

**Acceptance Criteria:**

**Given** j'enregistre un match
**When** j'ai sélectionné les équipes
**Then** je vois "Qui a gagné ?" — Équipe 1 / Équipe 2 (obligatoire)
**And** le formulaire remplace teamAScore/teamBScore par ce choix
**And** ELO utilise le gagnant

**Technical Notes:**

- Refactor MatchRecordingForm
- design-system-convergence section 7.4

---

## Story 14.26: Gobelets restants (optionnel)

As a player,
I want indiquer optionnellement les gobelets restants de l'équipe gagnante,
So que l'on puisse suivre l'intensité du match.

**Acceptance Criteria:**

**Given** j'ai sélectionné le gagnant
**When** le formulaire affiche les options
**Then** champ optionnel "Gobelets restants" (1–10)
**And** valeur stockée dans `cups_remaining`

**Technical Notes:**

- design-system-convergence section 7.2

---

## Story 14.27: Photo de l'équipe gagnante (optionnel)

As a player,
I want ajouter optionnellement une photo de l'équipe gagnante,
So que j'aie un souvenir du match.

**Acceptance Criteria:**

**Given** j'ai sélectionné le gagnant
**When** le formulaire affiche les options
**Then** bouton optionnel "Photo" (prise ou galerie)
**And** photo uploadée vers Supabase Storage
**And** URL stockée dans `photo_url`

**Technical Notes:**

- design-system-convergence section 7.2, 7.3

---

## Story 14.28: Affichage photo et gobelets dans l'historique des matchs

As a player,
I want voir la photo et les gobelets dans l'historique des matchs,
So que je puisse revivre les matchs.

**Acceptance Criteria:**

**Given** un match avec photo et/ou gobelets
**When** je consulte l'historique
**Then** thumbnail photo si disponible
**And** badge "X gobelets restants" si enregistré

**Technical Notes:**

- TournamentDashboard, LeagueDashboard — liste des matchs
