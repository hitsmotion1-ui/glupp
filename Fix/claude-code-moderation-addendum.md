# 🔧 Glupp — Addendum : Modération des ajouts de bières

> Ce fichier complète `claude-code-reset-add-flow.md`. 
> Applique ces modifications EN PLUS du prompt précédent.

## CHANGEMENT PRINCIPAL

Les bières ajoutées par les utilisateurs ne sont **pas immédiatement visibles**. Elles passent par une file d'attente que l'admin (toi) valide depuis l'interface d'administration.

## Modifications base de données

```sql
-- Ajouter un statut de validation
ALTER TABLE beers ADD COLUMN status TEXT DEFAULT 'approved' 
  CHECK (status IN ('pending', 'approved', 'rejected'));

-- Les 30 bières du seed restent 'approved' (défaut)
-- Les bières ajoutées par les utilisateurs arrivent en 'pending'

-- Index pour l'admin
CREATE INDEX idx_beers_status ON beers(status);
```

## Modification du flow d'ajout (AddBeerModal)

Quand un utilisateur ajoute une bière :

1. La bière est insérée avec `status: 'pending'`
2. Elle n'apparaît **PAS** dans le Pokédex/Mondial/Recherche des autres utilisateurs
3. Elle apparaît dans la collection de l'utilisateur qui l'a ajoutée, avec un badge "⏳ En attente de validation"
4. L'utilisateur reçoit quand même une partie du XP immédiatement :
   - +10 XP pour la proposition (pas les +25 de découvreur, ça vient à la validation)
5. Toast : "🍺 Bière proposée ! L'équipe Glupp va la valider. +10 XP"

## Quand l'admin valide

Depuis ton interface d'admin, quand tu passes une bière de `pending` → `approved` :

1. La bière devient visible pour tout le monde
2. L'utilisateur qui l'a proposée reçoit :
   - +25 XP bonus "Découvreur" (différé)
   - Notification : "🎉 Ta bière [nom] a été validée ! +25 XP Découvreur"
3. La bière apparaît dans le feed : "[user] a découvert [bière] et l'a ajoutée à Glupp !"

## Modification des requêtes frontend

**IMPORTANT** : Toutes les requêtes qui listent des bières doivent filtrer sur `status = 'approved'` :

```typescript
// Partout où tu fetch des bières pour l'affichage général
const { data } = await supabase
  .from('beers')
  .select('*')
  .eq('status', 'approved')     // ← AJOUTER PARTOUT
  .eq('is_active', true)
  .order('elo', { ascending: false });
```

**Exception** : Dans la collection personnelle d'un utilisateur, montrer aussi ses bières `pending` avec le badge "⏳ En attente" :

```typescript
// Collection perso : montrer approved + mes pending
const { data } = await supabase
  .from('user_beers')
  .select('*, beer:beers(*)')
  .eq('user_id', userId)
  // Pas de filtre status ici — on montre tout ce que l'user a gluppé
```

## Modification du SearchModal

Quand la recherche ne trouve rien :

```
Pas trouvé ? 👇
┌─────────────────────────────────────────┐
│  ➕ Proposer "Chouf" à Glupp            │
│     +10 XP · Validée par l'équipe       │
└─────────────────────────────────────────┘
```

Changer le wording :
- "Ajouter à Glupp" → **"Proposer à Glupp"**
- "+25 XP Découvreur" → **"+10 XP · Validée par l'équipe"**

## Interface admin (déjà créée)

Tu as déjà une interface admin. Assure-toi qu'elle permet de :
- [ ] Voir la liste des bières `pending` avec date et proposeur
- [ ] Pour chaque bière pending : voir les infos saisies par l'utilisateur
- [ ] Modifier les champs avant validation (corriger le nom, changer le style, ajouter fun fact, ajuster la rareté)
- [ ] Bouton "✅ Valider" → passe en `approved` + déclenche le +25 XP au proposeur
- [ ] Bouton "❌ Rejeter" → passe en `rejected` (optionnel : envoyer un message au proposeur)
- [ ] Bouton "✏️ Éditer" → modifier n'importe quel champ d'une bière existante

## Résumé du flow complet

```
Utilisateur                          Admin                        
    │                                   │
    ├─ Recherche "Chouffe Houblon"      │
    ├─ Pas trouvé                       │
    ├─ Tap "Proposer à Glupp"           │
    ├─ Remplit le formulaire             │
    ├─ Soumet                            │
    ├─ → bière créée (status: pending)   │
    ├─ +10 XP immédiat                   │
    ├─ Voit la bière dans SA collection  │
    │   avec badge "⏳ En attente"       │
    │                                   │
    │                                   ├─ Voit la bière en file d'attente
    │                                   ├─ Enrichit (fun fact, rareté...)
    │                                   ├─ Tap "Valider ✅"
    │                                   ├─ → status: approved
    │                                   │
    ├─ Reçoit notification               │
    ├─ +25 XP "Découvreur" 🎉           │
    ├─ Bière visible par tout le monde   │
    └─                                  └─
```
