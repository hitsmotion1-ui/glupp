-- ═══════════════════════════════════════════
-- GLUPP — Seed Trophées (~15)
-- Exécuter dans Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════

INSERT INTO trophies (name, description, emoji, category, condition_type, condition_value, xp_reward) VALUES
-- Collection
('Premier Glupp', 'Goûte ta première bière', '🍺', 'collection', 'beers_tasted', '{"count": 1}', 50),
('Collectionneur', 'Goûte 50 bières différentes', '📚', 'collection', 'beers_tasted', '{"count": 50}', 300),
('Maître Brasseur', 'Goûte 200 bières différentes', '👑', 'collection', 'beers_tasted', '{"count": 200}', 500),

-- Styles
('Maître IPA', 'Goûte 10 IPAs', '🌿', 'style', 'beers_by_style', '{"style": "IPA", "count": 10}', 200),
('Sorcier Stout', 'Goûte 5 Stouts', '🍫', 'style', 'beers_by_style', '{"style": "Stout", "count": 5}', 200),
('Expert Blanche', 'Goûte 10 bières blanches', '🌾', 'style', 'beers_by_style', '{"style": "Wheat Beer", "count": 10}', 200),

-- Pays
('Explorateur Belge', 'Goûte 10 bières belges', '🇧🇪', 'region', 'beers_by_country', '{"country": "🇧🇪", "count": 10}', 200),
('Connaisseur Français', 'Goûte 15 bières françaises', '🇫🇷', 'region', 'beers_by_country', '{"country": "🇫🇷", "count": 15}', 200),
('Globe-Trotter', 'Goûte des bières de 5 pays différents', '🌍', 'region', 'countries_count', '{"count": 5}', 300),

-- Rareté
('Chasseur de Légendes', 'Goûte 3 bières légendaires', '⚡', 'rarity', 'beers_by_rarity', '{"rarity": "legendary", "count": 3}', 300),
('Épique Aventurier', 'Goûte 10 bières épiques', '💎', 'rarity', 'beers_by_rarity', '{"rarity": "epic", "count": 10}', 200),

-- Social
('Ambassadeur', 'Ajoute 5 amis', '🤝', 'social', 'friends_count', '{"count": 5}', 200),
('Dueliste Acharné', 'Joue 50 duels', '⚔️', 'social', 'duels_count', '{"count": 50}', 200),

-- Photos
('Photographe', 'Prends 10 photos de bières', '📸', 'photos', 'photos_count', '{"count": 10}', 200),
('Instagrammeur', 'Prends 30 photos de bières', '🎨', 'photos', 'photos_count', '{"count": 30}', 300)

ON CONFLICT DO NOTHING;
