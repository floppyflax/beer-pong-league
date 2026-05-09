---
name: ui-component
description: Create or modify UI components matching the Beer Pong League design system (Everything ELO palette). Enforces palette, spacing, typography tokens, and the no-hardcoded-Tailwind-defaults guard test. Use when adding a new component, page, or when changing visual styles.
---

# UI component — Beer Pong League (Everything ELO)

## Design system source of truth

`apps/web/tailwind.config.js` defines every token. **Always prefer the
existing tokens over hardcoded values.** A guard test
(`tests/unit/config/no-hardcoded-tailwind-colors.test.ts`) walks `src/`
and **fails the suite** if any file outside the tiny allowlist
(`DevPanel.tsx`, `DesignSystemShowcase.tsx`) uses a default Tailwind
color (`bg-slate-700`, `text-red-400`, etc.).

### Palette — Everything ELO canonical tokens

```
Surfaces (dark canvas)
  navy        #0B1320   ← app background
  navy-deep   #070C16   ← deeper panels
  navy-soft   #141D2F   ← cards

Text
  white       (Tailwind default)   ← primary
  cool-gray   #A8B0C0               ← secondary / muted

Brand accents
  electric-blue       #2F6BFF   ← primary CTA, ELO hero, focus ring
  electric-blue-deep  #1E4CD9   ← pressed state
  signal-red          #FF3B3B   ← alert, live, delta-negative
  signal-red-deep     #D32828   ← pressed state
  ping-yellow         #FFD400   ← highlight, podium 1st, bracket
  ping-yellow-deep    #D9B400   ← pressed state
  lime                #B7FF3B   ← delta-positive, ELO hero, rank highlight
  lime-deep           #8BCC1F   ← pressed state
  bronze              #CD7F32   ← podium 3rd
```

Border / card tokens : `border-card`, `border-card-muted`, `rounded-card`,
`shadow-modal`, `shadow-fab`.

**Forbidden** (caught by the guard test) : default Tailwind palettes
`slate-*`, `gray-*`, `red-*`, `green-*`, `blue-*`, `amber-*`, `yellow-*`,
`orange-*`, `purple-*`, `pink-*`, `rose-*`, `fuchsia-*`, `violet-*`,
`indigo-*`, `cyan-*`, `teal-*`, `emerald-*`, `lime-*` (the default `lime-500`
— our token is plain `lime` without scale), `sky-*`, `stone-*`, `zinc-*`,
`neutral-*`. Use the Everything ELO tokens above.

### Typography

Families :
- `font-sans` → **Sora** (body, default).
- `font-display` → **Teko** (huge ELO numbers, scoreboard).
- `font-mono` → **JetBrains Mono** (codes, IDs).
- `font-archivo` → Archivo (legacy fallback — kept for the wordmark and
  some labels; new components should use `font-sans`).

Token sizes : `page-title`, `page-title-lg`, `section-title`, `body`,
`body-sm`, `label`, `stat`, `display-sm`, `display-md`, `display-lg`.

### Spacing & radius

Use `p-page`, `p-page-lg`, `gap-card-gap`, `rounded-card`,
`rounded-button`, `rounded-input` rather than `p-4` arbitraire. Tailwind
arbitrary values (`p-[12px]`) are tolerated for one-off design pixels but
shouldn't be the default.

## Existing reusable components

Two design-system folders coexist (a unification is pending — see audit
plan §3.1) :

- `apps/web/src/components/design-system/` — the bulk: `Avatar`, `Badge`,
  `Banner`, `Button`, `Card`, `ClaimGuestSheet`, `CodeInput`, `DetailHero`,
  `FAB`, `FormField`, `GhostManagementSheet`, `HelpCard`,
  `IdentityGateSheet`, `Input`, `InviteSheet`, `LastActivityCard`,
  `ListRow`, `MatchHistoryCard`, `PageHero`, `PlayerCard`, `PremiumGate`,
  `ScreenLayout`, `SearchBar`, `SegmentedTabs`, `Select`, `SettingsSheet`,
  `Sheet`, `StatCard`, `StickyCTA`, `ToggleRow`. Plus `atoms/`,
  `molecules/`, `page-specific/`, `showcase/`.
- `apps/web/src/components/ponglo/` — brand primitives :
  `BeerCupLoader`, `DayGroup`, `EloChart`, `EloDelta`, `LeaderRow`,
  `MatchRow`, `PAvatar`, `PButton`, `PRankBadge`, `Podium`, `Sparkline`,
  `Wordmark`. Use `PButton` for CTAs (NOT the design-system `Button` —
  one of the duplicates that 3.1 will resolve).

Showcase live à `/design-system` (`apps/web/src/pages/DesignSystemShowcase.tsx`).
Lance le dev server et ouvre la page pour visualiser tous les composants
dans tous leurs états avant de créer un nouveau.

## Pattern composant

```tsx
// apps/web/src/components/design-system/MyComponent.tsx
import { clsx } from 'clsx';
import type { ReactNode } from 'react';

export interface MyComponentProps {
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
  children: ReactNode;
}

const variantClasses: Record<NonNullable<MyComponentProps['variant']>, string> = {
  primary: 'bg-electric-blue text-white border-electric-blue-deep',
  secondary: 'bg-navy-soft text-white border-card',
};

export function MyComponent({ variant = 'primary', onClick, children }: MyComponentProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'rounded-card p-page font-sans font-bold border-[1.5px]',
        variantClasses[variant],
      )}
      data-testid="my-component"
    >
      {children}
    </button>
  );
}
```

### Règles

- **Pas de `forwardRef`** sauf besoin explicite (focus management, etc.).
- **Pas de CSS modules** — Tailwind inline + `clsx`.
- **Discriminated union** pour variantes à props différentes (voir
  `PlayerCard.tsx` pour l'exemple `compact` / `leaderRow` / `detailed`).
- **`data-testid`** systématique sur tout élément qu'un test devra
  cibler. Convention : `<kebab-case-component-name>` ou
  `<component>-<role>` (ex. `playercard-compact`, `listrow-chevron`).
- **`role` et `aria-*`** pour accessibilité — `role="alert"`,
  `aria-label`, `aria-hidden` sur icônes décoratives, `aria-current="page"`
  sur l'élément de nav actif.
- **Icônes** : `lucide-react` uniquement. `aria-hidden="true"` quand
  l'icône duplique un label texte adjacent.

## Test associé

Fichier test dans `tests/unit/components/` (pas à côté). Minimum :

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from '@/components/design-system/MyComponent';

describe('MyComponent', () => {
  it('renders with primary variant by default', () => {
    render(<MyComponent>hello</MyComponent>);
    const btn = screen.getByTestId('my-component');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveClass('bg-electric-blue');
  });
});
```

## Checklist avant livraison

- [ ] Props typées (pas de `any`).
- [ ] Au moins une variante testée + `data-testid` présent.
- [ ] ARIA correct (`role`, `aria-label`, `aria-hidden` sur icônes décoratives).
- [ ] **Dark canvas** : `bg-navy` ou `bg-navy-soft`, `text-white` /
  `text-cool-gray`. Tout le DS est dark — pas de fallback light.
- [ ] **Responsive** : mobile-first, breakpoints `md:` / `lg:` quand besoin.
- [ ] `npm run lint` clean — la guard tailwind ne flag pas une couleur hardcodée.
- [ ] `npx vitest run tests/unit/config/no-hardcoded-tailwind-colors.test.ts` passe.
- [ ] Si tu ajoutes un composant à la showcase `/design-system` : section
  dédiée avec tous les états importants.
