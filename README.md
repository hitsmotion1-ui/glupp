# 🍺 Glupp — Starter Kit Webapp

> **Kit de démarrage pour construire Glupp avec Claude Code**
> Stack : Next.js 14 + Tailwind CSS + Supabase + Vercel

---

## 📋 Pré-requis

- **Node.js** 18+ → [nodejs.org](https://nodejs.org)
- **Git** → [git-scm.com](https://git-scm.com)
- **Compte Supabase** (gratuit) → [supabase.com](https://supabase.com)
- **Compte Vercel** (gratuit) → [vercel.com](https://vercel.com)
- **Compte GitHub** → [github.com](https://github.com)
- **Claude Code** → `npm install -g @anthropic-ai/claude-code`

---

## 🚀 Phase 1 — Setup projet (Jour 1)

### 1.1 Créer le projet Next.js

```bash
npx create-next-app@latest glupp --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd glupp
```

### 1.2 Installer les dépendances

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install zustand                    # State management léger
npm install framer-motion              # Animations
npm install lucide-react               # Icônes
npm install next-pwa                   # PWA support
npm install -D supabase                # CLI Supabase local
```

### 1.3 Setup Supabase

```bash
npx supabase init
npx supabase start    # Lance Supabase en local (Docker requis)
```

Ou directement sur le cloud :
1. Créer un projet sur [supabase.com/dashboard](https://supabase.com/dashboard)
2. Copier les clés dans `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
```

### 1.4 Initialiser Git + GitHub

```bash
git init
git add .
git commit -m "🍺 init: glupp starter"
gh repo create glupp --public --source=. --push
```

### 1.5 Connecter Vercel

```bash
npx vercel link
npx vercel env add NEXT_PUBLIC_SUPABASE_URL
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## 🗄️ Phase 2 — Base de données (Jour 1-2)

### 2.1 Exécuter le schéma SQL

Copier le contenu de `supabase/schema.sql` dans l'éditeur SQL de Supabase Dashboard.

### 2.2 Seed les données

Copier le contenu de `supabase/seed.sql` pour ajouter les premières bières.

### 2.3 Configurer l'authentification

Dans Supabase Dashboard → Authentication → Providers :
- ✅ Email/Password (activé par défaut)
- ✅ Google OAuth (optionnel, recommandé)
- ✅ Apple OAuth (pour iOS plus tard)

### 2.4 Configurer le Storage

Dans Supabase Dashboard → Storage :
- Créer un bucket `beer-photos` (public)
- Créer un bucket `avatars` (public)

---

## 🏗️ Phase 3 — Structure du code (Jour 2-3)

Voir `project-structure.md` pour l'arborescence complète du projet.

### Architecture résumée

```
src/
├── app/                    # Routes Next.js App Router
│   ├── (auth)/            # Pages non-auth (login, register)
│   ├── (app)/             # Pages protégées
│   │   ├── duel/          # Tab Duel
│   │   ├── ranking/       # Tab Classement
│   │   ├── map/           # Tab Carte
│   │   ├── social/        # Tab Social
│   │   └── profile/       # Tab Profil
│   ├── layout.tsx         # Root layout + providers
│   └── page.tsx           # Redirect vers /duel
├── components/
│   ├── ui/                # Composants réutilisables
│   ├── beer/              # BeerCard, BeerModal, DuelCards
│   ├── social/            # FriendCard, CrewCard, LiveFeed
│   └── navigation/        # TabBar, Header
├── lib/
│   ├── supabase/          # Client, middleware, helpers
│   ├── hooks/             # useBeers, useDuel, useProfile
│   └── store/             # Zustand stores
└── types/                 # TypeScript types
```

---

## ⚔️ Phase 4 — MVP Features (Jour 3-14)

### Ordre de développement recommandé

| Priorité | Feature | Temps estimé | Fichier clé |
|----------|---------|-------------|-------------|
| 1 | Auth (inscription/login) | 1 jour | `(auth)/login/page.tsx` |
| 2 | Duel ELO | 2 jours | `(app)/duel/page.tsx` |
| 3 | Collection Pokédex | 2 jours | `(app)/profile/collection.tsx` |
| 4 | Profil + XP + Niveaux | 1 jour | `(app)/profile/page.tsx` |
| 5 | Recherche | 1 jour | `components/SearchModal.tsx` |
| 6 | Fiche bière détaillée | 1 jour | `components/beer/BeerModal.tsx` |
| 7 | Scan étiquette | 1 jour | `components/ScanModal.tsx` |
| 8 | Social (amis + feed) | 2 jours | `(app)/social/page.tsx` |
| 9 | Carte des bars | 2 jours | `(app)/map/page.tsx` |
| 10 | PWA + Install prompt | 0.5 jour | `next.config.js` |

### Système ELO — Logique serveur

Le calcul ELO doit être côté serveur (Supabase Edge Function) pour éviter la triche :

```typescript
// supabase/functions/process-duel/index.ts
const K = 32; // Facteur K standard
const expectedA = 1 / (1 + Math.pow(10, (eloB - eloA) / 400));
const expectedB = 1 / (1 + Math.pow(10, (eloA - eloB) / 400));

// Si A gagne :
const newEloA = Math.round(eloA + K * (1 - expectedA));
const newEloB = Math.round(eloB + K * (0 - expectedB));
```

---

## 📱 Phase 5 — PWA (Jour 14-15)

### Transformer en Progressive Web App

```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
});

module.exports = withPWA({ /* next config */ });
```

Créer `public/manifest.json` :

```json
{
  "name": "Glupp",
  "short_name": "Glupp",
  "description": "Every gulp counts.",
  "start_url": "/duel",
  "display": "standalone",
  "background_color": "#16130E",
  "theme_color": "#E08840",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## 🧪 Phase 6 — Beta Vendée (Mois 2-3)

1. Déployer sur Vercel (auto depuis GitHub push)
2. Ajouter 10-15 bars des Herbiers manuellement dans la DB
3. Seed 200-300 bières craft prioritaires
4. Recruter 20-30 beta testeurs (amis, bars, réseaux locaux)
5. QR codes dans les bars → lien vers la webapp
6. Itérer sur les retours

---

## 💡 Prompt Claude Code pour démarrer

Quand tu ouvres Claude Code, colle ce prompt :

```
Je construis Glupp, une webapp de classement et collection de bières.
Stack : Next.js 14 App Router + TypeScript + Tailwind + Supabase.

Voici les fichiers de référence :
- schema.sql : le schéma de base de données complet
- seed.sql : les données initiales (bières)
- project-structure.md : l'arborescence du projet
- claude-code-prompt.md : le contexte produit complet

Commence par :
1. Setup le projet Next.js avec la structure décrite
2. Configure le client Supabase
3. Crée le layout principal avec la TabBar (5 onglets)
4. Implémente la page Duel avec le système ELO

Design : palette sombre (#16130E bg, #E08840 accent, #DCB04C gold),
typographie Bricolage Grotesque, coins arrondis 16-20px, ombres subtiles.
```

---

## 🐳 Deploiement Docker + Traefik

### Pre-requis serveur

- Docker + Docker Compose
- Traefik deja en place avec reseau `proxy` et certresolver `letsencrypt`
- DNS `glupp.amithome.ovh` pointe vers le serveur

### 1. Cloner le repo

```bash
git clone https://github.com/hitsmotion1-ui/glupp.git
cd glupp
```

### 2. Configurer les variables d'environnement

```bash
cp .env.production.example .env.production
nano .env.production   # remplir les vraies cles Supabase
```

### 3. Lancer

```bash
docker compose up -d --build
```

### 4. Verifier

```bash
docker compose logs -f glupp
# Attendre "Ready on http://0.0.0.0:3000"
```

Puis ouvrir `https://glupp.amithome.ovh` dans le navigateur.

### Commandes utiles

```bash
docker compose logs -f glupp      # Logs en direct
docker compose restart glupp      # Redemarrer
docker compose up -d --build      # Rebuilder apres un changement
docker compose down               # Arreter
```

### Dev avec VS Code Remote-SSH

1. Se connecter au serveur via VS Code Remote-SSH
2. Ouvrir le dossier du projet
3. Editer les fichiers, puis `docker compose up -d --build` pour tester

---

## 📊 Couts estimes

| Service | Gratuit jusqu'à | Coût après |
|---------|----------------|------------|
| Supabase | 500MB DB, 1GB storage, 50K auth | ~25€/mois |
| Vercel | 100GB bandwidth, builds illimités | ~20€/mois |
| Domaine | — | ~12€/an |
| **Total démarrage** | **0€** | **~45€/mois à 1K+ users** |
