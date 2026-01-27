# Variables d'environnement

## Valeurs pour votre projet Supabase

### Pour le développement local (.env.local)

Créez un fichier `.env.local` à la racine du projet avec ces valeurs :

```env
VITE_SUPABASE_URL=https://zsazjkhhqtmyvjsumgcq.supabase.co
VITE_SUPABASE_PUBLIC_KEY=<your-publishable-key-sb_publishable_xxx>
```

> **Note**: Supabase a migré vers un nouveau système de clés API. La nouvelle **publishable key** (format `sb_publishable_xxx`) remplace l'ancienne `anon key` qui est maintenant deprecated. Obtenez votre publishable key depuis le dashboard Supabase → Project Settings → API → Publishable key.

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

- Name: `VITE_SUPABASE_PUBLIC_KEY`
- Value: `<your-publishable-key-sb_publishable_xxx>`
- Environment: All (Production, Preview, Development)

## Commandes pour créer .env.local

```bash
# Créer le fichier .env.local
cat > .env.local << 'EOF'
VITE_SUPABASE_URL=https://zsazjkhhqtmyvjsumgcq.supabase.co
VITE_SUPABASE_PUBLIC_KEY=<your-publishable-key-sb_publishable_xxx>
EOF
```

## Vérification

Après avoir créé le fichier, redémarrez le serveur de développement :

```bash
npm run dev
```

L'application devrait maintenant se connecter à Supabase sans warning dans la console.

