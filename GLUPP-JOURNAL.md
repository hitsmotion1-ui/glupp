# 🍺 GLUPP — Journal de bord projet

> **Ce fichier est la source de vérité du projet.**  
> Copie-le dans Claude Code au début de chaque session.  
> Mets-le à jour après chaque session de travail.  
> Dernière mise à jour : 26 février 2026

---

## 📍 ÉTAT ACTUEL

### ✅ Fait
- [x] Projet Next.js 14 + TypeScript + Tailwind initialisé
- [x] Supabase connecté (auth + database)
- [x] Schéma SQL déployé (15 tables, fonctions ELO, RLS)
- [x] Seed de 48 bières + 10 bars + 12 trophées
- [x] Import Open Food Facts configuré (script prêt, ~5000 bières potentielles)
- [x] 4 onglets fonctionnels : Duel, Classement, Collection, Profil
- [x] Auth (inscription/login) fonctionnel
- [x] Page Classement : tri ELO/Nom/Votes, filtres par style, badges rareté
- [x] Page Collection : grille Pokédex, filtres rareté, recherche
- [x] Page Profil : avatar, stats, niveau, XP
- [x] Bouton FAB (+) avec Scanner/Chercher

### 🔧 En cours / À corriger
- [ ] **BUG : Performance navigation** — Changement d'onglet lent, nécessite refresh
- [ ] **Import OFF** — Lancer le script pour passer de 48 à ~2000+ bières
- [ ] **UX globale** — Très en dessous du prototype de référence

### ❌ Pas encore fait
- [ ] Header complet (Scan doré + Search + Notifs)
- [ ] TabBar 5 onglets (manque Carte et Social)
- [ ] Flow Glupper (SearchModal → BeerModal → photo/géoloc/tag → célébration)
- [ ] BeerModal (fiche détaillée avec profil gustatif)
- [ ] Duel interactif (cartes animées, XP toast)
- [ ] Glupp of the Week
- [ ] Glupp Live feed (Supabase Realtime)
- [ ] Collection Pokédex : noms "???" pour non-gluppées, cartes colorées
- [ ] Profil : arbre de progression, trophées, Beer Passport
- [ ] Carte des bars (onglet Map)
- [ ] Social (amis, crews, invitations)
- [ ] PWA (manifest, service worker, install prompt)

---

## 🎯 PROCHAINES ÉTAPES (dans l'ordre)

### Sprint 1 : Fondations (cette semaine)
1. Fix performance navigation (React Query + cache)
2. Lancer import Open Food Facts
3. Header + TabBar 5 onglets polish

### Sprint 2 : Core Loop (semaine prochaine)
4. Flow Glupper complet (le cœur de l'app)
5. BeerModal avec fiche détaillée
6. Collection Pokédex (???, couleurs, tap → fiche)
7. Duel interactif avec animations

### Sprint 3 : Engagement (semaine +2)
8. Glupp of the Week
9. XP toasts et animations
10. Profil complet (progression, trophées, passport)

### Sprint 4 : Social & Map (semaine +3)
11. Onglet Social (amis, crew)
12. Onglet Carte (bars, menus)
13. Glupp Live feed

### Sprint 5 : Polish & Launch (semaine +4)
14. PWA
15. Onboarding (premier lancement)
16. QR codes pour bars partenaires

---

## 📐 DÉCISIONS DE DESIGN

### Palette (ne pas changer)
- Background : `#16130E`
- Cards : `#211E18`, border `#3A3530`
- Accent : `#E08840` (ambre chaud)
- Gold : `#DCB04C`
- Text : `#F5F0E8` (principal), `#A89888` (soft), `#6B6050` (muted)
- Rareté : Commune `#8D7C6C`, Rare `#4ECDC4`, Épique `#A78BFA`, Légendaire `#F0C460`

### Typo
- Titres : Bricolage Grotesque
- Body : Inter

### Principes UX
- **Pokédex** : Les bières non-gluppées affichent "???" et sont grisées avec 🔒
- **Duels** : Uniquement entre bières déjà goûtées par l'utilisateur
- **ELO** : Calcul côté serveur (fonction Supabase), jamais côté client
- **XP** : Duel +15, Photo +20, Photo+Géo +40, Tag pote +10, Scan +5, GOTW +50
- **Photos** : Optionnelles mais fortement encouragées (bonus XP)

### Stack confirmée
- Next.js 14 App Router + TypeScript
- Tailwind CSS avec config custom (palette Glupp)
- Supabase (PostgreSQL + Auth + Storage + Realtime)
- React Query (@tanstack/react-query) pour le cache
- Framer Motion pour les animations
- Zustand pour le state global UI
- Lucide React pour les icônes

---

## 🗂️ FICHIERS DE RÉFÉRENCE

Ces fichiers contiennent les specs détaillées, donne-les à Claude Code quand il en a besoin :

| Fichier | Contenu |
|---------|---------|
| `claude-code-prompt.md` | Contexte produit complet (features, onglets, vocabulaire, design) |
| `claude-code-fix-prompt.md` | Corrections UX détaillées pour chaque page |
| `supabase/schema.sql` | Schéma DB complet (tables, fonctions, RLS) |
| `supabase/seed.sql` | Données initiales (50 bières, bars, trophées) |
| `project-structure.md` | Arborescence fichiers + Tailwind config |
| `src/types/index.ts` | Types TypeScript complets |
| `src/lib/utils/xp.ts` | Système XP, niveaux, calcul ELO |
| `import-openfoodfacts.mjs` | Script import bières depuis OFF |

---

## 💬 PROMPT TYPE POUR CLAUDE CODE

Quand tu démarres une session Claude Code, commence par :

```
Voici l'état actuel du projet Glupp. Lis le fichier GLUPP-JOURNAL.md 
à la racine du projet pour connaître ce qui est fait et ce qui reste à faire.

Aujourd'hui je veux travailler sur : [DÉCRIS CE QUE TU VEUX FAIRE]

Fichiers de référence à consulter si besoin :
- claude-code-prompt.md (contexte produit)
- claude-code-fix-prompt.md (corrections UX)
```

### Exemples de prompts efficaces :

**Pour le fix performance :**
```
Lis GLUPP-JOURNAL.md. Le problème prioritaire est la lenteur de navigation 
entre onglets. Installe @tanstack/react-query, configure un QueryClientProvider 
dans le layout racine, et migre tous les fetches Supabase vers des hooks 
useQuery avec staleTime de 5 minutes. Ajoute des Suspense boundaries 
avec des skeletons sur chaque page.
```

**Pour le flow Glupper :**
```
Lis GLUPP-JOURNAL.md et claude-code-fix-prompt.md section "FLOW GLUPPER".
Crée le composant SearchModal (recherche full-screen avec fuzzy search),
le composant BeerModal (fiche détaillée en bottom sheet), et le GluppFlow 
(photo optionnelle + géoloc + tag amis + confirmation avec animation XP).
```

**Pour les duels :**
```
Lis GLUPP-JOURNAL.md et claude-code-fix-prompt.md section "PAGE DUEL".
Refais la page duel avec 2 grandes cartes animées (framer-motion).
Quand l'utilisateur n'a pas encore 2 bières, affiche un empty state 
engageant avec CTA vers la collection. Quand il en a 2+, lance les duels 
avec animation de choix et toast "+15 XP".
```
