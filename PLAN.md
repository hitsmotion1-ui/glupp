# Plan de refonte Navigation Glupp : 6 → 4 onglets

## Phase 1 — Fondations (sans casser l'existant)

### 1.1 Nouveau hook `useMyTop`
**Fichier** : `src/lib/hooks/useMyTop.ts` (NOUVEAU)
- Query les duels de l'utilisateur pour calculer son classement personnel
- `SELECT beer_id, COUNT(*) as wins FROM duels WHERE user_id=? AND winner_id=beer_id GROUP BY beer_id ORDER BY wins DESC`
- Joindre avec les infos beer (name, brewery, style, country, rarity, elo)
- Retourne : `myTopBeers[]`, `loading`, `topBeer` (la #1)

### 1.2 Nouveau hook `useRegionFilter`
**Fichier** : `src/lib/hooks/useRegionFilter.ts` (NOUVEAU)
- State : `selectedCountry: string | null`, `selectedRegion: string | null`
- Query pays disponibles : liste statique des COUNTRIES (réutiliser celle de SubmitBeerModal)
- Query régions dynamique : `SELECT DISTINCT region FROM beers WHERE country_code=? AND region IS NOT NULL ORDER BY region`
- Retourne : `countries[]`, `regions[]`, `selectedCountry`, `setSelectedCountry`, `selectedRegion`, `setSelectedRegion`

### 1.3 Nouveau composant `RegionFilter`
**Fichier** : `src/components/collection/RegionFilter.tsx` (NOUVEAU)
- Row scrollable de pays (drapeaux)
- Quand un pays est sélectionné → 2e row de sous-régions
- Compteur : "X/Y bières [région] gluppées" + mini barre progression
- Props : hook useRegionFilter

---

## Phase 2 — Page "Mon Classement" (fusion Collection + Ranking)

### 2.1 Réécrire `src/app/(app)/collection/page.tsx`
La page Collection devient "Mon Classement" avec 3 vues toggle :

**Toggle principal** : `[🏆 Mon Top] [🃏 Pokédex] [🌍 Mondial]`

**Header enrichi** :
- Titre "Mon Classement"
- Stats : "X bières gluppées · Y XP"
- Barre XP avec niveau actuel → niveau suivant
- Compteurs rareté (réutiliser le grid existant)

**Vue "Mon Top"** (NOUVEAU) :
- Utilise `useMyTop()`
- Bière #1 : grande carte premium (bordure dorée, 👑)
- Reste : `BeerRow` avec rang personnel
- Si < 2 bières : message CTA "Gluppe des bières et joue des duels !"

**Vue "Pokédex"** :
- Code actuel de CollectionPage (grid BeerCard, filtres rareté, recherche, tri)
- AJOUT : `<RegionFilter>` au-dessus de la grille
- Le filtre région s'ajoute aux filtres existants (rareté + search + country + region)

**Vue "Mondial"** :
- Code actuel de RankingPage (BeerRow, tri ELO/Nom/Votes, filtre style)
- AJOUT : `<RegionFilter>` au-dessus de la liste
- Le filtre région s'ajoute aux filtres existants

---

## Phase 3 — Page Duel enrichie

### 3.1 Modifier `src/app/(app)/duel/page.tsx`
**Ajouts en dessous des cartes de duel :**
- `<GluppOfWeekBanner />` (déjà existant, le déplacer ici)
- Section "Activité récente" :
  - Afficher les 3-4 dernières activités (query limitée)
  - Lien "Voir toute l'activité →" qui navigue vers `/social`
  - Utiliser `ActivityItem` existant

---

## Phase 4 — Page Profil enrichie

### 4.1 Modifier `src/app/(app)/profile/page.tsx`
**Garder** : Avatar, nom, username, niveau, barre XP, stats, Progression

**Remplacer** le placeholder "🏆 Trophées Bientôt disponible" par :

**Section "Trophées"** (dépliable) :
- Intégrer `<TrophyGrid />` directement
- Bouton "Voir tous les trophées" → `/trophees` (future page)

**Section "Mes Amis"** (dépliable, NOUVEAU) :
- Intégrer `<FriendList />` en version compacte
- Bouton "Ajouter un ami" → ouvre FriendSearchModal

**Section "Mes Crews"** (dépliable, NOUVEAU) :
- Intégrer `<CrewSection />`

**Section "Beer Passport"** (dépliable, NOUVEAU) :
- Résumé par pays : drapeau, nom, X/Y gluppées, mini ProgressBar
- Query : `SELECT country_code, country, COUNT(*) as total, COUNT(CASE WHEN id IN (tastedIds) THEN 1 END) as tasted FROM beers GROUP BY country_code, country ORDER BY total DESC`

**Déconnexion** reste tout en bas

---

## Phase 5 — TabBar + FAB + Nettoyage routes

### 5.1 Modifier `src/components/navigation/TabBar.tsx`
```
Avant : Duel | Classement | Collection | Carte | Social | Profil (6)
Après : Duel | Mon Classement | Explorer | Profil (4)
```
- `{ href: "/duel", label: "Duel", icon: Swords }`
- `{ href: "/collection", label: "Classement", icon: Trophy }`
- `{ href: "/map", label: "Explorer", icon: Map }`
- `{ href: "/profile", label: "Profil", icon: User }`

### 5.2 Modifier `src/components/global/GlobalModals.tsx`
- **Retirer** "Proposer un bar" du FAB menu
- Garder seulement : "Glupper une bière" + "Scanner une étiquette"

### 5.3 Page `/social` reste accessible
- La route `/social` reste fonctionnelle (page secondaire)
- Juste plus dans la TabBar
- Accessible via "Voir toute l'activité" depuis la page Duel

### 5.4 Supprimer la route `/ranking`
- Rediriger `/ranking` vers `/collection` (le contenu est dans l'onglet Mondial)

### 5.5 Page Explorer — ajouter "Proposer un bar"
- Dans `src/app/(app)/map/page.tsx`, ajouter un bouton "Proposer un bar" quelque part dans l'UI (header ou flottant)

---

## Ordre d'exécution (parallélisable)

**Batch 1** (indépendants, en parallèle) :
- Agent A : Phase 1 (hooks useMyTop + useRegionFilter + composant RegionFilter)
- Agent B : Phase 3 (Duel enrichi + GluppOfWeek + mini feed)
- Agent C : Phase 4 (Profil enrichi avec sections Amis/Crews/Trophées/Passport)

**Batch 2** (dépend de Batch 1 - Agent A) :
- Phase 2 : Page "Mon Classement" (toggle 3 vues avec les hooks de Phase 1)

**Batch 3** (après Batch 2) :
- Phase 5 : TabBar 4 onglets + FAB simplifié + nettoyage routes

**Final** :
- Build + test + commit + push
