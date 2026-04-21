# 14-36 — Refonte Design System : structure atomique, responsive, cohérence gradients

**Auteur :** floppyflax (PM + UX Designer)  
**Date :** 2026-02-16  
**Status :** En cours  
**Référence :** design-system-convergence.md, DesignSystemShowcase

---

## 1. Contexte

Refonte du design system pour :
1. **Structure atomique** : atomes, molécules, organismes, templates
2. **Visibilité responsive** : preview mobile/desktop dans le showcase
3. **Cohérence gradients** : CTA → jaune-orange, navigation/tabs → bleu-violet

---

## 2. Règles gradients (décision produit)

| Usage | Token | Gradient | Exemples |
|-------|-------|----------|----------|
| **CTA (boutons d'action)** | `gradient-cta` | Jaune-orange (amber-500 → yellow-500) | Rejoindre, Créer tournoi, Enregistrer, Submit |
| **FAB** | `gradient-fab` | Jaune-orange (aligné CTA) | Créer tournoi, Nouveau match |
| **Tabs / Navigation** | `gradient-tab-active` | Bleu-violet (blue-500 → violet-600) | BottomTabMenu actif, SegmentedTabs actif |

**Règle :** Tout bouton d'action principal = `bg-gradient-cta`. Tout état actif de navigation = `bg-gradient-tab-active`.

**Token déprécié :** `gradient-cta-alt` (bleu-violet) — ne plus utiliser pour les CTA. Remplacer par `gradient-cta`.

---

## 3. Structure atomique (proposition)

### 3.1 Atomes
- Couleurs (background, text, accents)
- Typographie (page-title, body, label, stat)
- Espacements (page, card-gap, bottom-nav)
- Radius (card, button, input)
- Bordures (card, card-muted)
- Gradients (cta, tab-active, card)

### 3.2 Molécules
- Bouton (primary CTA, secondary, ghost)
- Input, SearchBar
- Badge (status, delta)
- Icon + label

### 3.3 Organismes
- StatCard, InfoCard, HelpCard
- ListRow (player, tournament, league)
- SegmentedTabs
- Banner
- FAB
- PlayerCard

### 3.4 Templates
- Page liste (header + tabs + grille + FAB)
- Page dashboard (InfoCard + StatCards + tabs + liste)
- Page formulaire (champs + CTA sticky)

---

## 4. Design System Showcase — améliorations

### 4.1 Preview responsive
- Toggle mobile (375px) / tablet (768px) / desktop (1024px)
- Iframe ou conteneur avec `max-width` variable
- Composants affichés dans leur contexte viewport

### 4.2 Versions composants
- Chaque composant : variantes documentées (primary, secondary, etc.)
- États : default, hover, active, disabled
- Exemples de code (snippet)

### 4.3 Section gradients
- Clarifier usage : CTA vs Navigation
- Exemples concrets (bouton CTA vs tab actif)

---

## 5. Changements techniques (implémentation)

### 5.1 Tokens à modifier

**tailwind.config.js & design-tokens.css :**
- `gradient-fab` : `linear-gradient(to right, #f59e0b, #eab308)` (jaune-orange, aligné gradient-cta)
- `gradient-cta-alt` : déprécié — garder pour compatibilité temporaire mais documenter comme "navigation only" ou supprimer

### 5.2 Fichiers à mettre à jour (gradient CTA)

| Fichier | Changement |
|---------|------------|
| `LandingPage.tsx` | Participer CTA : `bg-gradient-cta-alt` → `bg-gradient-cta` |
| `Join.tsx` | Bouton principal : `from-blue-500 to-violet-600` → `bg-gradient-cta` |
| `CreateTournament.tsx` | CTA submit : `from-blue-500 to-violet-600` → `bg-gradient-cta` |
| `CreateLeague.tsx` | CTA submit : `from-blue-500 to-violet-600` → `bg-gradient-cta` |
| `TournamentJoin.tsx` | Boutons CTA : `from-blue-500 to-violet-600` → `bg-gradient-cta` |
| `BottomMenuSpecific.tsx` | variant="gradient" : utiliser `bg-gradient-cta` au lieu de blue-violet |
| `FAB.tsx` | primary : `bg-gradient-fab` (sera mis à jour via token) |

### 5.3 Fichiers à ne PAS modifier (navigation = bleu-violet)

- `BottomTabMenu.tsx` : `bg-gradient-tab-active` ✓
- `SegmentedTabs.tsx` : `bg-gradient-tab-active` ✓
- `UserProfile.tsx` : avatar `bg-gradient-tab-active` (décoratif, peut rester)

---

## 6. Tests à mettre à jour

- `LandingPage.test.tsx` : `bg-gradient-cta-alt` → `bg-gradient-cta`
- `tailwind-design-tokens.test.ts` : vérifier gradient-fab = gradient-cta

---

## 7. Checklist implémentation

- [ ] Mettre à jour `gradient-fab` dans tailwind.config.js et design-tokens.css
- [ ] Remplacer usages CTA blue-violet par gradient-cta
- [ ] Mettre à jour tests
- [ ] Documenter gradient-cta-alt comme déprécié (ou supprimer)
- [ ] (Phase 2) Structure atomique dans DesignSystemShowcase
- [ ] (Phase 2) Preview responsive dans DesignSystemShowcase
