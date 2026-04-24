# Brand Kit — Everything ELO

> **Status** : actif · créé 2026-04-23 · source = brand kit visuel fourni par le PO (image “Everything ELO”)
> **Scope** : référence unique pour l’identité de marque du portefeuille Everything ELO et du produit **Beer Pong ELO** (ex-Beer Pong League / Ponglo).
> **Usage** : tout changement d’UI, de wording, de token ou de composant doit respecter ce document. Les décisions produits liées à la refonte vivent dans `docs/redesign-spec.md` — ce fichier ne versionne que la **marque**.

---

## 1. Architecture de marque

```
                    Everything ELO          ← parent brand / maison mère
                   ┌──────┬──────┬──────┐
            Beer Pong  Padel  Tennis  Basket
               ELO     ELO    ELO     ELO     ← verticals / produits
```

- **Everything ELO** = parent brand, la “maison” de tous les classements ELO de sport casual / social.
- **Beer Pong ELO** = premier vertical, celui qui remplace l’app actuelle (ex-nom produit : *Beer Pong League* / code-name *Ponglo*).
- Les autres verticals (Padel, Tennis, Basket) sont roadmap long terme — non implémentés. On ne les référence que pour calibrer le système de marque (pas de code générique dédié avant d’en avoir un deuxième vivant).

**Règle de nommage produit** :
- **Beer Pong ELO** = nom affiché partout (UI, store, marketing, factures Stripe).
- **BPL** = acronyme toléré dans le code / commits / docs internes.
- **Ponglo** = legacy, à retirer progressivement (voir redesign-spec §9.1).

---

## 2. Palette — hex canoniques

### 2.1 Couleurs primaires

| Rôle | Nom token | Hex | Notes |
|---|---|---|---|
| Fond sombre (app background, hero card) | `navy` | `#0B1320` | Remplace l’ancien `cream #0B0D14` côté Arcade. |
| Accent principal (CTA, ELO hero, focus) | `electric-blue` | `#2F6BFF` | Remplace l’ancien `forest/cup-blue`. |
| Accent jaune (balle de ping, highlights) | `ping-yellow` | `#FFD400` | Remplace l’ancien `gold #FFB800`. |
| Alerte / score rouge | `signal-red` | `#FF3B3B` | Remplace l’ancien `cup-red/ruby #FF4438`. |
| Progression / delta positif / ELO up | `lime` | `#B7FF3B` | Très légèrement ajusté vs ancien `#B8FF3D` — on aligne sur brand kit. |
| Texte secondaire / bordures fines | `cool-gray` | `#A8B0C0` | Nouveau token — comble le gap entre `ink-soft` et `ink-mute`. |
| Texte sur fond sombre | `white` | `#FFFFFF` | Texte primary + logos sur fond navy. |

### 2.2 Déclinaisons tonales (à dériver)

Pour chaque couleur principale on prévoit (dans `tailwind.config.js`) deux déclinaisons :
- `<color>-deep` — ~15 % plus sombre, pour les états pressés / gradients CTA.
- `<color>-soft` — ~20 % plus clair ou alpha 0.2, pour les backgrounds atmosphériques.

| Token | Déclinaison | Hex suggéré |
|---|---|---|
| `navy-deep` | plus sombre | `#070C16` |
| `navy-soft` | paper card | `#141D2F` |
| `electric-blue-deep` | pressed/gradient end | `#1E4CD9` |
| `electric-blue-soft` | glow/chip bg | `rgba(47,107,255,0.15)` |
| `ping-yellow-deep` | pressed | `#D9B400` |
| `signal-red-deep` | pressed | `#D32828` |
| `lime-deep` | pressed | `#8BCC1F` |

### 2.3 Mapping des anciens tokens → nouveaux

| Ancien (Arcade) | Nouveau (Everything ELO) | Action |
|---|---|---|
| `cream #0B0D14` | `navy #0B1320` | rename + hex update |
| `cream-deep #050710` | `navy-deep #070C16` | rename + hex update |
| `paper #141826` | `navy-soft #141D2F` | rename + hex update (ou garder `paper` comme alias) |
| `ink #F4F2E8` | `white #FFFFFF` | rename — plus d’off-white |
| `ink-soft #B8B4A3` | `cool-gray #A8B0C0` | rename + hex update |
| `ink-mute #6B6A5E` | `cool-gray` alpha 0.5 | supprimer, dériver |
| `cup-red #FF4438` / `terracotta` / `ruby` | `signal-red #FF3B3B` | rename + hex update |
| `cup-blue #3B8EFF` / `forest` / `info` | `electric-blue #2F6BFF` | rename + hex update |
| `gold #FFB800` | `ping-yellow #FFD400` | rename + hex update |
| `lime #B8FF3D` | `lime #B7FF3B` | minor hex correction only |

Les alias legacy (`cream`, `paper`, `ink`, `forest`, `terracotta`, `gold`, `ruby`) restent dans la config Tailwind **pendant la migration** puis sont supprimés une fois la refonte mergée.

---

## 3. Typographie

### 3.1 Stack cible

| Usage | Famille cible | Fallback | Source |
|---|---|---|---|
| Display / numbers géants (ELO hero, scoreboard) | **Teko** | Space Grotesk, system-ui | Google Fonts |
| UI / body | **Sora** | Space Grotesk, system-ui | Google Fonts |
| Mono / chiffres tabulaires | **JetBrains Mono** | SF Mono, Menlo | Google Fonts (inchangé) |
| (plus tard, premium) | **Satoshi** | Sora, Space Grotesk | Fontshare — licence à vérifier avant intégration |

**Décision produit (R4 = C)** :
- Phase A = Sora + Teko via Google Fonts + fallback Space Grotesk (actuel). Pas de Satoshi au départ.
- Satoshi reste un candidat “refine later” — voir redesign-spec §9.4.

### 3.2 Règles d’usage

- **Teko** : UPPERCASE uniquement, pour les chiffres ELO hero, scores géants (DisplayView), et occasionnellement titres d’écran “hype” (ex : LEADERBOARD, FINALE).
- **Sora** : poids 400/500/600/700. Corps de texte, labels, titres d’écran standards.
- **JetBrains Mono** : uniquement pour les valeurs numériques qui veulent s’aligner en colonne (tables, ELO delta compact).
- Pas de mélange Teko + Sora dans un même bloc de texte — Teko est toujours un hero element isolé.

### 3.3 Chargement

- `@fontsource/sora` + `@fontsource/teko` dans `apps/web/package.json` (pas de CDN externe, pour contrôle offline et Vercel caching).
- Côté mobile (React Native), `expo-font` + fichiers `.ttf` embarqués.

---

## 4. Système de logos

### 4.1 Déclinaisons

| Version | Usage | Notes |
|---|---|---|
| **Wordmark parent “Everything ELO”** | splash marketing, footer, page à propos | texte blanc sur fond navy, ou noir sur fond blanc |
| **Icon parent (glyph E)** | favicon, app icons neutres | version carrée navy + glyph lime/yellow |
| **Lockup produit “Beer Pong ELO”** | header app web, loading screen mobile, stores | icon produit + wordmark vertical stack |
| **App icon dark (mobile)** | iOS/Android | fond navy + glyph Beer Pong ELO (balle jaune + cup) |

### 4.2 Règles

- **Aire de protection** = 1× la hauteur du glyph autour du lockup.
- **Pas de dégradé sur le logo** — uniquement les couleurs brand solides (navy, white, electric-blue, ping-yellow).
- **Taille min lisible** : 24 px pour l’icon seul, 96 px pour le lockup complet.
- **Ne jamais** étirer, re-colorer en dehors de la palette, ajouter d’ombre portée, ou appliquer d’outline.

Les assets sources (SVG) sont à importer dans `docs/brand/logos/` — à déposer par le designer dans un commit suivant.

---

## 5. Les 4 Piliers

Les piliers sont des **thèmes couleur sémantiques** — pas des composants, pas des pages. Ils donnent un code couleur consistant aux zones UI selon leur intention.

| Pilier | Couleur associée | Icône (emoji discutée) | Applications UI |
|---|---|---|---|
| **ÉNERGIE** | `electric-blue #2F6BFF` | ⚡ | CTA primaires, ELO hero card, scoreboard live, focus states, liens actifs |
| **PROGRESSION** | `lime #B7FF3B` | 📊 | Delta ELO positif, badges rank up, sparklines montantes, barres de progression, success toasts |
| **CONNEXION** | `signal-red #FF3B3B` | 👥 | Actions sociales (invite, partage, multi-joueur), badges communautaires, notifications d’interaction |
| **COMPÉTITION** | `navy #0B1320` (+ accent `ping-yellow`) | 🏆 | Tournois, brackets, podiums, trophées, moments “finale/drama” |

**Décision produit (R7 = B)** : les piliers sont **sémantiques**, pas structurels. Pas de route `/energie`, pas de composant `<Pillar>`. On les utilise comme guide pour choisir le token couleur d’un élément.

### 5.1 Exemples d’application

- Bouton *“Créer un match”* → pilier ÉNERGIE → fond `electric-blue`, hover `electric-blue-deep`.
- Badge *“+15 ELO”* → pilier PROGRESSION → texte `lime`, fond `lime-soft`.
- Écran *“Inviter des amis au tournoi”* → pilier CONNEXION → accent `signal-red`, icône 👥.
- Layout *“Finale du tournoi”* (DisplayViewDrama) → pilier COMPÉTITION → fond `navy`, highlights `ping-yellow`, glow diagonal `electric-blue`.

---

## 6. Direction UI

### 6.1 Cartes clés (référence brand kit)

- **ELO Hero card** (écran Home mobile, WebDashboard) : fond `electric-blue` + chiffre ELO géant en Teko blanc + sparkline lime + `PRankBadge` en bas.
- **Nouveau match card** : fond `navy-soft` + icon `⚡ electric-blue` + CTA ghost blanc.
- **En direct card** (live match banner) : fond `signal-red` avec pulsation subtile + label “● LIVE” + scores en Teko blanc.
- **Trophée / podium** : fond `navy` + médailles `ping-yellow` / `cool-gray` / `#CD7F32` (bronze) + glow contextuel du gagnant.

### 6.2 Navigation

- **TabBar mobile** : 4 items plats + bouton central `+` saillant (électrique).
  - Labels : `Accueil` · `MATCHS` · `Classement` · `Profil`
  - Central `+` = quick-create modal (nouveau match / nouveau tournoi / rejoindre par code).
- **Sidebar web (EventDashboard)** : fond `navy` + items `cool-gray` / actif `electric-blue` + bloc upsell PRO `ping-yellow`.

### 6.3 Gestes / micro-interactions

- Glow ambient sur ELO delta (lime = up, signal-red = down).
- Pulsation subtile sur les éléments “live” (match en cours, timer tournoi).
- Pas de parallax, pas de skeuomorphisme sur les cups (on reste graphique flat + neon glow).

---

## 7. Decision log (R1–R7)

Snapshot des décisions qui ont fait naître ce document :

| # | Question | Réponse | Impact |
|---|---|---|---|
| R1 | Rebrand vs refonte séparés ? | **A** — rebrand intégré dans la refonte en cours | Palette + typo + nom produit changent dans la même livraison que les nouveaux écrans. |
| R2 | Rename produit BPL → Beer Pong ELO ? | **Oui** | Chantier rename doux post-refonte (voir OQ #14 redesign-spec). |
| R3 | Update `tailwind.config.js` immédiatement ? | **Oui** | Phase A : swap tokens + garder aliases legacy le temps de la migration. |
| R4 | Typographie ? | **C** — Sora + Teko (Google Fonts) + fallback Space Grotesk, Satoshi plus tard | Chargement via `@fontsource/*`, licence Satoshi à vérifier. |
| R5 | Extraire `packages/ui-elo-family` pour les autres verticals ? | **B — non** | Monolithique sur Beer Pong ELO tant qu’il n’y a pas de 2e vertical vivant. |
| R6 | TabBar : renommer “Jouer” en “MATCHS” ? | **Oui** | Label plus clair, aligné sur le pilier ÉNERGIE. |
| R7 | Les piliers = composants structurels ou thèmes couleur ? | **B — thèmes couleur sémantiques** | Pas de route `/pilier/*`, pas de composant. Guide pour choisir les tokens. |

---

## 8. Relation avec les autres docs

| Doc | Lien |
|---|---|
| Refonte UI/UX par écran | [`redesign-spec.md`](./redesign-spec.md) |
| Tokens Tailwind (source technique) | [`../apps/web/tailwind.config.js`](../apps/web/tailwind.config.js) |
| Instructions agents (règle *tokens obligatoires*) | [`../CLAUDE.md`](../CLAUDE.md) |
| Roadmap (multi-vertical, long terme) | [`roadmap.md`](./roadmap.md) |

**Ordre de priorité si conflit** :
1. Ce fichier (`brand-kit-everything-elo.md`) fait foi sur **identité / marque**.
2. `redesign-spec.md` fait foi sur **décisions écran par écran**.
3. `tailwind.config.js` doit refléter ce qui est ici — s’il diverge, c’est le code qui est faux.

---

## 9. Historique du document

| Date | Auteur | Action |
|---|---|---|
| 2026-04-23 | Florian + Claude | Création initiale, extraction du brand kit “Everything ELO” + décisions R1–R7. |
