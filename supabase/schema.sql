-- ═══════════════════════════════════════════════════════════════
-- GLUPP — Schéma Supabase complet
-- Exécuter dans Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ─── Extensions ───
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- Pour la recherche fuzzy

-- ═══════════════════════════════════════════
-- TABLES PRINCIPALES
-- ═══════════════════════════════════════════

-- ─── Profils utilisateurs ───
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  xp INTEGER DEFAULT 0,
  duels_played INTEGER DEFAULT 0,
  beers_tasted INTEGER DEFAULT 0,
  photos_taken INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Bières ───
CREATE TABLE beers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  brewery TEXT NOT NULL,
  country TEXT NOT NULL,         -- Code emoji flag (🇧🇪, 🇫🇷, etc.)
  country_code TEXT NOT NULL,    -- ISO 3166-1 alpha-2 (BE, FR, etc.)
  style TEXT NOT NULL,
  abv DECIMAL(4,2),             -- Alcool (ex: 8.40)
  ibu INTEGER,                  -- Amertume
  elo INTEGER DEFAULT 1500,
  total_votes INTEGER DEFAULT 0,
  color TEXT DEFAULT '#E08840',  -- Couleur d'affichage hex
  -- Profil gustatif (1-5)
  taste_bitter INTEGER DEFAULT 3 CHECK (taste_bitter BETWEEN 1 AND 5),
  taste_sweet INTEGER DEFAULT 3 CHECK (taste_sweet BETWEEN 1 AND 5),
  taste_fruity INTEGER DEFAULT 3 CHECK (taste_fruity BETWEEN 1 AND 5),
  taste_body INTEGER DEFAULT 3 CHECK (taste_body BETWEEN 1 AND 5),
  -- Rareté
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common','rare','epic','legendary')),
  -- Métadonnées
  description TEXT,
  image_url TEXT,
  barcode TEXT,                  -- Pour le scan
  fun_fact TEXT,
  fun_fact_icon TEXT DEFAULT '💡',
  -- Passeport / Région
  region TEXT,                   -- Ex: "Vendée", "Wallonie", "Bavaria"
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour la recherche
CREATE INDEX idx_beers_name_trgm ON beers USING gin(name gin_trgm_ops);
CREATE INDEX idx_beers_brewery_trgm ON beers USING gin(brewery gin_trgm_ops);
CREATE INDEX idx_beers_style ON beers(style);
CREATE INDEX idx_beers_country_code ON beers(country_code);
CREATE INDEX idx_beers_rarity ON beers(rarity);
CREATE INDEX idx_beers_elo ON beers(elo DESC);
CREATE INDEX idx_beers_barcode ON beers(barcode) WHERE barcode IS NOT NULL;

-- ─── Collection utilisateur (Pokédex) ───
CREATE TABLE user_beers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  beer_id UUID NOT NULL REFERENCES beers(id) ON DELETE CASCADE,
  tasted_at TIMESTAMPTZ DEFAULT NOW(),
  photo_url TEXT,
  geo_lat DECIMAL(10,7),
  geo_lng DECIMAL(10,7),
  bar_name TEXT,                -- Où la bière a été bue
  notes TEXT,                   -- Note personnelle
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),  -- Note perso (pas ELO)
  UNIQUE(user_id, beer_id)
);

CREATE INDEX idx_user_beers_user ON user_beers(user_id);
CREATE INDEX idx_user_beers_beer ON user_beers(beer_id);

-- ─── Duels ───
CREATE TABLE duels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  beer_a_id UUID NOT NULL REFERENCES beers(id),
  beer_b_id UUID NOT NULL REFERENCES beers(id),
  winner_id UUID NOT NULL REFERENCES beers(id),
  -- ELO avant/après pour historique
  beer_a_elo_before INTEGER NOT NULL,
  beer_a_elo_after INTEGER NOT NULL,
  beer_b_elo_before INTEGER NOT NULL,
  beer_b_elo_after INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_duels_user ON duels(user_id);
CREATE INDEX idx_duels_created ON duels(created_at DESC);

-- ─── Bars ───
CREATE TABLE bars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  geo_lat DECIMAL(10,7),
  geo_lng DECIMAL(10,7),
  rating DECIMAL(3,2) DEFAULT 0,
  total_votes INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bars_city ON bars(city);
CREATE INDEX idx_bars_geo ON bars(geo_lat, geo_lng);

-- ─── Menu des bars (bières disponibles) ───
CREATE TABLE bar_beers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bar_id UUID NOT NULL REFERENCES bars(id) ON DELETE CASCADE,
  beer_id UUID NOT NULL REFERENCES beers(id) ON DELETE CASCADE,
  price DECIMAL(5,2),
  votes INTEGER DEFAULT 0,       -- Votes communautaires "j'ai vu cette bière ici"
  reported_by UUID REFERENCES profiles(id),
  last_confirmed TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(bar_id, beer_id)
);

-- ─── Amis ───
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_a UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_a, user_b),
  CHECK (user_a < user_b)  -- Évite les doublons inversés
);

CREATE INDEX idx_friendships_users ON friendships(user_a, user_b);

-- ─── Groupes (Crews) ───
CREATE TABLE crews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  streak INTEGER DEFAULT 0,     -- Sorties consécutives
  glupps_together INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE crew_members (
  crew_id UUID NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin','member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (crew_id, user_id)
);

-- ─── Activité / Feed (Glupp Live) ───
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('glupp','duel','trophy','level_up','photo','tag','crew_glupp')),
  beer_id UUID REFERENCES beers(id),
  bar_id UUID REFERENCES bars(id),
  crew_id UUID REFERENCES crews(id),
  photo_url TEXT,
  geo_lat DECIMAL(10,7),
  geo_lng DECIMAL(10,7),
  metadata JSONB DEFAULT '{}',  -- Données flexibles (tags, XP gagné, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activities_user ON activities(user_id);
CREATE INDEX idx_activities_created ON activities(created_at DESC);
CREATE INDEX idx_activities_type ON activities(type);

-- ─── Tags amis sur activités ───
CREATE TABLE activity_tags (
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  tagged_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (activity_id, tagged_user_id)
);

-- ─── Trophées (définitions) ───
CREATE TABLE trophies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  emoji TEXT DEFAULT '🏆',
  category TEXT,                -- Ex: "trappiste", "style", "region", "social"
  condition_type TEXT NOT NULL,  -- Ex: "beers_by_style", "beers_by_country", "duels_count"
  condition_value JSONB NOT NULL, -- Ex: {"style":"IPA","count":15} ou {"country":"BE","count":6}
  token_value DECIMAL(4,2) DEFAULT 0,
  xp_reward INTEGER DEFAULT 200,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Trophées utilisateur ───
CREATE TABLE user_trophies (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trophy_id UUID NOT NULL REFERENCES trophies(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,   -- Progression actuelle
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, trophy_id)
);

-- ─── Glupp of the Week ───
CREATE TABLE glupp_of_week (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  beer_id UUID NOT NULL REFERENCES beers(id),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  bonus_xp INTEGER DEFAULT 50,
  participants INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Votes contextuels (classement par moment) ───
CREATE TABLE moment_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  beer_id UUID NOT NULL REFERENCES beers(id),
  moment TEXT NOT NULL CHECK (moment IN ('barbecue','hiver','apero','rdv','soiree','brunch')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, beer_id, moment)
);

-- ═══════════════════════════════════════════
-- FONCTIONS
-- ═══════════════════════════════════════════

-- ─── Créer un profil automatiquement à l'inscription ───
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── Traitement d'un duel (calcul ELO côté serveur) ───
CREATE OR REPLACE FUNCTION process_duel(
  p_user_id UUID,
  p_beer_a_id UUID,
  p_beer_b_id UUID,
  p_winner_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_elo_a INTEGER;
  v_elo_b INTEGER;
  v_expected_a DECIMAL;
  v_expected_b DECIMAL;
  v_new_elo_a INTEGER;
  v_new_elo_b INTEGER;
  v_k INTEGER := 32;
  v_xp_gain INTEGER := 15;
BEGIN
  -- Vérifier que l'utilisateur a goûté les deux bières
  IF NOT EXISTS (SELECT 1 FROM user_beers WHERE user_id = p_user_id AND beer_id = p_beer_a_id) THEN
    RAISE EXCEPTION 'Tu n''as pas encore goûté cette bière !';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM user_beers WHERE user_id = p_user_id AND beer_id = p_beer_b_id) THEN
    RAISE EXCEPTION 'Tu n''as pas encore goûté cette bière !';
  END IF;

  -- Récupérer ELO actuels
  SELECT elo INTO v_elo_a FROM beers WHERE id = p_beer_a_id;
  SELECT elo INTO v_elo_b FROM beers WHERE id = p_beer_b_id;

  -- Calcul ELO
  v_expected_a := 1.0 / (1.0 + POWER(10, (v_elo_b - v_elo_a)::DECIMAL / 400));
  v_expected_b := 1.0 / (1.0 + POWER(10, (v_elo_a - v_elo_b)::DECIMAL / 400));

  IF p_winner_id = p_beer_a_id THEN
    v_new_elo_a := ROUND(v_elo_a + v_k * (1 - v_expected_a));
    v_new_elo_b := ROUND(v_elo_b + v_k * (0 - v_expected_b));
  ELSE
    v_new_elo_a := ROUND(v_elo_a + v_k * (0 - v_expected_a));
    v_new_elo_b := ROUND(v_elo_b + v_k * (1 - v_expected_b));
  END IF;

  -- Mettre à jour les ELO
  UPDATE beers SET elo = v_new_elo_a, total_votes = total_votes + 1, updated_at = NOW() WHERE id = p_beer_a_id;
  UPDATE beers SET elo = v_new_elo_b, total_votes = total_votes + 1, updated_at = NOW() WHERE id = p_beer_b_id;

  -- Enregistrer le duel
  INSERT INTO duels (user_id, beer_a_id, beer_b_id, winner_id, beer_a_elo_before, beer_a_elo_after, beer_b_elo_before, beer_b_elo_after)
  VALUES (p_user_id, p_beer_a_id, p_beer_b_id, p_winner_id, v_elo_a, v_new_elo_a, v_elo_b, v_new_elo_b);

  -- XP + stats
  UPDATE profiles SET xp = xp + v_xp_gain, duels_played = duels_played + 1, updated_at = NOW() WHERE id = p_user_id;

  -- Activité
  INSERT INTO activities (user_id, type, beer_id, metadata)
  VALUES (p_user_id, 'duel', p_winner_id, jsonb_build_object('loser', CASE WHEN p_winner_id = p_beer_a_id THEN p_beer_b_id ELSE p_beer_a_id END, 'xp', v_xp_gain));

  RETURN jsonb_build_object(
    'beer_a_elo', v_new_elo_a,
    'beer_b_elo', v_new_elo_b,
    'xp_gained', v_xp_gain
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Enregistrer un glupp (bière goûtée) ───
CREATE OR REPLACE FUNCTION register_glupp(
  p_user_id UUID,
  p_beer_id UUID,
  p_photo_url TEXT DEFAULT NULL,
  p_geo_lat DECIMAL DEFAULT NULL,
  p_geo_lng DECIMAL DEFAULT NULL,
  p_bar_name TEXT DEFAULT NULL,
  p_tagged_users UUID[] DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
  v_xp_gain INTEGER := 5;  -- Base: scan
  v_beer_rarity TEXT;
  v_tagged UUID;
BEGIN
  -- Vérifier pas déjà dans collection
  IF EXISTS (SELECT 1 FROM user_beers WHERE user_id = p_user_id AND beer_id = p_beer_id) THEN
    RAISE EXCEPTION 'Tu as déjà gluppé cette bière !';
  END IF;

  -- Calculer XP
  IF p_photo_url IS NOT NULL AND p_geo_lat IS NOT NULL THEN
    v_xp_gain := 40;  -- Photo + Géo
  ELSIF p_photo_url IS NOT NULL THEN
    v_xp_gain := 20;  -- Photo seule
  END IF;

  -- Bonus rareté
  SELECT rarity INTO v_beer_rarity FROM beers WHERE id = p_beer_id;
  IF v_beer_rarity = 'rare' THEN v_xp_gain := v_xp_gain + 10;
  ELSIF v_beer_rarity = 'epic' THEN v_xp_gain := v_xp_gain + 30;
  ELSIF v_beer_rarity = 'legendary' THEN v_xp_gain := v_xp_gain + 50;
  END IF;

  -- Ajouter à la collection
  INSERT INTO user_beers (user_id, beer_id, photo_url, geo_lat, geo_lng, bar_name)
  VALUES (p_user_id, p_beer_id, p_photo_url, p_geo_lat, p_geo_lng, p_bar_name);

  -- XP + stats
  UPDATE profiles SET
    xp = xp + v_xp_gain,
    beers_tasted = beers_tasted + 1,
    photos_taken = photos_taken + CASE WHEN p_photo_url IS NOT NULL THEN 1 ELSE 0 END,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Activité
  INSERT INTO activities (user_id, type, beer_id, photo_url, geo_lat, geo_lng, metadata)
  VALUES (p_user_id, 'glupp', p_beer_id, p_photo_url, p_geo_lat, p_geo_lng,
    jsonb_build_object('xp', v_xp_gain, 'bar', p_bar_name, 'rarity', v_beer_rarity));

  -- Tag amis (ajouter aussi dans leur collection)
  FOREACH v_tagged IN ARRAY p_tagged_users
  LOOP
    INSERT INTO user_beers (user_id, beer_id, bar_name)
    VALUES (v_tagged, p_beer_id, p_bar_name)
    ON CONFLICT (user_id, beer_id) DO NOTHING;

    UPDATE profiles SET beers_tasted = beers_tasted + 1, xp = xp + 10, updated_at = NOW()
    WHERE id = v_tagged;

    -- Tag XP pour le tagueur
    v_xp_gain := v_xp_gain + 10;
  END LOOP;

  -- Mettre à jour XP total (avec tags)
  IF array_length(p_tagged_users, 1) > 0 THEN
    UPDATE profiles SET xp = xp + (array_length(p_tagged_users, 1) * 10) WHERE id = p_user_id;
  END IF;

  RETURN jsonb_build_object(
    'xp_gained', v_xp_gain,
    'rarity', v_beer_rarity,
    'tags_count', COALESCE(array_length(p_tagged_users, 1), 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Recherche de bières (fuzzy) ───
CREATE OR REPLACE FUNCTION search_beers(p_query TEXT, p_limit INTEGER DEFAULT 20)
RETURNS SETOF beers AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM beers
  WHERE
    name ILIKE '%' || p_query || '%' OR
    brewery ILIKE '%' || p_query || '%' OR
    style ILIKE '%' || p_query || '%' OR
    country ILIKE '%' || p_query || '%' OR
    region ILIKE '%' || p_query || '%'
  ORDER BY
    CASE WHEN name ILIKE p_query || '%' THEN 0 ELSE 1 END,  -- Priorité prefix match
    elo DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════
-- ROW LEVEL SECURITY (RGPD)
-- ═══════════════════════════════════════════

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_beers ENABLE ROW LEVEL SECURITY;
ALTER TABLE duels ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE crews ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE moment_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_trophies ENABLE ROW LEVEL SECURITY;

-- Profils : visible par tous, modifiable par soi-même
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Bières : lisibles par tous (pas de RLS sur beers, bars, trophies, glupp_of_week)

-- Collection : visible par tous, insert/update par propriétaire
CREATE POLICY "User beers viewable by everyone" ON user_beers FOR SELECT USING (true);
CREATE POLICY "Users can insert own beers" ON user_beers FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Duels : visible par tous, insert par propriétaire
CREATE POLICY "Duels viewable by everyone" ON duels FOR SELECT USING (true);
CREATE POLICY "Users can insert own duels" ON duels FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Activités : visible par tous
CREATE POLICY "Activities viewable by everyone" ON activities FOR SELECT USING (true);
CREATE POLICY "Users can insert own activities" ON activities FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Amis : visible par les concernés
CREATE POLICY "Friendships viewable by involved users" ON friendships FOR SELECT
  USING (auth.uid() = user_a OR auth.uid() = user_b);
CREATE POLICY "Users can create friendships" ON friendships FOR INSERT
  WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b);
CREATE POLICY "Users can update friendships" ON friendships FOR UPDATE
  USING (auth.uid() = user_a OR auth.uid() = user_b);

-- Crews : visible par membres
CREATE POLICY "Crews viewable by everyone" ON crews FOR SELECT USING (true);
CREATE POLICY "Crew members viewable by everyone" ON crew_members FOR SELECT USING (true);
CREATE POLICY "Users can join crews" ON crew_members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Votes moment
CREATE POLICY "Moment votes viewable by everyone" ON moment_votes FOR SELECT USING (true);
CREATE POLICY "Users can insert own moment votes" ON moment_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trophées utilisateur
CREATE POLICY "User trophies viewable by everyone" ON user_trophies FOR SELECT USING (true);

-- Tags
CREATE POLICY "Tags viewable by everyone" ON activity_tags FOR SELECT USING (true);
