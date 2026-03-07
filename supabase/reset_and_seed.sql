-- ═══════════════════════════════════════════
-- Migration: Reset DB + Seed 30 beers + Add moderation columns
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════

-- ═══════════════════════════════════════════
-- STEP 1 : Vider les tables (respecter FK)
-- ═══════════════════════════════════════════

DELETE FROM moment_votes;
DELETE FROM activity_tags;
DELETE FROM activities;
DELETE FROM duels;
DELETE FROM user_beers;
DELETE FROM bar_beers;
DELETE FROM user_trophies;
DELETE FROM glupp_of_week;
DELETE FROM beers;

-- Reset les stats utilisateur
UPDATE profiles SET xp = 0, duels_played = 0, beers_tasted = 0, photos_taken = 0;

-- ═══════════════════════════════════════════
-- STEP 2 : Nettoyer la structure
-- ═══════════════════════════════════════════

-- Supprimer region_display si elle existe
ALTER TABLE beers DROP COLUMN IF EXISTS region_display;

-- Ajouter la colonne added_by (qui a ajoute la biere)
ALTER TABLE beers ADD COLUMN IF NOT EXISTS added_by UUID REFERENCES profiles(id);

-- Ajouter la colonne status pour la moderation
ALTER TABLE beers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved'
  CHECK (status IN ('pending', 'approved', 'rejected'));

-- Index pour les requetes admin sur le status
CREATE INDEX IF NOT EXISTS idx_beers_status ON beers(status);

-- Commentaires
COMMENT ON COLUMN beers.added_by IS 'UUID du user qui a propose la biere (null = ajoutee par admin)';
COMMENT ON COLUMN beers.status IS 'Statut de moderation: pending, approved, rejected';

-- ═══════════════════════════════════════════
-- STEP 3 : Seed 30 bieres emblematiques
-- ═══════════════════════════════════════════

INSERT INTO beers (name, brewery, country, country_code, style, abv, ibu, elo, rarity, color, taste_bitter, taste_sweet, taste_fruity, taste_body, region, description, fun_fact, fun_fact_icon, is_active, status) VALUES

-- ═══ TRAPPISTES (les 6 incontournables) ═══
('Westvleteren 12', 'Abbaye de Saint-Sixte', '🇧🇪', 'BE', 'Quadrupel', 10.2, 35, 1500, 'legendary', '#5C2D1A', 2, 5, 4, 5, 'Flandre-Occidentale', '33cl', 'On ne peut l''acheter qu''en reservant par telephone a l''abbaye.', '☎️', true, 'approved'),
('Rochefort 10', 'Abbaye de Rochefort', '🇧🇪', 'BE', 'Quadrupel', 11.3, 27, 1500, 'legendary', '#8E3B2F', 2, 5, 3, 5, 'Wallonie', '33cl', 'Brassee par 15 moines. La recette n''a pas change depuis 1950.', '⛪', true, 'approved'),
('Chimay Bleue', 'Abbaye de Scourmont', '🇧🇪', 'BE', 'Belgian Strong Dark', 9.0, 35, 1500, 'epic', '#2D5F8A', 3, 4, 3, 5, 'Wallonie', '33cl', 'Le label trappiste exige que la biere soit brassee dans un monastere.', '📜', true, 'approved'),
('Orval', 'Abbaye d''Orval', '🇧🇪', 'BE', 'Belgian Pale Ale', 6.2, 36, 1500, 'epic', '#D4952B', 4, 2, 2, 3, 'Luxembourg belge', '33cl', 'Seule trappiste refermentee avec des levures Brettanomyces.', '🧫', true, 'approved'),
('Westmalle Tripel', 'Abbaye de Westmalle', '🇧🇪', 'BE', 'Tripel', 9.5, 38, 1500, 'epic', '#E8C838', 3, 3, 3, 4, 'Anvers', '33cl', 'Westmalle a invente le style Tripel en 1934.', '👑', true, 'approved'),
('La Trappe Quadrupel', 'Abbaye de Koningshoeven', '🇳🇱', 'NL', 'Quadrupel', 10.0, 22, 1500, 'epic', '#8E3B2F', 2, 5, 3, 5, 'Brabant', '33cl', 'Seule brasserie trappiste des Pays-Bas.', '🇳🇱', true, 'approved'),

-- ═══ BELGIQUE CRAFT ═══
('Tripel Karmeliet', 'Brouwerij Bosteels', '🇧🇪', 'BE', 'Tripel', 8.4, 20, 1500, 'rare', '#E8A838', 2, 3, 3, 4, 'Flandre', '33cl', '"Tripel" vient des marques XXX sur les futs les plus costauds.', '🧑‍⚖️', true, 'approved'),
('Chouffe Blonde', 'Brasserie d''Achouffe', '🇧🇪', 'BE', 'Belgian Blonde', 8.0, 20, 1500, 'rare', '#F5A623', 2, 3, 2, 3, 'Ardennes', '33cl', 'La Chouffe tire son nom du lutin des Ardennes. Fondee dans un garage en 1982.', '🧝', true, 'approved'),
('Duvel', 'Duvel Moortgat', '🇧🇪', 'BE', 'Belgian Strong Pale', 8.5, 32, 1500, 'common', '#F5D76E', 3, 2, 2, 3, 'Anvers', '33cl', 'Duvel signifie "diable". Un testeur a dit "c''est un vrai diable !".', '😈', true, 'approved'),
('Delirium Tremens', 'Brasserie Huyghe', '🇧🇪', 'BE', 'Belgian Strong Pale', 8.5, 26, 1500, 'rare', '#F0C460', 2, 3, 3, 3, 'Flandre', '33cl', 'L''elephant rose est devenu un symbole mondial de la biere craft.', '🐘', true, 'approved'),
('Saison Dupont', 'Brasserie Dupont', '🇧🇪', 'BE', 'Saison', 6.5, 30, 1500, 'rare', '#C4923A', 3, 2, 3, 2, 'Hainaut', '33cl', 'Les Saisons etaient brassees en hiver pour les saisonniers d''ete.', '🌾', true, 'approved'),

-- ═══ ALLEMAGNE ═══
('Weihenstephaner Hefe', 'Weihenstephan', '🇩🇪', 'DE', 'Hefeweizen', 5.4, 14, 1500, 'rare', '#D4952B', 1, 3, 4, 3, 'Baviere', '50cl', 'Fondee en 1040, la plus ancienne brasserie en activite au monde.', '🏰', true, 'approved'),
('Augustiner Helles', 'Augustiner-Brau', '🇩🇪', 'DE', 'Helles', 5.2, 20, 1500, 'rare', '#F5D76E', 2, 2, 1, 2, 'Baviere', '50cl', 'Plus ancienne brasserie de Munich (1328) et la preferee des locaux.', '🍻', true, 'approved'),
('Schlenkerla Rauchbier', 'Schlenkerla', '🇩🇪', 'DE', 'Rauchbier', 5.1, 30, 1500, 'epic', '#5C2D1A', 3, 1, 1, 4, 'Baviere', '50cl', 'Malt fume au bois de hetre. Le patron "schlenkerte" (titubait).', '🔥', true, 'approved'),

-- ═══ USA ═══
('Pliny the Elder', 'Russian River', '🇺🇸', 'US', 'Double IPA', 8.0, 100, 1500, 'legendary', '#5B8C3E', 5, 1, 4, 3, 'Californie', '50cl', 'Le record mondial d''amertume est 2500 IBU — imbuvable.', '🔥', true, 'approved'),
('Heady Topper', 'The Alchemist', '🇺🇸', 'US', 'Double IPA', 8.0, 75, 1500, 'legendary', '#3D8B6E', 4, 1, 5, 3, 'Vermont', '47cl', 'La canette dit "Drink from the can" — le brasseur prefere ca.', '🥫', true, 'approved'),
('Sierra Nevada Pale Ale', 'Sierra Nevada', '🇺🇸', 'US', 'American Pale Ale', 5.6, 38, 1500, 'common', '#D4952B', 3, 1, 3, 2, 'Californie', '35.5cl', 'A lance la revolution craft americaine en 1980.', '🇺🇸', true, 'approved'),

-- ═══ TCHEQUIE ═══
('Pilsner Urquell', 'Plzensky Prazdroj', '🇨🇿', 'CZ', 'Czech Pilsner', 4.4, 40, 1500, 'common', '#F5D76E', 3, 1, 1, 2, 'Boheme', '50cl', 'La premiere pilsner au monde, brassee en 1842 a Plzen.', '🏆', true, 'approved'),

-- ═══ UK / IRLANDE ═══
('Guinness Draught', 'Guinness', '🇮🇪', 'IE', 'Stout', 4.2, 45, 1500, 'common', '#6B4C3B', 4, 2, 1, 5, 'Dublin', '44cl', '"Stout" signifiait "fort". Les premiers stouts etaient des porters survitamines.', '💪', true, 'approved'),
('Punk IPA', 'BrewDog', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'GB', 'IPA', 5.4, 35, 1500, 'common', '#4ECDC4', 4, 1, 3, 2, 'Ecosse', '33cl', 'BrewDog a leve des fonds via "Equity for Punks", du crowdfunding brassicole.', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', true, 'approved'),

-- ═══ FRANCE ═══
('Gallia Lager', 'Gallia Paris', '🇫🇷', 'FR', 'Lager', 5.0, 18, 1500, 'common', '#F5D76E', 2, 2, 1, 2, 'Ile-de-France', '33cl', 'Fondee en 1890, fermee en 1968, ressuscitee en 2014 a Pantin.', '🗼', true, 'approved'),
('Ninkasi IPA', 'Ninkasi', '🇫🇷', 'FR', 'IPA', 5.4, 45, 1500, 'common', '#A8CF45', 4, 1, 3, 2, 'Auvergne-Rhone-Alpes', '33cl', 'Ninkasi est la deesse sumerienne de la biere.', '⚡', true, 'approved'),

-- ═══ VENDEE (focus local) ═══
('Melusine Blonde', 'Brasserie Melusine', '🇫🇷', 'FR', 'Blonde Ale', 6.5, 20, 1500, 'rare', '#F5D76E', 2, 2, 2, 3, 'Vendee', '33cl', 'Nommee d''apres la fee Melusine, figure du folklore vendeen.', '🧚', true, 'approved'),
('Melusine Ambree', 'Brasserie Melusine', '🇫🇷', 'FR', 'Amber Ale', 7.0, 25, 1500, 'rare', '#B8712D', 2, 3, 2, 4, 'Vendee', '33cl', 'Le bocage vendeen en bouteille — chaude et boisee.', '🌳', true, 'approved'),
('Melusine Blanche', 'Brasserie Melusine', '🇫🇷', 'FR', 'Witbier', 5.0, 12, 1500, 'common', '#F0E8D0', 1, 3, 3, 2, 'Vendee', '33cl', 'Legere et epicee, parfaite pour un apero vendeen.', '🌿', true, 'approved'),
('Troussepinette', 'Brasserie Vendeenne', '🇫🇷', 'FR', 'Fruit Beer', 5.0, 10, 1500, 'rare', '#C45B8A', 1, 4, 5, 2, 'Vendee', '33cl', 'La troussepinette est un aperitif vendeen traditionnel.', '🫐', true, 'approved'),

-- ═══ JAPON ═══
('Hitachino Nest White', 'Kiuchi Brewery', '🇯🇵', 'JP', 'Witbier', 5.5, 13, 1500, 'rare', '#F0E8D0', 1, 3, 4, 2, 'Ibaraki', '33cl', 'La brasserie Kiuchi existe depuis 1823. L''hibou = sagesse.', '🦉', true, 'approved'),

-- ═══ DANEMARK ═══
('Mikkeller Beer Geek Breakfast', 'Mikkeller', '🇩🇰', 'DK', 'Oatmeal Stout', 7.5, 45, 1500, 'rare', '#2D1A0E', 3, 3, 2, 5, 'Copenhague', '33cl', 'Mikkel a commence dans sa cuisine en 2006. 40+ bars dans le monde.', '🍳', true, 'approved'),

-- ═══ CANADA ═══
('La Fin du Monde', 'Unibroue', '🇨🇦', 'CA', 'Tripel', 9.0, 19, 1500, 'rare', '#E8C838', 2, 3, 4, 4, 'Quebec', '34.1cl', 'Les explorateurs pensaient etre arrives au bout du monde au Quebec.', '🗺️', true, 'approved');
