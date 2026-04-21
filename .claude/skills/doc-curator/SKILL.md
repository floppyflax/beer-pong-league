---
name: doc-curator
description: Maintain consolidated project documentation. Use when adding/updating docs, after significant feature work, or when user asks to "update the docs" or "document X".
---

# Doc curator — Beer Pong League

## Structure canonique

Toute la doc projet vit dans **`docs/`**. La racine ne doit **pas** contenir de `.md` autres que `README.md`.

```
docs/
├── README.md              # index + TOC
├── getting-started.md     # install, env, run local
├── architecture.md        # stack, folders, ELO, identity/auth, offline-first
├── auth-identity.md       # anon + OTP + merge flow
├── payments.md            # Stripe + Premium gating
├── testing.md             # Vitest + Playwright
├── deployment.md          # Vercel + Supabase prod
├── roadmap.md             # features à venir
└── archive/               # anciens hotfix, solutions ponctuelles, PRD historiques
```

## Règles

1. **Une source de vérité par sujet.** Si l'auth est documentée, ne pas créer un 2e fichier d'auth — éditer l'existant.
2. **Les hotfix / solutions one-shot vont dans `docs/archive/`** — ils polluent sinon.
3. **`README.md` racine** : quick start + pointeur vers `docs/`. 50 lignes max.
4. **Pas de duplication du code** : la doc explique le *pourquoi* et les *conventions*, pas le *quoi* (le code s'auto-documente).
5. **Dates absolues** : jamais "la semaine dernière", toujours "2026-04-15".
6. **Links entre docs** : liens relatifs markdown `[texte](./autre-doc.md)`.

## Quand mettre à jour

- Feature livrée → update `architecture.md` si nouvelle lib/pattern, `roadmap.md` pour cocher.
- Fix d'un bug récurrent → une ligne dans la doc concernée, pas un nouveau fichier.
- Nouvelle convention de code → l'ajouter à la skill concernée **et** à `architecture.md`.

## Anti-patterns à éviter

- ❌ `SOLUTION_FINALE.md`, `HOTFIX_*.md` à la racine
- ❌ Même info dans 3 fichiers différents
- ❌ Doc qui décrit du code déprécié non marquée
- ❌ Fichiers > 500 lignes (splitter par sujet)

## Checklist après gros chantier

- [ ] `docs/roadmap.md` à jour
- [ ] `docs/architecture.md` reflète l'état réel
- [ ] Aucun `.md` orphelin créé à la racine
- [ ] Les skills (`.claude/skills/`) concernées sont à jour
