-- ═══════════════════════════════════════════════════════════════
-- GLUPP — Seed Data
-- 50 bières craft + bars Vendée + trophées + GOTW
-- ═══════════════════════════════════════════════════════════════

-- ─── BIÈRES ───
-- Belgique (Trappistes + Craft)
INSERT INTO beers (name, brewery, country, country_code, style, abv, ibu, elo, rarity, color, taste_bitter, taste_sweet, taste_fruity, taste_body, region, fun_fact, fun_fact_icon) VALUES
('Chimay Bleue', 'Chimay', '🇧🇪', 'BE', 'Belgian Strong Dark', 9.0, 35, 1889, 'epic', '#2D5F8A', 3, 4, 3, 5, 'Wallonie', 'Le label trappiste exige que la bière soit brassée dans un monastère, sous contrôle des moines.', '📜'),
('Rochefort 10', 'Rochefort', '🇧🇪', 'BE', 'Quadrupel', 11.3, 27, 1934, 'legendary', '#8E3B2F', 2, 5, 3, 5, 'Wallonie', 'Rochefort 10 est brassée par 15 moines. La recette n''a pas changé depuis 1950.', '⛪'),
('Tripel Karmeliet', 'Brouwerij Bosteels', '🇧🇪', 'BE', 'Tripel', 8.4, 20, 1876, 'rare', '#E8A838', 2, 3, 3, 4, 'Flandre', 'Le terme "Tripel" vient des marques XXX que les moines inscrivaient sur les fûts les plus costauds.', '🧑‍⚖️'),
('Chouffe Blonde', 'Brasserie d''Achouffe', '🇧🇪', 'BE', 'Belgian Blonde', 8.0, 20, 1847, 'rare', '#F5A623', 2, 3, 2, 3, 'Ardennes', 'La Chouffe tire son nom du lutin des Ardennes belges. Fondée dans un garage en 1982.', '🧝'),
('Orval', 'Abbaye d''Orval', '🇧🇪', 'BE', 'Belgian Pale Ale', 6.2, 36, 1891, 'epic', '#D4952B', 4, 2, 2, 3, 'Luxembourg', 'Orval est la seule trappiste refermentée avec des levures Brettanomyces.', '🧫'),
('Westmalle Tripel', 'Westmalle', '🇧🇪', 'BE', 'Tripel', 9.5, 38, 1903, 'epic', '#E8C838', 3, 3, 3, 4, 'Anvers', 'Westmalle a inventé le style Tripel en 1934. Toutes les tripels descendent de celle-ci.', '👑'),
('Westvleteren 12', 'Sint-Sixtus', '🇧🇪', 'BE', 'Quadrupel', 10.2, 35, 1956, 'legendary', '#5C2D1A', 2, 5, 4, 5, 'Flandre-Occidentale', 'On ne peut acheter Westvleteren qu''en réservant par téléphone à l''abbaye. Production limitée.', '☎️'),
('Saison Dupont', 'Brasserie Dupont', '🇧🇪', 'BE', 'Saison', 6.5, 30, 1856, 'rare', '#C4923A', 3, 2, 3, 2, 'Hainaut', 'Les Saisons étaient brassées en hiver par les fermiers wallons pour les saisonniers d''été.', '🌾'),
('Delirium Tremens', 'Huyghe', '🇧🇪', 'BE', 'Belgian Strong Pale', 8.5, 26, 1835, 'rare', '#F0C460', 2, 3, 3, 3, 'Flandre', 'L''éléphant rose de Delirium est devenu un symbole mondial de la bière craft.', '🐘'),
('Duvel', 'Duvel Moortgat', '🇧🇪', 'BE', 'Belgian Strong Pale', 8.5, 32, 1868, 'common', '#F5D76E', 3, 2, 2, 3, 'Anvers', 'Duvel signifie "diable" en dialecte flamand. Un testeur a dit "c''est un vrai diable" à la dégustation.', '😈'),

-- UK & Irlande
('Punk IPA', 'BrewDog', '🇬🇧', 'GB', 'IPA', 5.4, 35, 1792, 'common', '#4ECDC4', 4, 1, 3, 2, 'Scotland', 'BrewDog a levé des fonds via "Equity for Punks", une campagne de crowdfunding brassicole.', '🏴󠁧󠁢󠁳󠁣󠁴󠁿'),
('Guinness Draught', 'Guinness', '🇮🇪', 'IE', 'Stout', 4.2, 45, 1834, 'common', '#6B4C3B', 4, 2, 1, 5, 'Dublin', '"Stout" signifiait juste "fort" en anglais. Les premiers stouts étaient des porters survitaminés.', '💪'),
('London Pride', 'Fuller''s', '🇬🇧', 'GB', 'ESB', 4.7, 30, 1745, 'common', '#B8712D', 3, 2, 2, 3, 'London', 'Fuller''s brasse au même endroit à Chiswick depuis 1845.', '🏛️'),
('Old Speckled Hen', 'Morland', '🇬🇧', 'GB', 'English Pale Ale', 5.0, 28, 1723, 'common', '#C4923A', 3, 3, 2, 3, 'Oxfordshire', 'Nommée d''après une vieille voiture MG couverte de peinture dans l''usine.', '🚗'),

-- Allemagne
('Weihenstephaner Hefe', 'Weihenstephan', '🇩🇪', 'DE', 'Hefeweizen', 5.4, 14, 1803, 'rare', '#D4952B', 1, 3, 4, 3, 'Bavaria', 'Weihenstephan, fondée en 1040, est la plus ancienne brasserie en activité au monde.', '🏰'),
('Paulaner Hefe', 'Paulaner', '🇩🇪', 'DE', 'Hefeweizen', 5.5, 12, 1756, 'common', '#E8C838', 1, 3, 4, 3, 'Bavaria', 'Les moines Paulaner brassaient cette bière comme "pain liquide" pendant le carême.', '🍞'),
('Augustiner Helles', 'Augustiner', '🇩🇪', 'DE', 'Helles Lager', 5.2, 20, 1812, 'rare', '#F5D76E', 2, 2, 1, 2, 'Munich', 'Augustiner est la plus ancienne brasserie de Munich (1328) et la préférée des locaux.', '🍻'),
('Schlenkerla Rauchbier', 'Schlenkerla', '🇩🇪', 'DE', 'Rauchbier', 5.1, 30, 1778, 'rare', '#5C2D1A', 3, 1, 1, 4, 'Bamberg', 'Le malt est fumé au bois de hêtre. Le nom vient du patron qui "schlenkerte" (titubait).', '🔥'),

-- USA
('Pliny the Elder', 'Russian River', '🇺🇸', 'US', 'Double IPA', 8.0, 100, 1921, 'epic', '#5B8C3E', 5, 1, 4, 3, 'California', 'Le record du monde d''amertume est 2500 IBU — quasiment imbuvable.', '🔥'),
('Heady Topper', 'The Alchemist', '🇺🇸', 'US', 'Double IPA', 8.0, 75, 1908, 'legendary', '#3D8B6E', 4, 1, 5, 3, 'Vermont', 'La canette dit "Drink from the can" — le brasseur préfère qu''on ne la verse pas.', '🥫'),
('Sierra Nevada Pale Ale', 'Sierra Nevada', '🇺🇸', 'US', 'American Pale Ale', 5.6, 38, 1801, 'common', '#D4952B', 3, 1, 3, 2, 'California', 'Cette bière a lancé la révolution craft américaine en 1980.', '🇺🇸'),
('Founders KBS', 'Founders', '🇺🇸', 'US', 'Imperial Stout', 12.0, 70, 1912, 'epic', '#1A1A1A', 4, 4, 2, 5, 'Michigan', 'KBS = Kentucky Breakfast Stout. Vieillie en fûts de bourbon avec du café et du chocolat.', '☕'),
('Bell''s Two Hearted', 'Bell''s Brewery', '🇺🇸', 'US', 'American IPA', 7.0, 55, 1845, 'common', '#C4923A', 4, 1, 3, 3, 'Michigan', 'Nommée d''après la rivière Two Hearted dans le Michigan, chère à Hemingway.', '🎣'),
('Dogfish Head 60 Min', 'Dogfish Head', '🇺🇸', 'US', 'IPA', 6.0, 60, 1789, 'common', '#7BAD5E', 4, 1, 3, 2, 'Delaware', 'Le houblon est ajouté en continu pendant 60 minutes — d''où le nom.', '⏱️'),
('Toppling Goliath Pseudo Sue', 'Toppling Goliath', '🇺🇸', 'US', 'American Pale Ale', 5.8, 50, 1867, 'rare', '#A8CF45', 3, 1, 4, 2, 'Iowa', 'Sue est nommée d''après le plus grand squelette de T-Rex jamais trouvé.', '🦖'),

-- France
('Gallia Lager', 'Gallia Paris', '🇫🇷', 'FR', 'Lager', 5.0, 18, 1734, 'common', '#F5D76E', 2, 2, 1, 2, 'Paris', 'Gallia a été fondée en 1890, fermée en 1968, et ressuscitée en 2014 à Pantin.', '🗼'),
('Brasserie du Mont-Blanc Blanche', 'Brasserie du Mont-Blanc', '🇫🇷', 'FR', 'Witbier', 4.7, 12, 1712, 'common', '#F0E8D0', 1, 3, 3, 2, 'Savoie', 'Brassée avec l''eau des glaciers du Mont-Blanc à 1000m d''altitude.', '🏔️'),
('Ninkasi IPA', 'Ninkasi', '🇫🇷', 'FR', 'IPA', 5.4, 45, 1756, 'common', '#A8CF45', 4, 1, 3, 2, 'Lyon', 'Ninkasi est la déesse sumérienne de la bière. La brasserie lyonnaise porte son nom.', '⚡'),
('Bière des Amis', 'Brasserie de la Senne', '🇫🇷', 'FR', 'Belgian Blonde', 5.8, 22, 1723, 'common', '#E8C838', 2, 2, 2, 3, 'Brussels', 'Une blonde de session parfaite — le nom dit tout.', '🤝'),

-- Vendée (focus local)
('Mélusine Blonde', 'Brasserie Mélusine', '🇫🇷', 'FR', 'Blonde Ale', 6.5, 20, 1798, 'rare', '#F5D76E', 2, 2, 2, 3, 'Vendée', 'Nommée d''après la fée Mélusine, figure du folklore vendéen et poitevin.', '🧚'),
('L''Ambrée du Bocage', 'Brasserie Mélusine', '🇫🇷', 'FR', 'Amber Ale', 7.0, 25, 1767, 'rare', '#B8712D', 3, 3, 2, 4, 'Vendée', 'Le bocage vendéen est un paysage de haies et de champs — cette bière en capture la chaleur.', '🌳'),
('Troussepinette', 'Brasserie Vendéenne', '🇫🇷', 'FR', 'Fruit Beer', 5.0, 10, 1689, 'rare', '#C45B8A', 1, 4, 5, 2, 'Vendée', 'La troussepinette est un apéritif vendéen traditionnel à base d''épines noires.', '🫐'),
('Blanche des Marais', 'Brasserie du Marais Poitevin', '🇫🇷', 'FR', 'Witbier', 4.5, 15, 1701, 'common', '#F0E8D0', 1, 3, 3, 2, 'Vendée', 'Brassée à deux pas du Marais Poitevin, la Venise verte.', '🛶'),
('IPA du Littoral', 'Brasserie de l''Île de Ré', '🇫🇷', 'FR', 'IPA', 6.2, 55, 1745, 'common', '#7BAD5E', 4, 1, 3, 2, 'Vendée', 'L''île de Ré ajoute du sel de mer dans le processus — ça donne une touche marine unique.', '🌊'),

-- Tchéquie & Autriche
('Pilsner Urquell', 'Plzeňský Prazdroj', '🇨🇿', 'CZ', 'Czech Pilsner', 4.4, 40, 1823, 'common', '#F5D76E', 3, 1, 1, 2, 'Bohemia', 'La première pilsner au monde, brassée en 1842 à Plzeň. Toutes les lagers blondes en descendent.', '🏆'),
('Budvar', 'Budějovický Budvar', '🇨🇿', 'CZ', 'Czech Lager', 5.0, 22, 1778, 'common', '#E8C838', 2, 2, 1, 3, 'Bohemia', 'Le "vrai" Budweiser — la bataille juridique avec AB InBev dure depuis plus de 100 ans.', '⚖️'),

-- Japon
('Hitachino Nest White', 'Kiuchi Brewery', '🇯🇵', 'JP', 'Witbier', 5.5, 13, 1789, 'rare', '#F0E8D0', 1, 3, 4, 2, 'Ibaraki', 'La brasserie Kiuchi existe depuis 1823. L''hibou de la marque est un symbole de sagesse.', '🦉'),
('Asahi Super Dry', 'Asahi', '🇯🇵', 'JP', 'Japanese Lager', 5.0, 18, 1734, 'common', '#F5F0E8', 2, 1, 1, 1, 'Tokyo', 'Le style "Super Dry" a été inventé par Asahi en 1987 et a révolutionné la bière au Japon.', '🗾'),

-- Mexique
('Modelo Especial', 'Grupo Modelo', '🇲🇽', 'MX', 'Mexican Lager', 4.4, 18, 1712, 'common', '#F5D76E', 1, 2, 1, 2, 'Mexico City', 'Modelo a dépassé Bud Light comme bière la plus vendue aux USA en 2023.', '📈'),

-- Norvège
('Nøgne Ø Imperial Stout', 'Nøgne Ø', '🇳🇴', 'NO', 'Imperial Stout', 9.0, 70, 1856, 'epic', '#1A1A1A', 4, 4, 2, 5, 'Grimstad', 'Nøgne Ø signifie "île nue" — c''est la première microbrasserie de Norvège.', '🏝️'),

-- Australie
('Little Creatures Pale Ale', 'Little Creatures', '🇦🇺', 'AU', 'American Pale Ale', 5.2, 35, 1756, 'common', '#D4952B', 3, 1, 3, 2, 'Fremantle', 'Fondée dans un ancien hangar à bateaux de pêche au crocodile.', '🐊'),

-- Italie
('Birra Moretti', 'Heineken Italia', '🇮🇹', 'IT', 'Lager', 4.6, 18, 1698, 'common', '#F5D76E', 2, 2, 1, 2, 'Udine', 'Le moustachu sur l''étiquette est un vrai personnage photographié dans un bar en 1942.', '🇮🇹'),

-- Espagne
('Alhambra Reserva 1925', 'Cervezas Alhambra', '🇪🇸', 'ES', 'Lager', 6.4, 20, 1778, 'rare', '#E8A838', 2, 3, 1, 4, 'Granada', 'Vieillie 25 jours de plus qu''une lager standard. Le chiffre 1925 est l''année de fondation.', '🏰'),

-- Danemark
('Mikkeller Beer Geek Breakfast', 'Mikkeller', '🇩🇰', 'DK', 'Oatmeal Stout', 7.5, 45, 1867, 'rare', '#2D1A0E', 3, 3, 2, 5, 'Copenhagen', 'Mikkel Borg Bjergsø a commencé à brasser dans sa cuisine en 2006. Aujourd''hui, 40+ bars dans le monde.', '🍳'),

-- Écosse
('BrewDog Hazy Jane', 'BrewDog', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'GB', 'New England IPA', 5.0, 30, 1823, 'common', '#F0C460', 2, 1, 4, 2, 'Scotland', 'La NEIPA est trouble volontairement — les levures en suspension créent la texture juteuse.', '🌫️'),

-- Suisse
('BFM La Torpille', 'Brasserie des Franches-Montagnes', '🇨🇭', 'CH', 'Belgian Strong Dark', 11.0, 25, 1867, 'epic', '#5C2D1A', 2, 5, 3, 5, 'Jura', 'BFM est considérée comme la meilleure brasserie de Suisse. Jérôme Rebetez y est une légende.', '🧀'),

-- Pays-Bas
('La Trappe Quadrupel', 'La Trappe', '🇳🇱', 'NL', 'Quadrupel', 10.0, 22, 1889, 'epic', '#8E3B2F', 2, 5, 3, 5, 'Brabant', 'La Trappe est la seule brasserie trappiste des Pays-Bas.', '🇳🇱'),

-- Canada
('Unibroue La Fin du Monde', 'Unibroue', '🇨🇦', 'CA', 'Tripel', 9.0, 19, 1878, 'rare', '#E8C838', 2, 3, 4, 4, 'Quebec', 'Le nom vient des premiers explorateurs qui pensaient être arrivés au bout du monde au Québec.', '🗺️');

-- ─── BARS (Les Herbiers & environs, Vendée) ───
INSERT INTO bars (name, address, city, geo_lat, geo_lng, rating, total_votes, is_verified) VALUES
('Le Hop Corner', '12 Rue des Brasseurs', 'Les Herbiers', 46.8697, -1.0132, 4.6, 234, true),
('Brasserie du Marché', '5 Place du Marché', 'Les Herbiers', 46.8712, -1.0148, 4.3, 187, true),
('The Galway Pub', '28 Rue de la Soif', 'Les Herbiers', 46.8685, -1.0119, 4.5, 312, true),
('Micro Brasserie Mélusine', 'Route de Pouzauges', 'Chambretaud', 46.9012, -0.9652, 4.8, 156, true),
('Le Petit Zinc', '3 Place de la Gare', 'Les Herbiers', 46.8723, -1.0105, 4.1, 98, false),
('La Taverne du Puy du Fou', '15 Avenue du Puy du Fou', 'Les Épesses', 46.8912, -0.9245, 3.9, 245, true),
('Bar de l''Arbre', '22 Rue Nationale', 'Les Herbiers', 46.8701, -1.0156, 4.0, 67, false),
('O''Brien''s Irish Pub', '8 Rue Victor Hugo', 'La Roche-sur-Yon', 46.6706, -1.4266, 4.4, 421, true),
('La Brasserie Artisanale', '45 Boulevard des Vendéens', 'La Roche-sur-Yon', 46.6723, -1.4285, 4.7, 189, true),
('Le Bar à Mousse', '11 Quai Guiné', 'Les Sables-d''Olonne', 46.4976, -1.7850, 4.6, 356, true);

-- ─── TROPHÉES ───
INSERT INTO trophies (name, description, emoji, category, condition_type, condition_value, token_value, xp_reward) VALUES
('Maître Trappiste', 'Goûte les 6 trappistes belges', '🏆', 'trappiste', 'beers_by_tag', '{"tag":"trappiste","count":6}', 0.8, 500),
('Explorateur Vendéen', 'Découvre 5 bières de Vendée', '🗺️', 'region', 'beers_by_region', '{"region":"Vendée","count":5}', 0.5, 200),
('IPA Warrior', 'Goûte 15 IPA de 5 pays différents', '⚔️', 'style', 'beers_by_style', '{"style":"IPA","count":15,"countries":5}', 1.2, 300),
('Dark Lord', 'Goûte 10 stouts et porters', '🌑', 'style', 'beers_by_style', '{"style":"Stout","count":10}', 0.7, 200),
('Globe Trotter', 'Goûte des bières de 10 pays', '🌍', 'discovery', 'countries_count', '{"count":10}', 1.0, 400),
('Centenaire', 'Atteins 100 bières dans ta collection', '💯', 'collection', 'beers_total', '{"count":100}', 1.5, 500),
('Duelliste Fou', 'Joue 100 duels', '⚔️', 'engagement', 'duels_count', '{"count":100}', 0.8, 300),
('Photographe de Mousse', 'Prends 50 photos de bières', '📸', 'social', 'photos_count', '{"count":50}', 0.6, 200),
('Crew Master', 'Atteins le niveau 5 avec un crew', '👥', 'social', 'crew_level', '{"level":5}', 1.0, 400),
('Légende Vivante', 'Trouve une bière légendaire', '✨', 'rarity', 'beers_by_rarity', '{"rarity":"legendary","count":1}', 2.0, 500),
('Roi de Belgique', 'Complète le Beer Passport Belgique', '🇧🇪', 'passport', 'passport_complete', '{"country":"BE"}', 2.5, 1000),
('Sommelier de Houblon', 'Goûte 5 styles différents', '🎓', 'education', 'styles_count', '{"count":5}', 0.3, 100);

-- ─── GLUPP OF THE WEEK ───
INSERT INTO glupp_of_week (beer_id, week_start, week_end, bonus_xp, participants)
SELECT id, CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '5 days', 50, 2418
FROM beers WHERE name = 'Tripel Karmeliet' LIMIT 1;
