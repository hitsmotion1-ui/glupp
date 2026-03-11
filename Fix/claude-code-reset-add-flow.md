# 🔧 Glupp — Reset Base + Flow d'ajout de bière

## CONTEXTE

La base actuelle contient ~3000 bières importées d'Open Food Facts avec des données sales (adresses en guise de régions, noms incohérents, styles mal mappés). On repart de zéro avec une base curatée + un flow d'ajout communautaire.

---

## ÉTAPE 1 : Reset de la base

### 1.1 Vider les tables liées

Exécute dans cet ordre (respecter les dépendances FK) :

```sql
-- Vider les données utilisateur liées aux bières
DELETE FROM moment_votes;
DELETE FROM activity_tags;
DELETE FROM activities;
DELETE FROM duels;
DELETE FROM user_beers;
DELETE FROM bar_beers;
DELETE FROM user_trophies;
DELETE FROM glupp_of_week;

-- Vider les bières
DELETE FROM beers;

-- Reset les stats utilisateur
UPDATE profiles SET xp = 0, duels_played = 0, beers_tasted = 0, photos_taken = 0;
```

### 1.2 Nettoyer la structure

```sql
-- Supprimer region_display si elle existe (plus nécessaire)
ALTER TABLE beers DROP COLUMN IF EXISTS region_display;

-- S'assurer que region est propre pour les futures entrées
-- Le champ region contiendra désormais UNIQUEMENT des noms de régions propres
-- Exemples : "Vendée", "Wallonie", "Bavière", "Californie"
-- JAMAIS d'adresses ou de codes postaux
```

### 1.3 Seed curatée : 30 bières emblématiques

```sql
INSERT INTO beers (name, brewery, country, country_code, style, abv, ibu, elo, rarity, color, taste_bitter, taste_sweet, taste_fruity, taste_body, region, description, fun_fact, fun_fact_icon, is_active) VALUES

-- ═══ TRAPPISTES (les 6 belges incontournables) ═══
('Westvleteren 12', 'Abbaye de Saint-Sixte', '🇧🇪', 'BE', 'Quadrupel', 10.2, 35, 1500, 'legendary', '#5C2D1A', 2, 5, 4, 5, 'Flandre-Occidentale', '33cl', 'On ne peut l''acheter qu''en réservant par téléphone à l''abbaye.', '☎️', true),
('Rochefort 10', 'Abbaye de Rochefort', '🇧🇪', 'BE', 'Quadrupel', 11.3, 27, 1500, 'legendary', '#8E3B2F', 2, 5, 3, 5, 'Wallonie', '33cl', 'Brassée par 15 moines. La recette n''a pas changé depuis 1950.', '⛪', true),
('Chimay Bleue', 'Abbaye de Scourmont', '🇧🇪', 'BE', 'Belgian Strong Dark', 9.0, 35, 1500, 'epic', '#2D5F8A', 3, 4, 3, 5, 'Wallonie', '33cl', 'Le label trappiste exige que la bière soit brassée dans un monastère.', '📜', true),
('Orval', 'Abbaye d''Orval', '🇧🇪', 'BE', 'Belgian Pale Ale', 6.2, 36, 1500, 'epic', '#D4952B', 4, 2, 2, 3, 'Luxembourg belge', '33cl', 'Seule trappiste refermentée avec des levures Brettanomyces.', '🧫', true),
('Westmalle Tripel', 'Abbaye de Westmalle', '🇧🇪', 'BE', 'Tripel', 9.5, 38, 1500, 'epic', '#E8C838', 3, 3, 3, 4, 'Anvers', '33cl', 'Westmalle a inventé le style Tripel en 1934.', '👑', true),
('La Trappe Quadrupel', 'Abbaye de Koningshoeven', '🇳🇱', 'NL', 'Quadrupel', 10.0, 22, 1500, 'epic', '#8E3B2F', 2, 5, 3, 5, 'Brabant', '33cl', 'Seule brasserie trappiste des Pays-Bas.', '🇳🇱', true),

-- ═══ BELGIQUE CRAFT ═══
('Tripel Karmeliet', 'Brouwerij Bosteels', '🇧🇪', 'BE', 'Tripel', 8.4, 20, 1500, 'rare', '#E8A838', 2, 3, 3, 4, 'Flandre', '33cl', '"Tripel" vient des marques XXX sur les fûts les plus costauds.', '🧑‍⚖️', true),
('Chouffe Blonde', 'Brasserie d''Achouffe', '🇧🇪', 'BE', 'Belgian Blonde', 8.0, 20, 1500, 'rare', '#F5A623', 2, 3, 2, 3, 'Ardennes', '33cl', 'La Chouffe tire son nom du lutin des Ardennes. Fondée dans un garage en 1982.', '🧝', true),
('Duvel', 'Duvel Moortgat', '🇧🇪', 'BE', 'Belgian Strong Pale', 8.5, 32, 1500, 'common', '#F5D76E', 3, 2, 2, 3, 'Anvers', '33cl', 'Duvel signifie "diable". Un testeur a dit "c''est un vrai diable !".', '😈', true),
('Delirium Tremens', 'Brasserie Huyghe', '🇧🇪', 'BE', 'Belgian Strong Pale', 8.5, 26, 1500, 'rare', '#F0C460', 2, 3, 3, 3, 'Flandre', '33cl', 'L''éléphant rose est devenu un symbole mondial de la bière craft.', '🐘', true),
('Saison Dupont', 'Brasserie Dupont', '🇧🇪', 'BE', 'Saison', 6.5, 30, 1500, 'rare', '#C4923A', 3, 2, 3, 2, 'Hainaut', '33cl', 'Les Saisons étaient brassées en hiver pour les saisonniers d''été.', '🌾', true),

-- ═══ ALLEMAGNE ═══
('Weihenstephaner Hefe', 'Weihenstephan', '🇩🇪', 'DE', 'Hefeweizen', 5.4, 14, 1500, 'rare', '#D4952B', 1, 3, 4, 3, 'Bavière', '50cl', 'Fondée en 1040, la plus ancienne brasserie en activité au monde.', '🏰', true),
('Augustiner Helles', 'Augustiner-Bräu', '🇩🇪', 'DE', 'Helles', 5.2, 20, 1500, 'rare', '#F5D76E', 2, 2, 1, 2, 'Bavière', '50cl', 'Plus ancienne brasserie de Munich (1328) et la préférée des locaux.', '🍻', true),
('Schlenkerla Rauchbier', 'Schlenkerla', '🇩🇪', 'DE', 'Rauchbier', 5.1, 30, 1500, 'epic', '#5C2D1A', 3, 1, 1, 4, 'Bavière', '50cl', 'Malt fumé au bois de hêtre. Le patron "schlenkerte" (titubait).', '🔥', true),

-- ═══ USA ═══
('Pliny the Elder', 'Russian River', '🇺🇸', 'US', 'Double IPA', 8.0, 100, 1500, 'legendary', '#5B8C3E', 5, 1, 4, 3, 'Californie', '50cl', 'Le record mondial d''amertume est 2500 IBU — imbuvable.', '🔥', true),
('Heady Topper', 'The Alchemist', '🇺🇸', 'US', 'Double IPA', 8.0, 75, 1500, 'legendary', '#3D8B6E', 4, 1, 5, 3, 'Vermont', '47cl', 'La canette dit "Drink from the can" — le brasseur préfère ça.', '🥫', true),
('Sierra Nevada Pale Ale', 'Sierra Nevada', '🇺🇸', 'US', 'American Pale Ale', 5.6, 38, 1500, 'common', '#D4952B', 3, 1, 3, 2, 'Californie', '35.5cl', 'A lancé la révolution craft américaine en 1980.', '🇺🇸', true),

-- ═══ TCHÉQUIE ═══
('Pilsner Urquell', 'Plzeňský Prazdroj', '🇨🇿', 'CZ', 'Czech Pilsner', 4.4, 40, 1500, 'common', '#F5D76E', 3, 1, 1, 2, 'Bohême', '50cl', 'La première pilsner au monde, brassée en 1842 à Plzeň.', '🏆', true),

-- ═══ UK / IRLANDE ═══
('Guinness Draught', 'Guinness', '🇮🇪', 'IE', 'Stout', 4.2, 45, 1500, 'common', '#6B4C3B', 4, 2, 1, 5, 'Dublin', '44cl', '"Stout" signifiait "fort". Les premiers stouts étaient des porters survitaminés.', '💪', true),
('Punk IPA', 'BrewDog', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'GB', 'IPA', 5.4, 35, 1500, 'common', '#4ECDC4', 4, 1, 3, 2, 'Écosse', '33cl', 'BrewDog a levé des fonds via "Equity for Punks", du crowdfunding brassicole.', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', true),

-- ═══ FRANCE ═══
('Gallia Lager', 'Gallia Paris', '🇫🇷', 'FR', 'Lager', 5.0, 18, 1500, 'common', '#F5D76E', 2, 2, 1, 2, 'Île-de-France', '33cl', 'Fondée en 1890, fermée en 1968, ressuscitée en 2014 à Pantin.', '🗼', true),
('Ninkasi IPA', 'Ninkasi', '🇫🇷', 'FR', 'IPA', 5.4, 45, 1500, 'common', '#A8CF45', 4, 1, 3, 2, 'Auvergne-Rhône-Alpes', '33cl', 'Ninkasi est la déesse sumérienne de la bière.', '⚡', true),

-- ═══ VENDÉE (focus local) ═══
('Mélusine Blonde', 'Brasserie Mélusine', '🇫🇷', 'FR', 'Blonde Ale', 6.5, 20, 1500, 'rare', '#F5D76E', 2, 2, 2, 3, 'Vendée', '33cl', 'Nommée d''après la fée Mélusine, figure du folklore vendéen.', '🧚', true),
('Mélusine Ambrée', 'Brasserie Mélusine', '🇫🇷', 'FR', 'Amber Ale', 7.0, 25, 1500, 'rare', '#B8712D', 2, 3, 2, 4, 'Vendée', '33cl', 'Le bocage vendéen en bouteille — chaude et boisée.', '🌳', true),
('Mélusine Blanche', 'Brasserie Mélusine', '🇫🇷', 'FR', 'Witbier', 5.0, 12, 1500, 'common', '#F0E8D0', 1, 3, 3, 2, 'Vendée', '33cl', 'Légère et épicée, parfaite pour un apéro vendéen.', '🌿', true),
('Troussepinette', 'Brasserie Vendéenne', '🇫🇷', 'FR', 'Fruit Beer', 5.0, 10, 1500, 'rare', '#C45B8A', 1, 4, 5, 2, 'Vendée', '33cl', 'La troussepinette est un apéritif vendéen traditionnel.', '🫐', true),

-- ═══ JAPON ═══
('Hitachino Nest White', 'Kiuchi Brewery', '🇯🇵', 'JP', 'Witbier', 5.5, 13, 1500, 'rare', '#F0E8D0', 1, 3, 4, 2, 'Ibaraki', '33cl', 'La brasserie Kiuchi existe depuis 1823. L''hibou = sagesse.', '🦉', true),

-- ═══ DANEMARK ═══
('Mikkeller Beer Geek Breakfast', 'Mikkeller', '🇩🇰', 'DK', 'Oatmeal Stout', 7.5, 45, 1500, 'rare', '#2D1A0E', 3, 3, 2, 5, 'Copenhague', '33cl', 'Mikkel a commencé dans sa cuisine en 2006. 40+ bars dans le monde.', '🍳', true),

-- ═══ CANADA ═══
('La Fin du Monde', 'Unibroue', '🇨🇦', 'CA', 'Tripel', 9.0, 19, 1500, 'rare', '#E8C838', 2, 3, 4, 4, 'Québec', '34.1cl', 'Les explorateurs pensaient être arrivés au bout du monde au Québec.', '🗺️', true);
```

---

## ÉTAPE 2 : Flow d'ajout de bière (le plus important)

### Principe
N'importe quel utilisateur connecté peut ajouter une bière qui n'existe pas dans Glupp. L'ajout passe par un formulaire simple mais bien guidé. La bière ajoutée est immédiatement disponible pour tous les utilisateurs.

### 2.1 Accès au flow d'ajout

3 chemins possibles :
- **FAB** → "Glupper une bière" → recherche → pas de résultat → **"Ajouter cette bière à Glupp"**
- **FAB** → "Scanner une étiquette" → bière pas trouvée → **"Cette bière n'est pas encore dans Glupp. Ajoute-la !"**
- **Pokédex** → bouton "Ajouter une bière" quelque part en haut ou fin de grille

### 2.2 Formulaire d'ajout : AddBeerModal

Un bottom sheet ou une page modale avec les champs suivants :

```
┌─────────────────────────────────────────────┐
│              Ajouter une bière              │
│                                             │
│  📷 [Photo de l'étiquette]  (optionnel)     │
│     Tap pour prendre une photo              │
│                                             │
│  Nom de la bière *                          │
│  ┌─────────────────────────────────┐        │
│  │ Ex: Chouffe Blonde              │        │
│  └─────────────────────────────────┘        │
│                                             │
│  Brasserie *                                │
│  ┌─────────────────────────────────┐        │
│  │ Ex: Brasserie d'Achouffe        │        │
│  └─────────────────────────────────┘        │
│                                             │
│  Style *                                    │
│  ┌─────────────────────────────────┐        │
│  │ [Sélecteur] Blonde Ale     ▼    │        │
│  └─────────────────────────────────┘        │
│  Options : IPA, Double IPA, Stout,          │
│  Porter, Pale Ale, Blonde Ale, Amber Ale,   │
│  Tripel, Dubbel, Quadrupel, Saison, Sour,   │
│  Wheat Beer, Pilsner, Lager, Helles,        │
│  Rauchbier, Fruit Beer, Brown Ale,          │
│  Barleywine, Bock, Strong Ale, Witbier,     │
│  Session IPA, New England IPA, Kölsch,      │
│  Bitter, Scotch Ale, Autre                  │
│                                             │
│  Pays *                                     │
│  ┌─────────────────────────────────┐        │
│  │ 🇫🇷 France                  ▼    │        │
│  └─────────────────────────────────┘        │
│                                             │
│  Région (optionnel)                         │
│  ┌─────────────────────────────────┐        │
│  │ Ex: Vendée, Bavière, Wallonie   │        │
│  └─────────────────────────────────┘        │
│  → Input libre, mais proposer des           │
│    suggestions basées sur le pays choisi    │
│                                             │
│  Taux d'alcool (optionnel)                  │
│  ┌──────────┐                               │
│  │ 8.0  % vol│                              │
│  └──────────┘                               │
│                                             │
│  ┌─────────────────────────────────┐        │
│  │     🍺 Ajouter à Glupp          │        │
│  └─────────────────────────────────┘        │
│                                             │
│  En ajoutant, tu gagnes +25 XP ⚡           │
│  et tu deviens le découvreur officiel !     │
└─────────────────────────────────────────────┘
```

### 2.3 Champs obligatoires vs optionnels

**Obligatoires (*)** : nom, brasserie, style, pays
**Optionnels** : région, ABV, photo, description

→ On veut le MINIMUM de friction pour ajouter. 4 champs obligatoires c'est le juste milieu.

### 2.4 Valeurs par défaut pour les champs non remplis

Quand l'utilisateur ne remplit pas les optionnels :

```typescript
{
  elo: 1500,               // Toujours
  total_votes: 0,
  rarity: 'common',        // Par défaut, l'admin peut changer après
  ibu: null,
  color: COLOR_BY_STYLE[style],  // Couleur automatique selon le style
  taste_bitter: TASTE_BY_STYLE[style].bitter,  // Profil auto selon style
  taste_sweet: TASTE_BY_STYLE[style].sweet,
  taste_fruity: TASTE_BY_STYLE[style].fruity,
  taste_body: TASTE_BY_STYLE[style].body,
  fun_fact: null,
  fun_fact_icon: '💡',
  added_by: user.id,       // NOUVEAU CHAMP — qui a ajouté la bière
}
```

### 2.5 Nouveau champ : added_by

```sql
ALTER TABLE beers ADD COLUMN added_by UUID REFERENCES profiles(id);
```

Ça permet de :
- Créditer le découvreur ("Ajoutée par @Mika02")
- Donner le bonus "First Blood" XP
- Modérer si quelqu'un ajoute des bières bidon

### 2.6 Après l'ajout

Quand l'utilisateur tape "Ajouter à Glupp" :

1. La bière est insérée dans la table `beers`
2. **Automatiquement gluppée** par l'utilisateur (insérée dans `user_beers` aussi)
3. XP gagné :
   - +25 XP pour l'ajout (First Blood / Découvreur)
   - +10 XP pour le glupp
   - + bonus photo/géoloc si fournis
4. Toast cascade :
   ```
   🍺 Nouvelle bière ajoutée à Glupp !     +25 XP
   🍺 Gluppée !                             +10 XP
   📸 Photo preuve                          +15 XP
                                      Total: 50 XP 🎉
   ```
5. La bière apparaît dans la collection du user ET dans le Pokédex/Mondial pour tout le monde
6. Dans le feed social : "Mika02 a découvert 🍺 Chouffe Houblon et l'a ajoutée à Glupp !"

### 2.7 Suggestions de régions par pays

Quand l'utilisateur sélectionne un pays, proposer des suggestions pour le champ région :

```typescript
const REGION_SUGGESTIONS: Record<string, string[]> = {
  FR: ['Île-de-France', 'Pays de la Loire', 'Bretagne', 'Normandie', 'Grand Est', 
       'Auvergne-Rhône-Alpes', 'Nouvelle-Aquitaine', 'Occitanie', 'Hauts-de-France', 
       'Provence-Alpes-Côte d\'Azur', 'Bourgogne-Franche-Comté', 'Centre-Val de Loire', 
       'Corse', 'Vendée'],
  BE: ['Wallonie', 'Flandre', 'Bruxelles', 'Ardennes'],
  DE: ['Bavière', 'Berlin', 'Rhénanie', 'Bade-Wurtemberg', 'Hambourg', 'Franconie'],
  GB: ['Écosse', 'Londres', 'Angleterre', 'Pays de Galles'],
  US: ['Californie', 'Côte Est', 'Midwest', 'Colorado', 'Oregon', 'Vermont'],
  NL: ['Brabant', 'Hollande'],
  CZ: ['Bohême', 'Moravie'],
  JP: ['Tokyo', 'Osaka', 'Ibaraki'],
  IT: ['Lombardie', 'Piémont', 'Vénétie'],
  ES: ['Catalogne', 'Andalousie', 'Pays Basque'],
  DK: ['Copenhague'],
  CA: ['Québec', 'Ontario', 'Colombie-Britannique'],
};
```

Afficher ces suggestions comme des pills cliquables sous le champ région. L'utilisateur peut aussi taper librement.

### 2.8 Anti-doublons

Avant d'insérer, vérifier qu'une bière similaire n'existe pas déjà :

```typescript
// Recherche fuzzy avant insertion
const { data: existing } = await supabase
  .from('beers')
  .select('id, name, brewery')
  .ilike('name', `%${beerName}%`)
  .ilike('brewery', `%${breweryName}%`)
  .limit(5);

if (existing && existing.length > 0) {
  // Afficher : "Cette bière existe peut-être déjà :"
  // Liste des résultats similaires
  // Boutons : "C'est celle-là → Glupper" ou "Non, c'est une nouvelle → Ajouter"
}
```

---

## ÉTAPE 3 : Ajuster le SearchModal

Le SearchModal actuel (ouvert via FAB > "Glupper une bière") doit intégrer le flow d'ajout :

```
┌─────────────────────────────────────────────┐
│  🔍 Rechercher une bière...                 │
│  ┌─────────────────────────────────┐        │
│  │ Chouf                           │  ✕     │
│  └─────────────────────────────────┘        │
│                                             │
│  Résultats :                                │
│  🍺 Chouffe Blonde — Brasserie d'Achouffe  │
│  🍺 Chouffe Houblon — Brasserie d'Achouffe │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  Pas trouvé ? 👇                            │
│  ┌─────────────────────────────────┐        │
│  │  ➕ Ajouter "Chouf" à Glupp     │        │
│  │     +25 XP ⚡ Découvreur         │        │
│  └─────────────────────────────────┘        │
│                                             │
└─────────────────────────────────────────────┘
```

Le bouton "Ajouter à Glupp" pré-remplit le nom avec ce que l'utilisateur a tapé dans la recherche, et ouvre le AddBeerModal.

---

## RÉSUMÉ DES FICHIERS À CRÉER/MODIFIER

| Fichier | Action |
|---------|--------|
| Supabase SQL | Reset tables + nouveau seed 30 bières |
| `beers` table | Ajouter colonne `added_by UUID` |
| `AddBeerModal.tsx` | **NOUVEAU** — Formulaire d'ajout |
| `SearchModal.tsx` | Ajouter le lien "Ajouter à Glupp" en bas des résultats |
| `ScanModal.tsx` | Ajouter le fallback "Bière non trouvée → Ajouter" |
| `src/lib/utils/beerDefaults.ts` | **NOUVEAU** — Couleurs et goûts par défaut par style |
| `src/lib/utils/regionSuggestions.ts` | **NOUVEAU** — Suggestions de régions par pays |
| `src/lib/hooks/useAddBeer.ts` | **NOUVEAU** — Hook d'ajout avec anti-doublon + XP |

Commence par le reset SQL (étape 1), puis le AddBeerModal (étape 2), puis l'intégration dans SearchModal (étape 3).
