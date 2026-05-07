# Redesign Spec — Beer Pong League → **Beer Pong ELO** (Everything ELO)

**Statut** : ✅ **Spec complète, prête pour implémentation** (passe 2 web ✅ · passe 3 mobile ✅ · §5 composants DS consolidée ✅ · §6 dépréciations ordonnées par phase ✅ · §7 phasing A/B/C/D draft ✅ · §8.1 récap OQ ✅ · **🔄 pivot brand Everything ELO acté R1–R7 le 2026-04-23**)
**Dernière mise à jour** : 2026-04-23
**Source design** : zip `Beer Pong ELO.zip` extrait dans `/tmp/bpl-redesign/` (mockups JSX Ponglo Arcade) + brand kit **Everything ELO** fourni le 2026-04-23 (image PO) → consolidé dans [`brand-kit-everything-elo.md`](./brand-kit-everything-elo.md) qui **fait foi** pour l'identité de marque.

> ⚠️ **Note de transition** : cette spec a été draftée en ciblant le DS `Ponglo Arcade` (dark neon, tokens `cream`/`paper`/`ink`/`cup-red`/`cup-blue`/`lime`/`gold`). Le 2026-04-23, le PO a livré un nouveau brand kit **Everything ELO** (voir doc dédié). Les décisions R1–R7 rebrand sont reflétées dans les sections **2.1, 2.2, 2.4, 2.6** et le logbook §9. Les anciennes références aux tokens `cream`/`cup-red`/`gold` restent dans les entrées écran déjà écrites **pour lisibilité historique** — le mapping vers les nouveaux tokens est systématisé dans le brand-kit §2.3.

---

## 1. Intro

### 1.1 Pourquoi cette spec

Le design proposé (produit **Ponglo**, système **Arcade** — dark neon) est fourni sous forme de mockups JSX + tokens, pas de Figma. Il introduit :
- **2 nouveaux écrans web** (WebDashboard organisateur, DisplayViewDrama finale)
- **Des refontes structurelles** de plusieurs écrans mobile (Score, Leaderboard, Profile, History)
- **Un ensemble de primitives DS enrichi** (Sparkline, CupVisualizer, Podium, BracketCard live, etc.)

Cette spec **compare écran par écran** l'app actuelle avec la cible, identifie les écarts, et arbitre `✅ Implémente (P0/P1/P2)` / `⏸ Reporte` / `❌ Ignore` pour chacun. Elle sert de base au **plan d'implémentation** en phases (document séparé produit après validation de cette spec).

### 1.2 Principe de lecture

Chaque entrée d'écran suit le même gabarit :

```
#### <NomEcran>

- **Route** : `/xxx`
- **Fichier** : `apps/web/src/pages/<File>.tsx` (ou N/A si nouveau)
- **Référence design** : `<fichier>.jsx > <Screen>` (ou N/A si pas d'équivalent zip)
- **État actuel** : description factuelle du JSX/flow actuel (pas d'interprétation).
- **Cible design** : extraction structurée du mockup Ponglo.
- **Gap** : diff concret (composants manquants, data manquante, layout différent, tokens différents).
- **Décision** : ✅ Implémente (P0/P1/P2) | ⏸ Reporte (raison) | ❌ Ignore (raison).
- **Dépendances** : endpoints, migrations, composants DS à créer en amont.
```

**Priorités** :
- **P0** — bloque la cohérence visuelle / flow critique. Doit être dans la première PR livrable.
- **P1** — visible mais pas bloquant. Dans les 2-3 PRs suivantes.
- **P2** — polish, finitions, animations.

### 1.3 Source files

**Design (read-only)** :
- `/tmp/bpl-redesign/tokens.js` — palette Cups + Arcade.
- `/tmp/bpl-redesign/primitives.jsx` — PButton, PRankBadge, EloDelta, Sparkline, PongloGlyph, PongloWordmark.
- `/tmp/bpl-redesign/mobile-screens-1.jsx` — Auth, Home, Join, CreateTournament, CreateLeague (+ helpers PhoneBody, MobileNav, TabBar, QuickAction, MatchRow, FormField, ToggleRow).
- `/tmp/bpl-redesign/mobile-screens-2.jsx` — Score, Leaderboard, Profile, History, TournamentBracket.
- `/tmp/bpl-redesign/design-canvas.jsx` — WebDashboard organisateur.
- `/tmp/bpl-redesign/web-display.jsx` — DisplayView + DisplayViewDrama.
- `/tmp/bpl-redesign/data.js` — données de démo (structures de référence).

**App existante** : `apps/web/src/pages/*.tsx` (19 pages), `apps/web/src/components/ponglo/`, `apps/web/src/components/design-system/`, `apps/web/tailwind.config.js`.

---

## 2. Décisions transverses (tranchées)

Les 5 points structurants ont été validés **avant** la spec écran-par-écran pour éviter de les rouvrir à chaque entrée.

### 2.1 Palette : **Everything ELO** (navy + electric blue + ping yellow) 🔄 **RÉVISÉ 2026-04-23**

✅ **Retenu (R1/R3)** : bascule du DS `Ponglo Arcade` vers **Everything ELO**. Le brand kit détaillé vit dans [`brand-kit-everything-elo.md`](./brand-kit-everything-elo.md) — la section ici n'est qu'un résumé du contrat **technique** pour `tailwind.config.js`.

**Tokens cibles** (à écrire dans `apps/web/tailwind.config.js` en phase A) :

| Rôle | Token | Hex | Remplace |
|---|---|---|---|
| App background | `navy` | `#0B1320` | `cream #0B0D14` |
| Deeper panels | `navy-deep` | `#070C16` | `cream-deep #050710` |
| Cards | `navy-soft` (alias `paper`) | `#141D2F` | `paper #141826` |
| Primary text | `white` | `#FFFFFF` | `ink #F4F2E8` |
| Secondary text | `cool-gray` | `#A8B0C0` | `ink-soft #B8B4A3` |
| Tertiary text | `cool-gray` alpha 0.5 | dérivé | `ink-mute #6B6A5E` |
| Accent principal (CTA, ELO hero, focus) | `electric-blue` / `electric-blue-deep` | `#2F6BFF` / `#1E4CD9` | `cup-blue`/`forest` `#3B8EFF` |
| Alerte / live / delta négatif | `signal-red` / `signal-red-deep` | `#FF3B3B` / `#D32828` | `cup-red`/`terracotta`/`ruby` `#FF4438` |
| Progression / delta positif / ELO up | `lime` / `lime-deep` | `#B7FF3B` / `#8BCC1F` | `lime #B8FF3D` (hex corrigé) |
| Highlight / podium 1er / bracket | `ping-yellow` / `ping-yellow-deep` | `#FFD400` / `#D9B400` | `gold #FFB800` |

**Aliases legacy conservés en transition** (`cream`, `paper`, `ink`, `ink-soft`, `ink-mute`, `forest`, `terracotta`, `gold`, `ruby`, `cup-red`, `cup-blue`, `cup-green`) → pointent vers les nouveaux hex le temps de la refonte, puis supprimés (section 6).

**Radius (inchangé)** : `xs:2 / sm:4 / md:6 / lg:10 / xl:14 / full:9999`.

**Shadows** : à regénérer pour le nouveau fond `navy` (les glows deviennent bleu électrique + lime + ping-yellow, plus rouge par défaut) :
- `shadow-card` — hairline white alpha + drop.
- `shadow-card-lg` — + glow `electric-blue` (remplace le glow rouge).
- `shadow-fab` — + glow `lime`.
- `shadow-modal` — deep drop.
- `shadow-glow-blue` / `shadow-glow-lime` / `shadow-glow-red` / `shadow-glow-yellow` — halos par pilier (cf. §2.6).

### 2.2 Typographie : **Sora + Teko + JetBrains Mono** 🔄 **RÉVISÉ 2026-04-23 (R4 = C)**

✅ **Retenu (R4)** : bascule vers la stack Everything ELO. **Satoshi parked** (licence Fontshare à valider plus tard → logbook §9.4).

| Rôle | Famille cible | Fallback | Usage |
|---|---|---|---|
| Display / hero numbers | **Teko** | Space Grotesk, system-ui | UPPERCASE, chiffres ELO géants, scoreboards, hero titles "LEADERBOARD", "FINALE". Toujours isolé d'un bloc Sora. |
| Body / UI | **Sora** (400/500/600/700) | Space Grotesk, system-ui | Texte courant, titres d'écran, labels, boutons. |
| Mono | **JetBrains Mono** (inchangé) | SF Mono, Menlo | Codes join (PG1847), scores tabulaires, ELO compact, labels uppercase letterSpacing `ELO · LIGUE`. |

**Chargement** : `@fontsource/sora` + `@fontsource/teko` dans `apps/web/package.json` (pas de CDN externe, cache Vercel). Côté mobile, `expo-font` + ttf embarqués.

**Mapping Tailwind** (à mettre à jour en phase A) :
- `font-sans` → Sora, Space Grotesk, system-ui (remplace Space Grotesk + Archivo).
- `font-display` → Teko, Space Grotesk, system-ui (remplace Archivo).
- `font-mono` → JetBrains Mono (inchangé).
- Alias `font-archivo` conservé en transition (pointe vers Teko).

**Discipline d'usage à enforcer** (audit pendant la refonte) :
- **Teko UPPERCASE uniquement**, hero elements isolés.
- **Mono uniquement** pour chiffres / codes / labels uppercase letterSpacing.
- Jamais de `font-family` hardcodé — passer par `font-sans` / `font-display` / `font-mono`.

### 2.3 Rank tiers : noms et seuils du design

✅ **Retenu** : on garde **exactement** les noms du design (thème boisson, français), extraits de `/tmp/bpl-redesign/primitives.jsx > buildRanks()` :

| Seuil ELO | Nom | Couleur |
|---|---|---|
| ≥ 0 | **MOUSSE** | `ink-mute` |
| ≥ 900 | **PICHET** | `cup-green` |
| ≥ 1100 | **DEMI** | `cup-red` |
| ≥ 1300 | **PINTE** | `cup-red-deep` |
| ≥ 1500 | **MAGNUM** | `cup-blue` |
| ≥ 1700 | **MÉTÉORE** | `cup-blue-deep` |
| ≥ 1900 | **LÉGENDE** | `gold` |

**Action** : aligner `PRankBadge` (DS existant) sur cette liste. Lors de la migration, auditer tous les endroits où un rank string est affiché en dur.

### 2.4 Bottom TabBar : **4 items + `+` central** 🔄 **RÉVISÉ 2026-04-23 (R6)**

✅ **Retenu (R6)** : recadrer la bottom nav à 4 items + bouton central saillant. Label item 2 renommé **“MATCHS”** (aligné pilier ÉNERGIE, plus clair que "Jouer").

| Ordre | ID | Label | Route | Pilier couleur actif |
|---|---|---|---|---|
| 1 | `home` | Accueil | `/` (Home) | `electric-blue` |
| 2 | `play` | **MATCHS** | `/play` (nouveau hub d'entrée match/tournoi) | `electric-blue` |
| — | `quick-create` (bouton central) | `+` | — (ouvre modal) | `lime` saillant |
| 3 | `rank` | Classement | `/leaderboard` | `electric-blue` |
| 4 | `me` | Profil | `/me` (user profile) | `electric-blue` |

**Item central `+`** (création rapide, motif récurrent apps sport) : ✅ **tranché (Groupe 7, 2026-04-23)** — bouton rond `lime` saillant (dépasse la barre), superposé entre les items 2 et 3 (MATCHS et Classement). **Pas un item de nav** (pas d'état actif, pas de route), c'est un "action button" qui ouvre un **modal quick-create** avec 3 options : Nouveau match / Nouveau tournoi / Nouvelle ligue. Cf. OQ #2 résolue.

**Impact** : la `BottomNav` existante côté web sera remplacée (5 items → 4 items + `+` central). Les routes `/play` et `/leaderboard` sont à créer ou renommer. Le modal quick-create = nouveau composant DS `QuickCreateSheet` (consolidé section 5). Le label `MATCHS` est tenu en Teko UPPERCASE (pilier ÉNERGIE).

### 2.5 CupVisualizer : **on implémente**

✅ **Retenu** : nouveau composant DS à construire, utilisé dans le flow Score mobile (ScreenScore). L'API détaillée est en section 5.

**Remark** : le CupVisualizer **mobile-first**. La version web du score entry (s'il existe) peut fallback sur une UI simplifiée à base de `+/-`, à arbitrer lors du Groupe 3/4.

### 2.6 Brand **Everything ELO** : architecture + piliers 🆕 **AJOUTÉ 2026-04-23 (R1/R2/R5/R7)**

✅ **Retenu (R1 = A)** : le rebrand Everything ELO est **intégré dans cette refonte** (pas de spec séparée). Détails complets dans [`brand-kit-everything-elo.md`](./brand-kit-everything-elo.md). Résumé des décisions structurantes qui affectent les écrans :

#### 2.6.1 Architecture de marque (R2/R5)

```
Everything ELO (parent)
├── Beer Pong ELO          ← on est ici (ex-Beer Pong League / Ponglo)
├── Padel ELO              ← roadmap long terme
├── Tennis ELO             ← roadmap long terme
└── Basket ELO             ← roadmap long terme
```

- **Rename produit (R2 = oui)** : "Beer Pong League" / "Ponglo" → **"Beer Pong ELO"** partout (UI, store, factures Stripe, emails). Acronyme `BPL` toléré dans code/commits/docs internes. Chantier rename doux **post-refonte** (voir OQ #14).
- **Pas d'extraction `packages/ui-elo-family` (R5 = B)** : on reste monolithique sur Beer Pong ELO tant qu'il n'y a pas de 2e vertical vivant. Loggé §9.4 "à essayer plus tard".
- **Nom code-base** : `apps/web` et `apps/mobile` restent tels quels. Le rename reste au niveau **produit** (affiché), pas filesystem.

#### 2.6.2 Les 4 Piliers comme thèmes couleur sémantiques (R7 = B)

Les piliers sont des **thèmes couleur**, pas des composants ni des routes. Ils guident le choix du token quand on implémente un élément d'UI.

| Pilier | Token couleur | Icône | Applications UI |
|---|---|---|---|
| **ÉNERGIE** | `electric-blue #2F6BFF` | ⚡ | CTA primaires, ELO hero card, scoreboard live, focus states, liens actifs, TabBar label "MATCHS" |
| **PROGRESSION** | `lime #B7FF3B` | 📊 | Delta ELO positif, badges rank up, sparklines montantes, barres de progression, success toasts, `+` central TabBar |
| **CONNEXION** | `signal-red #FF3B3B` | 👥 | Actions sociales (invite, partage, multi-joueur), badges communautaires, notifications d'interaction, live match banner |
| **COMPÉTITION** | `navy #0B1320` + accent `ping-yellow #FFD400` | 🏆 | Tournois, brackets, podium 1er, trophées, DisplayViewDrama finale |

**Règle de choix de couleur** : quand on hésite sur quel token utiliser pour un élément, on identifie d'abord **l'intention** (énergie/progression/connexion/compétition) puis on applique le token du pilier correspondant. C'est la **grille de décision** à appliquer pendant la refonte.

**Pas** :
- ❌ de route `/energie`, `/progression`…
- ❌ de composant `<Pillar name="..." />` ou `<PillarCard />`.
- ❌ de navigation par pilier dans l'app.

#### 2.6.3 Impact sur les sections 3-4 déjà écrites

Les entrées écran draftées avant le 2026-04-23 référencent les anciens tokens (`cream`, `cup-red`, `gold`, `forest`). **À chaque entrée**, le mapping §2.3 du brand-kit s'applique implicitement (ex: `ELO hero forest` → `ELO hero electric-blue`, `gold podium` → `ping-yellow podium`). Les sections 3-4 **ne seront pas re-éditées masse** pour éviter du bruit de diff — la phase A d'implémentation swap les tokens dans `tailwind.config.js`, et les entrées décrites avec les anciens noms continueront à rendre correctement via les aliases legacy.

---

## 3. Spec par écran — WEB

### 3.1 Groupe 1 — Onboarding (Landing, AuthCallback, Join, TournamentJoin, TournamentInvite)

#### LandingPage

- **Route** : `/`
- **Fichier** : `apps/web/src/pages/LandingPage.tsx` (103 lignes)
- **Référence design** : `mobile-screens-1.jsx > ScreenAuth`
- **État actuel** :
  - Fond `bg-forest` (#3B8EFF), décor cups SVG opacity 5%, `PongloWordmark` size 22 en top.
  - Headline `font-archivo font-black uppercase` avec `<span className="text-lime">vrai classement.</span>`.
  - Paragraphe descriptif `text-ink/70`.
  - 3 CTAs : `PButton variant="lime" size="lg" full` → "Créer un compte" (ouvre `AuthModal`), `PButton variant="ghost"` → "J'ai un code de tournoi →" (navigate `/join`), bouton texte `"Déjà membre ? Se connecter"` → ouvre `AuthModal`.
  - État : **déjà implémenté avec le design cible** (un commentaire de tête pointe explicitement `Ref: /tmp/bpl-design/mobile-screens-1.jsx > ScreenAuth`).
- **Cible design** : identique à l'actuel. Le zip ScreenAuth utilise `PhoneBody bg={P.forest}`, même décor cups, même typo, mêmes CTAs (sauf nuance : le zip n'a pas de notion de modal — il suppose un navigate).
- **Gap** : quasi nul.
  - 🟡 `handleCreateAccount` met `sessionStorage.setItem("authReturnTo", "/home")` — la nouvelle nav a `/` comme Home (pas `/home`). À vérifier/aligner avec le routing final.
  - 🟡 La taille du headline utilise `clamp(32px, 10vw, 48px)`. Le design prescrit 52px fixe mobile. À conserver le clamp pour desktop (ok responsive) — juste valider visuellement.
- **Décision** : ✅ **Implémente P2** (polish visuel uniquement, pas de refonte).
  - Action 1 (P2) : aligner la route post-auth (`authReturnTo`) avec la nouvelle Home.
  - Action 2 (P2) : audit visuel side-by-side avec le mockup.
- **Dépendances** : aucune. Dépend de la nouvelle Home pour valider `authReturnTo`.

---

#### AuthCallback

- **Route** : `/auth/callback`
- **Fichier** : `apps/web/src/pages/AuthCallback.tsx` (151 lignes)
- **Référence design** : **N/A** (le zip n'a pas d'écran de callback auth explicite).
- **État actuel** :
  - Gère le retour Supabase OTP (`supabase.auth.getSession()`).
  - Crée le profil si absent (`profileService`), déclenche `identityMergeService` pour fusionner les identités anonymes.
  - 3 états visuels : `loading` (🍺 + texte), `success` (✅ + texte), `error` (⚠️ + retry button).
  - Styling minimaliste : `bg-cream`, `text-ink`, centré, emojis.
  - Redirect vers `sessionStorage.authReturnTo` ou `/` après succès (timeout 1.5s).
- **Cible design** : **à définir** (pas de référence). Propositions d'inspiration :
  - Fond cream dark uniforme.
  - Remplacer les emojis par :
    - Loading : `<PongloGlyph>` + spinner lime.
    - Success : cocktail glyph + message cream.
    - Error : icône ruby + CTA `PButton variant="primary"` "Réessayer".
  - Typo : title Archivo uppercase, body Space Grotesk.
- **Gap** : style cohérent avec le DS Arcade à appliquer, mais fonctionnalité déjà solide. Pas de data/endpoint à ajouter.
- **Décision** : ✅ **Implémente P1** (polish DS, pas de refonte fonctionnelle).
  - Remplacer emojis par glyphs Ponglo + typo DS.
  - Boutons en `PButton` plutôt que boutons custom.
  - Garder la logique de session / identity merge telle quelle.
- **Dépendances** : `PongloGlyph` (existe), `PButton` (existe).

---

#### Join (saisie code + QR)

- **Route** : `/join`
- **Fichier** : `apps/web/src/pages/Join.tsx` (239 lignes)
- **Référence design** : `mobile-screens-1.jsx > ScreenJoin`
- **État actuel** :
  - Top nav custom : bouton rond ChevronLeft + titre "REJOINDRE" uppercase Archivo.
  - Headline `"Scanne le QR / ou tape le code."` 34px, Archivo black, uppercase, tracking négatif.
  - Carte "Ouvrir le scanner" : aspect-square, `bg-ink`, décor QR pattern 21×21 (441 cellules générées déterministiquement), centre blanc avec icône Camera.
  - Séparateur `— OU —` en mono.
  - Input code 6 slots (aspect 0.8), focus state `border-forest`, overlay input transparent.
  - CTA sticky bas `PButton primary size=lg full` → `handleSubmit` via `useJoinTournament`.
  - `QRScanner` modal (camera + fallback code).
- **Cible design** : quasi-identique. Le zip ScreenJoin affiche un **QR décoratif plein** (représente le QR du tournoi, pas l'entrée scanner). L'app actuelle a pivoté vers **"scanner entry"** (logique : on rejoint un tournoi, on ne montre pas son propre QR ici) — ce pivot est **meilleur que le design d'origine**.
- **Gap** : aucun significatif. Le design d'origine serait moins utile.
  - 🟢 Bonus : l'app a `ChevronLeft` (lucide) là où le design inline un SVG custom — équivalent.
  - 🟡 Détail : le décor QR à 441 cellules a une subtile différence d'algo entre zip et app (logique `cornerRing` conditions), probablement imperceptible visuellement.
- **Décision** : ✅ **Implémente P2** (aucun changement requis, juste audit visuel).
- **Dépendances** : aucune.

---

#### TournamentJoin (rejoindre un tournoi via ID)

- **Route** : `/tournament/:id/join`
- **Fichier** : `apps/web/src/pages/TournamentJoin.tsx` (326 lignes)
- **Référence design** : **N/A** (pas d'équivalent direct dans le zip — ScreenJoin couvre la saisie code, pas la sélection de joueur une fois rentré).
- **État actuel** :
  - `ContextualHeader` + `TournamentCard`.
  - Deux sections :
    1. "Sélectionner un joueur existant" : liste `PlayerCard` compact avec select state, CTA `"Rejoindre en tant que ce joueur"`.
    2. "Créer un nouveau joueur" : bouton qui bascule sur un form (input + submit).
  - Bloc `HelpCard` "Comment ça marche ?" 3 étapes.
  - Styling **legacy** : `bg-gradient-card`, `bg-gradient-to-r from-cup-blue to-violet-600`, `border-card/50`, rounded-xl.
  - Modal `CreateIdentityModal` JIT si pas d'identité.
- **Cible design** : pas de maquette directe. Propositions d'adaptation DS :
  - Appliquer le pattern **bloc-forest CTA** : fond `bg-paper` avec hairline `border-card`, CTA principal en `PButton variant="primary" size="lg"` (pas de gradient violet).
  - Remplacer les gradients violets par les tokens Arcade (`cup-red` ou `cup-blue` pleins).
  - Typo des titres : `font-archivo font-black uppercase` au lieu de `text-lg font-bold`.
  - Utiliser le pattern `MobileNav` (bouton rond retour) plutôt que `ContextualHeader` legacy — **à valider** : le header legacy peut rester si la refonte du header est un P2 séparé.
- **Gap** :
  - 🔴 Styling entièrement legacy (gradients violets inexistants dans le DS Arcade).
  - 🟡 Textarea de titre non-conforme DS (`text-lg font-bold` au lieu de Archivo).
  - 🟡 `HelpCard` existe dans le DS — à garder tel quel.
  - 🟢 Logique fonctionnelle solide (identité JIT, validation nom).
- **Décision** : ✅ **Implémente P1** (refonte visuelle, logique intacte).
  - Remplacer tous les gradients legacy par les tokens Arcade.
  - Aligner les titres sur la typo display.
  - Garder la logique `useRequireIdentity` + `CreateIdentityModal` + `HelpCard`.
- **Dépendances** : `PButton` (existe), alignement optionnel avec refonte `ContextualHeader` (voir Groupe 3).

---

#### TournamentInvite (QR + lien à partager)

- **Route** : `/tournament/:id/invite`
- **Fichier** : `apps/web/src/pages/TournamentInvite.tsx` (203 lignes)
- **Référence design** : **N/A** (le zip ne montre pas cet écran. ScreenCreateTournament affiche le code généré `PG1847` dans une bannière forest, mais pas d'écran dédié avec QR + partage).
- **État actuel** :
  - `ContextualHeader` + `TournamentCard`.
  - Carte QR `bg-paper`, `QRCodeSVG` responsive (220 mobile / 300 desktop), fond blanc.
  - Carte lien + boutons `Copier` / `Partager` (Web Share API fallback).
  - `HelpCard` "Comment ça marche ?" 4 étapes.
  - Styling legacy : `bg-paper`, `bg-cup-red/20` pour boutons actifs.
- **Cible design** : adaptation directe du pattern "code généré bannière forest" de ScreenCreateTournament, étendu à un écran de partage complet :
  - Bannière "CODE GÉNÉRÉ" en `bg-forest` avec code en Archivo 32px letterSpacing 4px.
  - QR en carte blanche (comme actuel) mais encadrée par un liseré forest/lime.
  - Boutons `PButton variant="primary"` pour copier/partager (pas de gradients mixtes).
- **Gap** :
  - 🟡 La bannière code (présente dans ScreenCreateTournament) n'est pas réutilisée ici — ce serait une unification visuelle bienvenue.
  - 🟡 Boutons custom `bg-cup-red/20` → remplacer par `PButton`.
  - 🟢 `QRCodeSVG`, `HelpCard`, logique copy/share solides.
- **Décision** : ✅ **Implémente P1** (refonte visuelle + ajout bannière code).
  - Ajouter la bannière "CODE DU TOURNOI" pattern ScreenCreateTournament (si le tournoi a un code lisible — cf dépendance).
  - Remplacer boutons custom par `PButton`.
  - Garder QRCodeSVG + logique partage.
- **Dépendances** :
  - Besoin d'un **code court lisible par tournoi** (`PG1847` style). À vérifier : le modèle actuel a-t-il déjà ce champ ? Sinon **open question #1** (voir section 8). Sinon fallback : afficher seulement l'ID tronqué.

---

### 3.2 Groupe 2 — Création (CreateTournament, CreateLeague)

#### CreateTournament

- **Route** : `/tournament/new` (probable, à vérifier dans le router)
- **Fichier** : `apps/web/src/pages/CreateTournament.tsx` (568 lignes)
- **Référence design** : `mobile-screens-1.jsx > ScreenCreateTournament`
- **État actuel** :
  - `ScreenLayout` + `ContextualHeader` ("Créer un Tournoi", bouton retour).
  - **Freemium gate** : `premiumService.canCreateTournament()` — modal "LimiteAtteinte" si compte gratuit > 2 tournois. CTA gold "✨ Passer Premium — 3€" + "Plus tard".
  - **Bannière quota** : si non-premium : "X tournoi(s) restant(s) sur 2 (gratuit)" avec icône `Info` cup-blue. Si premium : bannière gold "Tournois illimités — Premium actif".
  - **Form fields** :
    1. `name` — input text, max 50 char, compteur caractères mono, validation inline.
    2. `format` — 3 radios cartes `2v2 / 1v1 / libre` avec description, active state `border-cup-red bg-cup-red/10`.
    3. `hasPlayerLimit` — toggle row "Limiter le nombre de joueurs" + (si on) input number 2-100.
    4. `isPrivate` — toggle row "🔒 Tournoi privé / Seuls ceux qui ont le code peuvent rejoindre".
  - **CTA sticky** : `bg-cup-red` pill rounded-full, shadow 3px cup-red-deep, "Créer le tournoi".
  - Génération code unique côté client (`generateTournamentCode` → 6 chars ABC123 excluant 0/O/I/1/L, collision-resilient 10 retries), création tournoi via `databaseService.createTournament()`.
  - **Tokens utilisés** : cup-red/cup-red-deep (CTA), lime (focus ring), ruby (errors), gold (premium), cream/paper/ink canoniques. ✅ **Déjà DS Arcade conforme**.
- **Cible design** (`ScreenCreateTournament`) :
  - `MobileNav title="Nouveau tournoi"` + bouton rond retour.
  - Headline "Un soir, un bracket." (Archivo 30px, black, uppercase, letterSpacing -1).
  - Champs pattern **`FormField`** (label mono uppercase + value 16px + chevron optionnel) — **different pattern** du form actuel.
  - Field order : Nom / Format (chevron select) / Équipes (nombre) + Par équipe (chevron select) / Date de début (chevron date picker).
  - Section "ELO & règles" avec 3 `ToggleRow` : "Compter pour l'ELO" / "Public" / "Inscription libre".
  - **Bannière code généré** : `bg-forest` rounded-lg, label mono "CODE GÉNÉRÉ", value Archivo 32px letterSpacing 4 ("PG1847"), sub "Tape-le ou scanne le QR pour rejoindre".
  - CTAs bas : `ghost "Brouillon"` + `primary "Créer →"` (split).
- **Gap** :
  - 🟡 **Headline manquante** ("Un soir, un bracket.") — très identitaire du design, absente actuellement.
  - 🟡 **Pattern des fields différent** : actuel = label visible au-dessus + input stylé ; design = `FormField` avec label mono discret intégré dans la carte + value éditable inline + chevron pour selects.
  - 🟡 **Pas de "date de début"** dans le form actuel — le design inclut "Ven. 24 avr. 20:30". **Open question** : ajoute-t-on ce champ ? (probablement nice-to-have pour tournois planifiés).
  - 🟡 **Pas de "nombre d'équipes" / "par équipe"** comme champs chevron — l'actuel dérive ça du `format` (2v2/1v1/libre). Le design propose des champs explicites. Garder la logique actuelle (plus simple) et ne pas dupliquer.
  - 🟡 **Bannière code généré** : pas présente **avant** création (dans l'actuel le code n'est visible qu'après, dans `TournamentInvite`). Le design la montre en preview **pendant** la création. Implication : soit préview `PG1847` (fake) avec tooltip "code final généré à la création", soit attendre post-création. **Prefer post-création** (évite la confusion code preview ≠ code final).
  - 🟡 **Toggles différents** :
    - Design : ELO / Public / Inscription libre.
    - Actuel : Limite joueurs / Privé.
    - Gap fonctionnel : "Compter pour l'ELO" et "Inscription libre" sont des nouveaux concepts ⇒ nécessitent colonnes DB ⇒ **open question** (voir OQ #6).
  - 🟡 **CTA Brouillon** — pas implémenté actuellement. Nice-to-have P2.
  - 🟢 **Freemium gate + modal LimiteAtteinte** — absent du design (le design est idéal sans contraintes commerciales). On **garde** la logique actuelle.
  - 🟢 **Validation + errors** — solide, à garder.
- **Décision** : ✅ **Implémente P1** (refonte visuelle + ajout headline ; pas de gros ajouts fonctionnels dans le premier passage).
  - **P1.a** : ajouter headline "Un soir, un bracket." (Archivo 30px black uppercase).
  - **P1.b** : migrer les 2 toggles existants (`hasPlayerLimit`, `isPrivate`) sur le pattern `ToggleRow` DS (section 5).
  - **P1.c** : migrer les input text sur le pattern `FormField` DS (label mono + value inline). Format radios peuvent rester tels quels (le design propose un chevron select, moins ergonomique qu'une liste à 3 options visibles).
  - **P2.a** : ajouter champ "Date de début" optionnel (nouveau champ DB ⇒ migration) — à arbitrer avec OQ #6.
  - **P2.b** : bouton "Brouillon" — à arbitrer, probablement ⏸.
  - **⏸** : ajout des toggles ELO/Public/Inscription libre (besoin cadrage produit + migration — voir OQ #6).
  - **✅ Garder** : freemium gate + modal LimiteAtteinte, bannière quota, validation inline, génération code 6 chars, tokens Arcade.
- **Dépendances** :
  - `FormField` DS (à créer, voir section 5).
  - `ToggleRow` DS (à créer, voir section 5).
  - Éventuellement migration SQL si P2.a retenu.

---

#### CreateLeague

- **Route** : `/league/new` (probable, à vérifier dans le router)
- **Fichier** : `apps/web/src/pages/CreateLeague.tsx` (226 lignes)
- **Référence design** : `mobile-screens-1.jsx > ScreenCreateLeague`
- **État actuel** :
  - `ScreenLayout` + `ContextualHeader` ("Nouvelle League", retour vers `/leagues`).
  - **Auth gate** : `AuthModal` si pas connecté — affiché au mount, bloque la création.
  - **Form fields** :
    1. `name` — input text, max 100 char, validation inline (required, min 2 chars).
    2. `type` — 2 cartes radio style boutons : `event` (Calendar icon, "League Continue / Classement persistant dans le temps") et `season` (Trophy icon, "League par Saison / Classement par saison avec reset périodique").
  - CTA sticky `bg-cup-red` rounded-full, shadow 3px, "C'est parti !" (ou "Connexion requise" si pas authentifié).
  - **Tokens utilisés** : cup-red/cup-red-deep, lime focus, ruby errors, paper/cream/ink. ✅ **Déjà DS Arcade conforme**.
- **Cible design** (`ScreenCreateLeague`) :
  - `MobileNav title="Nouvelle ligue"` + bouton rond retour.
  - Headline "Un classement qui tient la saison." (Archivo 30px black uppercase, "saison." highlighted `text-terracotta`).
  - Subheadline 13px ink-soft : "Une ligue = un groupe durable. Les matchs font grimper (ou chuter) l'ELO au fil du temps."
  - `FormField` "Nom de la ligue" / `FormField` "Saison" avec chevron ("Saison 5 · Été 2026").
  - Carte custom "ELO de départ" : label mono + value 36px Archivo ("1200 par défaut (standard Elo)") + slider range 800-1200-1600.
  - Section "Confidentialité" avec 2 `ToggleRow` : "Ligue privée" / "Historique public".
  - Callout dashed forest "★ GG bonus : tu commences comme commissaire de la ligue. Tu peux nommer d'autres organisateurs plus tard."
  - CTA unique bas `PButton variant="accent" size="lg" full` "Lancer la ligue →".
- **Gap** :
  - 🟡 **Headline + subheadline manquantes** — fortement identitaires, facile à ajouter.
  - 🔴 **Choix `type` différent** :
    - Actuel : `event` (continue) / `season` (avec reset).
    - Design : pas de choix event/season visible dans le mockup — uniquement "Saison" en FormField chevron. Le design implique qu'une ligue **est toujours** saisonnière.
    - **Divergence conceptuelle** — à trancher : on garde le dual event/season actuel (plus flexible) ou on s'aligne sur "toujours saison" ? Voir OQ #7.
  - 🔴 **ELO de départ configurable** — design prescrit un slider 800-1600 avec défaut 1200. Actuel : pas de choix (probablement hardcodé à 1200). **Nécessite migration** (colonne `starting_elo`) + éventuellement logique backend. **Open question** (OQ #8).
  - 🟡 **2 toggles design** (Ligue privée / Historique public) — actuel n'a ni l'un ni l'autre. "Privée" = concept nouveau pour les ligues (il existe pour les tournois). "Historique public" = encore plus nouveau. Besoin cadrage produit. ⏸ initialement.
  - 🟡 **Callout GG bonus** — facile à ajouter, pur visuel.
  - 🟢 **Auth gate + AuthModal** — solide, à garder (le design assume l'auth déjà faite).
  - 🟢 **Validation + errors** — solide, à garder.
- **Décision** : ✅ **Implémente P1** (refonte visuelle ; ajouts fonctionnels parkés).
  - **P1.a** : ajouter headline "Un classement qui tient la saison." + subheadline.
  - **P1.b** : ajouter callout dashed forest "GG bonus commissaire".
  - **P1.c** : migrer le name input sur pattern `FormField` DS.
  - **P2.a** : audit du choix event/season (OQ #7) — probablement **garder** le dual actuel si le produit en dépend.
  - **⏸** : ELO de départ slider (OQ #8 — migration + cadrage produit).
  - **⏸** : toggles "Ligue privée" / "Historique public" (cadrage produit).
  - **✅ Garder** : auth gate, validation inline, CTA style actuel (pill cup-red shadow), type event/season (le temps de l'arbitrage).
- **Dépendances** :
  - `FormField` DS (commun avec CreateTournament — voir section 5).
  - `ToggleRow` DS (si toggles ajoutés ultérieurement).
  - Migrations SQL si OQ #8 retenue (`starting_elo`), si "Ligue privée" retenue (`is_private`), etc.

### 3.3 Groupe 3 — Dashboards (Home, Tournaments, Leagues, LeagueDashboard, TournamentDashboard)

> **Note conceptuelle (2026-04-23)** : dans l'app actuelle, un "tournoi" est un **classement ponctuel sur un événement** (ex: soirée du vendredi), pas un bracket d'élimination. Conséquence pour ce groupe :
> - Aucun `BracketCard` ni tab `Bracket` n'est implémenté (✗ décision Groupe 3 Q3.8).
> - Le renommage produit `Tournoi → Événement` est envisagé mais **parké en OQ #9** (migration DB + URLs + labels trop large pour ce cycle).

#### Home

- **Route** : `/`
- **Fichier** : `apps/web/src/pages/Home.tsx` (305 lignes)
- **Référence design** : `mobile-screens-1.jsx > ScreenHome`
- **État actuel** :
  - `bg-cream`, `MobileNav` custom (pas `ContextualHeader`), `PongloGlyph` + wordmark.
  - **ELO hero card** : `bg-forest` (#3B8EFF) avec glow lime, `EloDelta +24`, ELO value 72px Archivo, sparkline inline (~12 points), label `PRankBadge`.
  - **QuickAction grid 2×2** : `Nouveau match` / `Rejoindre` / `Tournoi` / `Ligue` (icônes lucide + labels Archivo uppercase + bg tokens distincts).
  - **Active tournament banner** (si présent) : carte `bg-paper` avec dot ruby pulse + label "EN DIRECT", nom tournoi, CTA "Partager" (⚠️ pointe actuellement vers `handleUpgradeClick` — probable bug hors-scope de la spec).
  - **3 derniers matchs** : liste compacte avec `ActivityRow` inline (adversaire + score + delta ELO + date).
  - Pas de bottom TabBar (nav 4 items arrive au DS update).
- **Cible design** (`ScreenHome`) :
  - ELO hero en **gradient terracotta** (`bg-gradient-cta` = `cup-red → cup-red-deep`), pas `bg-forest` bleu. Headline ELO identique (Archivo 72px), sparkline réutilisable.
  - QuickAction grid 2×2 (design propose : `Jouer un match / Voir bracket / Inviter / Classement` — ignoré car on conserve les actions actuelles, voir décision Q3.1).
  - Active tournament `BracketCard` live (on garde la bannière, sans BracketCard puisque pas de bracket dans BPL — décision Q3.8).
  - Liste des 3 derniers matchs quasi-identique à l'actuel.
- **Gap** :
  - 🔴 **ELO hero** : `bg-forest` bleu → doit passer en `bg-gradient-cta` terracotta (décision Q3.2).
  - 🟡 **Sparkline** : inline dans Home aujourd'hui → extraire en **primitive DS** (utilisée aussi dans Profile + Leaderboard — décision Q3.3, P1).
  - 🟡 **Active tournament banner** : "Partager" bouton redirige vers upgrade premium (bug probable). À auditer séparément, pas bloquant pour la refonte.
  - 🟢 **QuickAction grid** : on garde l'existant (`Nouveau match / Rejoindre / Tournoi / Ligue`) — décision Q3.1.
  - 🟢 **Layout + MobileNav** : solides.
- **Décision** : ✅ **Implémente P1** (refonte chromatique + extraction primitive).
  - **P1.a** : migrer ELO hero card de `bg-forest` vers `bg-gradient-cta` (terracotta gradient) + ajuster le glow lime pour rester lisible.
  - **P1.b** : extraire `Sparkline` en primitive DS (section 5) et remplacer l'usage inline.
  - **P2.a** : audit bug "Partager" → `handleUpgradeClick` (hors-scope spec, à logger comme tech-debt).
  - **✅ Garder** : QuickAction grid 2×2, ActivityRow, MobileNav custom, PongloGlyph, logique EloDelta.
- **Dépendances** :
  - `Sparkline` DS (à créer — voir section 5).
  - Pas de migration DB.

---

#### Tournaments (liste)

- **Route** : `/tournaments`
- **Fichier** : `apps/web/src/pages/Tournaments.tsx` (239 lignes)
- **Référence design** : **N/A** (le zip Ponglo ne propose pas d'écran "liste de tournois" dédié — seul l'écran de détail `ScreenTournament` existe).
- **État actuel** :
  - `ScreenLayout` + `ContextualHeader` (action "CRÉER TOURNOI" avec icône + flag `premium` si quota atteint).
  - `SearchBar` (debounce 300ms interne) + `SegmentedTabs variant="encapsulated"` (`Tous / Actifs / Terminés`).
  - Responsive : `lg:grid lg:grid-cols-2 lg:gap-6` desktop, stack vertical mobile.
  - `TournamentCard` pour chaque item.
  - **Empty state** : 🏆 + headline "Aucun tournoi" + 2 CTAs ("Créer un tournoi" + "Rejoindre un tournoi").
  - **Freemium gate** : `usePremiumLimits` + `PaymentModal` si `isAtTournamentLimit`.
  - `FAB` bottom-right avec icône Plus + `ariaLabel`.
  - `Banner` en cas d'erreur de chargement.
  - ✅ **Déjà DS Arcade conforme** (bg-cream, PButton tokens, cup-red, paper, ink).
- **Cible design** : aucun équivalent direct. Par extrapolation du pattern design :
  - Header compact + éventuellement count mono (`8 tournois · 2 actifs`).
  - Empty state illustré (PongloGlyph plutôt que emoji ?).
  - Reste du pattern liste + FAB est standard, le design ne le refond pas.
- **Gap** : minimal.
  - 🟡 **Empty state emoji 🏆** → pourrait utiliser `PongloGlyph` pour cohérence DS (polish P2).
  - 🟡 **Header subtitle count** : ajouter sous le titre "X tournois · Y actifs" en mono uppercase (polish P2).
  - 🟢 **Pattern global (SearchBar + Tabs + grid + FAB)** : solide, pas de refonte.
- **Décision** : ✅ **Implémente P2** (polish uniquement, décision Q3.4).
  - **P2.a** : remplacer emoji 🏆 par `PongloGlyph` dans l'empty state (option au choix — conserver emoji est acceptable).
  - **P2.b** : ajouter count mono dans le header.
  - **✅ Garder** : SearchBar + SegmentedTabs + FAB + responsive grid + PaymentModal + TournamentCard + Banner.
- **Dépendances** : aucune.

---

#### Leagues (liste)

- **Route** : `/leagues`
- **Fichier** : `apps/web/src/pages/Leagues.tsx` (210 lignes)
- **Référence design** : **N/A** (même remarque que Tournaments).
- **État actuel** : pattern identique à Tournaments — `ScreenLayout` + `ContextualHeader` + `SearchBar` + `SegmentedTabs` + `LeagueCard` grid + `FAB` + empty state 🏅 + freemium gate (1 ligue gratuit) + `PaymentModal` + `Banner`.
  - ✅ **Déjà DS Arcade conforme**.
- **Cible design** : même extrapolation que Tournaments. Pas d'écran dédié.
- **Gap** : minimal, identique à Tournaments.
- **Décision** : ✅ **Implémente P2** (polish aligné avec Tournaments pour cohérence visuelle).
  - **P2.a** : empty state emoji 🏅 → `PongloGlyph` optionnel.
  - **P2.b** : header count mono.
  - **✅ Garder** : toute la logique + pattern liste.
- **Dépendances** : aucune. Mutualiser le travail avec Tournaments (même code de header/empty-state).

---

#### LeagueDashboard

- **Route** : `/league/:id`
- **Fichier** : `apps/web/src/pages/LeagueDashboard.tsx` (755 lignes)
- **Référence design** : `mobile-screens-2.jsx > ScreenLeaderboard` (podium + pills) pour le tab Classement.
- **État actuel** :
  - `ScreenLayout` + `ContextualHeader` + `SegmentedTabs` (`Classement / Matchs / Paramètres`).
  - **InfoCard** en tête (status de la ligue : event/season, format, date création).
  - **StatCard** 3 colonnes (Joueurs / Matchs / Top ELO).
  - **Tab Classement** : liste triée par ELO desc, `ListRow variant="player"` avec `rank`, `delta` (mini-EloDelta), `recentResults` (5 derniers V/D), `elo` (mono).
  - **Tab Matchs** : liste chronologique inverse, `TeamA vs TeamB scores`, enrichie par `MatchEnrichedDisplay` (photo team + cups).
  - **Tab Paramètres** : infos ligue (name, type), liste tournois associés, liste joueurs, actions (export JSON, delete).
  - **FAB** avec `BeerPongMatchIcon` → ouvre **modal Record Match** (simple form : team builder + winner selection + validate button).
  - **Modal Add Player** (simple form, pseudo uniquement).
  - Styling : majoritairement DS Arcade. Quelques touches legacy (`bg-accent`, `bg-primary`) dans les modals internes.
- **Cible design** (`ScreenLeaderboard`) :
  - `MobileNav` title + sub.
  - **Headline** "Ligue du Vendredi" (Archivo large).
  - **Pills filtre** `Saison / Ligue / Global` (3 chips encapsulés).
  - **Podium top 3** : hauteur dégressive `78 / 56 / 44 px` (or / argent / bronze), avatars au sommet, scores sous chaque socle. Forest #1, ink-soft #2-3.
  - **LeaderRow list** : rank + nom + winrate + sparkline + ELO.
  - **FAB** absent (on accède au record match ailleurs).
- **Gap** :
  - 🔴 **Pas de Podium top 3** actuellement → à ajouter en tête du tab Classement (décision Q3.5). Nouveau primitive DS.
  - 🔴 **Record Match = modal simple** → doit devenir une **vraie page** `/record-match/:leagueId` avec `CupVisualizer` + ELO preview live (`ScreenScore` du design — décision Q3.7). **Gros chantier**.
  - 🟡 **Pills Saison / Ligue / Global** : parkées ⏸ (décision Q3.6, nouvelle **OQ #10** — feature complexe cross-ligue, notion de saison).
  - 🟡 **Sparkline dans LeaderRow** : à intégrer quand la primitive DS est prête.
  - 🟡 **Styling legacy dans modals** (`bg-accent`, `bg-primary`) → nettoyer aux tokens canoniques.
  - 🟢 **InfoCard, StatCard, SegmentedTabs, ListRow** : solides, à garder.
- **Décision** : ✅ **Implémente P0 + P1** (Record Match page = blocker car coeur de l'app ; Podium = identitaire).
  - **P0.a** : créer la **page `/record-match/:leagueId`** (remplace la modal) avec layout ScreenScore : cup-visualizer + ELO preview live + CTA validation. Route partagée avec TournamentDashboard.
  - **P1.a** : ajouter `Podium` top 3 en tête du tab Classement (visible si `players.length ≥ 3`).
  - **P1.b** : ajouter Sparkline (primitive DS) dans chaque `ListRow` du classement.
  - **P2.a** : nettoyer styling legacy (`bg-accent` → `cup-red`, etc.) dans les modals internes.
  - **⏸** : pills `Saison / Ligue / Global` (OQ #10 — cadrage produit + backend cross-ligue).
  - **✅ Garder** : InfoCard + StatCard 3-cols + tabs order `Classement/Matchs/Paramètres` + FAB → nouvelle page + Add Player modal + export JSON + delete.
- **Dépendances** :
  - `Podium` DS (à créer — voir section 5).
  - `Sparkline` DS (commun avec Home).
  - `CupVisualizer` DS (déjà planifié section 2.5, utilisé dans page Record Match).
  - `EloDelta` (existe).
  - Nouvelle route React Router : `/record-match/:leagueId` et `/record-match/:tournamentId` (ou paramétrée par type).

---

#### TournamentDashboard

- **Route** : `/tournament/:id`
- **Fichier** : `apps/web/src/pages/TournamentDashboard.tsx` (1142 lignes)
- **Référence design** : `mobile-screens-2.jsx > ScreenTournament` (partiellement — la partie "Bracket" est **ignorée**, décision Q3.8).
- **État actuel** :
  - `ScreenLayout` + `ContextualHeader` + `SegmentedTabs` (`Classement / Matchs / Paramètres`) — parallèle à LeagueDashboard.
  - **InfoCard** (nom, dates, format, status), **StatCard** 3 colonnes.
  - **Ranking mode toggle** (local tournoi vs global ligue) si `leagueId` présent.
  - **Tab Paramètres** inclut une **section Invitation** remarquable : QRCode affiché + `joinCode` en mono large + bouton "Afficher en plein écran" (ouvre un écran QR fullscreen pour projection).
  - Association à une ligue (selector), anti-cheat toggle, close/leave/delete actions.
  - **Modal Add Player 3-tabs** : `Pseudo / Invitation / Depuis ligue` (pattern riche vs LeagueDashboard qui n'a qu'un simple form).
  - **Record Match** via `MatchRecordingForm` (simple form dans modal).
  - Bouton "Voir écran" → `TournamentDisplayView` (fullscreen affichage public).
  - Styling : DS Arcade majoritaire, quelques `border-primary`, `bg-accent` legacy.
- **Cible design** (`ScreenTournament`) : le mockup propose `Bracket / Matchs / Classement` tabs + `BracketCard` live. **Ignoré** dans la refonte car BPL = classement ponctuel, pas élimination (Q3.8).
- **Gap** :
  - 🔴 **Record Match modal** → page dédiée `/record-match/:tournamentId` (mutualisée avec LeagueDashboard, décision Q3.7).
  - 🟡 **Bouton "Voir écran"** : à **déplacer vers le futur WebDashboard organisateur** (Groupe 6, décision Q3.11). La page Tournoi côté "joueur" n'a plus besoin de ce CTA.
  - 🟡 **Ordre tabs** : `Classement / Matchs / Paramètres` — **garder** (décision Q3.12 : unifier avec LeagueDashboard, ignorer proposition design `Bracket / Matchs / Classement`).
  - 🟡 **Styling legacy** (`border-primary`, `bg-accent`) dans les actions de Paramètres → nettoyer.
  - 🟢 **Section Invitation (QR + joinCode + fullscreen)** : **excellente, à garder telle quelle** (décision Q3.10).
  - 🟢 **Add Player modal 3-tabs** : riche, conserver.
  - ❌ **Bracket tab + BracketCard live** : hors-scope (décision Q3.8).
- **Décision** : ✅ **Implémente P0 + P1** (Record Match = P0 mutualisé avec LeagueDashboard ; divers polish en P1).
  - **P0.a** : brancher le FAB "Record Match" sur la page dédiée `/record-match/:tournamentId` (créée via LeagueDashboard).
  - **P1.a** : déplacer le bouton "Voir écran" vers le WebDashboard organisateur (Groupe 6).
  - **P1.b** : ajouter `Podium` top 3 en tête du tab Classement (mutualisé avec LeagueDashboard, visible si ≥3 joueurs).
  - **P2.a** : nettoyer styling legacy (`border-primary`, `bg-accent`) dans Paramètres.
  - **⏸** : renommage produit `Tournoi → Événement` (nouvelle **OQ #9** — impact DB + URLs + labels trop large pour ce cycle).
  - **❌ Ignore** : `BracketCard` live + tab `Bracket` (non pertinent — BPL ne fait pas de bracket).
  - **✅ Garder** : InfoCard + StatCard + SegmentedTabs + ranking mode toggle + section Invitation (QR + joinCode + plein écran) + Add Player 3-tabs modal + anti-cheat toggle + close/leave/delete.
- **Dépendances** :
  - Page `/record-match/:id` (mutualisée — voir LeagueDashboard).
  - `Podium` DS (mutualisé).
  - `Sparkline` DS (mutualisé).
  - Futur WebDashboard organisateur (Groupe 6) pour accueillir le CTA "Voir écran".

### 3.4 Groupe 4 — Profils (PlayerProfile, UserProfile)

#### PlayerProfile

- **Route** : `/player/:playerId`
- **Fichier** : `apps/web/src/pages/PlayerProfile.tsx` (720 lignes)
- **Référence design** : `mobile-screens-2.jsx > ScreenProfile`
- **État actuel** :
  - `ContextualHeader` (retour + nom).
  - **Hero** : avatar rond 64px (photo ou initiales sur `bg-cream-deep`), nom, nom de ligue, `formatJoinedSince(joinedAt)`.
  - **StatCards 3 cols** : `ELO` (variant accent), `W-L`, `Win rate` (variant success).
  - **Streak card** : bloc avec variants conditionnels (`bg-gold/20 border-gold/50` + Flame si ≥3, `bg-lime/20 border-green-500/50` + TrendingUp si >0, `bg-ruby/20 border-red-500/50` + TrendingDown si <0).
  - **Section Évolution ELO** : `recharts AreaChart` hauteur 192px, gradient amber `rgb(251, 191, 36)` (**legacy, non Arcade**), tick color `rgb(148, 163, 184)`, tooltip `rgb(30, 41, 59)` — couleurs **hardcodées hors DS**.
  - **Section Stats par league** : une carte `bg-paper rounded-xl border border-card/50` par ligue, avec ELO + win rate + V/D.
  - **Section Tête-à-tête** : top 5 adversaires en `ListRow variant="player"` avec avatars pré-chargés.
  - **Section Matchs récents** (max 10) : cards `bg-paper` avec `border-green-500/50` (legacy) ou `border-red-500/50`, date relative, badge Victoire/Défaite, delta ELO, `MatchEnrichedDisplay` (photo + cups).
- **Cible design** (`ScreenProfile`) :
  - `MobileNav` title "Profil joueur" + icône settings à droite.
  - **Hero** : `PAvatar` 72px **avec ring lime**, nom Archivo 22px black, sub mono "@handle · depuis 2024", `PRankBadge` visible sous le nom.
  - **Big ELO card** : `bg-forest` (ou `bg-cream-deep` variante dark), coins `rounded-xl`, padding 20px. Label mono "COTE ELO", value **Archivo 64px black color lime**, `EloDelta +42` à droite, sub mono "30 derniers jours".
  - **EloChart 330×110** : SVG custom — gridlines pointillés `lime 0.12 opacity`, aire `lime 0.15`, polyline lime 2.5px, dernier point halo lime.
  - **Stats grid 3×2 (6 cells)** : Matchs / Victoires (accent terracotta) / Ratio / "🔥 Série en cours" / Pic ELO / Rang ligue. Chaque cell en `StatCell` (bg paper, value Archivo 22px, label mono 10px uppercase).
  - **Trophées récents** : scroll horizontal, 4 cartes 108×auto colorées (ex: BLITZ terracotta / REMONTADA gold / UNDERDOG forest / PERFECT ink) avec "★" + title Archivo + sub mono.
  - `TabBar active="me"` fixe en bas.
- **Gap** :
  - 🔴 **Hero** : pas de ring lime sur l'avatar, pas de `PRankBadge` visible, pas de handle mono `@xxx` (on a le nom de ligue à la place — pas le même concept).
  - 🔴 **Big ELO card absente** : la structure actuelle éparpille ELO dans un `StatCard` 3-cols. Le design en fait le héros visuel sur carte dédiée avec chart intégré.
  - 🔴 **EloChart recharts** (192px height, couleurs amber legacy `rgb(251,191,36)`) → à migrer sur **SVG custom 330×110** cohérent avec `Sparkline`. Décision à prendre sur **OQ #4**.
  - 🔴 **Stats grid 3 cells → 6 cells** : manque `Pic ELO` (max historique, calculable depuis `eloHistoryFromDb`) + `Rang ligue` (position du joueur dans le leaderboard de sa ligue, calculable). "Série" à intégrer dans la grid plutôt qu'en carte séparée.
  - 🔴 **Trophées / Achievements** : **absents** de l'app. Nécessite table DB `achievements` + logique d'attribution + cadrage produit (liste de trophées, critères). **Nouvelle OQ #11**.
  - 🟡 **Streak card actuelle** : bon UX mais doublon avec la proposition "série intégrée à la grid". Arbitrage : garder la card **en plus** de la cell grid (bonus visuel si ≥3), ou fusionner. Proposition : **fusionner dans la grid pour rester fidèle au design**, conserver la flame emoji en prefix du value.
  - 🟡 **Couleurs recharts hors DS** : amber `251,191,36`, slate `148,163,184`, dark slate `30,41,59`, border slate `51,65,85` → à remplacer par tokens Arcade (`lime`, `ink-soft`, `paper`, `card`).
  - 🟡 **`border-green-500/50`, `border-red-500/50`** dans match cards → tokens `cup-green`/`ruby`.
  - 🟢 **Sections bonus hors design** (Stats par league, Tête-à-tête, Matchs récents enrichis) : **à conserver** — valeur produit utile, le design ne les montre pas mais ne les interdit pas.
- **Décision** : ✅ **Implémente P1** (gros chantier visuel, logique data déjà solide).
  - **P1.a** : refonte hero — `PAvatar` 72px **ring lime**, nom Archivo 22px black, `PRankBadge` visible sous le nom. **Pas de handle @** (pas présent dans le modèle user actuel), remplacé par `formatJoinedSince(joinedAt)` en **mono uppercase** (`depuis avr. 2024`) pour cohérence typo avec le design (décision Q4.7).
  - **P1.b** : créer **Big ELO card** en **remplacement** du `StatCard ELO` actuel (décision Q4.1) : bg-forest ou bg-cream-deep, label mono "COTE ELO", value **Archivo 64px black color lime**, `EloDelta` à droite, sub mono "30 derniers jours", SVG chart intégré dans la card (ci-dessous P1.c).
  - **P1.c** : migrer `EloChart` de recharts vers **SVG custom 330×110** aligné avec `Sparkline` (décision OQ #4 ✅ résolue).
  - **P1.d** : enrichir stats grid (3 → 6 cells — décision Q4.2) :
    - `Matchs` / `Victoires` (accent terracotta) / `Ratio` (% win rate).
    - `🔥 Série en cours` — fusionner la Streak card dans la grid (décision Q4.3). Value = streak absolue, prefix 🔥/🧊 selon signe.
    - `Pic ELO` — max de `eloHistoryFromDb` (fallback : max de `eloEvolution` calculé depuis matchs).
    - `Rang ligue` — position dans le leaderboard de la **dernière ligue où le joueur a joué** (décision Q4.2 : identifier la ligue par `max(match.date)` sur `playerMatches` restreint aux matches `leagueId`, puis classer les `players` de cette ligue par `elo` desc).
  - **P2.a** : nettoyer couleurs legacy (`border-green-500`, `border-red-500`, `rgb(251,191,36)`) → tokens Arcade (`cup-green`, `ruby`, `lime`).
  - **⏸** : Trophées récents (OQ #11 — à reprendre post-refonte).
  - **✅ Garder** : Stats par league, Tête-à-tête, Matchs récents enrichis (`MatchEnrichedDisplay`), tous les effects de chargement (enrichment, ELO history, opponent avatars).
- **Dépendances** :
  - `Sparkline` / `EloChart` DS (à créer — section 5).
  - `PRankBadge` (existe, à aligner tiers — décision 2.3).
  - `PAvatar` avec prop `ring?: string` — à vérifier si la primitive actuelle supporte le ring, sinon étendre.
  - `EloDelta` (existe).
  - Potentiellement migration DB `achievements` si OQ #11 tranchée positivement (hors-scope ce cycle).

---

#### UserProfile

- **Route** : `/profile` (probable — mapping `/me` post-refonte, cf section 2.4 Bottom TabBar)
- **Fichier** : `apps/web/src/pages/UserProfile.tsx` (210 lignes)
- **Référence design** : **N/A** (le zip n'a pas d'écran "Mon compte / Settings" dédié — `ScreenProfile` est orienté stats joueur, pas gestion de session).
- **État actuel** :
  - `ContextualHeader` "Mon Profil" + retour.
  - Badge status texte "Compte authentifié" / "Mode local" (small text centré).
  - **Card profile** : `bg-paper rounded-xl border border-card/50`, avatar rond 64px avec `bg-gradient-tab-active` + icône `User` 32px, displayName, email (avec icône `Mail`) ou "📱 Mode local".
  - **StatCards 3 cols** : `Leagues` (variant primary), `Tournois` (variant accent), `Matchs` (default).
  - **Section "Mes Leagues"** : liste avec `Trophy` icon header + cards `bg-gradient-card` clickables (nom + `X joueurs • Y matchs`).
  - **Section "Mes Tournois"** : liste avec `Calendar` icon header + cards `bg-gradient-card` clickables (nom + badge "Terminé" si finished + date + `Y matchs`).
  - **Bouton Déconnexion** : `bg-ruby/20 hover:bg-ruby/30 text-ruby border-red-500/50` (**legacy red-500**) + `LogOut` icon.
- **Cible design** : aucun mockup direct. Inspiration à tirer de `ScreenProfile` pour l'esthétique (hero + typo + cards tokens) sans dupliquer le contenu (pas de Big ELO card ici, ce n'est pas le même concept).
- **Gap** :
  - 🟡 **Hero avatar** : `bg-gradient-tab-active` + icône User → proposer `PAvatar` avec ring lime cohérent avec PlayerProfile hero.
  - 🟡 **Typo displayName** : `text-xl font-bold` → `font-archivo font-black uppercase` pour cohérence.
  - 🟡 **Sections Leagues / Tournois** : cards `bg-gradient-card` → migrer sur pattern `ListRow` DS (gain de cohérence).
  - 🟡 **Bouton Déconnexion** : `border-red-500/50` legacy → `border-ruby` + passer en `PButton variant="danger"` si le DS l'a, sinon class pattern tokens.
  - 🟡 **Icône header** : `text-info` est un alias legacy (`#3B8EFF`) → remplacer par `text-cup-blue`.
  - 🟢 **Logique `fullDisconnect`, `isAuthenticated`, mode local** : solide.
  - 🟢 **StatCards 3 cols** (Leagues / Tournois / Matchs) : cohérent avec le pattern du DS, à garder.
- **Décision** : ✅ **Implémente P1** (polish visuel + migration tokens, cohérent avec PlayerProfile — décision Q4.6).
  - **P1.a** : hero avec **`PAvatar` ring lime** (même pattern que PlayerProfile — décision Q4.6). Si avatar photo absent, fallback : cercle `bg-cream-deep` + icône `User` + ring lime.
  - **P1.b** : typo displayName → `font-archivo font-black uppercase text-2xl`. Email en mono sous le nom (pattern handle mono du design, appliqué ici à l'email).
  - **P1.c** : listes Mes Leagues / Mes Tournois → `ListRow` variant adapté (name + meta sub).
  - **P2.a** : nettoyer tokens legacy (`border-red-500` → `border-ruby`, `text-info` → `text-cup-blue`).
  - **P2.b** : bouton Déconnexion → `PButton variant="danger"` si disponible, sinon class `bg-ruby/20 text-ruby border-ruby`.
  - **✅ Garder** : StatCards 3 cols, logique `fullDisconnect` + `isAuthenticated` + mode local fallback.
- **Dépendances** :
  - `PAvatar` (existe).
  - `ListRow` (existe).
  - `PButton variant="danger"` — à vérifier ou fallback class.

---

### 3.5 Groupe 5 — Display (DisplayView, TournamentDisplayView, DisplayViewDrama [déjà présent])

> ✅ **Validé 2026-04-23** — ambient glow OK, token `bronze` ajouté (option A), structure DisplayView ligue gardée telle quelle, drama bottom strip inchangé tant que OQ #12 parkée.

> **Découverte (2026-04-23)** : `DisplayViewDrama` est **déjà implémenté** dans `TournamentDisplayView.tsx` (ligne 157-247) sous forme de variant (`?variant=drama`). La spec initiale le mentionnait comme nouveau — c'est en fait un polish + audit.

#### DisplayView (ligue)

- **Route** : `/league/:id/display`
- **Fichier** : `apps/web/src/pages/DisplayView.tsx` (323 lignes)
- **Référence design** : `web-display.jsx > DisplayView` (avec adaptations — le design intègre un bracket non applicable à BPL).
- **État actuel** :
  - `h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900` — **fond slate legacy**, hors tokens Arcade.
  - Header fixed top : nom ligue + type (Saison/Ligue) + LIVE avec `Zap` animé + nb matchs, sur `bg-cream/80 backdrop-blur-md` (OK DS).
  - **Main split** 1fr:384px (desktop) : gauche = Classement (top 10 cards + scrollable remaining), droite = Match Feed (5 derniers) + QR Code "Rejoins le tournoi !".
  - **Auto-scroll** : top 10 visibles 15s, scroll sur les joueurs restants pendant 12s, retour top.
  - **Highlight nouveau match** : joueurs du dernier match mis en `border-cup-red shadow-2xl shadow-primary/50 scale-[1.02]` 5s + ring lime/ruby si winner/loser (`ring-green-500/30`, `ring-red-500/30` **legacy**).
  - Podium visible par les couleurs des rangs (`bg-gold`, `bg-ink-soft`, `bg-gold` — **bug probable** : rang #3 en gold comme #1). Rest en `bg-cream-deep`.
  - `ESC` pour quitter.
- **Cible design** (`DisplayView` web-display.jsx, variant `split`) :
  - `bg-forestDeep` (deep forest/blue) + **ambient glow** : 2 blobs radial blur 80px, lime 8% en top-left, terracotta 8% en bottom-right.
  - Top bar : `PongloWordmark` + center (titre tournoi + sous-titre mono "QF · 4 équipes restantes") + LIVE dot ruby pulse à droite.
  - Main 1.6fr:1fr : gauche = **Match en cours** avec scores 140px Archivo lime/cream + `CupVisualizer` 10 cups par équipe + **ELO prediction strip** ("Si victoire : +14 / −14"), droite = bracket live + top ELO 5.
  - Bottom strip : `bg-ink` + code lime + "Scanner QR" + heure.
  - **Inapplicable à BPL** : section bracket (décision Q3.8 — pas d'élimination). La section "Match en cours" est aussi discutable pour une ligue (pas de notion de round/finale dans une ligue continue).
- **Gap** :
  - 🔴 **Fond slate legacy** (`from-slate-900 via-slate-800 to-slate-900`) → à migrer sur `bg-cream-deep` ou `bg-forest-deep` + **ambient glow** lime/terracotta.
  - 🔴 **Ring colors legacy** (`ring-green-500/30`, `ring-red-500/30`) → `ring-lime/30`, `ring-ruby/30`.
  - 🔴 **Podium bug** : rang #3 en `bg-gold` au lieu de bronze → à corriger (bronze = `#CD7F32` à ajouter aux tokens, ou fallback `bg-cup-red-deep`).
  - 🟡 **Top bar** : `Zap` icon → remplacer par un dot pulse ruby (cohérent avec le design + plus propre).
  - 🟡 **Pattern "Match en cours" du design** : non applicable aux ligues (pas de match in-progress en DB actuellement). Si implémenté un jour (via flag `match.isLive`), ce serait un ajout de valeur. ⏸ parkée.
  - 🟡 **Ambient glow** : à ajouter, effet visuel fort pour projection.
  - 🟡 **Bottom strip code + QR hint** : actuellement le QR est une carte à droite. Pattern design est plus compact (strip bottom-fixe). À arbitrer — probablement **garder carte droite** (plus lisible de loin).
  - 🟢 **Logique auto-scroll + highlight** : solide, à garder.
  - 🟢 **Sections Leaderboard + Match Feed + QR** : structure adaptée à la ligue (non-bracket), à garder.
- **Décision** : ✅ **Implémente P1** (refonte cosmétique tokens + ambient glow, structure intacte).
  - **P1.a** : migrer fond `from-slate-*` → `bg-forest-deep` (ou `bg-cream-deep`) + ajouter **ambient glow** (2 blobs radial blur).
  - **P1.b** : nettoyer `ring-green-500` / `ring-red-500` → `ring-lime` / `ring-ruby`.
  - **P1.c** : corriger le podium (rang #3 en bronze, pas gold) — ajouter token `bronze: "#CD7F32"` dans `tailwind.config.js` (✅ décision 2026-04-23, option A).
  - **P1.d** : top bar — remplacer `Zap` animé par dot pulse ruby cohérent design.
  - **P2.a** : auditer si on peut ajouter la section "Match en cours" si BPL implémente plus tard un flag `isLive` sur les matchs.
  - **✅ Garder** : logique auto-scroll, highlight 5s, QR card droite, ESC quit, structure leaderboard + match feed + QR.
- **Dépendances** :
  - Éventuel nouveau token `bronze` dans `tailwind.config.js`.
  - Aucun nouveau composant DS obligatoire (ambient glow = 2 divs absolute avec `blur-[80px]`).

---

#### TournamentDisplayView (split + drama)

- **Route** : `/tournament/:id/display` (+ `?variant=drama` pour Drama)
- **Fichier** : `apps/web/src/pages/TournamentDisplayView.tsx` (469 lignes)
- **Référence design** :
  - `split` → `web-display.jsx > DisplayView` (idem DisplayView ligue, adaptations bracket éliminées).
  - `drama` → `web-display.jsx > DisplayViewDrama`.
- **État actuel (split, défaut)** :
  - `bg-cream-deep` (✅ DS Arcade OK) + header `bg-cream/80 backdrop-blur-md`.
  - Titre tournoi + date `Calendar` + LIVE `Zap` + nb matchs + badge "Terminé" si applicable.
  - Même layout que DisplayView ligue : Classement (top 10 + scrollable) + Match Feed + QR.
  - Même bugs : `ring-lime/30` et `ring-ruby/30` (ici **déjà corrigés** vs DisplayView ligue — bonus). Le podium utilise encore `bg-gold`/`bg-ink-soft`/`bg-gold` (bug rang 3).
  - Usage de `rounded-card` (sharp 10px Arcade, cohérent) vs `rounded-xl` (14px) dans DisplayView ligue — préférer l'un ou l'autre selon décision projet (probablement `rounded-card`).
- **État actuel (drama)** :
  - `bg-ink text-cream` (✅ DS Arcade OK).
  - 2 triangles clipPath `bg-cup-red` + `bg-cup-blue`, couvrant 60% chacun avec diagonal overlap 30% au centre.
  - Header : wordmark Ponglo Archivo + center mono "● LIVE · {tournament.name}" + heure droite.
  - 2 équipes grid 1:1 avec score **220px Archivo black letterSpacing -8px textShadow**.
  - Bottom strip `bg-black/35` : code lime + nb matchs joués + "ESC pour quitter".
  - **Déjà très proche du design** — excellente implémentation.
- **Cible design (split)** : identique à DisplayView ligue (avec bracket à ignorer).
- **Cible design (drama)** : bg-ink, 2 triangles clipPath cup-red + cup-blue (✅ identique), scores 220px (✅ identique), bottom strip avec **code + ballon + ELO en jeu** (différence : le design affiche "Ballon 14 · Match point à 10" + "+14 ELO en jeu" en vert lime ; l'actuel affiche "matches joués" + "ESC pour quitter").
- **Gap (split)** :
  - 🟡 Même gaps que DisplayView ligue sur podium bug (bronze) + top bar `Zap` (à remplacer par dot ruby pulse) + ambient glow (à ajouter).
  - 🟡 `bg-cream-deep` (déjà DS) — pas besoin de migrer le fond, juste ajouter ambient glow lime/terracotta.
  - 🟢 Ring colors déjà correctes (`ring-lime/30`, `ring-ruby/30`).
- **Gap (drama)** :
  - 🟡 **Bottom strip** : aligner sur le format design (code + "Ballon X · Match point à Y" + "+N ELO en jeu"). Le champ "Ballon" n'existe pas en DB — ⏸ parkée ou simplification.
  - 🟡 **ELO en jeu** : nécessite le calcul live de la variation ELO prévisible pour le match en cours. Si match `isLive` existe, calculable. Sinon fallback sur nb matchs joués comme actuel.
  - 🟢 Structure, typo, clipPath, couleurs : excellentes, à garder.
- **Décision** : ✅ **Implémente P1** (split : cosmétique + ambient glow ; drama : polish mineur + parking des features "Ballon"/"ELO en jeu" selon data dispo).
  - **P1.a (split)** : ambient glow lime/terracotta (cohérent DisplayView ligue).
  - **P1.b (split)** : corriger podium bronze (rang #3) — commun avec DisplayView ligue.
  - **P1.c (split)** : top bar `Zap` → dot ruby pulse.
  - **P2.a (drama)** : audit bottom strip — si pas de flag `match.isLive` disponible, garder le format actuel (nb matchs + ESC). Sinon, afficher "+N ELO en jeu" (lime) + simplifier "Ballon" en "Match en cours".
  - **⏸** : champs `isLive`, `ballon`, `matchPoint` en DB (OQ #12 nouvelle — feature "live match tracking" hors-scope refonte).
  - **✅ Garder (split)** : structure, auto-scroll, highlight, QR, logique participants, variant switcher.
  - **✅ Garder (drama)** : tout le layout, clipPath, typo 220px, palette cup-red/cup-blue.
- **Dépendances** :
  - Aucune bloquante. Token bronze (commun avec DisplayView ligue) à arbitrer.
  - Le bouton "Voir écran" actuellement sur TournamentDashboard sera déplacé sur WebDashboard (Groupe 6, décision Q3.11).

---

### 3.6 Groupe 6 — Admin / Nouveaux (**EventDashboard organisateur** [nouveau], PaymentSuccess, PaymentCancel)

> ✅ **Validé 2026-04-23** — EventDashboard en **P2** (hors phase A polish, livré en phase B2 comme première feature post-refonte esthétique). Rebaptisé `WebDashboard` → `EventDashboard` pour éviter la dette de rename (OQ #9). Scope global organisateur, admin-only (créateur de la ressource), point d'entrée via boutons contextuels dans `LeagueDashboard` + `TournamentDashboard`. Pas réservé aux premium. Upsell Pro = lien direct Stripe checkout.

> **Point structurel** : ce groupe contient le plus gros ajout net de la refonte côté web — l'**EventDashboard organisateur** (renommé depuis `WebDashboard` proposé initialement). C'est le premier écran "desktop-first" (layout sidebar) de l'app, qui était jusque-là mobile-first partout.
>
> **Rename** : le nouveau dashboard naît avec le nom `EventDashboard` directement (pas `WebDashboard`). L'existant `TournamentDashboard.tsx` reste sous ce nom pendant la refonte (le chantier complet Tournoi → Événement est traité en **OQ #9** post-refonte, pour regrouper tous les touchpoints : DB, routes, labels, types).

---

#### EventDashboard (NOUVEAU) — Dashboard organisateur desktop

- **Route** : `/dashboard` (nouveau, à créer)
- **Fichier cible** : `apps/web/src/pages/EventDashboard.tsx` (nouveau — nommé `EventDashboard` et non `WebDashboard` pour anticiper le rename Tournoi → Événement de l'OQ #9, évite la dette de renaming futur)
- **Référence design** : `web-display.jsx > WebDashboard` (lignes 6-127) + helpers `Kpi` / `LiveMatchRow` / `MultiLineChart`.
- **État actuel** : ❌ **N'existe pas**. Aujourd'hui l'organisateur d'une ligue/tournoi gère son événement depuis `LeagueDashboard` / `TournamentDashboard` (vues mobile-first avec onglets). Pas de vue consolidée cross-événements.
- **Cible design** :
  - Layout **2 colonnes desktop** : `Sidebar 220px bg-forest` (ici `bg-cup-blue` #3B8EFF, alias `forest` dans la palette Arcade) + Main flex-1 auto-scroll.
  - **Sidebar** :
    - `PongloWordmark` 18px (ink sur forest).
    - Nav verticale : `Vue d'ensemble` (active, bg lime 15% + text lime), `Tournois [3]`, `Ligues [2]`, `Joueurs [24]`, `Matchs`, `Display view`.
      - Items : `padding 9px 12px`, `rounded-md` (6px Arcade), `font-display` uppercase 13px, badge mono 10px à droite avec count.
    - Spacer flex 1.
    - **Bloc PRO** en bas : `bg-ink/5 rounded-md p-3`, label `PRO` lime uppercase 11px, baseline "Passe en Ponglo Pro pour la live TV sans watermark".
  - **Main** :
    - **Top bar** (`border-b border-card`) : breadcrumb mono `Dashboard / {scope name}` + titre display `Vue d'ensemble` (22px black uppercase) + CTA droits `Exporter` (ghost) + `+ Nouveau tournoi` (primary).
    - **KPI row grid 4 cols** (14px gap, padding 24px) :
      - `Joueurs actifs` (24, delta +3), `Matchs joués` (142, +18), `Tournois` (7, +1), `ELO moyen` (1521, −4 ruby).
      - `Kpi` card : `bg-paper rounded-lg p-4 border`, label mono 10px uppercase muted, big 30px display black, delta mono 12px bold (lime si up, ruby si down), **progress bar 4px** en bas (35%/72% selon delta).
    - **Grid 1.6fr:1fr** (chart + live) :
      - **ELO chart card** : `bg-paper rounded-lg p-5 border` — titre display uppercase "Top 5 — évolution ELO" + sous-titre mono "Saison X · 30 derniers jours" + **pills période** droite (`7j / 30j / 90j / Saison`, active = `bg-ink text-cream rounded-full`).
      - `MultiLineChart` : SVG viewBox 620×200, 3 gridlines horizontales dashed, 5 polylines (colors terracotta/forest/gold/purple/lime pour "moi"), end circles 4px, légende dots 10×3 sous le graphe avec nom + ELO mono.
      - **Live matches card** : `bg-ink rounded-lg p-5 text-cream` — pulsing ruby dot + label "LIVE · N matchs" display uppercase ruby + `LiveMatchRow` items (adversaire + score mono 18px, winner en lime) + flag `⚡ Égalité — match point` en lime uppercase si `hot` + footer CTA "Ouvre la **Display view →** pour projeter" mono.
    - **Leaderboard table card** pleine largeur : `bg-paper rounded-lg border` — header (titre display + "N joueurs · mis à jour il y a X min" mono muted) + colonne grid `40px 1fr 80px 110px 120px 80px 50px` (# / Joueur avatar+nom+badge MOI / Rang `PRankBadge` sm / ELO mono 16 bold / Sparkline 100×22 / W/L mono / EloDelta).
      - Row du joueur courant highlightée `bg-lime/18%`.
      - Top 3 ont le # en terracotta.
  - **Scope** du dashboard : le design montre "Ligue du Vendredi" dans le breadcrumb → dashboard **scopé à une ligue/tournoi** (pas global). À clarifier (Q6.3).
- **Gap** (vs existant) :
  - 🔴 **Écran inexistant** — création complète.
  - 🔴 **Pattern desktop** — premier layout sidebar de l'app. Toutes les pages actuelles sont mobile-first avec header top + tabs. Cette vue casse le pattern (volontairement, cible = organisateur sur desktop).
  - 🔴 **MultiLineChart** — nouveau composant DS (variante multi-séries du `Sparkline`). Aligner impl avec `EloChart` profil (SVG custom, décision OQ #4).
  - 🔴 **Kpi** — nouveau composant DS (label + big + delta + progress bar).
  - 🔴 **LiveMatchRow** — nouveau composant DS (row inline adversaires + scores + flag hot). Dépend de `match.isLive` (OQ #12) — **fallback** : afficher les 5 derniers matchs non-live si aucun live.
  - 🟡 **Sidebar nav** — nouveau pattern (pas réutilisé ailleurs). Semi-dupliqué avec `MobileNav` bottom tabs mobile. À factoriser ? Probablement pas dans un premier temps (patterns distincts desktop/mobile).
  - 🟡 **Period pills** (7j/30j/90j/Saison) — nouveau petit composant (ou utility Tailwind + état local).
  - 🟡 **Pro upsell block** dans sidebar — lier au flow Stripe premium (bouton → `/pricing` ? ou modal upgrade existant ?). À arbitrer (Q6.4).
  - 🟡 **Export** CTA — fonctionnalité export CSV / PDF classement ? Hors scope refonte (⏸ logbook 9.4).
  - 🟢 Données disponibles : leagues, tournaments, players, matches via `useLeague()` et `useTournament()`. ELO moyen et sparkline trend calculables client-side.
- **Décision** : ✅ **Implémente P2** (feature nouvelle importante, **sortie du scope refonte esthétique** phase A — devient la première feature de phase B2 post-refonte).
  - **P2.a** : créer `apps/web/src/pages/EventDashboard.tsx` + route `/dashboard` avec **scope global organisateur** (agrège toutes les ligues + tournois dont l'user est créateur, pas de scope ligue/tournoi unitaire — décision 6.3).
  - **P2.b** : **admin-only** (= créateur de la ressource). Guard route : si `user.id !== creator_user_id` sur au moins 1 ressource → accès autorisé, sinon redirect `/`. **Pas réservé aux premium** (décision 6.5 — Pro upsell reste en rappel).
  - **P2.c** : composant DS `Kpi` (label + big + delta + progress).
  - **P2.d** : composant DS `MultiLineChart` (SVG custom, multi-séries, aligné `Sparkline`).
  - **P2.e** : composant DS `LiveMatchRow` + fallback (5 derniers matchs si `isLive` manquant) — OQ #12 reste parkée.
  - **P2.f** : composant DS `SidebarNav` (vertical desktop, 6 items + bloc Pro upsell).
  - **P2.g** : Pro upsell bloc → **lien direct Stripe checkout** via `stripeService.createCheckoutSession()` existant (décision 6.4), cohérent avec le flow freemium `limitModal`.
  - **P2.h** : **points d'entrée** (décision 6.2) :
    - Bouton "Voir le dashboard complet →" dans `LeagueDashboard` (header ou zone admin).
    - Bouton équivalent dans `TournamentDashboard`.
    - Visible uniquement si `user.id === creator_user_id`.
  - **P2.i** : CTA "+ Nouveau tournoi" → lier à `/create-tournament` (existant).
  - **💡 Logbook 9.4** : CTA "Exporter" (feature CSV/PDF classement) — pas dans cette itération.
- **Dépendances** :
  - **Composants DS nouveaux** : `Kpi`, `MultiLineChart`, `LiveMatchRow`, `SidebarNav` (consolidés section 5).
  - **Données** : tout est calculable depuis les stores existants (`useLeague()`, `useTournament()`). Pour le trend 7j/30j/90j : filtrer `eloHistory` par fenêtre temporelle (logique client-side pure, pas de migration DB).
  - **Routage** : nouvelle route `/dashboard` à ajouter dans `App.tsx` (zone authentifiée).
  - **Services** : réutiliser `stripeService.createCheckoutSession()` pour le Pro upsell.
  - **Pas de dépendance backend** : pas de nouvelle table, pas de nouvel endpoint. Scope global = agrégation client-side des stores existants.

---

#### PaymentSuccess

- **Route** : `/payment-success?session_id=…`
- **Fichier** : `apps/web/src/pages/PaymentSuccess.tsx` (137 lignes)
- **Référence design** : ❌ **Aucun écran dédié** dans le zip (le flow paiement n'est pas dans les mockups Ponglo).
- **État actuel** :
  - 3 états : `verifying` (loader + titre "Vérification du paiement…") / `error` (message ruby + CTA retour accueil) / `success` (CheckCircle lime + titre + 3 features illimitées check + auto-redirect 2s).
  - Card centrée `bg-cream rounded-2xl p-8 max-w-md border`.
  - State success utilise `border-green-500/50` **legacy** (hors DS).
  - State error utilise `border-red-500/50` **legacy**.
  - Loader state utilise `bg-cup-red/20` + `text-cup-red` (icône Loader) — cohérent DS.
  - Icons Lucide : Loader (spin), CheckCircle, ❌ emoji (inconsistant).
  - Features check list : `CheckCircle lime` + `bg-paper/50 rounded-xl` (OK).
  - Body fond : `bg-cream-deep` (OK DS).
  - Texte "Ton compte est maintenant Premium" avec `text-cup-red font-bold` (OK).
- **Cible design** :
  - Pas de mockup spécifique. On applique **uniformément** les tokens Arcade sur la base actuelle (polish cosmétique).
  - Idéalement : intégrer un petit effet de confetti ou glow lime pulse sur le CheckCircle (micro-reward). Loguer en 9.4 si pas fait maintenant.
- **Gap** :
  - 🟡 `border-green-500/50` → `border-lime/40` (tokens Arcade).
  - 🟡 `border-red-500/50` → `border-ruby/40`.
  - 🟡 `❌` emoji → icône Lucide `XCircle` (cohérent avec PaymentCancel).
  - 🟡 `rounded-2xl` (16px) → `rounded-card` (10px sharp Arcade).
  - 🟡 Card pourrait utiliser `shadow-modal` + `bg-paper` au lieu de `bg-cream` (la card actuelle est plus claire que le fond — à inverser en dark mode).
  - 🟢 Logique verify + redirect : à garder.
- **Décision** : ✅ **Implémente P2** (polish cosmétique, pas bloquant).
  - **P2.a** : nettoyer `border-green-500` / `border-red-500` / emoji ❌ → tokens Arcade + icônes Lucide.
  - **P2.b** : auditer `bg-cream` card sur fond `bg-cream-deep` — inverser si hiérarchie visuelle incohérente (probablement : card `bg-paper` + fond `bg-cream-deep`).
  - **P2.c** : `rounded-2xl` → `rounded-card`.
  - **✅ Garder** : logique verify Stripe, 3 états, auto-redirect, premium update.
  - **💡 Logbook 9.4** : micro-reward (confetti / glow lime) au success — pas maintenant.
- **Dépendances** : aucune, pur polish.

---

#### PaymentCancel

- **Route** : `/payment-cancel`
- **Fichier** : `apps/web/src/pages/PaymentCancel.tsx` (38 lignes)
- **Référence design** : ❌ Aucun mockup.
- **État actuel** :
  - Card centrée `bg-cream rounded-2xl p-8 max-w-md border border-card`.
  - Icon `XCircle` dans `bg-gold/20 rounded-full` (gold pour "attention" plutôt que "échec" — OK sémantiquement).
  - Titre "Paiement annulé" + 2 paragraphes + 2 boutons (Retour accueil `bg-cup-red` / Réessayer `bg-cream-deep`).
  - Cohérent DS dans l'ensemble, quelques détails à nettoyer.
- **Cible design** : idem PaymentSuccess (pas de mockup, polish uniforme).
- **Gap** :
  - 🟡 `rounded-2xl` → `rounded-card`.
  - 🟡 `bg-cream` card sur `bg-cream-deep` fond — idem PaymentSuccess (auditer hiérarchie, probablement `bg-paper`).
  - 🟡 Bouton "Retour accueil" `bg-cup-red hover:brightness-110` → préférer `PButton variant="primary"` (composant DS).
  - 🟡 Bouton "Réessayer" → `PButton variant="ghost"`.
  - 🟢 Icon `XCircle` gold + message : bonne sémantique, à garder.
- **Décision** : ✅ **Implémente P2** (polish trivial).
  - **P2.a** : remplacer boutons inline par `PButton` (primary + ghost).
  - **P2.b** : `rounded-2xl` → `rounded-card`, audit card bg.
  - **✅ Garder** : icon gold, structure, CTAs.
- **Dépendances** : `PButton` (existant).

---

### 3.7 Groupe 7 — Dev (DesignSystemShowcase)

> ✅ **Validé 2026-04-23** — Showcase P1 discipline, TabBar 4 items + bouton `+` central saillant (modal quick-create), showcase focalisée primitives/composants (pas de section "page patterns"). Règle discipline écrite en 9.5.

> **Rôle de cet écran** : référence vivante du DS, accessible en dev via `/design-system`. Pas un écran produit — c'est le "livre de styles" pour les devs et designers. Doit refléter toutes les décisions transverses (section 2) et tous les nouveaux composants (section 5).

---

#### DesignSystemShowcase

- **Route** : `/design-system`
- **Fichier** : `apps/web/src/pages/DesignSystemShowcase.tsx` (577 lignes)
- **Référence design** : pas de mockup équivalent dans le zip (le zip est lui-même la référence source). À la place, on se base sur `primitives.jsx` + `tokens.js` pour lister ce qui doit apparaître.
- **État actuel** — **7 sections bien structurées** :
  - **0 · Identity** : `PongloWordmark` + `PongloGlyph` (tailles variées).
  - **1 · Palette** : 3 groupes (Surfaces / Ink / Brand & signals). Swatches avec hex + nom mono.
  - **2 · Typographie** : Display (lg/md/sm) + Page/Section titles + Body + Mono (avec chiffres lime).
  - **3 · Primitives Ponglo** : `PButton` (6 variants + 3 sizes + icon + disabled), `EloDelta` (5 cas), `PRankBadge` (tous les tiers via `RANKS.map`).
  - **4 · Forme** : Radius (xs/sm/md/lg/xl/card/full) + shadows (card / card-lg / fab).
  - **5 · Composants design-system** : `StatCard`, `SegmentedTabs`, `ListRow` (4 variants : player/tournament/league), `HelpCard`, `InfoCard`, `Banner` (3 cas + dismissable), `SearchBar`, `FAB` (3 variants), `LastActivityCard`.
  - **6 · Navigation** : `BottomTabPreview` avec `BottomTabMenu` (actuellement **5 items** : ACCUEIL / REJOINDRE / TOURNOIS / LEAGUES / PROFIL).
- **Cible** : refléter la totalité des décisions/nouveautés de cette refonte. Les **gaps** listés ci-dessous sont des ajouts à faire, pas des refontes.
- **Gap** (ce qui manque vs les décisions prises) :
  - 🔴 **Section 1 Palette** : ajouter le token **`bronze` #CD7F32** (décision Groupe 5 pour le podium rang #3).
  - 🔴 **Section 3 Primitives** : ajouter les nouveaux primitives :
    - **`Sparkline`** (nouveau primitive DS — mentionné dans Home, PlayerProfile, leaderboard). À extraire depuis Home actuel.
    - **`CupVisualizer`** (décision 2.5) — matrice de cups par équipe, cups tombés crossed/faded.
    - **`Podium`** (nouveau — Leaderboard top 3, Displays).
    - **`EloChart`** SVG (décision OQ #4 Groupe 4) — remplace recharts AreaChart dans PlayerProfile.
  - 🔴 **Section 5 Composants** : ajouter les nouveaux composants Groupe 6 :
    - **`Kpi`** (label + big + delta + progress bar).
    - **`MultiLineChart`** (SVG multi-séries).
    - **`LiveMatchRow`** (score inline + flag hot).
    - **`SidebarNav`** (layout desktop vertical).
  - 🔴 **Section 5 Composants** : ajouter également les patterns "create flow" réutilisables (si extraits) :
    - **`FormField`** avec chevron (patterns CreateTournament / CreateLeague).
    - **`ToggleRow`** (switch + label).
    - **`QuickAction`** (tuile 2×2 grid Home).
  - 🔴 **Section 6 Navigation** : aligner sur **4 items** (décision 2.4) — actuel 5 items (ACCUEIL/REJOINDRE/TOURNOIS/LEAGUES/PROFIL) → cible 4 items (Accueil/Jouer/Classement/Profil). Question OQ #2 (item central `+`) à trancher et à refléter ici.
  - 🟡 **Section 0 Identity** : éventuellement ajouter la variante `PongloGlyph` au cup rouge (version app icon). Cosmétique.
  - 🟡 **Section 2 Typographie** : ajouter une démo des `text-display-*` en chiffres mono avec letter-spacing négatif (patterns score 140px / 220px des Displays). Pédagogique.
  - 🟡 **Section 4 Forme** : ajouter `shadow-modal`, `shadow-glow-red/blue/lime` (présents dans `tailwind.config.js` mais pas swatch-és ici).
  - 🟡 **Section 5** : le `BottomTabPreview` pourrait être déplacé en section 6 (déjà le cas) — OK.
  - 🟢 Structure globale : excellente base, juste à enrichir.
- **Décision** : ✅ **Implémente P1** (la showcase doit rester synchronisée avec le DS — sinon elle devient obsolète et trompeuse).
  - **P1.a** : synchroniser la showcase **au fur et à mesure** de l'implémentation de chaque nouveau primitive/composant (règle de discipline : un composant ajouté au DS = une entrée showcase).
  - **P1.b** : en début de phase B (refonte esthétique), ajouter immédiatement :
    - Token `bronze` dans section 1.
    - `Sparkline` (extraction primitive) dans section 3.
    - `CupVisualizer` dans section 3.
    - Alignement `BottomTabMenu` 4 items dans section 6.
  - **P1.c** : en phase B2 (EventDashboard), ajouter `Kpi`, `MultiLineChart`, `LiveMatchRow`, `SidebarNav`.
  - **P2.a** : polish mineurs (variantes Glyph, démo letter-spacing, shadows manquantes).
  - **✅ Garder** : la structure 7 sections, le pattern `Section` + `SubHeading` + `Swatch`, les showcases interactifs (`TabsShowcase`, `SearchShowcase`, `BannerShowcase`, `BottomTabPreview`).
- **Dépendances** : aucune bloquante. La showcase évolue avec le reste (progressive enhancement).

---

---

## 4. Spec par écran — MOBILE

> ⚠️ **Constat structurel (2026-04-23)** : l'app mobile (`apps/mobile/`) est aujourd'hui un **squelette**. Les 9 écrans existants (`HomeScreen`, `JoinScreen`, `LeaguesScreen`, `TournamentsScreen`, `ProfileScreen`, `CreateLeagueScreen`, `CreateTournamentScreen`, `LeagueDetailScreen`, `TournamentDetailScreen`) font chacun **36 à 59 lignes** — des placeholders avec un titre + une zone vide. Pas de navigation, pas de services connectés, pas de DS mobile reskiné.
>
> **Conséquence sur la passe 3** : la question n'est plus "comment migrer l'existant ?" mais "**comment construire depuis zéro en s'alignant sur le design du zip + la cohérence DS web**". La spec mobile se lit donc comme un cahier des charges, pas un diff.
>
> **Décision transverse mobile** : les **10 écrans du design** (`ScreenAuth`, `ScreenHome`, `ScreenJoin`, `ScreenCreateTournament`, `ScreenCreateLeague`, `ScreenTournament`, `ScreenScore`, `ScreenLeaderboard`, `ScreenProfile`, `ScreenHistory`) sont pris comme référence **directe**. Les arbitrages "identique web / adaptation / exclusif mobile" sont faits **par écran** ci-dessous.
>
> **Ordre de bataille mobile** (à arbitrer à la fin de la spec, section 7 phasing) :
> - Option A — **reset complet** : supprimer les 9 placeholders, construire depuis zéro en miroir du design.
> - Option B — **garder les placeholders** et les remplir un par un.
> - Reco : **A** (les placeholders n'apportent rien, créent de la confusion, et le design impose un pattern `PhoneBody + MobileNav + TabBar` incompatible avec le boilerplate actuel `SafeAreaView + StyleSheet brut`).
>
> ⏸ **Hors scope de cette spec mobile** : les décisions **DB / services / auth flow** — l'app mobile partagera `packages/shared/` avec le web (services + types + hooks communs). Tout ajustement backend reste parked dans les OQs.

---

### 4.1 Batch 1 — Auth / Home / Join (onboarding mobile)

> **Note générale batch 1** : tous les écrans utilisent le pattern design `PhoneBody` (conteneur bg + flex col h-full) + `MobileNav` (header sticky avec left/title/right) + éventuellement `TabBar` en bas (composant DS mobile à construire, miroir du web `BottomTabMenu` 4 items + `+`).

---

#### ScreenAuth (mobile Landing)

- **Fichier actuel** : ❌ **n'existe pas** (pas d'`AuthScreen.tsx` dans `apps/mobile/src/screens/`). Le squelette mobile démarre directement sur `HomeScreen`.
- **Fichier cible** : `apps/mobile/src/screens/AuthScreen.tsx` (nouveau)
- **Référence design** : `mobile-screens-1.jsx > ScreenAuth` (lignes 85-116) — **strictement identique à la Landing web** (Groupe 1).
- **Cible design** :
  - Fond `bg={P.forest}` (= `cup-blue` #3B8EFF dans Arcade).
  - Pattern de cercles cream `opacity: 0.05` en fond (décoratif, SVG avec 40 cercles).
  - `PongloWordmark` cream en haut (padding 56/24/20px).
  - Hero bloc en bas : display 52px black line-height 0.92 letterSpacing -1.8 — "Le beer pong. Enfin avec un **vrai classement.**" (le mot lime).
  - Sous-titre 15px cream/70%, ligne 1.4 — "Ligues, tournois, ELO. Pour les amis, les assos, les semi-pros du mercredi soir."
  - 2 CTA + 1 lien texte :
    - `PButton variant="lime" size="lg" full` — "Créer un compte".
    - `PButton variant="ghost" size="md" full` (bord cream 25%) — "J'ai un code de tournoi →".
    - Texte bottom "Déjà membre ? **Se connecter**" (lien lime).
- **Gap** :
  - 🔴 **Écran inexistant**.
  - 🔴 Pas de `PongloWordmark` / `PButton` / `PongloGlyph` en React Native — tout le DS mobile est à construire (**OQ #13** ci-dessous).
  - 🟡 Auth flow (OTP / Apple / Google) : le design ne précise pas — à aligner avec web (modal OTP email actuel + providers future).
- **Décision** : ✅ **Implémente P1** (écran d'entrée, bloquant pour toute la nav mobile).
  - **P1.a** : créer `AuthScreen.tsx` en miroir exact de la `LandingPage.tsx` web (cohérence brand).
  - **P1.b** : **construire le DS mobile RN** en parallèle : `PongloWordmark`, `PButton` (6 variants, 3 sizes), `PongloGlyph`, `PRankBadge`, `EloDelta`, palette tokens RN (port de `tailwind.config.js` vers `tokens.ts`). Consolidé dans **OQ #13 nouvelle**.
  - **P1.c** : auth flow = même pattern que web (modal OTP email). Reuse `authService` de `packages/shared/`.
- **Dépendances** :
  - **OQ #13** : construire DS mobile RN (palette, typo, primitives Ponglo, composants DS équivalents). Chantier majeur mais unique.
  - `packages/shared/` : `authService`, types user.

---

#### ScreenHome (mobile)

- **Fichier actuel** : `apps/mobile/src/screens/HomeScreen.tsx` (46 lignes placeholder — `SafeAreaView` + titre "Accueil" + placeholder "Activité récente").
- **Référence design** : `mobile-screens-1.jsx > ScreenHome` (lignes 119-194).
- **Cible design** :
  - `PhoneBody bg={P.cream}` (= dark `cream` #0B0D14 Arcade).
  - `MobileNav` avec `title="Salut Léo 👋"`, left = `PongloGlyph 32`, right = avatar rond forest 36×36 avec initiales "LM" (display bold).
  - Contenu scrollable `padding 0 18px 110px` (bottom = tabbar).
  - **ELO hero card** (bg forest = cup-blue, rounded-xl, padding 22, shadow-lg, glow lime top-right) :
    - Top row : label mono "ELO · {league.name}" + `PRankBadge sm` · `EloDelta +18`.
    - Big number display **72px black line-height 0.9 letterSpacing -2 color lime** — l'ELO.
    - Sub mono "#{rank} sur {members} · {wins}W — {losses}L" opacity 60%.
    - Border-top 1px cream 12% + `Sparkline` lime 320×40.
  - **Quick actions grid 2×2** (gap 10) :
    - `QuickAction` tuile = icon 22px + label display 14 + sub mono 11 uppercase. 4 tuiles : Nouveau match (lime/ink `⚡`), Rejoindre (terracotta/cream `⌁`), Tournoi (paper/ink border `◆`), Ligue (paper/ink border `◇`).
  - **Active tournament banner** (bg paper, border 1.5px ink, rounded-lg, shadow 3px ink bottom = "stacked paper") :
    - Pulsing ruby dot + label mono "EN DIRECT" ruby 10px.
    - Display 20px bold — nom tournoi.
    - Sub 13 inkSoft — round + remaining/teams.
    - 2 boutons `PButton sm` : "Voir le bracket →" primary + "Partager" ghost. _(Note : "bracket" inapplicable BPL — à renommer "Voir le classement" cf. décision Q3.8.)_
  - **Derniers matchs** : header display 14 uppercase + link "TOUT →" mono. 3 `MatchRow` = team A vs team B, scores mono 18, winner en forest, `EloDelta` à droite.
  - `TabBar active="home"` en bas.
- **Gap** vs web Home (Groupe 3) :
  - 🟢 **Structure identique** à la Home web refondue : ELO hero + QuickActions 2×2 + Tournoi actif + 3 derniers matchs. C'est voulu — cohérence cross-platform.
  - 🔴 Écran quasi-inexistant en mobile.
  - 🔴 `QuickAction`, `MatchRow`, `TabBar`, `MobileNav` = composants DS mobile à construire (OQ #13).
  - 🟡 Bouton "Voir le bracket" → "Voir le classement" (cohérence BPL, Groupe 3 Q3.8).
  - ~~🟡 Couleur ELO hero — **Q-M1.1**~~ ✅ **Résolue 2026-04-23 par brand kit Everything ELO** : ELO hero sur **`bg-electric-blue #2F6BFF`** (pilier ÉNERGIE, §2.6.2). L'ancien arbitrage "terracotta vs forest" est obsolète — le brand kit aligne web + mobile sur electric-blue.
- **Décision** : ✅ **Implémente P1** (écran hub principal post-auth, bloquant).
  - **P1.a** : construire `HomeScreen.tsx` en miroir de la `Home.tsx` web refondue.
  - **P1.b** : composants DS mobile nécessaires : `MobileNav`, `QuickAction`, `MatchRow`, `TabBar`, `Sparkline`, `PongloGlyph` (→ à renommer `BrandGlyph` post-rename OQ #14), `PRankBadge`, `EloDelta`, `PButton`.
  - **P1.c** : ELO hero **`bg-electric-blue`** (pilier ÉNERGIE). Delta positif reste `lime` (pilier PROGRESSION), pas de confusion (fond ≠ accent).
  - **✅ Appliquer** : rename "bracket" → "classement" (décision Q3.8).
- **Dépendances** : OQ #13 (DS mobile), `useLeague()` / `useIdentity()` portés à RN (via `packages/shared/` ou réécriture hooks).

---

#### ScreenJoin (mobile)

- **Fichier actuel** : `apps/mobile/src/screens/JoinScreen.tsx` (59 lignes placeholder — titre + QR icon + bouton "Scanner un QR code").
- **Référence design** : `mobile-screens-1.jsx > ScreenJoin` (lignes 239-285).
- **Cible design** :
  - `PhoneBody bg={P.cream}` + `MobileNav title="Rejoindre"` avec back button.
  - Contenu `padding 8/24/40`, flex col.
  - **Titre display 34px black line-height 0.95 letterSpacing -1.2 uppercase** — "Scanne le QR\nou tape le code."
  - **QR display** (mockup) : carré ratio 1:1, bg ink, rounded-xl, padding 20. Grille 21×21 "QR-like" déterministe (fill noir selon pattern). **Centre : glyph Ponglo sur fond cream rounded-md 52×52**.
  - Divider mono centré "— ou —" uppercase 12px inkMute.
  - **Code input** : label mono "Code d'accès" + **6 cases** 2px border (active = forest), aspect 0.8, display 28 black. Ex : `P G 1 8 4 7`.
  - `PButton primary size="lg" full` — "Rejoindre le tournoi".
- **Gap** vs web Join (Groupe 1) :
  - 🟢 **Très aligné** sur le web Join (refondu en Groupe 1 — QR + code 6 chars). Bon parallélisme.
  - 🔴 Écran placeholder.
  - 🔴 **Scanner QR natif** : mobile doit intégrer `expo-camera` ou `expo-barcode-scanner` pour un vrai scan. Le design montre un QR **à afficher**, mais en pratique l'écran Join doit aussi **scanner** (caméra arrière).
  - 🟡 Le design montre un code `PG1847` (6 chars). Sur web on a tranché 6 chars alphanumérique sans ambiguïté (OQ #1). **Identique mobile**.
  - ~~🟡 **Q-M1.2** : scanner caméra vs saisie manuelle seule ?~~ ✅ **Résolue 2026-04-23 (option A)** : **scanner caméra + saisie manuelle 6 chars**, les deux entrées en parallèle. Cas d'usage mobile = scanner le QR d'un pote → sans scanner, on perdrait le principal avantage mobile vs web.
- **Décision** : ✅ **Implémente P1** (écran central du funnel rejoindre).
  - **P1.a** : construire `JoinScreen.tsx` avec 3 zones empilées verticalement :
    1. **Scanner caméra arrière** (haut) — vue caméra live, ratio ~1:1, overlay de cadrage + feedback visuel (cadre lime qui se verrouille quand un code est détecté). Placeholder "Autoriser l'accès caméra" si permission refusée.
    2. Divider mono "— ou —".
    3. **Code input 6 cases** (bas) — saisie manuelle fallback, mêmes 6 chars alphanumériques sans ambiguïté.
  - **P1.b** : bouton principal `PButton primary size="lg" full` — "Rejoindre le tournoi" (actif quand code complet, scanné OU saisi).
  - **P1.c** : gestion permission caméra via `expo-camera` (prompt au premier accès, UX de fallback si refusée — on reste sur saisie manuelle, le scanner zone affiche un CTA "Autoriser la caméra").
  - **P1.d** : composants DS mobile nécessaires : `MobileNav`, `CodeInput` (6 cases, nouveau), `QRScanner` (wrapper `expo-barcode-scanner` avec overlay cadrage lime, nouveau — **à ajouter section 5**).
  - **✅ Reuse** : logique `joinByCode` de `packages/shared/`. Le QR scan émet le même payload que la saisie manuelle (juste une autre entrée du flow).
  - 📌 **Note affichage QR du design** : le design montre un QR à **afficher** (pattern 21×21 centré glyph Ponglo). Ça sert au cas "je suis organisateur et je montre mon QR à mes amis qui scannent". Ce cas d'usage vit plutôt sur l'écran **TournamentDashboard mobile** (un bouton "Montrer le QR" qui ouvre un modal plein écran). L'écran `JoinScreen` reste orienté **consommation** (je scanne / je saisis), pas **production** (je montre). À formaliser dans batch 3.
- **Dépendances** :
  - OQ #13 (DS mobile).
  - Lib native : `expo-camera` + `expo-barcode-scanner` (ou `expo-camera` seul avec API `onBarCodeScanned` selon version SDK Expo) pour scan · `react-native-qrcode-svg` pour **afficher** un QR (batch 3 TournamentDashboard, pas ici).
  - `app.json` / `app.config.ts` : ajouter `expo-camera` plugin + `NSCameraUsageDescription` iOS + permission `CAMERA` Android.
  - Services `joinService` à partager avec web via `packages/shared/`.

---

### 4.2 Batch 2 — CreateTournament / CreateLeague / Leaderboard (mobile)

> **Note générale batch 2** : les 2 premiers écrans (`CreateTournamentScreen`, `CreateLeagueScreen`) existent en squelette (54 lignes chacun, form avec 1 input `name` + styles inline). Le 3e (`LeaderboardScreen`) **n'existe pas** — écran 100 % nouveau, miroir de la vue leaderboard web refondue. Tous les arbitrages produits tranchés web (section 3 groupes 2-3) s'appliquent mobile : **pas de toggle ELO**, **pas de slider ELO départ**, date/public/inscription **parkés** (OQ #6), **dual event/season conservé** (OQ #7).
>
> 📌 **Rename filesystem anticipé (OQ #9, Lecture 1)** : `CreateTournamentScreen.tsx` → `CreateEventScreen.tsx` dans cette refonte. Labels UI restent "tournoi" (cohérence cross-platform web le temps de la refonte).

---

#### ScreenCreateEvent (mobile)

> 📌 **Rename filesystem anticipé (OQ #9, Lecture 1)** : le nouveau fichier mobile s'écrit `CreateEventScreen.tsx`, **pas** `CreateTournamentScreen.tsx`. Le titre UI mobile reste **"Nouveau tournoi"** le temps de la refonte (cohérence cross-platform web), divergence transitoire résolue au chantier OQ #9.

- **Fichier actuel** : `apps/mobile/src/screens/CreateTournamentScreen.tsx` (54 lignes placeholder — `SafeAreaView` + titre + input `name` brut, tokens locaux `theme/tokens` ≠ brand kit Everything ELO). **À renommer en `CreateEventScreen.tsx`** lors de la reconstruction (rename filesystem anticipé, OQ #9).
- **Fichier cible** : `apps/mobile/src/screens/CreateEventScreen.tsx`.
- **Référence design** : `mobile-screens-1.jsx > ScreenCreateTournament` (lignes 288-321).
- **Cible design** :
  - `PhoneBody bg={P.cream}` (= `navy` Everything ELO) + `MobileNav title="Nouveau tournoi"` avec back button.
  - Contenu scroll `padding 0 18px 110px`.
  - **Titre hype display 30px black line-height 1 letterSpacing -1 UPPERCASE** — "Un soir,\nun bracket." → **à retravailler côté BPL**, "bracket" inapplicable (Q3.8). Proposé : **"Un soir,\nun classement."** (Teko UPPERCASE post-brand).
  - Série de `FormField` empilés :
    - "Nom du tournoi" (value plain).
    - "Format" (chevron → modal de sélection). _Design propose "Élimination directe" — BPL = "Classement par points" unique, chevron dispensable côté BPL._
    - Grille 2 colonnes : "Équipes" (value numérique), "Par équipe" (chevron).
    - "Date de début" (chevron → date picker). ⏸ **parkée OQ #6**.
  - Section **"ELO & règles"** (label mono 11 uppercase `cool-gray`) + 3 `ToggleRow` :
    - ❌ **"Compter pour l'ELO"** — retiré (OQ #6, ELO toujours compté).
    - ⏸ **"Public"** — parkée (OQ #6).
    - ⏸ **"Inscription libre"** — parkée (OQ #6).
  - **Code généré preview** (post-submit ou inline) : bloc `bg-electric-blue` (ex-forest), code `PG1847` en Teko 32px letterSpacing 4, + "Tape-le ou scanne le QR pour rejoindre".
  - Bottom sticky 2 CTA : `PButton ghost size="lg"` "Brouillon" + `PButton primary size="lg" flex: 1` "Créer →".
- **Gap** vs web CreateTournament (Groupe 2) :
  - 🟢 **Structure identique** à la version web refondue : FormField + grille 2col + Code généré preview + bottom sticky 2 CTA. Cohérence cross-platform.
  - 🔴 Écran placeholder quasi vide (1 champ).
  - 🔴 `FormField` (avec chevron), `ToggleRow` (post-parks OQ #6), bouton sticky bottom = composants DS mobile à construire. Cf. section 5.
  - 🟡 Tokens locaux `theme/tokens` (`colors.bg.primary`, `typography.pageTitle`) à aligner sur brand kit Everything ELO (port de `tailwind.config.js` → `tokens.ts` — cf. OQ #13).
  - 🟡 Bouton "Brouillon" — **pas de feature "brouillon" côté BPL** (pas de draft tournois). **Décision** : retirer le bouton Brouillon, garder uniquement "Créer →" full-width (cohérent avec le web Groupe 2).
  - 🟡 **Code preview** : à afficher **post-submit** (après création réussie), pas inline pendant la saisie (logique cohérente avec OQ #1 — le code est généré côté serveur au create, pas deviné).
- **Décision** : ✅ **Implémente P1** (flow de création critique).
  - **P1.a** : construire `CreateEventScreen.tsx` (rename filesystem anticipé, OQ #9) en miroir de `CreateTournament.tsx` web refondue (Groupe 2) — titre Teko UPPERCASE "Un soir, un classement." + 2 FormField (name, équipes) + CTA unique "Créer →". Labels UI restent "tournoi" (transient).
  - **P1.b** : composants DS mobile nécessaires : `MobileNav`, `FormField` (port de la version web), `PButton`. Aligner sur brand kit : Sora body, Teko display, tokens navy/electric-blue/cool-gray.
  - **P1.c** : **post-submit** — transition vers `EventDetailScreen` (batch 3, rename filesystem anticipé) qui affiche le code `PG1847` dans une **section dédiée** avec CTA "Montrer le QR" (modal plein écran via composant `QRDisplay`, cf. batch 1 note).
  - **✅ Appliquer** : rename "bracket" → "classement" dans le titre (Q3.8).
  - **✅ Retirer** : ToggleRow "Compter pour l'ELO" (OQ #6). Parker ToggleRow "Public" / "Inscription libre" (OQ #6). Parker FormField "Date de début" (OQ #6). Retirer bouton "Brouillon".
- **Dépendances** :
  - OQ #13 (DS mobile : `FormField`, `MobileNav`, `PButton`, tokens).
  - Service `createTournamentService` partagé via `packages/shared/`.

---

#### ScreenCreateLeague (mobile)

- **Fichier actuel** : `apps/mobile/src/screens/CreateLeagueScreen.tsx` (54 lignes placeholder — titre + input `name`).
- **Référence design** : `mobile-screens-1.jsx > ScreenCreateLeague` (lignes 356-404).
- **Cible design** :
  - `PhoneBody bg={P.cream}` + `MobileNav title="Nouvelle ligue"` avec back.
  - Contenu scroll.
  - **Titre hype Teko 30px** — "Un classement\nqui tient la **saison.**" (mot `saison` en `signal-red`, ex-`terracotta`).
  - Sous-titre 13px `cool-gray` line-height 1.4 — "Une ligue = un groupe durable. Les matchs font grimper (ou chuter) l'ELO au fil du temps."
  - `FormField` :
    - "Nom de la ligue".
    - "Saison" (chevron → Saison 5 · Été 2026). **Dual event/season conservé (OQ #7)** : le chevron ouvre un modal "Type de période" avec options `Événement continu` OU `Saison datée`. Par défaut "Événement continu" (cohérent avec l'historique BPL).
  - **Bloc ELO de départ** : `bg-navy-soft` (ex-paper) + label mono "ELO DE DÉPART" + valeur Teko 36px "1200" + sub mono "par défaut (standard Elo)" + ❌ **slider retiré** (OQ #8 fermée — 1200 hardcodé).
  - Section **"Confidentialité"** + 2 `ToggleRow` :
    - ✅ **"Ligue privée"** — conservé, aligné sur `privacy_policy` actuel.
    - ⏸ **"Historique public"** — parkée (pas de feature historique visibility côté BPL aujourd'hui).
  - **Bloc "GG bonus"** (= info card décorative) : bg `rgba(lime, 0.25)`, border 1.5px dashed `electric-blue`, icône ★, message "tu commences comme commissaire de la ligue. Tu peux nommer d'autres organisateurs plus tard." — **cosmétique, rappel UX du rôle créateur** sans implication backend.
  - Bottom sticky : `PButton accent size="lg" full` "Lancer la ligue →".
- **Gap** vs web CreateLeague (Groupe 2) :
  - 🟢 **Structure identique** à la version web refondue (Groupe 2 : FormField + bloc ELO 1200 fixe + Confidentialité + bottom CTA). Cohérence cross-platform.
  - 🔴 Écran placeholder.
  - 🔴 `FormField`, `ToggleRow`, info card décorative = composants DS mobile. Cf. section 5.
  - 🟡 Tokens locaux → brand kit Everything ELO.
  - 🟡 Le design colore "saison" en `terracotta` → rebind `signal-red` (brand kit).
- **Décision** : ✅ **Implémente P1**.
  - **P1.a** : construire `CreateLeagueScreen.tsx` en miroir de `CreateLeague.tsx` web refondue (Groupe 2).
  - **P1.b** : composants : `MobileNav`, `FormField`, `ToggleRow` (pour "Ligue privée"), `PButton`, + `InfoCard` (GG bonus — peut être une variante existante du DS web, à décliner RN).
  - **P1.c** : modal "Type de période" (chevron Saison) → nouveau `SelectSheet` composant DS mobile (bottom sheet natif avec liste d'options). À ajouter section 5.
  - **✅ Retirer** : slider ELO (OQ #8 fermée). ToggleRow "Historique public" (parké).
  - **✅ Bien garder** : ToggleRow "Ligue privée" (cohérent avec feature actuelle).
- **Dépendances** :
  - OQ #13 (DS mobile).
  - `SelectSheet` nouveau composant DS (bottom sheet options) — section 5.
  - Service `createLeagueService` partagé `packages/shared/`.

---

#### ScreenLeaderboard (mobile, **100 % NOUVEAU**)

- **Fichier actuel** : ❌ **n'existe pas**. Pas de `LeaderboardScreen.tsx` dans `apps/mobile/src/screens/`. Les placeholders actuels ont `LeaguesScreen` + `LeagueDetailScreen` mais pas de vue leaderboard dédiée.
- **Fichier cible** : `apps/mobile/src/screens/LeaderboardScreen.tsx` (nouveau).
- **Référence design** : `mobile-screens-2.jsx > ScreenLeaderboard` (lignes 206-296), + helpers `Podium` (241-269), `LeaderRow` (271-296).
- **Cible design** :
  - `PhoneBody bg={P.cream}` + `MobileNav title="Classement"` + right = label mono "S4 · J47" (saison + jour). ⏸ **label saison parké OQ #10** — afficher juste le nom de la ligue active dans le right, ou rien.
  - Header section `padding 0 18px 10px` :
    - Titre Teko 28px UPPERCASE — "Ligue du\nVendredi" (le nom de la ligue active).
    - Pills `Saison / Ligue / Global` (ScrollView horizontal) — ⏸ **parkées OQ #10** (nécessite endpoint cross-ligue + notion de saison). **Décision v1 mobile** : pas de pills. Leaderboard = scope ligue active seule.
  - **Podium top 3** (composant `Podium`) — carte `bg-electric-blue` (ex-forest) rounded-lg padding 18/14 :
    - Label mono "TOP 3 — CETTE SEMAINE" opacity 0.55.
    - Flex row gap 8, items alignés en bas (effet pyramide — ordre visuel 2e/1er/3e, hauteurs 78/56/44px).
    - Par joueur : `PAvatar` 48/40 px + ring coloré (gold/silver/bronze) + prénom + ELO en mono lime + bloc rectangle de la hauteur du podium avec numéro de rang en Teko 24.
    - **Couleurs rang** : 1er = `ping-yellow` (ex-gold), 2e = `cool-gray` (ex-`#A8A8A8`), 3e = **`bronze #CD7F32`** (nouveau token à ajouter §2.1 — déjà décidé Groupe 5/5.2).
  - **Liste complète** (sous le podium) :
    - ScrollView, gap 6px entre rows.
    - `LeaderRow` = flex row :
      - Rank # en mono (top 3 colorés `signal-red`, reste `cool-gray`).
      - Avatar 32px.
      - Nom + badge "MOI" (mono 9px uppercase `bg-white color-navy` — **signalétique cohérente brand**) + stats mono "W · L · 🔥streak" (streak > 2 affiché en `signal-red`).
      - `Sparkline` 44×18 `electric-blue` (delta+) ou `signal-red` (delta-).
      - ELO en mono 17px.
      - `EloDelta`.
    - Row "moi" (si présent) : bg `lime` + border 1.5px white + shadow 3px white offset bottom (effet "épinglé").
  - `TabBar active="rank"` en bas.
- **Gap** vs web LeagueDashboard (Groupe 3) :
  - 🔴 Écran **inexistant** (nouveau).
  - 🔴 Composants nouveaux : `Podium` (3 colonnes pyramide), `LeaderRow` (row liste), `PAvatar` (avatar cercle + ring coloré) — **tous nouveaux DS mobile**, + miroir web à consolider.
  - 🟡 Pills saison/ligue/global — parkées (OQ #10).
  - 🟡 Label "S4 · J47" — parké (nécessite notion de saison).
  - ~~🟡 **Q-M2.1** : switch ligue dans le header ?~~ ✅ **Résolue 2026-04-23 (option B)** : **chevron dans le header** (titre "Ligue du Vendredi ▾") → tap ouvre un `LeagueSwitcher` (bottom sheet avec liste des ligues du user). 1 tap pour switch au lieu de 3, pattern mobile connu, évite un écran index intermédiaire.
- **Décision** : ✅ **Implémente P1** (écran critique, 1 des 4 onglets TabBar).
  - **P1.a** : construire `LeaderboardScreen.tsx` from scratch avec header + Podium top 3 + liste complète.
  - **P1.b** : composants DS mobile nécessaires : `MobileNav`, `Podium` (NEW), `LeaderRow` (NEW), `PAvatar` (NEW, + port web), `Sparkline`, `EloDelta`, `TabBar`.
  - **P1.c** : scope v1 = **ligue active seule** (pas de pills cross-ligue). Header = titre "Ligue du Vendredi ▾" cliquable → `LeagueSwitcher` bottom sheet avec la liste des ligues du user (Q-M2.1 = B, 2026-04-23). Switch instantané, pas de rechargement d'écran.
  - **P1.d** : podium rang 3 = token `bronze #CD7F32` (confirmé Groupe 5).
  - **✅ Parker** : pills Saison/Ligue/Global (OQ #10), label "S4 · J47" (OQ #10).
- **Dépendances** :
  - OQ #13 (DS mobile — `Podium`, `LeaderRow`, `PAvatar`).
  - Token `bronze` à ajouter dans `tailwind.config.js` + `tokens.ts` mobile (§2.1).
  - Hook `useLeague()` RN — port de `packages/shared/` ou réécriture légère.
  - Composant `LeagueSwitcher` (chevron + bottom sheet liste ligues) — déjà ajouté §5 (Q-M2.1 = B, 2026-04-23).

### 4.3 Batch 3 — Score / Profile / History / Event (mobile)

> **Note générale batch 3** : dernier batch mobile. `ProfileScreen` et `TournamentDetailScreen` existent en squelette (21 + 37 lignes), `ScoreScreen` et `HistoryScreen` **n'existent pas** (écrans 100 % nouveaux). Décisions héritées web appliquées : **pas de bracket** (Q3.8 → rename "bracket" → "classement"), **achievements parkés** (OQ #11), **history timeline = nouveau** (pas d'équivalent web encore — sera peut-être ajouté en Groupe 3.5+ plus tard).
>
> 📌 **Rename filesystem anticipé (OQ #9, Lecture 1)** : `TournamentDetailScreen.tsx` → `EventDetailScreen.tsx` dans cette refonte. Labels UI restent "tournoi" (cohérence cross-platform web le temps de la refonte).

---

#### ScreenScore (mobile, **100 % NOUVEAU**)

- **Fichier actuel** : ❌ **n'existe pas**. Pas de `ScoreScreen.tsx` dans `apps/mobile/src/screens/`. Le score entry côté web est géré par un modal dans `LeagueDashboard`/`TournamentDashboard` — côté mobile, on en fait un **écran plein écran dédié** (pattern plus naturel mobile, plus d'espace pour les gros chiffres et le `CupVisualizer`).
- **Fichier cible** : `apps/mobile/src/screens/ScoreScreen.tsx` (nouveau).
- **Référence design** : `mobile-screens-2.jsx > ScreenScore` (lignes 90-203), + helpers `TeamScoreCard` (135-175), `ScoreBtn` (177-189), `EloPreview` (191-203).
- **Cible design** :
  - `PhoneBody bg={P.cream}` (= `navy`) + `MobileNav title="Match en cours"` avec back + right = horloge mono "14:32" (durée match depuis start).
  - Contenu flex col `padding 0 18px 20px` :
    - Label mono uppercase "QF · BO1 · 10 pts" (contextuel — round + best of + cible score).
    - **`TeamScoreCard` équipe A** (haut) :
      - Bg = `paper` (ex-navy-soft) si non-leading, sinon `cup-red` (ex-terracotta = équipe rouge). Équipe leading = hero visuel coloré.
      - Nom team Teko 18px + ELO mono 11px.
      - Badge "MÈNE" mono 10px `bg-white alpha 0.2` si leading.
      - **Score géant Teko 76px** + **2 boutons ronds `-` / `+`** 52×52 de part et d'autre.
      - **CupVisualizer** en bas : 10 cercles (1 par cup, de base 10), cup "gone" = cercle transparent + border, cup "restant" = cercle rempli couleur équipe (rouge ou bleu). **Mobile tactile** : tap sur une cup la fait "tomber" (score++) ou revenir (score--) — alternative au bouton `+/-` pour une UX plus ludique.
    - Divider "VS" Teko 12px entre les 2 cards.
    - **`TeamScoreCard` équipe B** (bas) : miroir de A, mais couleur `cup-blue` (ex-forest = équipe bleue).
    - **Carte ELO preview** : bg `paper` + label mono "PRÉDICTION ELO SI ÇA FINIT COMME ÇA" + 2 `EloPreview` côte à côte :
      - Nom team + `elo → elo+delta` en mono + `EloDelta` pill.
      - Couleur delta : vert = `lime` (pilier PROGRESSION), rouge = `signal-red`.
    - Spacer flex pour pousser le footer en bas.
    - Footer sticky : `PButton ghost size="lg"` "Pause" + `PButton primary size="lg" flex: 1` "Valider le match →".
- **Gap** vs web :
  - 🔴 Écran **inexistant**. Feature hub du flow mobile (saisie score = acte principal).
  - 🔴 Composants nouveaux : `TeamScoreCard`, `ScoreBtn`, `CupVisualizer` (déjà prévu §2.5), `EloPreview`. **Tous à ajouter §5**.
  - 🔴 **CupVisualizer tactile** : nécessite callbacks `onToggle(side, idx)` pour gérer les taps individuels sur cups. API étendue vs spec initiale §5.
  - 🟡 Le design affiche `BO1 · 10 pts` — BPL actuellement **unique mode "classement par points"**, pas de BO1/BO3. Le label à afficher serait plutôt juste **"10 pts"** ou **"Premier à 10 pts"**. À valider.
  - 🟡 Badge "MÈNE" — nouveauté UX intéressante, pas côté web. **À envisager web aussi en cohérence**.
  - 🟡 Horloge "14:32" durée match — BPL ne tracke pas la durée d'un match aujourd'hui. **Parker** (pas de migration DB pour ça).
  - 🟡 **ELO preview live** : le prediction `+14 / -14` doit être calculé côté **client** (pas de round-trip serveur à chaque tap) via la lib ELO partagée `packages/shared/elo`. Cohérent avec l'invariant "ELO calculé côté serveur pour match **confirmé**" (pas pour la preview).
  - 🟡 **Bouton "Pause"** — BPL ne supporte pas la pause match aujourd'hui (pas d'état `paused` sur `match`). **Parker ou retirer** v1.
- **Décision** : ✅ **Implémente P1** (écran central du flow match — saisie score = usage #1 mobile).
  - **P1.a** : construire `ScoreScreen.tsx` avec `TeamScoreCard` (A + B), divider VS, ELO preview, footer CTA.
  - **P1.b** : `CupVisualizer` **tactile** — taps individuels sur cups toggle le score. Taps toujours disponibles en `+/-` buttons pour ergonomie.
  - **P1.c** : ELO preview live via `packages/shared/elo` (calcul client pur, pas de call DB). Recalcul à chaque changement de score.
  - **P1.d** : label contextuel = **"Premier à {targetScore} pts"** (BPL unique mode), **sans BO1/BO3**. TargetScore par défaut = 10, configurable au niveau ligue/tournoi (si on veut l'exposer) — sinon hardcodé.
  - **P1.e** : couleurs team = **`signal-red` (A) et `electric-blue` (B)** (brand kit) — plus les 2 couleurs brand emblématiques (piliers CONNEXION et ÉNERGIE).
  - **✅ Retirer** : horloge "14:32" (pas de tracking durée). Bouton "Pause" (pas d'état `paused`).
  - **✅ Ajouter (post-brand)** : badge "MÈNE" **aussi côté web** (cohérence cross-platform — petite addition DS, impact visuel fort).
- **Dépendances** :
  - OQ #13 (DS mobile : `TeamScoreCard`, `ScoreBtn`, `CupVisualizer`, `EloPreview` — tous nouveaux).
  - `packages/shared/elo` : fonction `predictElo(teamA, teamB, scoreA, scoreB)` exportée et utilisable client.
  - Service `saveMatchService` existant, pas de migration DB.

---

#### ScreenProfile (mobile)

- **Fichier actuel** : `apps/mobile/src/screens/ProfileScreen.tsx` (21 lignes placeholder — SafeAreaView + titre + Ionicons avatar placeholder + 2 labels vides).
- **Référence design** : `mobile-screens-2.jsx > ScreenProfile` (lignes 299-367), + `StatCell` (369-380), `EloChart` (382-404).
- **Cible design** :
  - `PhoneBody bg={P.cream}` (= `navy`) + `MobileNav title="Profil joueur"` + back + right = icône réglages ⚙.
  - Contenu scroll `padding 0 18px 110px` :
    - **Hero row** : `PAvatar` 72px + ring `lime` + stack à droite (nom Teko 22px + handle mono 12 "depuis 2024" + `PRankBadge size="md"`).
    - **ELO card géante** : bg `electric-blue` (ex-forest), rounded-xl, padding 20 :
      - Top row split : gauche = label mono "COTE ELO" + **valeur Teko 64px black lime** ; droite = `EloDelta +42` + label mono "30 DERNIERS JOURS".
      - **`EloChart` 330×110** : SVG custom, grille dashed `lime alpha 0.12`, polygon area `lime alpha 0.15`, polyline `lime 2.5px`, point final + halo. **Composant déjà prévu §5 (OQ #4)** — décision SVG custom confirmée, recharts retiré.
    - **Stats grid 3×2** : 6 `StatCell` (Matchs, Victoires [accent `signal-red`], Ratio %, Série 🔥, Pic ELO, Rang ligue).
    - **Trophées récents** (scroll horizontal) : header mono + row de `AchievementCard` 108px largeur, chacune colorée (terracotta/gold/forest/ink) avec icône ★ + titre Teko 11 + sub mono 10.
    - `TabBar active="me"` en bas.
- **Gap** vs web UserProfile + PlayerProfile (Groupe 4) :
  - 🟢 **Structure alignée** sur le PlayerProfile web refondu (Groupe 4) : Hero + ELO card géante + Stats grid + (Trophées). Cohérence cross-platform.
  - 🔴 Écran quasi-placeholder.
  - 🔴 Composants nouveaux : `EloChart` (SVG, §5 OQ #4), `StatCell` (tile stat mobile), `AchievementCard`. `StatCell` à aligner avec le `StatCard` web existant (API commune ? ou variant mobile ?).
  - 🟡 **Trophées récents** — ⏸ **parkés OQ #11** (feature achievements non implémentée côté BPL). ✅ **Q-M3.1 = A (2026-04-23)** : afficher la section **vide avec placeholder** ("Tu débloqueras tes premiers trophées bientôt…").
  - 🟡 **Rang ligue "#23"** — nécessite calcul rang courant user dans sa ligue active. Si pas trivial, afficher juste ELO + rank name (`PRankBadge`) et parker "#23".
  - 🟡 **Pic ELO** (high score historique) — nécessite stockage historique ELO user. OK si on a `elo_history` en DB — à confirmer.
  - 🟡 **Ratio %** calculable côté client depuis wins/matches — OK.
  - 🟡 **Variant "dark"** du design (fond ink, accents cream) — on garde **variant unique** (navy bg, cohérence brand Everything ELO).
- **Décision** : ✅ **Implémente P1** (écran principal onglet Profil, bloquant).
  - **P1.a** : construire `ProfileScreen.tsx` avec Hero + ELO card + EloChart + Stats grid 3×2.
  - **P1.b** : composants DS mobile : `PAvatar` (NEW, déjà §5 batch 2), `PRankBadge` (port web), `EloDelta`, `EloChart` (SVG custom, NEW — variant mobile du §5), `StatCell` (NEW — variant mobile de `StatCard` web). Harmoniser API : **`StatCard` devient le composant commun** (web + mobile), `StatCell` disparaît au profit de `StatCard variant="compact"`.
  - **P1.c** : ELO card = `bg-electric-blue` (brand kit, pas `cup-red` dark). Chiffre ELO en lime (pilier PROGRESSION).
  - **P1.d** : section **Trophées récents** = **placeholder visible** avec message "Tu débloqueras tes premiers trophées bientôt…" + bg discret `bg-navy-soft` + icône ★ muted. Permet de garder la section en UI v1, sera "remplie" quand OQ #11 sera adressée. ✅ **Q-M3.1 résolue 2026-04-23 (option A)** : placeholder visible retenu (pas de teaser fun qui engage sur un délai, pas de retrait qui créerait un trou visuel dans la hiérarchie du profil).
  - **P1.e** : Pic ELO = utiliser colonne `elo_peak` si existe, sinon afficher `—` ou calculer depuis `elo_history` au fly (si la table existe).
  - **P1.f** : Rang ligue (`#23`) = calcul client depuis leaderboard de la ligue active. Si pas de ligue active, masquer la cell.
  - **✅ Appliquer** : variant unique (pas de dark mode alternatif — brand kit = dark natif).
- **Dépendances** :
  - OQ #13 (DS mobile).
  - `StatCard` harmonisé (ajout `variant="compact"` côté web → réutilisable mobile).
  - `EloChart` SVG (§5, OQ #4 résolue).
  - Data : `elo_history` ou colonne `elo_peak` à vérifier. Si absent → afficher `—` pour Pic ELO.

---

#### ScreenHistory (mobile, **100 % NOUVEAU**)

- **Fichier actuel** : ❌ **n'existe pas**. Pas d'écran historique dédié — les matchs sont listés dans `LeagueDetailScreen` / `TournamentDetailScreen` (→ renommé `EventDetailScreen`, OQ #9) actuels en placeholder.
- **Fichier cible** : `apps/mobile/src/screens/HistoryScreen.tsx` (nouveau). **Pas d'équivalent web actuel** non plus — nouveau concept cross-platform.
- **Référence design** : `mobile-screens-2.jsx > ScreenHistory` (lignes 407-434), + helpers `DayGroup` (437-447), `HistoryRow` (449-468).
- **Cible design** :
  - `PhoneBody bg={P.cream}` + `MobileNav title="Historique"` + back.
  - Header section : 4 pills `Tout / Victoires / Défaites / Ligue` (actif = bg `white` + color `navy`, inactif = border + color `cool-gray`).
  - Contenu scroll `padding 0 18px 110px` — série de `DayGroup` :
    - Label période (Teko 12 uppercase) + count + delta agrégé mono right (vert si +, rouge si -).
    - Liste de `MatchRow variant="history"` par période : team home vs team away + date + score mono + `EloDelta`.
    - **Border-left 3px** colorée sur chaque row (won = `lime` ex-forest, lost = `signal-red`).
  - `TabBar active="home"` en bas (le design met `home` car l'écran est atteint depuis Home, pas un onglet top-level).
- **Gap** :
  - 🔴 Écran **inexistant** + pas d'équivalent web actuel.
  - 🔴 Composants nouveaux : `MatchRow variant="history"` (factorisé Q-M3.3 = A, composant unifié §5), `DayGroup` (NEW), `FilterPills` (peut être le composant `SegmentedTabs` existant web, variant pills).
  - 🟡 **Pills "Ligue"** ambiguës — c'est un filtre ? Ça voudrait dire "uniquement matchs de ma ligue active". Pertinent si user joue dans plusieurs ligues + tournois. ✅ **Q-M3.2 = B (2026-04-23)** : v1 = **`Tout / Victoires / Défaites`** (3 pills, "Ligue" reportée v2).
  - 🟡 **Regroupement par semaine** — `DayGroup label="Cette semaine"` + `"Semaine dernière"` + historique plus ancien. Logique de grouping à coder (date match → bucket semaine).
  - 🟡 **Accès à l'écran** : pas un onglet TabBar dédié — le design active `home`. Suggère que l'accès se fait via un lien "TOUT →" sur la home ("Derniers matchs"), ce qui matche le design batch 1 Home. ✅ Cohérent.
  - 🟡 Cas vide (nouveau user, 0 match) : afficher un **empty state** clean ("Aucun match joué · Lance ton premier match !").
- **Décision** : ✅ **Implémente P1** (écran essentiel du flow "voir ses matchs").
  - **P1.a** : construire `HistoryScreen.tsx` from scratch avec pills filtre + liste `DayGroup` + `MatchRow variant="history"`.
  - **P1.b** : composants : `MobileNav`, `FilterPills` (réutiliser `SegmentedTabs` web en variant pills RN), `DayGroup` (NEW), `MatchRow` (NEW, variant `history`), `EloDelta`, `TabBar`.
  - **P1.c** : pills v1 réduites à **`Tout / Victoires / Défaites`** (3 pills). ✅ **Q-M3.2 résolue 2026-04-23 (option B)** : pas de filtre "Ligue" v1. Raison : peu de users jouent dans 2+ ligues simultanément aujourd'hui, scope ajouté en v2 quand le cas d'usage remonte. Pill "Ligue" reportée.
  - **P1.d** : grouping par **semaine ISO** (date match → `getISOWeek(date)`), label "Cette semaine" / "Semaine dernière" / "Il y a 2 semaines" / sinon date range. Utilitaire `groupMatchesByWeek(matches)` à écrire dans `packages/shared/utils/`.
  - **P1.e** : delta agrégé par période = somme des deltas ELO user sur ces matchs. Calcul client.
  - **P1.f** : empty state illustré quand 0 match.
  - **✅ Mirror web** : à terme, ajouter aussi une route web `/history` avec le même composant. **Décision 2026-04-23** : refonte mobile d'abord, web plus tard (pas bloquant pour le web, pas dans les groupes 1-7 web).
- **Dépendances** :
  - OQ #13 (DS mobile).
  - Utilitaire `groupMatchesByWeek` dans `packages/shared/`.
  - Service `getUserMatches(userId, filter)` dans `packages/shared/` — agrège depuis toutes les ligues/tournois du user.

---

#### ScreenEvent / EventDetail (mobile)

> 📌 **Rename filesystem anticipé (OQ #9, Lecture 1)** : le fichier mobile s'écrit `EventDetailScreen.tsx`, **pas** `TournamentDetailScreen.tsx`. Le titre UI mobile reste **"Pongathon #12"** (nom de l'event — sans préfixe "Tournoi") et les onglets / labels UI restent en FR "Classement / Matchs / Infos" — divergence filesystem/UI transitoire résolue au chantier OQ #9.

- **Fichier actuel** : `apps/mobile/src/screens/TournamentDetailScreen.tsx` (37 lignes placeholder — titre + ID brut). **À renommer en `EventDetailScreen.tsx`** lors de la reconstruction (rename filesystem anticipé, OQ #9).
- **Fichier cible** : `apps/mobile/src/screens/EventDetailScreen.tsx`.
- **Référence design** : `mobile-screens-2.jsx > ScreenTournament` (lignes 6-47) + helpers `BracketCard` (49-73), `TeamLine` (75-87).
- **Cible design** :
  - `PhoneBody bg={P.cream}` + `MobileNav title="Pongathon #12"` (nom tournoi) + right = bouton rond ink "⋯" (menu options).
  - Top block `padding 0 18px 8px` :
    - **Badge "EN DIRECT · Quarts de finale"** : dot `signal-red` + label mono uppercase + boxShadow halo `rgba(signal-red, 0.18)`.
    - **Segmented control** 3 onglets `Bracket / Matchs / Classement`. ⚠️ **"Bracket" inapplicable BPL (Q3.8)** → rename **`Classement / Matchs / Infos`** ou **`Équipes / Matchs / Classement`**.
  - Content tab actif :
    - **Onglet Bracket (design)** → devient **Onglet Classement** : liste des équipes triées par ELO (réutilise `LeaderRow` de batch 2).
    - **Onglet Matchs** : liste chronologique des matchs du tournoi, chacun avec scores + équipes (réutilise `MatchRow variant="match"` — score neutre, pas de border-left).
    - **Onglet Infos** (nouveau) : code `PG1847` géant + bouton "Montrer le QR" → modal plein écran avec `QRDisplay` + date création + nombre équipes + statut (actif/terminé).
  - Bloc "Prochain round" (design) : bg `paper` + border dashed + message — **à adapter** : remplacer par "Prochains matchs à venir" si pertinent, sinon retirer.
  - `TabBar active="play"` en bas.
- **Gap** vs web TournamentDashboard (Groupe 3) :
  - 🔴 Écran quasi-placeholder.
  - 🔴 **Structure bracket inapplicable** (Q3.8) — refonte onglets complète.
  - 🟡 Le design montre un `BracketCard` élaboré (score home/away + live state + winner highlighted) — **BPL = classement par points**, donc on **remplace `BracketCard` par `LeaderRow`** (ligue) ou `MatchRow` (matchs). Cohérent avec Groupe 3 web.
  - 🟡 Badge "EN DIRECT" + halo — seulement pertinent si feature "live match tracking" active. ⏸ **parkée OQ #12** → label statique "En cours" ou simplement nom du round, pas de halo pulsant.
  - 🟡 **Montrer le QR** : nouveau CTA important sur mobile (= scanner le QR d'un pote ou diffuser son tournoi). Ajout dans onglet "Infos".
- **Décision** : ✅ **Implémente P1** (écran central de la vue tournoi pendant un événement).
  - **P1.a** : construire `EventDetailScreen.tsx` (rename filesystem anticipé, OQ #9) en miroir de `TournamentDashboard.tsx` web refondue (Groupe 3). Labels UI en FR restent "tournoi" (transient).
  - **P1.b** : onglets = **`Classement / Matchs / Infos`** (sans bracket, Q3.8).
    - **Classement** : `LeaderRow` (réutilise batch 2) + `Podium` top 3 si tournoi terminé.
    - **Matchs** : liste chrono `MatchRow` — ✅ **factorisé avec `HistoryRow`** (Q-M3.3 = A, 2026-04-23) : un seul composant `MatchRow` avec props variant `history` (border-left colorée + delta perso) / `match` (score neutre, pas de border).
    - **Infos** : code tournoi Teko 32 + bouton "Montrer le QR" (ouvre modal `QRDisplay`) + métadonnées (date, nb équipes, statut).
  - **P1.c** : composants : `MobileNav`, `SegmentedTabs` (port web), `LeaderRow`, `MatchRow` (variant `match` ici, factorisé Q-M3.3 = A), `Podium` (si terminé), `QRDisplay` (bouton "Montrer le QR" → modal plein écran).
  - **P1.d** : ⏸ live badge halo — parké (OQ #12). Label round statique.
  - **P1.e** : bouton "⋯" menu right = options (partager, éditer si admin, terminer le tournoi, dupliquer, supprimer) — nécessite **`ActionSheet`** composant DS mobile (bottom sheet actions). À ajouter §5.
- **Dépendances** :
  - OQ #13 (DS mobile).
  - Composants réutilisés batch 2 : `LeaderRow`, `Podium`, `SegmentedTabs`.
  - ✅ **Q-M3.3 résolue 2026-04-23 (option A)** : `MatchRow` unifié avec variants (`history` border-left colorée + delta perso / `match` score neutre). Composant unique §5, moins de dup.
  - Nouveau `ActionSheet` composant DS mobile (§5).

---

**Questions batch 3 résolues (2026-04-23)** :

- ✅ **Q-M3.1** (Profile) = **A** : placeholder "Tu débloqueras tes premiers trophées bientôt…" visible (bg `navy-soft` + icône ★ muted).
- ✅ **Q-M3.2** (History) = **B** : 3 pills v1 `Tout / Victoires / Défaites`. Pill "Ligue" reportée v2 (peu de users multi-ligues).
- ✅ **Q-M3.3** (Event + History) = **A** : `MatchRow` factorisé avec variants `history` / `match` (évite duplication `HistoryRow`).

**Rename filesystem mobile anticipé (OQ #9, Lecture 1)** : `CreateTournamentScreen.tsx` → `CreateEventScreen.tsx` et `TournamentDetailScreen.tsx` → `EventDetailScreen.tsx`. Labels UI mobile restent "tournoi" en FR pour cohérence cross-platform web — transient, résolu au chantier rename post-refonte.

---

## 5. Nouveaux composants DS à construire

> _À consolider au fil de l'eau au fur et à mesure que les écrans sont spec'és. Liste initiale pré-remplie ci-dessous._

| Composant | Usage principal | API proposée (placeholder) |
|---|---|---|
| Composant | Scope | Usage principal | API proposée (placeholder) |
|---|---|---|---|
| **— Primitives (bas-niveau)** | | | |
| `Sparkline` | web + mobile | Mini-graphe ELO — Home hero, LeaderRow, Profile compact | `{ points: number[]; width?: number; height?: number; color?: string; fill?: boolean }` — SVG custom, pas de deps externes |
| `EloChart` (330px) | web + mobile | Profile graph ELO sur 30/90j | `{ points: number[]; width?: number; height?: number; highlightCurrent?: boolean }` — **SVG custom** (OQ #4 résolue ✅), aligné sur `Sparkline`, grille dashed lime alpha 0.12, polygon area lime alpha 0.15, point final + halo |
| `PAvatar` | web + mobile | Avatar cercle — leaderboard, profile, match rows | `{ name: string; size?: number; ring?: string; imageUrl?: string }` — fallback initiales, ring coloré optionnel |
| `PRankBadge` (update) | web + mobile | Aligner tiers MOUSSE→LÉGENDE | Existant, rebind sur seuils §2.3 |
| `CupVisualizer` | web + mobile | Score entry (Record Match page web + ScreenScore mobile) | `{ homeCups: number; awayCups: number; onToggle?: (side: 'home'\|'away', idx: number) => void; readOnly?: boolean }` — **tactile** sur mobile (tap individuel sur cup toggle le score), **readOnly** par défaut côté DisplayView |
| `EloPreview` | web + mobile | Prediction ELO inline pendant match (dans Record Match + ScreenScore) | `{ name: string; elo: number; delta: number }` — `elo → elo+delta` + EloDelta pill |
| **— Composants de formulaire** | | | |
| `FormField` (with chevron) | web + mobile | Patterns des create flows (CreateLeague, CreateEvent, Profile edit) | `{ label: string; value: string; chevron?: boolean; onClick?: () => void; error?: string; mono?: boolean }` |
| `ToggleRow` | web + mobile | Switch + label des create forms | `{ label: string; sub?: string; on: boolean; onToggle: (v: boolean) => void; disabled?: boolean }` |
| `CodeInput` | web + mobile | Saisie 6 cases alphanumériques — Join, TournamentJoin, AuthCallback OTP | `{ length?: number; value: string; onChange: (v: string) => void; autoFocus?: boolean; active?: boolean; uppercase?: boolean }` — default `length=6`, `uppercase=true`, filtre 6 chars sans ambiguïté (OQ #1) |
| `InfoCard` | web + mobile | Info/hint décorative (GG bonus, onboarding tips) | `{ icon?: string; title: string; message: string; variant?: 'default' \| 'hint' \| 'warning' }` — bg alpha, border dashed ou solide |
| **— Composants de listing** | | | |
| `LeaderRow` | web + mobile | Ligne leaderboard | `{ rank: number; player: LeaderboardPlayer; isMe?: boolean; onClick?: () => void }` — row complète avec avatar + stats + Sparkline + ELO + Delta, variante "MOI" highlighted |
| `Podium` | web + mobile | Top 3 leaderboard — tab Classement LeagueDashboard + TournamentDashboard + ScreenLeaderboard mobile | `{ top3: Array<{ id: string; name: string; elo: number; avatar?: string }>; heights?: [number, number, number]; scope?: string }` — pyramide 2/1/3, defaults `[78, 56, 44]`, rings gold/silver/bronze, carte fond `electric-blue` |
| `MatchRow` | web + mobile | Ligne match historique OU match event (factorisé, Q-M3.3 ✅) | `{ match: Match; variant: 'history' \| 'match'; userPerspective?: 'won' \| 'lost' }` — variant `history` : border-left colorée `lime`/`signal-red` + delta perso ; variant `match` : score neutre, pas de border |
| `DayGroup` | web + mobile | Grouping par semaine History | `{ label: string; count: string; deltaSum: number; children: ReactNode }` — header avec count mono + delta coloré |
| `StatCard` (update — variant `compact`) | web + mobile | Stats grid Profile mobile + cards stats web | `{ value: string \| number; label: string; variant?: 'default' \| 'compact' \| 'primary' \| 'accent' }` — ajouter variant `compact` (mobile 3×2 grid), remplace l'ancien `StatCell` mobile |
| **— Composants de score (mobile-focus)** | | | |
| `TeamScoreCard` | mobile | Carte équipe pendant score entry | `{ name: string; elo: number; score: number; onScoreChange: (v: number) => void; leading: boolean; teamColor: 'red' \| 'blue' }` — gros score Teko 76px + ScoreBtn +/- + CupVisualizer tactile intégré + badge "MÈNE" si leading |
| `ScoreBtn` | mobile | Bouton rond +/- pour score | `{ onClick: () => void; sign: '+' \| '−'; dark?: boolean }` — 52×52 rond |
| **— Layout & navigation** | | | |
| `MobileNav` | mobile | Header sticky mobile (title + back + right action) | `{ title: string; onBack?: () => void; right?: ReactNode; variant?: 'light' \| 'dark' }` |
| `TabBar` | mobile | Bottom tabs 4 items + `+` central | `{ active: 'home' \| 'play' \| 'rank' \| 'me'; onQuickCreate: () => void }` — 4 items plats (labels "ACCUEIL / MATCHS / CLASSEMENT / PROFIL") + FAB saillant lime `+` |
| `QuickAction` | web + mobile | Grid 2×2 Home | `{ label: string; sub?: string; icon: LucideIcon; bg?: string; color?: string; border?: string; onClick: () => void }` |
| `FilterPills` | web + mobile | Pills segmented filter (History, Leaderboard) | `{ options: string[]; value: string; onChange: (v: string) => void }` — variant pills du `SegmentedTabs` web |
| **— QR & camera (mobile-focus)** | | | |
| `QRScanner` | mobile | Scanner QR dans Join + ouverture caméra | `{ onDetected: (code: string) => void; onError?: (err: Error) => void; frameColor?: string }` — wrapper `expo-camera` (ou `expo-barcode-scanner` deprecated), overlay cadrage lime, feedback verrouillage au détect |
| `QRDisplay` | web + mobile | Afficher un QR (EventDetail "Montrer le QR", DisplayView web) | `{ value: string; size?: number; glyph?: boolean }` — wrapper `react-native-qrcode-svg` (mobile) / `qrcode.react` ou custom SVG (web), avec glyph centre optionnel |
| **— Bottom sheets & modals (mobile-focus)** | | | |
| `SelectSheet` | mobile | Bottom sheet sélection (CreateLeague type de période, CreateEvent format si activé plus tard) | `{ title: string; options: Array<{ id: string; label: string; sub?: string }>; value: string; onSelect: (id: string) => void; onClose: () => void }` |
| `ActionSheet` | mobile | Bottom sheet actions (menu "⋯" EventDetail) | `{ title?: string; actions: Array<{ id: string; label: string; icon?: string; destructive?: boolean }>; onSelect: (id: string) => void; onClose: () => void }` |
| `LeagueSwitcher` | mobile | Chevron dans header Leaderboard pour switch entre ligues du user | `{ currentLeagueId: string; leagues: League[]; onSelect: (id: string) => void }` — trigger chevron + bottom sheet (réutilise `SelectSheet`) |
| **— Parkés (section placeholder v1)** | | | |
| `AchievementCard` | mobile | Tuile trophée scrollable horizontale — ⏸ **parkée OQ #11**, section rendue en placeholder neutre v1 (Q-M3.1 = A) | `{ title: string; sub: string; color: string; icon?: string }` — 108×120px. Non construite v1. |

**Pages nouvelles (pas des composants, planifiées ici pour continuité)** :
- **Record Match Page** (`/record-match/:id`) — remplace les modals actuelles de LeagueDashboard + EventDashboard web. Utilise `CupVisualizer` + `EloPreview` + CTA validation. Miroir web de `ScreenScore` mobile. À concevoir en Phase B implémentation.
- **EventDashboard** (`/event/:id/dashboard`) — nouvelle route organisateur (section 3 Groupe 6). Rename anticipé de "WebDashboard" pour s'aligner sur OQ #9. Cf. batch 6.

**Composants écartés / dépréciés** :
- ❌ `BracketCard` — retiré de la liste : **décision Q3.8** — BPL ne fait pas de bracket d'élimination (classement ponctuel uniquement).
- ❌ `HistoryRow` — fusionné dans `MatchRow` avec variant `history` (Q-M3.3 = A, 2026-04-23).
- ❌ `StatCell` (mobile) — fusionné dans `StatCard variant="compact"` (batch 3 Profile).

> Détails d'API à compléter par écran. Ne pas over-engineer avant d'avoir vu les 3-4 usages.
>
> **Convention scope** : `web + mobile` = un seul composant partagé (conceptuellement), deux implémentations (React web + React Native mobile) mais **même API**. `web` ou `mobile` seul = composant propre à la plateforme.

---

## 6. Dépréciations

**À supprimer une fois la refonte mergée.** Table ordonnée par phase de suppression.

### 6.1 Tokens & palette

| Cible | Raison | Supprimer en phase |
|---|---|---|
| `tailwind.config.js > colors.background.*` (primary/secondary/tertiary) | Aliases legacy Epic 14, remappés sur `navy`/`paper` Everything ELO | A (foundation) |
| `tailwind.config.js > colors.text.*` (primary/secondary/tertiary/muted) | Idem, remappés sur `ink`/`ink-soft`/`cool-gray` | A |
| `tailwind.config.js > colors.primary / success / error / elo / info / accent / secondary` | Aliases non sémantiques, remappés tokens brand (signal-red/lime/electric-blue/ping-yellow) | A |
| `status-active`, `status-finished`, `delta-positive`, `delta-negative` | Doublons des tokens brand (signal-red/lime) | A |
| Aliases Arcade `cream`, `cream-deep`, `paper`, `forest*`, `terracotta*`, `cup-*` | Superseded par brand Everything ELO (navy/electric-blue/signal-red/ping-yellow/lime) | B (fin refonte web) |
| Gradients legacy `bg-gradient-to-r from-cup-blue to-violet-600` (violet hardcodé) | Violet hors DS, aucune référence produit | A (purge globale) |
| `bg-gradient-cta` (terracotta) | Remappé `bg-gradient-to-br from-electric-blue to-navy` (pilier ÉNERGIE) | B |

### 6.2 Composants

| Cible | Remplacé par | Supprimer en phase |
|---|---|---|
| `LastActivityCard` (si non réutilisé) | Nouvelle carte Home "Derniers matchs" + lien vers History mobile | B (Home refondue) |
| `BracketCard` (proposé par design) | Non créé — BPL = classement ponctuel (Q3.8) | — (jamais créé) |
| `HistoryRow` (proposé) | Fusionné dans `MatchRow variant="history"` (Q-M3.3 = A) | — (jamais créé) |
| `StatCell` (proposé mobile) | Fusionné dans `StatCard variant="compact"` | — (jamais créé) |
| `PongloGlyph` / `PongloWordmark` (références nominales) | Rebind `BrandGlyph` / `BrandWordmark` (ou équivalent générique Everything ELO) | C (rename OQ #14, post-refonte) |
| `BottomTabMenu` actuel (si ≥ 5 items) | Nouveau `TabBar` 4 items + FAB `+` | B |

### 6.3 Routes & pages

| Cible | Remplacé par | Supprimer en phase |
|---|---|---|
| Modals record-match inlinées dans `LeagueDashboard` / `TournamentDashboard` | Page dédiée `/record-match/:id` (web + mirror mobile `ScreenScore`) | B |
| (futur) `/tournament/:id`, `/tournaments` | `/event/:id`, `/events` + redirects 301 | C (chantier rename OQ #9, post-refonte) |

### 6.4 Dépendances externes

| Cible | Raison | Supprimer en phase |
|---|---|---|
| `recharts` (si plus aucun usage après `EloChart` refondu) | EloChart passe en SVG custom (OQ #4 = SVG). Si recharts reste nulle part, retirer la dep. | B (fin Profils) |
| `expo-barcode-scanner` (mobile) | Deprecated Expo SDK 50+. Utiliser `expo-camera` directement pour le scan QR. | B (batch 1 mobile) |

---

## 7. Phasing d'implémentation

**Principe** : chaque phase produit une ou plusieurs PRs **mergeables indépendamment**. Pas de big-bang. L'UI existante continue de fonctionner jusqu'à la dernière PR de chaque phase.

### Phase A — Foundation (brand + DS tokens)

**Objectif** : ancrer la palette Everything ELO dans `tailwind.config.js` et purger les aliases Epic 14, sans toucher aux composants écran. L'app continue d'afficher le look actuel (via remap).

- **A.1** — Ajouter les tokens Everything ELO dans `tailwind.config.js` (navy, electric-blue, ping-yellow, signal-red, lime, cool-gray) + bronze. Conserver les aliases Arcade legacy en co-existence pour compat.
- **A.2** — Charger les fonts Sora / Teko / JetBrains Mono via `@fontsource/*` dans `apps/web/src/main.tsx`. Ajouter `font-sora` / `font-teko` / `font-mono` dans `tailwind.config.js > theme.fontFamily`.
- **A.3** — Update `PRankBadge` : aligner tiers `MOUSSE / ROOKIE / SHOOTER / CAPTAIN / MVP / LÉGENDE` sur les seuils §2.3, couleurs piliers.
- **A.4** — Purge legacy (dépréciations §6.1 phase A) : supprimer aliases `colors.background.*`, `colors.text.*`, `primary / success / error / elo / info / accent / secondary`, `status-active/finished`, `delta-positive/negative`, gradient violet hardcodé. Grep + remplacer par les tokens canoniques.
- **A.5** — Créer les primitives DS manquantes dans `apps/web/src/components/design-system/` : `Sparkline`, `EloChart` (SVG custom), `PAvatar`. Ajouter entrée `DesignSystemShowcase.tsx` pour chacune (R1).
- **A.6** — Créer les form primitives : `FormField` (chevron support), `ToggleRow`, `CodeInput`, `InfoCard`. Entrée showcase.
- **A.7** — Créer les listing primitives : `LeaderRow`, `Podium`, `MatchRow` (variants `history` / `match`), `DayGroup`, `StatCard variant="compact"`. Entrée showcase.
- **A.8** — Update `brand-kit-everything-elo.md` si besoin d'ajustements rétro post-implémentation.

**Livrable PR** : 1-2 PRs — (1) tokens + fonts + purge, (2) primitives DS + showcase.

### Phase B — Refonte web par flow

**Objectif** : re-skinner les écrans web existants flow par flow. À chaque flow, la PR passe les screens du "legacy tokens remappés" au "brand tokens natifs" et injecte les primitives.

- **B.1 Onboarding** — Landing polish + AuthCallback restyle + TournamentJoin/Invite restyle. Utilise `CodeInput`, `PButton`, brand navy.
- **B.2 Création** — CreateTournament + CreateLeague refondues (Groupe 2) — retire slider ELO (OQ #8), parke date/public/inscription/toggle ELO (OQ #6), conserve dual event/season (OQ #7). Utilise `FormField` + `ToggleRow` + `InfoCard`.
- **B.3 Record Match Page** (`/record-match/:id`, P0 transverse) — remplace les modals actuelles de LeagueDashboard + TournamentDashboard. Utilise `CupVisualizer` + `EloPreview` + CTA validation. **Bloquant pour B.4** (les dashboards linkent vers cette page).
- **B.4 Dashboards** — Home + Tournaments/Leagues lists + TournamentDashboard + LeagueDashboard avec `Podium` top 3 + `LeaderRow` + `Sparkline`. Retire le bracket (Q3.8) — TournamentDashboard reste classement.
- **B.5 Profils** — PlayerProfile + UserProfile refondus avec hero `PAvatar` + ELO card `bg-electric-blue` + `EloChart` (SVG custom) + stats grid `StatCard variant="compact"`. Trophées parkés (placeholder visible v1, OQ #11 = Q-M3.1 = A).
- **B.6 Display** — DisplayView restyle + DisplayViewDrama nouveau (finale split diagonal) + **EventDashboard** nouveau (`/event/:id/dashboard`, rename anticipé OQ #9, Groupe 6). Accueille le CTA "Voir écran".
- **B.7 DesignSystemShowcase** — update final : vérifier que tous les composants créés phases A-B ont leur entrée + refresh screenshots/demos.

**Livrable PR** : 1 PR par sous-phase (B.1 à B.7), mergeable indépendamment. Possible de paralléliser B.1-B.2 puisque indépendants.

### Phase C — Mobile

**Objectif** : reconstruire les 10 écrans mobile from scratch sur la base du DS mobile nouvellement porté.

- **C.1 DS mobile (OQ #13)** — porter tokens → `tokens.ts`, charger fonts via `expo-font`, créer primitives `PongloGlyph` (→ `BrandGlyph`), `PButton`, `PRankBadge`, `EloDelta`, `Sparkline`, `PAvatar`, `EloChart`. Composants : `MobileNav`, `TabBar` 4 items + FAB, `FormField`, `ToggleRow`, `CodeInput`, `InfoCard`, `StatCard variant="compact"`, `MatchRow`, `LeaderRow`, `Podium`, `DayGroup`, `FilterPills`, `SelectSheet`, `ActionSheet`, `QRScanner`, `QRDisplay`.
- **C.2 Mobile batch 1** — `AuthScreen` + `HomeScreen` + `JoinScreen` (scanner QR + saisie manuelle, Q-M1.2 = A).
- **C.3 Mobile batch 2** — `CreateEventScreen` (rename anticipé, OQ #9) + `CreateLeagueScreen` + `LeaderboardScreen` (nouveau, avec `LeagueSwitcher` Q-M2.1 = B).
- **C.4 Mobile batch 3** — `ScoreScreen` (nouveau, avec `CupVisualizer` tactile + `TeamScoreCard` + `EloPreview`) + `ProfileScreen` (avec `EloChart` + placeholder trophées Q-M3.1 = A) + `HistoryScreen` (nouveau, 3 pills Q-M3.2 = B) + `EventDetailScreen` (rename anticipé, OQ #9, onglets `Classement / Matchs / Infos`, pas de bracket Q3.8).
- **C.5 Mobile navigation** — wiring `TabBar` + stack navigation + deep-linking depuis QR.

**Livrable PR** : 1 PR DS mobile (C.1) bloquante, puis 1 PR par batch (C.2/C.3/C.4) parallélisables sur le DS stable, + 1 PR wiring (C.5).

### Phase D — Chantiers post-refonte (hors scope refonte, à planifier séparément)

Tickets à ouvrir à la fin de la refonte, dans l'ordre suggéré :

1. **`product:rename-to-beer-pong-elo`** (OQ #14) — rename UI + emails + store listings. PR courte, pas de migration DB. Allégée car tokens Everything ELO déjà en place.
2. **`product:rename-tournament-to-event`** (OQ #9) — migration DB `tournaments` → `events` + ajout colonne `mode` + rename routes + labels UI cross-platform. Allégée côté mobile (filesystem déjà anticipé phase C).
3. **`feature:achievements-system`** (OQ #11) — table + attribution + UI `AchievementCard` (actuellement parkée §5). Remplit les sections placeholder phase B.5 + C.4.
4. **`feature:live-match-tracking`** (OQ #12) — DB `match.isLive` + realtime Supabase + UI badges "EN DIRECT" (actuellement statiques).
5. **`feature:cross-league-leaderboard`** (OQ #10) — endpoint agrégé + notion de saison + pills `Saison/Ligue/Global` (actuellement parkées phase B.4 + C.3).
6. **`refactor:extract-ui-elo-family`** (R5) — UNIQUEMENT quand un 2e vertical démarre.

---

## 8. Risques & open questions

- ~~**OQ #1** : le modèle `tournaments` a-t-il un champ `short_code` (style `PG1847`) ?~~ ✅ **Résolue (Groupe 2)** : le champ `join_code` existe (migration `006_add_tournament_code_and_format.sql`), 6 chars alphanumériques sans ambiguïté (exclut 0/O/I/1/L), généré par `generateTournamentCode()` avec check collision. Utilisable directement pour la bannière `TournamentInvite` et le display post-création.
- ~~**OQ #2** : item central `+` dans la TabBar — quel comportement ?~~ ✅ **Résolue (Groupe 7, 2026-04-23)** : **4 items plats + bouton `+` central saillant** (rond lime, dépasse la barre). Au clic → **modal quick-create** avec 3 options (Nouveau match / Nouveau tournoi / Nouvelle ligue). Pattern mobile moderne (Instagram/TikTok), valorise la création, ne casse pas la décision 2.4 (4 items de nav). Le `+` n'est **pas** un item de nav (pas d'état actif, pas de route dédiée), c'est un "action button" superposé.
- **OQ #3** : `ContextualHeader` (existant) est-il conservé tel quel ou remplacé par le pattern `MobileNav` du design ? — à trancher au Groupe 3.
- **OQ #4** : `EloChart` reste en recharts ou on bascule sur un SVG custom cohérent avec `Sparkline` ? — à trancher au Groupe 4 (Profils).
- **OQ #5** : routes `/play` et `/leaderboard` (Bottom TabBar item 2 et 3) — à créer ou à mapper sur existant ? Probablement nouveaux écrans web (le leaderboard actuel est embedded dans `LeagueDashboard`).
- **OQ #6** _(Groupe 2, CreateTournament)_ : ajout des champs optionnels du design (`date début`, `Public`, `Inscription libre`, `Compter pour l'ELO`) — statut après arbitrage :
  - ❌ **"Compter pour l'ELO"** : **retiré du scope** (décision 2026-04-23). L'ELO est toujours compté, pas de toggle non-ranked. Pas de migration.
  - ⏸ **date début / Public / Inscription libre** : parkés (pas de cadrage produit à ce stade). Ne pas implémenter tant qu'un besoin concret ne remonte pas.
- ~~**OQ #7** _(Groupe 2, CreateLeague)_ : event/season dual ou fusion ?~~ ✅ **Résolue (2026-04-23)** : **garder le dual** (`event` continue vs `season` avec reset). Le design est plus restrictif, on garde la flexibilité.
- ~~**OQ #8** _(Groupe 2, CreateLeague)_ : slider ELO de départ configurable ?~~ ❌ **Résolue (2026-04-23)** : **pas besoin**. ELO de départ reste hardcodé à 1200 (standard Elo). Pas de migration.
- **OQ #9** _(Groupe 3, TournamentDashboard)_ — 📌 **À reprendre après la refonte** : **renommer le concept produit `Tournoi → Événement`**. Dans BPL, un "tournoi" est aujourd'hui un classement ponctuel sur un événement (soirée), pas un bracket. "Événement" (ou équivalent) serait plus juste et ouvrirait la voie à un sous-mode `mode: bracket | classement` plus tard.
  - **Modèle conceptuel retenu (2026-04-23, Lecture 1)** : `Event` est le **nouveau nom** du concept actuellement appelé `Tournament`. **Pas de hiérarchie parent-enfant** (ce n'est pas `Event` qui contient des `Tournaments`). C'est un **rename 1:1** du concept. Hiérarchie finale :
    ```
    League (groupement durable, ELO continu)

    Event (session ponctuelle — ex-Tournament)
      ├── mode = 'classement'  (seul mode implémenté aujourd'hui, = l'actuel "Tournoi")
      └── mode = 'bracket'     (futur : vrai tournoi à élimination avec rounds)
    ```
    → L'actuel "tournoi" devient `Event{ mode: 'classement' }`. Le mot "bracket" désigne un **mode futur** d'Event, pas l'actuel.
  - **Impact estimé** : migration DB (table `tournaments` → `events`, ajout colonne `mode` default 'classement'), URLs (`/tournament/:id` → `/event/:id` + redirects), labels UI partout (composants, emails, notifications), docs `CLAUDE.md`/`architecture.md`, types TS dans `packages/shared/`, edge functions Supabase qui référencent le nom.
  - **Décision (2026-04-23)** : ⏸ **parkée pour ce cycle** côté **web + DB**. Deux chantiers lourds en parallèle (refonte + renommage produit) créerait trop de bruit dans les PRs. Séquence retenue : **1) refonte UI en gardant le mot "Tournoi"** sur le web et dans la DB, 2) après refonte mergée, ouvrir un chantier dédié renommage.
  - **Stratégie anticipation côté mobile (2026-04-23)** : le mobile étant **reconstruit from scratch** (placeholders 30-60 lignes), on **anticipe le rename filesystem mobile uniquement**. Nouveaux fichiers mobile créés directement en `Event*Screen.tsx` (ex : `CreateEventScreen.tsx`, `EventDetailScreen.tsx`, `EventsScreen.tsx`). Ça réduit la portée du chantier OQ #9 post-refonte (il ne restera que le web + DB à renommer).
    - **Contrainte** : les **labels UI mobile** restent **"Tournoi"** le temps de la refonte, pour cohérence cross-platform avec le web. L'écran s'appellera `EventDetailScreen.tsx` dans le code mais affichera "Tournoi" en titre. Cette divergence code/UI est **transitoire** et se résout au chantier rename.
    - **Également anticipés** : le nouvel `EventDashboard` web (Groupe 6) naît directement sous ce nom.
  - **Follow-up** : à la fin de la refonte, créer un ticket `product:rename-tournament-to-event` regroupant tous les touchpoints restants (DB + web code + routes + labels UI cross-platform + docs + comms utilisateurs). Le mobile ayant anticipé, ce ticket sera **plus léger**.
- **OQ #10** _(Groupe 3, LeagueDashboard)_ — ⏸ **Parkée (validée 2026-04-23)** : pills `Saison / Ligue / Global` proposées par `ScreenLeaderboard`. Nécessite (a) notion de "saison" (période temporelle) en DB + reset logic, (b) endpoint de leaderboard **cross-ligue** (agrégation globale de tous les joueurs). Feature produit à cadrer séparément, non-bloquant pour la refonte esthétique.
- **OQ #11** _(Groupe 4, PlayerProfile)_ — 📌 **À reprendre après la refonte** : section **Trophées récents** (achievements BLITZ / REMONTADA / UNDERDOG / PERFECT...) proposée par `ScreenProfile`.
  - **Impact estimé** : nouvelle table `achievements` + FK user/player, edge function ou trigger DB pour l'attribution automatique, composant `AchievementCard` scrollable horizontal, cadrage produit sur la liste initiale (noms, critères, couleurs) et la stratégie d'évolution (ajout de trophées saisonniers, etc.).
  - **Décision (2026-04-23)** : ⏸ **parkée pour ce cycle**. Chantier feature complet (DB + logique + UI + produit), hors scope refonte esthétique.
  - **Follow-up** : après refonte mergée, créer un ticket `feature:achievements-system` regroupant migration + attribution + UI + liste initiale.
- ~~**OQ #4** _(Groupe 4, PlayerProfile)_ : `EloChart` recharts vs SVG custom ?~~ ✅ **Résolue (2026-04-23)** : **SVG custom** aligné sur `Sparkline`. Cohérence DS + moins de deps runtime + facile à dériver. `recharts` reste utilisable ailleurs mais plus ici.
- **OQ #12** _(Groupe 5, Displays)_ — ⏸ **Parkée (2026-04-23)** : **live match tracking**. Le design affiche "Match en cours" (scores live, ballon #N, match point, +N ELO en jeu) sur `DisplayView` et `DisplayViewDrama`. Nécessite champs DB `match.isLive`, `match.ballon`, `match.matchPoint` + logique de transition (début/fin de match, ballon courant) + éventuellement realtime Supabase. Feature produit à cadrer séparément (hors scope refonte esthétique). Fallback actuel (nb matchs joués + match feed) reste fonctionnel.
  - **Follow-up** : après refonte mergée, créer un ticket `feature:live-match-tracking` (DB + UI live + realtime).
- **OQ #13** _(Passe 3 mobile, transverse)_ — 🔨 **Chantier actif** : **construire le DS mobile React Native**. L'app mobile étant un squelette (9 écrans placeholder 40-60 lignes chacun), le DS Ponglo Arcade doit être porté de Tailwind web vers RN StyleSheet.
  - **Scope** : palette tokens `tokens.ts` (port de `tailwind.config.js` → objets TS), typo (charger Space Grotesk / Archivo / JetBrains Mono via `expo-font`), primitives (`PongloWordmark`, `PongloGlyph`, `PButton` 6 variants × 3 sizes, `PRankBadge`, `EloDelta`, `Sparkline`), composants DS (`MobileNav`, `TabBar` 4 items + `+`, `QuickAction`, `MatchRow`, `CodeInput`, `QRDisplay`, `StatCard`, `ListRow`, etc.), layout (`PhoneBody` = SafeAreaView + flex col).
  - **Impact** : chantier majeur mais **unique** — une fois le DS mobile en place, les 10 écrans se construisent relativement vite. Les composants DS mobile doivent rester **API-compatibles** avec leurs cousins web (mêmes props, mêmes variants) pour que les dev switchent facilement.
  - **Stratégie** : construire le DS mobile **en parallèle** du premier écran qui l'utilise (AuthScreen), puis itérer. Pas de chantier "DS mobile complet avant tout écran" — on construit au fil des besoins.
  - **Follow-up** : ticket `feature:mobile-ds-arcade` avec sous-tickets par primitive/composant. À attaquer après la phase A web (polish), ou en parallèle si bande passante.
- **OQ #14** _(Transverse, 2026-04-23, R2)_ — 📌 **À reprendre après la refonte** : **rename produit Beer Pong League / Ponglo → Beer Pong ELO**. Décidé côté brand (R2 = oui) mais non exécuté dans cette refonte pour éviter le double-chantier (refonte + rename).
  - **Scope du rename** : labels UI ("Beer Pong League" → "Beer Pong ELO" dans headers, splash, meta tags HTML `<title>`, OG tags), emails transactionnels Supabase/Resend, factures et descriptions produit Stripe, store listings (App Store + Play Store), site marketing + domaine (si concerné), doc utilisateur, `README.md`, onboarding copy, page Legal/CGU, références "Ponglo" dans composants (`PongloGlyph`, `PongloWordmark` → à renommer `EverythingELOGlyph` / `BeerPongELOWordmark` ou génériques `BrandGlyph` / `BrandWordmark`).
  - **Scope hors rename** : `apps/web` / `apps/mobile` / `packages/shared` filesystem, nom du monorepo, package.json `name`, tables DB, types TS, noms de colonnes — tout ça reste tel quel (`BPL` toléré comme acronyme code-base).
  - **Décision (2026-04-23)** : ⏸ **parkée pour ce cycle**. Le rename est **affiché** (UI-only), pas structurel. Séquence : 1) refonte UI mergée avec tokens Everything ELO, 2) chantier rename label pur dans une PR dédiée.
  - **Follow-up** : à la fin de la refonte, créer un ticket `product:rename-to-beer-pong-elo` regroupant tous les touchpoints. Check-list à préparer dans ce ticket (pas ici).

### 8.1 Récap OQ — état final de la spec

| OQ | Sujet | État | Phase de reprise |
|---|---|---|---|
| OQ #1 | `join_code` tournois | ✅ Résolue (existe déjà) | — |
| OQ #2 | TabBar `+` central | ✅ Résolue (4 items + FAB) | — |
| OQ #3 | `ContextualHeader` vs `MobileNav` | ⏸ À trancher Phase B.4 (Groupe 3) | Implémentation |
| OQ #4 | EloChart recharts vs SVG | ✅ Résolue (SVG custom) | — |
| OQ #5 | Routes `/play` `/leaderboard` | ⏸ Phase B (mapping à décider) | Implémentation |
| OQ #6 | Champs optionnels CreateTournament | ✅ Toggle ELO retiré / 📌 date/public/inscription parkés | Si demande produit |
| OQ #7 | Event/Season dual | ✅ Résolue (dual conservé) | — |
| OQ #8 | Slider ELO départ | ✅ Résolue (1200 hardcodé) | — |
| OQ #9 | Rename Tournament → Event | 📌 Parké (chantier post-refonte, mobile anticipé) | Phase D.2 |
| OQ #10 | Leaderboard cross-ligue + saisons | 📌 Parkée | Phase D.5 |
| OQ #11 | Achievements / Trophées | 📌 Parkée | Phase D.3 |
| OQ #12 | Live match tracking | 📌 Parkée | Phase D.4 |
| OQ #13 | DS mobile RN | 🔨 Chantier Phase C.1 | Refonte |
| OQ #14 | Rename BPL → Beer Pong ELO | 📌 Parké (chantier post-refonte) | Phase D.1 |

**État global de la spec** : 8/14 OQ résolues ✅ · 6/14 parkées 📌 (5 vers Phase D, 1 chantier Phase C) · 2 OQ d'implémentation à trancher au fil (#3, #5).

---

## 9. Pistes & idées non testées (logbook)

> **But de cette section** : garder trace de toutes les alternatives envisagées, features du design pas retenues pour la refonte, patterns à essayer plus tard. Pas des OQs (pas de décision à prendre dans l'immédiat), pas des dépréciations (on ne supprime rien). Juste un carnet de bord.
>
> **Format** : date · source · idée · pourquoi non retenue (ou non testée) · déclencheur potentiel pour reprendre.

### 9.1 Alternatives tech écartées par décision explicite

| Date | Contexte | Piste envisagée | Non retenue car | Déclencheur pour reprendre |
|---|---|---|---|---|
| 2026-04-23 | Palette (décision 2.1, **superseded par brand Everything ELO**) | **Dual theme Cups (clair) + Arcade (dark)** | Coût maintenance x2, pas de demande produit | Si demande utilisateurs "mode clair" remonte |
| 2026-04-23 | Palette (décision 2.1, **superseded 2026-04-23 par R1/R3**) | **Garder `Ponglo Arcade` tel quel** (cream/cup-red/gold) | Nouveau brand kit Everything ELO livré par PO le 2026-04-23 — palette navy + electric-blue + ping-yellow + signal-red retenue | — (decision figée, rollback uniquement si nouveau rebrand) |
| 2026-04-23 | Typo (décision 2.2, **superseded par R4 = C**) | Basculer sur **Inter** ou **Geist** (plus "neutre moderne") | Identité visuelle Everything ELO retenue : Sora + Teko + JetBrains Mono | — |
| 2026-04-23 | Typo (décision 2.2, **superseded 2026-04-23 par R4**) | **Garder Space Grotesk + Archivo + JetBrains Mono** (stack Arcade) | Brand Everything ELO exige Sora + Teko ; Space Grotesk reste fallback | — |
| 2026-04-23 | Typo (R4) | **Satoshi immédiat** (Fontshare, identité premium) | Licence Fontshare non validée + font loading + délai projet | Si licence OK et un designer identifie un besoin UI que Sora ne couvre pas |
| 2026-04-23 | Brand (R5) | **Extraire `packages/ui-elo-family`** (DS factorisé pour Beer Pong/Padel/Tennis/Basket ELO) | Pas de 2e vertical vivant. Prématuré. Reste monolithique Beer Pong ELO. | Quand un 2e vertical démarre l'implémentation |
| 2026-04-23 | Brand (R7) | **Piliers comme composants structurels / routes dédiées** | Les piliers sont sémantiques (thèmes couleur), pas des pages. Pas de `/energie`, pas de `<PillarCard>` | — (decision figée) |
| 2026-04-23 | Groupe 4 (PlayerProfile, OQ #4) | Garder **recharts AreaChart** pour EloChart | Cohérence DS avec `Sparkline` SVG custom, moins de deps runtime | — (tranché SVG) |
| 2026-04-23 | Groupe 5 (DisplayView, 5.2) | Podium rang #3 avec **`bg-cup-red-deep`** (fallback sans nouveau token) | Option A token `bronze` retenue pour la sémantique claire | — |
| 2026-04-23 | Groupe 6 (6.1) | **EventDashboard en P1** (inclus dans la phase A polish) | Trop gros pour le même cycle que les polish tokens ; déplacé en phase B2 post-refonte | — (tranché P2) |
| 2026-04-23 | Groupe 6 (6.2) | **Item bottom tab `MobileNav` 5e** pour entrée dashboard | Casserait la décision 2.4 (4 items fixes) ; boutons contextuels dans LeagueDashboard / TournamentDashboard suffisent | — |
| 2026-04-23 | Groupe 6 (6.3) | **Scope ligue/tournoi unitaire** (`/league/:id/dashboard`) | Décision scope global retenue — plus simple v1, couvre 80% du besoin organisateur | Si besoin vue scopée remonte, ajouter variante `?scope=league:xxx` |
| 2026-04-23 | Groupe 6 (6.4) | **Page `/pricing` dédiée** OU modal upgrade existant pour le Pro upsell | Lien direct Stripe checkout retenu (cohérent avec limitModal freemium) | — |
| 2026-04-23 | Groupe 6 (6.5) | **Dashboard réservé aux users premium** | Décision B : accessible à tous les admins (créateurs), Pro upsell reste rappel — moteur de conversion naturel | — |
| 2026-04-23 | Groupe 6 (naming) | **WebDashboard** (nom générique web) | Rebaptisé `EventDashboard` dès création, anticipe rename OQ #9, évite dette future | — |
| 2026-04-23 | Groupe 7 (7.1 / OQ #2) | **5 items plats** dans BottomTabMenu (garder actuel) | Décision 2.4 à 4 items confirmée + bouton `+` central saillant retenu (pattern mobile moderne) | — |
| 2026-04-23 | Groupe 7 (7.1 / OQ #2) | **Pas de bouton `+` central** (4 items plats nus) | Valorisation de la création jugée utile, `+` saillant ne casse pas 2.4 (pas un item nav) | Si UX test révèle que le `+` gêne (mauvaise découvrabilité tabs) |
| 2026-04-23 | Groupe 7 (7.3) | **Section "Page patterns"** dans la showcase (mini-mockups header/tabs/content/nav) | Showcase focalisée primitives/composants ; patterns page = `ScreenLayout`, pas la showcase | Si la complexité compositionnelle grandit et devient confuse |
| 2026-04-23 | Mobile batch 2 (Q-M2.1) | **Pas de switch ligue dans le header Leaderboard** (sélection via écran index préalable) | Friction 3 taps au lieu d'1, pas cohérent avec un onglet TabBar "Classement" direct | Si le bottom sheet gêne (découvrabilité faible) |
| 2026-04-23 | Mobile batch 2 (Q-M2.1) | **Parker le switch ligue entièrement** (v1 = dernière ligue consultée seule) | Plusieurs ligues = cas fréquent pour habitués, frustrant de ne pas pouvoir switcher | — |
| 2026-04-23 | Mobile batch 3 (Q-M3.1) | **Retirer complètement la section Trophées** v1 | Trou visuel dans la hiérarchie du profil, section réintroduite à OQ #11 quoi qu'il arrive | — |
| 2026-04-23 | Mobile batch 3 (Q-M3.1) | **Placeholder teaser fun** ("Viens checker la v2 pour les trophées 🏆") | Engage sur un délai qu'on ne veut pas tenir ; placeholder neutre plus sûr | — |
| 2026-04-23 | Mobile batch 3 (Q-M3.2) | **4 pills `Tout/Victoires/Défaites/Ligue`** dès v1 | Peu de users multi-ligues aujourd'hui ; friction UI inutile | Si analytics montrent >30% users avec ≥2 ligues actives |
| 2026-04-23 | Mobile batch 3 (Q-M3.3) | **2 composants distincts** `MatchRow` (neutre) + `HistoryRow` (border-left colorée + delta perso) | Duplication API et maintenance x2 pour une différence tenant à 3 props ; variants plus DRY | Si les 2 usages divergent au-delà des props actuels |
| 2026-04-23 | OQ #9 (Lecture) | **Lecture 2 : Event parent container + Tournament comme enfant** (hiérarchie réelle) | Pas de besoin produit pour grouper plusieurs tournois/sessions en un Event parent ; reste à plat | Si un besoin "saison + rounds multiples sous un même événement officiel" remonte |
| 2026-04-23 | OQ #9 (stratégie mobile) | **Garder `TournamentDetailScreen.tsx` / `CreateTournamentScreen.tsx`** (pas anticiper le rename filesystem) | Reconstruction mobile from scratch (placeholders 40-60 lignes) — coût de rename = 0, anticiper évite un chantier séparé | — (tranché anticipatif) |

### 9.2 Features du design pas retenues pour la refonte

Choses vues dans les mockups Ponglo (`/tmp/bpl-redesign/`) qu'on a consciemment **décidé de ne pas implémenter maintenant**. Pas des OQs ouvertes : on a décidé, on n'y touche pas.

| Date | Source | Feature | Raison | Potentiel reprise |
|---|---|---|---|---|
| 2026-04-23 | `mobile-screens-2.jsx > ScreenTournament` | **Bracket d'élimination** (visuel arbre rounds) | BPL = classement ponctuel, pas bracket (décision Q3.8) | Si OQ #9 aboutit avec mode `bracket` en option |
| 2026-04-23 | `web-display.jsx > DisplayView` | Section **"Match en cours" live** (scores 140px + CupVisualizer + ELO prediction) | Nécessite live tracking (OQ #12 parkée) | Quand OQ #12 adressée |
| 2026-04-23 | `web-display.jsx > DisplayViewDrama` bottom strip | **"Ballon 14 · Match point à 10"** + **"+14 ELO en jeu"** | Mêmes champs DB manquants que OQ #12 | Idem OQ #12 |
| 2026-04-23 | `mobile-screens-2.jsx > ScreenLeaderboard` | **Pills `Saison / Ligue / Global`** | Nécessite endpoint cross-ligue + notion de saison (OQ #10 parkée) | Cadrage produit séparé |
| 2026-04-23 | `mobile-screens-2.jsx > ScreenProfile` | **Trophées récents** scroll horizontal (BLITZ, REMONTADA, UNDERDOG, PERFECT...) | Feature complète DB + logique (OQ #11 parkée) | Chantier feature dédié post-refonte |
| 2026-04-23 | `design-canvas.jsx > CreateTournament` | **Date début / Public / Inscription libre** (champs optionnels) | Pas de cadrage produit (OQ #6 partiel) | Si besoin concret utilisateur remonte |
| 2026-04-23 | `design-canvas.jsx > CreateTournament` | **Toggle "Compter pour l'ELO"** | Décision : ELO toujours compté, pas de ranked/non-ranked split | Jamais — décision figée |
| 2026-04-23 | `design-canvas.jsx > CreateLeague` | **Slider ELO de départ** configurable | 1200 standard suffit (OQ #8 fermée) | Jamais — décision figée |

### 9.3 Patterns UX vus dans le design mais écartés au profit de l'existant

Choix de garder un pattern actuel plutôt que d'adopter celui du design, sans que ça soit un enjeu produit majeur.

| Date | Écran | Pattern design | Pattern gardé | Raison |
|---|---|---|---|---|
| 2026-04-23 | DisplayView (5.3) | **Match en cours hero + ELO prediction** | **Leaderboard + Match Feed + QR** (structure actuelle) | Ligue continue ≠ tournoi bracket, pattern actuel plus adapté |
| 2026-04-23 | DisplayView | **Bottom strip fixe code + heure** (compact) | **QR card droite** | Plus lisible de loin en projection |
| 2026-04-23 | Home (Groupe 3, **superseded 2026-04-23 par brand Everything ELO**) | **ELO hero `bg-forest` (bleu)** | **ELO hero `bg-gradient-cta` (terracotta)** | Terracotta = accent primaire DS, lime = signal positif (éviter confusion) |
| 2026-04-23 | Home (rétabli par brand Everything ELO) | ELO hero **terracotta** (ancienne décision) | **ELO hero `bg-electric-blue`** (pilier ÉNERGIE) | Brand kit Everything ELO aligne l'ELO hero sur le pilier ÉNERGIE (electric-blue). Delta positif reste `lime` (pilier PROGRESSION), pas de confusion car couleur ≠ fond. |

### 9.4 À essayer plus tard (hors roadmap immédiate)

Idées notées pour ne pas les perdre, sans engagement.

| Date | Idée | Contexte | État |
|---|---|---|---|
| 2026-04-23 | **Renommer `Tournoi` → `Événement`** + sous-mode `bracket \| classement` | OQ #9 — concept produit plus juste | 📌 Post-refonte, chantier dédié |
| 2026-04-23 | **Achievements / trophées** (BLITZ, REMONTADA, PERFECT…) | OQ #11 — gamification | 📌 Post-refonte, chantier feature |
| 2026-04-23 | **Live match tracking** (isLive, ballon, matchPoint, ELO prediction) | OQ #12 — realtime scoring | 📌 Post-refonte, chantier feature |
| 2026-04-23 | **Leaderboard cross-ligue / global** (pills Saison/Ligue/Global) | OQ #10 — vue agrégée multi-ligues | 📌 Cadrage produit séparé |
| 2026-04-23 | **Mode clair** (palette `Cups` du zip : cream + terracotta + forest) | Alternative au dark Arcade | 💤 Pas de demande, non priorisé |
| 2026-04-23 | **TabBar item central `+`** (quick-create match/tournoi/ligue) | OQ #2 — à trancher Groupe 3 ou post-spec | ⏸ En attente décision |
| 2026-04-23 | **Migration recharts → Visx ou SVG custom généralisé** | Si `EloChart` SVG custom marche bien, étendre | 💡 Observation post-implémentation |
| 2026-04-23 | **Extraction `packages/ui-elo-family`** (DS partagé Beer Pong/Padel/Tennis/Basket ELO) | R5 = B : pas de 2e vertical vivant. Prématuré. | 🔜 Quand un 2e vertical démarre son implémentation, ouvrir chantier `refactor:extract-ui-elo-family`. Facteur de décision : tokens / primitives dupliqués entre Beer Pong ELO et vertical N°2. |
| 2026-04-23 | **Adoption Satoshi** (Fontshare, identité premium) | R4 = C : Sora + Teko retenus. Satoshi candidat "refine later". | 🔜 Quand un designer identifie un manque expressif dans Sora ET licence Fontshare validée par PO. |
| 2026-04-23 | **App icon dark animé** (mobile) | Brand kit mentionne app icon, pas de brief animation | 💡 Après refonte mergée, pitch au PO si opportunité |
| 2026-04-23 | **Page "À propos" Everything ELO** (marketing parent brand) | Brand kit structure la famille ; premier vertical vivant, pas de besoin page parent tant qu'on est seul | 🔜 Quand un 2e vertical démarre |

### 9.5 Règles de discipline DS

Règles projet liées au DS, établies au fil de la refonte. Destinées à être reportées dans `CLAUDE.md` (section "Invariants critiques") à la fin de la refonte.

- **R1 — Showcase à jour** _(Groupe 7, 2026-04-23)_ : **tout nouveau primitive ou composant DS ajouté doit avoir une entrée dans `DesignSystemShowcase.tsx` dans la même PR**. Sinon PR non mergeable. Objectif : éviter que la showcase devienne obsolète/trompeuse. L'agent `bpl-reviewer` doit vérifier ce point avant merge.
- **R2 — Tokens Arcade obligatoires** _(rappel de CLAUDE.md, déjà en place)_ : aucune couleur hardcodée dans les composants. Palette = `tailwind.config.js`. Toute violation détectée est bloquante.
- **R3 — Typo system** _(décision 2.2)_ : toute nouvelle surface texte utilise `font-sans` (Space Grotesk) par défaut, `font-archivo` pour display uppercase, `font-mono` pour chiffres/codes/metadata. Pas de fallback inline.
- **R4 — Composants de la refonte = composants DS** _(à formaliser)_ : tout composant ayant une vocation réutilisable (≥ 2 usages prévus) doit vivre sous `apps/web/src/components/design-system/` ou `apps/web/src/components/ponglo/` et être typé. Pas de composant orphelin versé dans `pages/`.
- **R5 — Brand kit = source de vérité identité** _(2026-04-23)_ : [`brand-kit-everything-elo.md`](./brand-kit-everything-elo.md) **fait foi** pour palette, typo, logo, piliers. Si `tailwind.config.js` diverge, c'est le code qui est faux. Toute modif palette/typo passe d'abord par le brand kit, puis par `tailwind.config.js`. L'agent `bpl-reviewer` vérifie la cohérence.
- **R6 — Piliers = grille de décision couleur** _(2026-04-23, R7)_ : quand on hésite sur un token couleur à appliquer à un élément UI, on identifie d'abord son intention (ÉNERGIE/PROGRESSION/CONNEXION/COMPÉTITION) et on applique le token du pilier (cf. §2.6.2). Pas de composant `<Pillar>`, pas de route dédiée.

### 9.6 Comment faire évoluer cette section

- Chaque fois qu'on **écarte une piste** ou qu'on **park une feature** pendant la rédaction de la spec (passe 2 web, passe 3 mobile) : ligne ici.
- Chaque fois qu'on **résout une OQ dans un sens qui élimine une alternative** : ligne ici.
- À la fin de la refonte : relire cette section pour transformer les "À essayer plus tard" (9.4) en tickets concrets si encore pertinents.
- Ne **pas** mettre ici :
  - Des bugs à corriger (→ issues GitHub).
  - Des décisions techniques d'implémentation (→ PR descriptions).
  - Des OQs qui ont encore besoin d'être tranchées (→ section 8).
