# Setup Supabase - Beer Pong League

## ✅ Configuration terminée

### Migrations appliquées

1. **001_initial_schema** - Toutes les tables créées :
   - `users` - Utilisateurs globaux (Supabase Auth)
   - `anonymous_users` - Identités locales
   - `leagues` - Ligues
   - `league_players` - Association League ↔ Joueurs
   - `tournaments` - Tournois
   - `tournament_players` - Association Tournament ↔ Joueurs
   - `matches` - Matchs
   - `elo_history` - Historique ELO
   - `user_identity_merges` - Audit des fusions d'identité

2. **002_rls_policies** - Row Level Security activé sur toutes les tables

### Informations de connexion

- **URL du projet** : `https://zsazjkhhqtmyvjsumgcq.supabase.co`
- **Anon Key** : Voir `.env.local` (créer ce fichier)

### Variables d'environnement

Créer un fichier `.env.local` à la racine du projet :

```env
VITE_SUPABASE_URL=https://zsazjkhhqtmyvjsumgcq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzYXpqa2hocXRteXZqc3VtZ2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2ODYzOTUsImV4cCI6MjA3OTI2MjM5NX0.RiUs9I4al4k0wfI8Ql_k2ak5TSg-ca3ZNbh7ouXr2uE
```

### Fichiers créés

- ✅ `src/lib/supabase.ts` - Client Supabase configuré
- ✅ `src/types/supabase.ts` - Types TypeScript générés
- ✅ `package.json` - Dépendance `@supabase/supabase-js` ajoutée

### Prochaines étapes

1. Installer les dépendances :
   ```bash
   npm install
   ```

2. Configurer Supabase Auth :
   - Aller dans Supabase Dashboard → Authentication → Providers
   - Activer "Email" provider
   - Configurer les redirect URLs

3. Commencer l'implémentation (voir `IMPLEMENTATION_PLAN_IDENTITY.md`)

### Vérification

Pour vérifier que tout fonctionne :

```typescript
import { supabase } from './lib/supabase';

// Test de connexion
const { data, error } = await supabase.from('leagues').select('*').limit(1);
console.log('Supabase connected:', !error);
```



