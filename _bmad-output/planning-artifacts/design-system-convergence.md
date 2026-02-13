# Design System Convergence — Beer Pong League

**Author:** floppyflax  
**Date:** 2026-02-11  
**Dernière mise à jour :** 2026-02-13 (variantes cartes gradient/plein §3.7, TournamentCard refonte)  
**Status:** Addendum to UX Design Specification  
**Reference:** Screens Frame 1–11 (assets), Party Mode discussion 2026-02-11

---

## 1. Objectif

Ce document formalise les décisions de design récentes pour **converger l’UI existante** vers le design system illustré par les screens de référence. Il complète la UX Design Specification existante et sert de base pour l’implémentation.

**Principes directeurs :**

- **Menu toujours visible** : bottom navigation sur toutes les routes core
- **CTA flottant par page** : FAB quand une action principale existe
- **Design system d’abord** : tokens + composants, puis migration page par page

---

## 2. Règles de navigation

### 2.1 Bottom Navigation Bar

**Visibilité :** Toujours affichée sur les routes core (y compris pages de détail).

**Onglets (5) :**
| Onglet | Icône | Route | Description |
|----------|-------|--------------|--------------------------|
| Accueil | Home | `/` | Dashboard personnel |
| Rejoindre| QrCode/Grid | `/join` | Rejoindre un tournoi |
| Tournois | Trophy| `/tournaments` | Liste des tournois |
| Leagues | Medal | `/leagues` | Liste des leagues |
| Profil | User | `/user/profile` | Mon profil |

**Comportement :**

- Fixée en bas de l’écran (mobile)
- État actif : couleur primaire (bleu/violet)
- État inactif : gris
- Hauteur minimale : 64px (touch target 48px+)
- Visible sur : `/`, `/join`, `/tournaments`, `/leagues`, `/user/profile`, `/tournament/:id`, `/league/:id`, `/player/:id`, etc.

**Exclusions :**

- Landing (visiteur non identifié)
- Display views (`/league/:id/display`, `/tournament/:id/display`)
- Auth callback, payment success/cancel
- Modales plein écran (QR scanner, etc.)

### 2.2 Floating Action Button (FAB)

**Règle :** Un FAB par page quand une action principale existe.

**Placement :** Bas droite, au-dessus de la bottom nav (avec marge).

**Pages avec FAB :**

| Page              | Action FAB          | Icône                            |
| ----------------- | ------------------- | -------------------------------- |
| Mes tournois      | Créer un tournoi    | +                                |
| Mes leagues       | Créer une league    | +                                |
| Dashboard tournoi | Nouveau match       | +                                |
| Dashboard league  | Nouveau match       | +                                |
| Dashboard tournoi | Inviter (si droits) | User+ (FAB secondaire ou header) |

**Style FAB :**

- Taille : 56px (mobile), 64px (desktop)
- Fond : gradient bleu/violet (`from-blue-500 to-violet-600` ou équivalent)
- Icône : blanche, 24px
- Ombre : `shadow-lg`
- Position : `fixed bottom-20 right-4` (au-dessus de la bottom nav)

### 2.3 Identité visuelle — Icône « Nouveau match »

**Objectif :** Renforcer l’identité de l’app avec un pictogramme propre au beer pong, plutôt qu’un simple « + » ou icône générique.

**Icône FAB « Nouveau match » :**

- **Concept :** Gobelet de beer pong + balle de ping-pong
- **Usage :** Bouton « Nouveau match » (FAB ou header) sur dashboards tournoi et league
- **Composants visuels :**
  - Gobelet : forme de cup rouge/ambre (référence beer pong)
  - Balle : cercle blanc, positionnée sur ou près du gobelet (suggère le lancer)
- **Variantes :** Icône pleine pour fond sombre (blanc/ambre), outline possible pour fond clair
- **Taille :** 20–24px selon contexte (header vs FAB)

**Fichier :** `src/components/icons/BeerPongMatchIcon.tsx`

**Autres FAB :** Créer tournoi / Créer league gardent « + » ou icône Trophy/Medal — l’icône custom est réservée à l’action « match » pour la différencier.

### 2.4 Header contextuel

**Structure :**

- Gauche : bouton retour (flèche) si page secondaire
- Centre : titre de la page (tronqué si long)
- Droite : actions icon-only (+, …, search) + menu « … » si besoin

**Actions desktop vs mobile :**

- Desktop : boutons texte + icônes visibles
- Mobile : icônes seules dans le header, FAB pour l’action principale

---

## 3. Design tokens

### 3.1 Couleurs

**Fond :**

- `bg-slate-900` : fond principal
- `bg-slate-800` : cartes, surfaces secondaires
- `bg-slate-700` : inputs, bordures légères

**Texte :**

- `text-white` : titres, contenu principal
- `text-slate-300` : sous-titres
- `text-slate-400` : labels, métadonnées
- `text-slate-500` : texte tertiaire, placeholders

**Accents :**

- **Primaire (CTA, actif) :** gradient `from-amber-500 to-yellow-500` ou `from-blue-500 to-violet-600` selon screens
- **Succès / positif :** `green-500`, `green-400`
- **Erreur / négatif :** `red-500`, `red-400`
- **ELO / highlight :** `amber-500`, `yellow-500`
- **Info :** `blue-500`, `blue-400`

**Sémantique :**

- Statut actif : `bg-amber-500/20 text-amber-500`
- Statut terminé : `bg-green-500/20 text-green-500`
- Delta ELO + : `text-green-500`
- Delta ELO − : `text-red-500`

### 3.2 Gradients

- **CTA principal :** `bg-gradient-to-r from-amber-500 to-yellow-500` (landing) ou `from-blue-500 to-violet-600` (screens)
- **FAB / boutons primaires :** `from-blue-500 to-violet-600`
- **Onglet actif :** même gradient ou `bg-primary`
- **Cartes de liste (TournamentCard, LeagueCard) :** `bg-gradient-card` — dégradé horizontal `to left` (slate-700 → slate-800) pour contraste avec le fond. Valeur : `linear-gradient(to left, rgba(51, 65, 85, 0.98), rgba(30, 41, 59, 0.98))`. Référence : Frame 3 (Mes tournois).

### 3.3 Typographie

- **Titres page :** `text-xl` (mobile), `text-2xl` (desktop), `font-bold`
- **Titres section :** `text-lg font-bold`
- **Corps :** `text-base`, `text-sm` pour secondaire
- **Labels :** `text-sm font-medium text-slate-400`
- **Stats / chiffres :** `text-2xl font-bold` (StatCards)

### 3.4 Espacements

- **Padding page :** `p-4` (mobile), `p-6` (desktop)
- **Gap cartes :** `gap-4`, `gap-6`
- **Padding cartes :** `p-4`, `p-6`
- **Margin bottom nav :** `pb-20` ou `pb-24` sur le contenu scrollable

### 3.5 Bordures et radius

- **Radius cartes :** `rounded-xl` (12px)
- **Radius boutons :** `rounded-lg` (8px), `rounded-xl` pour CTA
- **Radius inputs :** `rounded-xl`
- **Bordure cartes :** `border border-slate-700` ou `border-slate-700/50`

### 3.6 Élévations

- **Cartes :** `shadow` léger ou `border` uniquement
- **FAB :** `shadow-lg`
- **Modales :** `shadow-2xl`

### 3.7 Variantes de cartes (gradient vs plein)

| Variante          | Token              | Usage                                                              | Exemples                                                          |
| ----------------- | ------------------ | ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| **Avec gradient** | `bg-gradient-card` | Cartes de liste cliquables, items répétitifs dans une grille/liste | TournamentCard, LeagueCard (listes Mes tournois, Mes leagues)     |
| **Sans gradient** | `bg-slate-800`     | Cartes de contexte, blocs d’info, stats, formulaires               | StatCard, InfoCard, SegmentedTabs encapsulé, champs de formulaire |

**Règle :** Utiliser le gradient pour les cartes d’entité (tournoi, league) dans les listes — meilleur contraste avec le fond `bg-slate-900`. Utiliser le fond plein pour les blocs utilitaires (stats, infos, filtres).

**Conteneur commun :** `rounded-xl p-4` ou `p-6`, `border border-slate-700/50`

---

## 4. Composants à implémenter / standardiser

### 4.1 StatCard

**Usage :** Résumé chiffré (Joueurs, Matchs, Top ELO, ELO moyen, etc.)

**Structure :**

- Conteneur : `bg-slate-800 p-3 rounded-xl text-center`
- Valeur : `text-2xl font-bold` + couleur sémantique (bleu, vert, jaune)
- Label : `text-[10px] text-slate-400 uppercase font-bold`

**Variantes :** `primary` (bleu), `success` (vert), `accent` (jaune/ambre)

### 4.2 SegmentedTabs (filtres)

**Usage :** Filtres Tous / Actifs / Terminés, ou onglets Classement / Matchs / Paramètres

**Variantes :**

- **`default`** (onglets séparés) :
  - Conteneur : `flex gap-2`
  - Tab : `px-4 py-2 rounded-lg font-semibold`
  - Actif : `bg-primary text-white` ou gradient
  - Inactif : `bg-slate-800 text-slate-400 hover:bg-slate-700`

- **`encapsulated`** (onglets dans un bloc unique) — Référence : Frame 3 (Mes tournois) :
  - Conteneur : `bg-slate-800 rounded-xl p-1` (bloc unique encapsulant tous les onglets)
  - Tabs : `flex` à l’intérieur, sans gap entre eux
  - Actif : `bg-gradient-tab-active text-white rounded-lg` (gradient bleu-violet)
  - Inactif : fond transparent, `text-slate-400`

### 4.3 ListRow (joueur / tournoi / league)

**Usage :** Ligne de liste cliquable (classement, cartes tournoi/league)

**Layout :** `w-full` — les cartes prennent toute la largeur du conteneur parent.

**Structure (joueur) :**

- Avatar circulaire (ou placeholder initiales)
- Rang en pastille (1, 2, 3 avec couleurs or/argent/bronze)
- Nom + sous-texte (W/L, winrate)
- **Derniers résultats (optionnel) :** 5 petits cercles (vert=victoire, rouge=défaite) affichant les 5 derniers matchs, du plus récent au plus ancien. Taille : `w-2.5 h-2.5`, couleurs : `bg-green-500` / `bg-red-500`
- ELO à droite + delta (vert/rouge) si pertinent
- Chevron ou flèche droite

**Props joueur :** `name`, `subtitle`, `elo`, `rank?`, `delta?`, `avatarUrl?`, `recentResults?: boolean[]` (max 5), `onClick?`

**Structure (carte tournoi/league) :**

- Nom, date, statut (badge)
- Métriques : Matchs, Joueurs, Format (couleurs distinctes)
- Chevron droite

### 4.4 InfoCard (bandeau contexte)

**Usage :** En-tête de dashboard (tournoi, league) avec statut, code, format, date

**Structure :**

- `bg-slate-800/50 rounded-xl p-4 border border-slate-700/50`
- Titre + badge statut
- Ligne d’infos avec icônes (calendrier, users, format)

### 4.5 FAB (Floating Action Button)

**Usage :** Action principale de la page

**Props :** `icon`, `onClick`, `ariaLabel`, optionnel `variant` (primary, secondary)

**Style :** Voir section 2.2

### 4.6 Banner (feedback)

**Usage :** Toast ou bannière temporaire (ex. « Tournoi rejoint ! Redirection… »)

**Structure :**

- Fond vert (succès) ou rouge (erreur)
- Icône + texte
- Position : top ou inline selon contexte

### 4.7 SearchBar

**Usage :** Recherche dans listes (tournois, leagues)

**Structure :**

- Icône loupe à gauche
- Input : `bg-slate-800 border border-slate-700 rounded-lg pl-12`
- Debounce 300ms

### 4.8 TournamentCard (carte tournoi)

**Usage :** Carte de tournoi dans les listes (Mes tournois, Mes leagues). Référence : Frame 3 (Mes tournois).

**Style de fond :** `bg-gradient-card` (dégradé horizontal `to left`, slate-700 → slate-800, section 3.2)

**Structure :**

1. **Header :** `[Titre en gras blanc] [Badge ACTIF / TERMINÉ]`
   - Badge actif : `bg-green-500/20 text-green-400` — « ACTIF »
   - Badge terminé : `bg-slate-700 text-slate-300` — « TERMINÉ »

2. **Milieu :** Date du tournoi seule (`text-sm text-slate-400`, ex. « 15 janv. 2024 »)

3. **Bas :** Trois colonnes de stats + bouton chevron :
   - **Matchs** : nombre en `text-lg font-bold text-white`, label « Matchs » en `text-xs text-slate-400`
   - **Joueurs** : nombre en `text-lg font-bold text-white`, label « Joueurs » en `text-xs text-slate-400`
   - **Format** : valeur (2v2, 1v1, 3v3, Libre) en `text-lg font-bold text-blue-400`, label « Format » en `text-xs text-slate-400`
   - **Bouton navigation** : cercle `w-10 h-10 rounded-full bg-slate-700`, icône chevron droite blanche, `aria-label="Voir le tournoi"`

**Conteneur :** `rounded-xl p-6 border border-slate-700/50` — clic sur la carte ou le bouton → navigation vers `/tournament/:id`

---

## 5. Règles par type de page

### 5.1 Listes (Mes tournois, Mes leagues)

- Header : titre + bouton + (search en header ou barre dédiée)
- Barre de recherche
- SegmentedTabs (Tous / Actifs / Terminés) — variante `encapsulated` recommandée (Frame 3)
- Grille ou liste de cartes (TournamentCard ou ListRow)
- TournamentCard : fond `gradient-card`, structure section 4.8
- FAB : Créer tournoi / Créer league
- Bottom nav visible

### 5.2 Dashboards (Tournoi, League)

- Header : nom + retour + actions (+, …)
- InfoCard (statut, code, format, date)
- StatCards (3 colonnes)
- SegmentedTabs (Classement / Matchs / Paramètres, etc.)
- Liste classement avec ListRow (avatar, rang, ELO, delta, recentResults 5 cercles)
- FAB : Nouveau match (et Inviter si pertinent)
- Bottom nav visible

### 5.3 Formulaires (Créer tournoi, Créer league)

- Header : titre + retour
- Champs avec labels, validation inline
- CTA principal en bas
- Pas de FAB (le submit est le CTA)
- Bottom nav visible (ou masquée selon choix produit)

### 5.4 Profil joueur

- Header : nom + retour
- Avatar + infos
- StatCards (ELO, W/L, Win rate)
- Carte streak
- Sections : Évolution ELO, Stats par league, Tête-à-tête, Matchs récents
- Bottom nav visible

### 5.5 Inviter des joueurs

- Header : titre + retour
- Carte récap tournoi
- QR code (grand, lisible)
- Lien + Copier / Partager
- Bloc « Comment ça marche ? »
- Bottom nav visible

---

## 6. Modales

### 6.1 Règles générales

- **Bouton fermer** : Toujours un X en haut à droite pour fermer, même si des boutons d’action existent (ex. « Plus tard »).
- **Choix du format** :
  - **Centré (overlay)** : contenu court (≤ 2 champs ou message + boutons). Ex. : Saisir code, Limite atteinte, confirmation.
  - **Fullscreen ou bottom sheet** : formulaires longs ou multi-étapes. Ex. : Nouveau match (équipes + scores).

### 6.2 Exemples par type

| Modale          | Format              | Contenu                                   |
| --------------- | ------------------- | ----------------------------------------- |
| Saisir le code  | Centré              | Input + CTA, X                            |
| Limite atteinte | Centré              | Message + Passer à Premium / Plus tard, X |
| Nouveau match   | Fullscreen ou sheet | Équipes, scores, options, X               |
| Ajouter joueur  | Centré              | Input pseudo + CTA, X                     |
| Confirmation    | Centré              | Message + Oui / Non, X                    |

---

## 7. Flow « Enregistrement de match »

### 7.1 Données requises

- **Équipe gagnante** (obligatoire) : choix Équipe 1 ou Équipe 2.
- **Équipes** : sélection des joueurs par équipe (selon format tournoi : 1v1, 2v2, libre).

### 7.2 Données optionnelles

- **Gobelets restants** : nombre de gobelets restants à l’équipe gagnante uniquement (l’équipe perdante a 0).
- **Photo de l’équipe gagnante** : souvenir du match, affichée dans l’historique des matchs.

### 7.3 Photo (souvenir)

- **Usage** : souvenir du match, à revoir dans la liste des matchs.
- **Viralité** : partage possible (phase ultérieure), renforce l’engagement et la mémorabilité.
- **Phase 2 (optionnel)** : utilisation de LIA pour détecter le nombre de gobelets sur la photo (pré-remplissage du champ « gobelets restants »).

### 7.4 Structure du formulaire « Nouveau match »

1. Sélection Équipe 1 (joueurs)
2. Sélection Équipe 2 (joueurs)
3. **Qui a gagné ?** — Équipe 1 / Équipe 2 (obligatoire)
4. **Gobelets restants** (optionnel) — champ numérique, 1–10, pour l’équipe gagnante
5. **Photo** (optionnel) — prise de photo ou galerie, équipe gagnante
6. CTA « Enregistrer le match »

**Format modale** : fullscreen ou bottom sheet (formulaire long).

---

## 8. Plan de migration (ordre suggéré)

**Phase 1 — Fondations**

1. Tokens (couleurs, radius, typo) dans Tailwind / thème
2. Composants : StatCard, SegmentedTabs, ListRow, InfoCard, FAB
3. Règles navigation : `shouldShowBottomMenu` → toujours true sur routes core

**Phase 2 — Flow tournoi** 4. Mes tournois (recherche, filtres, cartes, FAB) 5. Dashboard tournoi (InfoCard, StatCards, tabs, classement) 6. Inviter des joueurs 7. Rejoindre (via lien)

**Phase 3 — Flow league** 8. Mes leagues 9. Dashboard league 10. Créer league

**Phase 4 — Reste** 11. Créer tournoi (form) 12. Profil joueur, Mon profil 13. Landing, Rejoindre (scan/code)

---

## 9. Références visuelles

Les screens Frame 1–11 dans `assets/` servent de référence pour :

- Landing (PongELO)
- Rejoindre (scan + code)
- Mes tournois
- Dashboard tournoi (Soirée Beer Pong 2024)
- Inviter des joueurs
- Rejoindre via lien
- Mes leagues
- Dashboard league (League des Pingouins)
- Créer league
- Créer tournoi
- Profil joueur (Marc Dupont)
- Mon profil

---

_Document prêt pour l’implémentation. À utiliser en complément de `ux-design-specification.md`._
