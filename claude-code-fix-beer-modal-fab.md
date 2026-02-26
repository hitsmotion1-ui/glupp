# 🔧 Glupp — Fix UX : Fiche bière verrouillée + Menu FAB

## 1. FICHE BIÈRE NON-DÉBLOQUÉE (bottom sheet classement)

### Problème actuel
Quand on tape sur une bière dans le classement, une bottom sheet s'ouvre avec "Bière non débloquée", une icône cadenas, "Bière mystérieuse", et un bouton "Glupper cette bière !". C'est trop vide et pas engageant.

### Ce qu'il faut changer

La bottom sheet doit **teaser** la bière pour donner envie de la débloquer. Voici le layout :

```
┌─────────────────────────────────────────┐
│             ─── (handle)                │
│                                         │
│     🔒  [emoji style en grayscale]      │
│                                         │
│         Bière Mystérieuse               │
│         ??? • ??? Brewery               │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  Style : Belgian Strong Dark     │    │  ← visible
│  │  Pays : 🇧🇪                      │    │  ← visible
│  │  Rareté : [badge Légendaire]     │    │  ← visible
│  │  ABV : ???                       │    │  ← masqué
│  │  ELO : ???                       │    │  ← masqué
│  │  Profil gustatif : ████░░ ???    │    │  ← barres floues
│  └─────────────────────────────────┘    │
│                                         │
│  💡 "Gluppe cette bière pour découvrir  │
│      son nom, ses stats et son          │
│      anecdote secrète !"                │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  🍺  Glupper cette bière !       │    │  ← bouton accent
│  └─────────────────────────────────┘    │
│                                         │
│  Le bouton ouvre le GluppFlow           │
│  (photo optionnelle + géoloc + confirm) │
└─────────────────────────────────────────┘
```

**Règles :**
- On montre le **style**, le **pays** (drapeau), et le **badge de rareté** → ça teaser sans spoiler le nom
- Le nom de la bière et la brasserie sont remplacés par "???"
- L'ABV, l'ELO, et le profil gustatif sont floutés/masqués
- Le fun fact est caché ("Anecdote secrète 🔒")
- Le texte d'accroche doit donner envie : mentionner le XP à gagner
- Si la bière est Épique ou Légendaire, ajouter : "⚡ +50 XP bonus rareté !"

**Quand la bière EST débloquée**, la même bottom sheet montre tout :
- Emoji en couleur (pas de cadenas)
- Vrai nom + brasserie
- Toutes les stats visibles
- Profil gustatif en barres colorées (4 barres : Amertume, Sucre, Fruité, Corps)
- Fun fact avec emoji
- Section "Où la trouver" (bars qui servent cette bière)
- Date de glupp + photo si elle existe
- Pas de bouton "Glupper" (déjà fait)

---

## 2. MENU FAB (bouton + en bas à droite)

### Problème actuel
Le menu affiche "Scanner" et "Chercher". "Chercher" est trop formel et utilitaire. Et visuellement c'est plat.

### Ce qu'il faut changer

Remplacer les labels et revoir le design :

**Avant :**
```
[📷 Scanner]
[🔍 Chercher]
[✕]
```

**Après :**
```
[📷  Scanner une étiquette]     ← garde tel quel, c'est clair
[🍺  Glupper une bière]         ← remplace "Chercher"
[✕]
```

**Détails du style :**
- Les boutons doivent avoir un background semi-transparent avec border accent, pas gris
- Texte en blanc, icônes en accent (#E08840)
- Le bouton "Glupper une bière" doit être légèrement plus gros que "Scanner" car c'est l'action principale
- Ajouter une subtile animation d'apparition (scale + fade, framer-motion)
- Le ✕ ferme avec une rotation de 45° (le + tourne en ✕)

**Comportement :**
- Tap "Glupper une bière" → ouvre SearchModal (recherche full-screen, fuzzy search)
- Tap "Scanner une étiquette" → ouvre ScanModal (caméra ou input barcode pour le MVP)

**Optionnel mais cool :**
Ajouter un 3e bouton si on veut :
```
[✏️  Ajouter manuellement]      ← pour les bières pas dans la DB
```

---

## 3. BONUS : Améliorer le classement

Tant qu'on y est, dans la liste du classement :
- Les 3 premiers doivent avoir 🥇🥈🥉 au lieu de l'icône trophée actuelle
- Chaque ligne doit afficher le **pays** (drapeau) et le **score ELO** aligné à droite
- Les lignes doivent avoir un léger hover/active state (background légèrement plus clair au tap)
- Quand une bière est déjà gluppée par l'utilisateur, ajouter un petit ✓ vert à côté du nom
