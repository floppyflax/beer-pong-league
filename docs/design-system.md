# Design System — Lexique & cartographie des incohérences

> **Status** : actif · créé 2026-05-22 · source = audit composants UI/UX
> **Scope** : ce document fige le **vocabulaire** des composants (qu'est-ce qu'un badge, un chip, une vignette…) et **cartographie les incohérences** d'affichage à travers l'app. Il ne couvre **pas** la palette/marque (→ [brand-kit](./brand-kit-everything-elo.md)) ni l'inventaire brut des composants (→ [architecture.md §Composants](./architecture.md)).
> **Usage** : référence pour toute discussion « comment doit-on afficher X ? ». Tant que les arbitrages ne sont pas tranchés, ce doc décrit l'**état observé**, pas la cible.

---

## 0. Verdict en une page

Les **fondations sont saines** : tokens Tailwind propres ([brand-kit §2](./brand-kit-everything-elo.md)), squelettes partagés bien faits (`CardShell`, `DetailHero`), palette respectée à ~98 % hors `ponglo/`.

Le désordre vient de **deux causes** :

1. **Double stack historique** : `design-system/` (moderne, tokens) **et** `ponglo/` (arcade, hex hardcodés) cohabitent. `ponglo/` est **legacy à retirer** (acté dans [brand-kit §1](./brand-kit-everything-elo.md), frontière à durcir cf. [architecture.md:192](./architecture.md)). Une partie des incohérences ci-dessous **se résorbe mécaniquement** par la sortie de `ponglo/`.
2. **Conventions transverses absentes** : pas d'icône canonique par entité, pas de composant « référence à une entité », plusieurs façons d'indiquer un gagnant. Ces trous **ne se résolvent pas** tout seuls — ils demandent une décision.

> ⚠️ **Pas de couleurs anarchiques.** Le problème n'est quasi jamais « mauvaise couleur » mais « même rôle, composant différent ». L'audit a trouvé seulement 10 classes hors palette, toutes dans `DevPanel` (outil dev).

---

## 1. Lexique — vocabulaire des composants

Ces termes n'ont aujourd'hui **pas de définition unique** dans le code. Définitions proposées pour aligner le discours :

| Terme | Définition | Quand l'utiliser | Composant de référence |
|---|---|---|---|
| **Badge** | Pastille **non cliquable** de statut/catégorie. Texte court uppercase, fond teinté `bg-x/20 text-x`, `rounded-full`. | Étiqueter un état (« Premium », « Validé »). | [`Badge`](../apps/web/src/components/design-system/Badge.tsx) |
| **Pill de statut** | Badge **+ dot coloré** (souvent animé). | Cycle de vie d'un match/event (live / à venir / terminé). | [`LiveMatchBadge`](../apps/web/src/components/live/LiveMatchBadge.tsx) |
| **RankBadge** | Médaille **numérique** de rang (1/2/3 → or/argent/bronze, ≥4 → neutre). | Position au classement. | [`atoms/RankBadge`](../apps/web/src/components/design-system/atoms/RankBadge.tsx) |
| **Tier badge** | Badge de **palier ELO** nommé (`★ PINTE`, `★ LÉGENDE`). | Niveau ELO d'un joueur. | [`PRankBadge`](../apps/web/src/components/ponglo/PRankBadge.tsx) (ponglo) |
| **Chip** | Élément **cliquable** : `[icône] label`, navigue vers une entité. | Référencer un event/league/joueur depuis ailleurs. | ❌ **n'existe pas** — réinventé inline |
| **Avatar** | Photo ou initiales, rond. | Identifier un joueur. | [`Avatar`](../apps/web/src/components/design-system/Avatar.tsx) |
| **Card** | Surface conteneur : `bg-navy-soft`, `border-card`, `rounded-card`, padding interne. | Bloc autonome dans une liste/grille. | [`CardShell`](../apps/web/src/components/design-system/molecules/CardShell.tsx) |
| **Row** | Ligne **dense** d'une liste (hauteur réduite, pas de padding card). | Classement, historique. | [`ListRow`](../apps/web/src/components/design-system/ListRow.tsx) |
| **Hero** | Bandeau d'en-tête d'une page détail (identité + stats + actions). | Haut de page event/league/profil. | [`DetailHero`](../apps/web/src/components/design-system/DetailHero.tsx) |
| **Vignette** | *(terme sans référent aujourd'hui)* — réservé pour une éventuelle miniature visuelle. | — | ❌ inexistant |

**Le trou structurant** : pas de composant **Chip / EntityRef** (`[icône] Nom` cliquable). C'est lui qui manque pour que « un event référencé soit toujours affiché pareil ».

---

## 2. Cartographie des incohérences

### 🔴 C1 — Deux langages de boutons

| | [`Button`](../apps/web/src/components/design-system/Button.tsx) (DS) | [`PButton`](../apps/web/src/components/ponglo/PButton.tsx) (ponglo) |
|---|---|---|
| Forme | rectangle `rounded-button` (6px) | capsule `rounded-full` |
| Couleur primaire | gradient **electric-blue** | **ping-yellow** plat |
| Relief | ombre douce | ombre 3px « carton arcade » (press −2px) |
| Typo | Sora | `font-archivo` uppercase |
| Variants | `primary/secondary/ghost/danger/premium` | `primary/accent/tertiary/lime/dark/ghost` |

→ Deux **identités opposées**. Selon la page, le CTA principal est bleu rectangulaire ou jaune capsule. **Arbitrage requis** (lié à la sortie de ponglo).

### 🔴 C2 — Quatre façons d'afficher un MATCH

| Composant | Layout | Gagnant signalé par | Score | Avatars | Ordre équipes |
|---|---|---|---|---|---|
| [`MatchHistoryCard`](../apps/web/src/components/design-system/MatchHistoryCard.tsx) | empilé 2 lignes | border-left lime/red + **swap perso** | gros (Teko) | ✅ stackés | mon équipe à gauche |
| [`MatchRow`](../apps/web/src/components/ponglo/MatchRow.tsx) | 1 ligne | border-left + label « Victoire/Défaite » | inline mono | ❌ | A/B préservé |
| [`MatchTeamsRow`](../apps/web/src/components/match/MatchTeamsRow.tsx) | colonnes VS | **emoji 🏆** + couleur ELO | ❌ absent | ❌ | A/B préservé |
| [`MiniMatchCard`](../apps/web/src/components/leagues/activity/MiniMatchCard.tsx) | 1 ligne | **🏆 bronze** + gagnant à gauche | mono | ❌ | gagnant à gauche |

→ 4 conventions « qui a gagné », dont **2 emojis 🏆 stylés différemment**. Le score est tantôt énorme, tantôt mono, tantôt absent.

### 🔴 C3 — Trois lignes de CLASSEMENT pour le même usage

| | [`PlayerCard` variant `leaderRow`](../apps/web/src/components/design-system/PlayerCard.tsx) | [`ListRow`](../apps/web/src/components/design-system/ListRow.tsx) | [`LeaderRow`](../apps/web/src/components/ponglo/LeaderRow.tsx) |
|---|---|---|---|
| Rang | médaillon overlay sur avatar | pastille séparée | **emoji 🥇🥈🥉** + ring avatar |
| Tendance récente | `ResultDots` (5 points) | `ResultDots` | `Sparkline` |
| Avatar | interne (navy-deep, mono) | interne (navy-deep, mono) | `PAvatar` (ring) |
| Typo nom | `font-archivo` uppercase | `font-archivo` uppercase | `font-bold` normal |

→ 🐛 **Bug visuel** : [`ListRow`](../apps/web/src/components/design-system/ListRow.tsx) colore le **rang 3 en rouge** (`signal-red-deep`) au lieu de **bronze** — diverge de `RankBadge` et `PlayerCard`.

### 🔴 C4 — Quatre+ implémentations d'AVATAR

| Implémentation | Fond | Police | Spécificité |
|---|---|---|---|
| [`Avatar`](../apps/web/src/components/design-system/Avatar.tsx) (DS, canonique) | `navy-soft` | `font-bold` | tailles tokens `xs→xl` |
| [`PAvatar`](../apps/web/src/components/ponglo/PAvatar.tsx) | `#1A2540` **inline** | bold | `ring` couleur, taille px |
| `PlayerCard.Avatar` (interne) | `navy-deep` | `font-mono` | médaillon rang + rankDelta |
| `ListRow` (inline) | `navy-deep` | `font-mono` | — |
| [`PlayerChip`](../apps/web/src/components/design-system/atoms/PlayerChip.tsx) | teinté side A/B | — | ring electric/red selon équipe |

→ 5 rendus du même objet « joueur ». Fonds, polices et tailles tous différents.

### 🟠 C5 — Pas d'icône canonique par entité

| Entité | Icônes observées | Où |
|---|---|---|
| **Event** | `FolderOpen` · `Calendar` · `BeerPongMatchIcon` | timeline / display+create+record / FAB |
| **League** | `Trophy` (majoritaire) · `Swords` | partout / sidebar |
| **Match** | `BeerPongMatchIcon` · 🏆 · `Swords` | variable |

→ Impossible de reconnaître une entité à son icône. **Décision requise** : 1 icône = 1 entité.

### 🟠 C6 — La « référence à une entité » n'est pas standardisée

C'est l'exemple d'origine de l'audit (« un match qui référence un event »). Aujourd'hui :

- Event référencé depuis un match → chip `FolderOpen + nom`, `bg-navy-deep`, hover electric-blue ([`TimelineMatchCard:51`](../apps/web/src/components/leagues/activity/TimelineMatchCard.tsx)).
- League référencée depuis un event → pill `Link + nom`, `bg-electric-blue/10`, electric-blue ([`EventCard:82`](../apps/web/src/components/design-system/molecules/EventCard.tsx)).

→ Deux entités référencées = deux styles de chip ad-hoc. Manque le composant **Chip/EntityRef** du §1.

### 🟠 C7 — `font-archivo` : 2e police « fantôme »

- Token marqué `@deprecated` dans [tailwind.config.js:42](../apps/web/tailwind.config.js), mais **utilisé dans 63 fichiers**.
- Archivo **est réellement chargée** ([index.html:17](../apps/web/index.html)) → l'app fait tourner **Sora ET Archivo** en parallèle pour des rôles proches (titres Archivo / body Sora), alors que la spec dit « Sora partout » ([architecture.md:190](./architecture.md)).

### 🟡 C8 — Pills/badges de statut dupliqués inline

Les 3 badges anti-cheat (`pending` / `rejected` / `validé`) sont **réécrits quasi à l'identique** dans [`MatchHistoryCard`](../apps/web/src/components/design-system/MatchHistoryCard.tsx) **et** [`MatchRow`](../apps/web/src/components/ponglo/MatchRow.tsx) (seules les tailles changent). Le « status dot + label » est aussi réimplémenté inline dans [`CardShell:54`](../apps/web/src/components/design-system/molecules/CardShell.tsx) au lieu de réutiliser `LiveMatchBadge`.

### 🟡 C9 — Hygiène tokens (faible impact)

- **78 hex hardcodés** dans 21 fichiers, concentrés dans `ponglo/` (`PAvatar #1A2540`, `PRankBadge` RANKS, `LeaderRow` rings…). Souvent des **doublons de tokens existants**.
- **10 classes hors palette** (purple/green/blue Tailwind) — toutes dans [`DevPanel`](../apps/web/src/components/DevPanel.tsx) (dev-only).
- Signe « moins » incohérent : `−` (U+2212) dans `MatchTeamsRow` vs `-` ailleurs.

### ✅ Bons modèles à répliquer

- [`DetailHero`](../apps/web/src/components/design-system/DetailHero.tsx) : **un seul composant** paramétré par `tone` (event = `electric-blue`, league = `electric-blue-deepest` institutionnel). Le bon pattern « même composant, variante par entité ».
- [`CardShell`](../apps/web/src/components/design-system/molecules/CardShell.tsx) : squelette partagé event/league.
- Re-exports `events/`, `leagues/`, `achievements/` → DS : stables, pas de vrais doublons.

---

## 3. Récap par sévérité & nature

| # | Incohérence | Sévérité | Nature |
|---|---|---|---|
| C1 | Deux langages de boutons | 🔴 | Arbitrage (sortie ponglo) |
| C2 | 4 affichages de match | 🔴 | Arbitrage + refactor |
| C3 | 3 lignes de classement (+ bug rang 3) | 🔴 | Refactor + quick win (bug) |
| C4 | 4+ avatars | 🔴 | Refactor (sortie ponglo) |
| C5 | Pas d'icône par entité | 🟠 | Décision de convention |
| C6 | Référence d'entité non standardisée | 🟠 | Nouveau composant `Chip` |
| C7 | `font-archivo` police fantôme | 🟠 | Décision typo + migration |
| C8 | Pills de statut dupliquées | 🟡 | Refactor (extraction) |
| C9 | Hex hardcodés / signe ELO | 🟡 | Hygiène (sortie ponglo) |

**Lecture** :
- *Sortie ponglo* (C1, C4, C9 partiels) → résolus mécaniquement quand `ponglo/` est retiré.
- *Décision de convention* (C5, C6, C7) → ne se résolvent pas seuls, à trancher.
- *Quick win* → bug rang 3 de C3, normalisation du signe ELO de C9.

---

## 4. Liens

- [brand-kit-everything-elo.md](./brand-kit-everything-elo.md) — palette, typo, identité de marque.
- [architecture.md §Composants](./architecture.md) — inventaire brut des composants DS & ponglo.
- [roadmap.md](./roadmap.md) — « frontière ponglo à durcir ».
- Showcase vivant : route `/design-system` ([`DesignSystemShowcase.tsx`](../apps/web/src/pages/DesignSystemShowcase.tsx)).
