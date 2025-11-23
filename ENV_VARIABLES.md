# Variables d'environnement

## Valeurs pour votre projet Supabase

### Pour le développement local (.env.local)

Créez un fichier `.env.local` à la racine du projet avec ces valeurs :

```env
VITE_SUPABASE_URL=https://zsazjkhhqtmyvjsumgcq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzYXpqa2hocXRteXZqc3VtZ2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2ODYzOTUsImV4cCI6MjA3OTI2MjM5NX0.RiUs9I4al4k0wfI8Ql_k2ak5TSg-ca3ZNbh7ouXr2uE
```

### Pour Vercel (Production)

Ajoutez ces mêmes variables dans les **Settings > Environment Variables** de votre projet Vercel :

1. Allez sur votre projet Vercel
2. Settings > Environment Variables
3. Ajoutez :

**Variable 1:**

- Name: `VITE_SUPABASE_URL`
- Value: `https://zsazjkhhqtmyvjsumgcq.supabase.co`
- Environment: All (Production, Preview, Development)

**Variable 2:**

- Name: `VITE_SUPABASE_ANON_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzYXpqa2hocXRteXZqc3VtZ2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2ODYzOTUsImV4cCI6MjA3OTI2MjM5NX0.RiUs9I4al4k0wfI8Ql_k2ak5TSg-ca3ZNbh7ouXr2uE`
- Environment: All (Production, Preview, Development)

## Commandes pour créer .env.local

```bash
# Créer le fichier .env.local
cat > .env.local << 'EOF'
VITE_SUPABASE_URL=https://zsazjkhhqtmyvjsumgcq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzYXpqa2hocXRteXZqc3VtZ2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2ODYzOTUsImV4cCI6MjA3OTI2MjM5NX0.RiUs9I4al4k0wfI8Ql_k2ak5TSg-ca3ZNbh7ouXr2uE
EOF
```

## Vérification

Après avoir créé le fichier, redémarrez le serveur de développement :

```bash
npm run dev
```

L'application devrait maintenant se connecter à Supabase sans warning dans la console.
