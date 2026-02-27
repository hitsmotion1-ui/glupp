-- ═══════════════════════════════════════════
-- GLUPP — Bar Reviews (Sprint 4 — Map)
-- Table pour les avis des utilisateurs sur les bars
-- ═══════════════════════════════════════════

-- Ajout colonnes Google sur la table bars (si pas deja present)
ALTER TABLE bars ADD COLUMN IF NOT EXISTS google_rating DECIMAL(2,1);
ALTER TABLE bars ADD COLUMN IF NOT EXISTS google_place_id TEXT;

-- Table bar_reviews : un avis par utilisateur par bar
CREATE TABLE IF NOT EXISTS bar_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bar_id UUID NOT NULL REFERENCES bars(id) ON DELETE CASCADE,
  ambiance INTEGER NOT NULL CHECK (ambiance >= 1 AND ambiance <= 5),
  beer_selection INTEGER NOT NULL CHECK (beer_selection >= 1 AND beer_selection <= 5),
  price INTEGER NOT NULL CHECK (price >= 1 AND price <= 5),
  service INTEGER NOT NULL CHECK (service >= 1 AND service <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Un seul avis par user par bar
  UNIQUE(user_id, bar_id)
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_bar_reviews_bar_id ON bar_reviews(bar_id);
CREATE INDEX IF NOT EXISTS idx_bar_reviews_user_id ON bar_reviews(user_id);

-- RLS
ALTER TABLE bar_reviews ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire les avis
CREATE POLICY "bar_reviews_select_all" ON bar_reviews
  FOR SELECT USING (true);

-- Un user peut inserer son propre avis
CREATE POLICY "bar_reviews_insert_own" ON bar_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Un user peut mettre a jour son propre avis
CREATE POLICY "bar_reviews_update_own" ON bar_reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- Un user peut supprimer son propre avis
CREATE POLICY "bar_reviews_delete_own" ON bar_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Fonction RPC pour obtenir les stats agregees d'un bar
CREATE OR REPLACE FUNCTION get_bar_review_stats(p_bar_id UUID)
RETURNS JSON AS $$
  SELECT json_build_object(
    'total_reviews', COUNT(*),
    'avg_ambiance', ROUND(COALESCE(AVG(ambiance), 0)::numeric, 1),
    'avg_beer_selection', ROUND(COALESCE(AVG(beer_selection), 0)::numeric, 1),
    'avg_price', ROUND(COALESCE(AVG(price), 0)::numeric, 1),
    'avg_service', ROUND(COALESCE(AVG(service), 0)::numeric, 1),
    'avg_overall', ROUND(
      COALESCE(AVG((ambiance + beer_selection + price + service)::numeric / 4), 0)::numeric,
      1
    )
  )
  FROM bar_reviews
  WHERE bar_id = p_bar_id;
$$ LANGUAGE SQL STABLE;
