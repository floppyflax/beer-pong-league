---
name: ui-component
description: Create or modify UI components matching the Beer Pong League design system. Use when adding a new component, page, or when changing visual styles. Enforces palette, spacing, and component patterns.
---

# UI component — Beer Pong League

## Design system reference

Config Tailwind : `tailwind.config.js` (source de vérité — toujours préférer les tokens existants à des valeurs hardcodées).

### Palette

- Backgrounds : `#0f172a` (primary), `#1e293b` (secondary), `#334155` (tertiary)
- Text : `#ffffff` (primary), `#cbd5e1` (secondary), `#94a3b8` (tertiary), `#64748b` (muted)
- Accents : `amber-500 #f59e0b` (CTA, ELO), `green-500 #22c55e` (success), `red-500 #ef4444` (error), `blue-500 #3b82f6` (info)
- Gradients : `gradient-cta`, `gradient-fab`, `gradient-card`

### Typo

`page-title`, `page-title-lg`, `section-title`, `body`, `label`, `stat`. Famille : Inter.

### Spacing & radius

Utiliser `p-page`, `p-page-lg`, `gap-card-gap`, `rounded-card`, `rounded-button`, `rounded-input` (pas de `p-4` arbitraire).

## Composants réutilisables existants

Avant de créer un nouveau composant, vérifier `src/components/design-system/` :
- `Banner`, `HelpCard`, `PlayerCard`, `SearchBar`, `StatCard`, `InfoCard`, `FAB`, `ListRow`, `SegmentedTabs`.

## Pattern composant

```tsx
// src/components/design-system/MyComponent.tsx
import clsx from 'clsx';
import { Icon } from 'lucide-react';

export interface MyComponentProps {
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
  children: React.ReactNode;
}

const variantConfig: Record<string, { bgClass: string }> = {
  primary: { bgClass: 'bg-gradient-cta' },
  secondary: { bgClass: 'bg-secondary' },
};

export function MyComponent({ variant = 'primary', onClick, children }: MyComponentProps) {
  return (
    <button
      onClick={onClick}
      className={clsx('rounded-button p-page', variantConfig[variant].bgClass)}
      data-testid="my-component"
    >
      {children}
    </button>
  );
}
```

### Règles

- **Pas de `forwardRef`** sauf besoin explicite.
- **Pas de CSS modules** — Tailwind inline + `clsx`.
- **Discriminated union** pour variantes à props différentes (voir `PlayerCard`).
- **`data-testid`** systématique pour chaque élément testable.
- **`role` et `aria-*`** pour accessibilité (`role="alert"`, `aria-label`, `aria-hidden` sur icônes décoratives).
- **Icônes** : `lucide-react` uniquement.

## Test associé

Fichier test à côté ou dans `tests/unit/components/`. Minimum :

```tsx
import { render, screen, fireEvent } from '@testing-library/react';

it('renders', () => {
  render(<MyComponent>hello</MyComponent>);
  expect(screen.getByTestId('my-component')).toBeInTheDocument();
});
```

## Checklist avant livraison

- [ ] Props typées (pas de `any`)
- [ ] Au moins une variante testée
- [ ] `data-testid` présent
- [ ] ARIA correct (role, label)
- [ ] Dark mode : tous les composants sont déjà en dark (bg `#0f172a` par défaut)
- [ ] Responsive : mobile-first, breakpoints `md:` / `lg:` quand besoin
