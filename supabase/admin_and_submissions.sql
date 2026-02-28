-- ═══════════════════════════════════════════
-- GLUPP — Admin + Submissions + Notifications
-- Exécuter dans Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════

-- ─── 1. Colonne admin sur profiles ───
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- ⚠️ IMPORTANT : Après exécution, mets ton compte en admin :
-- UPDATE profiles SET is_admin = TRUE WHERE username = 'ton_username';

-- ─── 2. Table notifications (persistante) ───
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'submission_approved', 'submission_rejected', 'xp_reward',
    'friend_request', 'activity_tag', 'admin_new_submission', 'system'
  )),
  title TEXT NOT NULL,
  message TEXT,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- ─── 3. Table submissions ───
CREATE TABLE IF NOT EXISTS submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('beer', 'bar')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  data JSONB NOT NULL,
  admin_note TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_submissions_user ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_created ON submissions(created_at DESC);

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Users can view their own submissions
CREATE POLICY "Users can view own submissions" ON submissions
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Users can insert their own submissions
CREATE POLICY "Users can insert submissions" ON submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only admins can update submissions (approve/reject)
CREATE POLICY "Admins can update submissions" ON submissions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- ─── 4. Admin RLS policies on existing tables ───

-- Allow admins to insert/update/delete beers
CREATE POLICY "Admins can insert beers" ON beers
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

CREATE POLICY "Admins can update beers" ON beers
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

CREATE POLICY "Admins can delete beers" ON beers
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Allow admins to insert/update/delete bars
CREATE POLICY "Admins can insert bars" ON bars
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

CREATE POLICY "Admins can update bars" ON bars
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

CREATE POLICY "Admins can delete bars" ON bars
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- ─── 5. RPC: Check if current user is admin ───
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM profiles WHERE id = auth.uid()),
    FALSE
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ─── 6. RPC: Submit bar review with XP ───
CREATE OR REPLACE FUNCTION submit_bar_review(
  p_bar_id UUID,
  p_ambiance INTEGER,
  p_beer_selection INTEGER,
  p_price INTEGER,
  p_service INTEGER,
  p_comment TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_existing_id UUID;
  v_xp_gain INTEGER := 0;
  v_is_new BOOLEAN := FALSE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Non connecte';
  END IF;

  -- Check existing review
  SELECT id INTO v_existing_id FROM bar_reviews
    WHERE bar_id = p_bar_id AND user_id = v_user_id;

  IF v_existing_id IS NOT NULL THEN
    -- Update existing (no XP)
    UPDATE bar_reviews SET
      ambiance = p_ambiance,
      beer_selection = p_beer_selection,
      price = p_price,
      service = p_service,
      comment = p_comment
    WHERE id = v_existing_id;
  ELSE
    -- Insert new + XP
    INSERT INTO bar_reviews (user_id, bar_id, ambiance, beer_selection, price, service, comment)
    VALUES (v_user_id, p_bar_id, p_ambiance, p_beer_selection, p_price, p_service, p_comment);

    v_xp_gain := 10;
    v_is_new := TRUE;

    UPDATE profiles SET xp = xp + v_xp_gain, updated_at = NOW() WHERE id = v_user_id;
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'is_new', v_is_new,
    'xp_gained', v_xp_gain
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 7. RPC: Approve submission ───
CREATE OR REPLACE FUNCTION approve_submission(p_submission_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_admin_id UUID;
  v_sub RECORD;
  v_new_id UUID;
  v_xp_gain INTEGER;
BEGIN
  v_admin_id := auth.uid();

  -- Check admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_admin_id AND is_admin = TRUE) THEN
    RAISE EXCEPTION 'Acces refuse';
  END IF;

  -- Get submission
  SELECT * INTO v_sub FROM submissions WHERE id = p_submission_id AND status = 'pending';
  IF v_sub IS NULL THEN
    RAISE EXCEPTION 'Soumission introuvable ou deja traitee';
  END IF;

  IF v_sub.type = 'beer' THEN
    -- Create beer from JSONB data
    INSERT INTO beers (name, brewery, country, country_code, style, abv, description, rarity)
    VALUES (
      v_sub.data->>'name',
      v_sub.data->>'brewery',
      COALESCE(v_sub.data->>'country', '🌍'),
      COALESCE(v_sub.data->>'country_code', 'XX'),
      COALESCE(v_sub.data->>'style', 'Autre'),
      (v_sub.data->>'abv')::DECIMAL,
      v_sub.data->>'description',
      'common'
    )
    RETURNING id INTO v_new_id;
    v_xp_gain := 15;

  ELSIF v_sub.type = 'bar' THEN
    -- Create bar from JSONB data
    INSERT INTO bars (name, address, city, geo_lat, geo_lng)
    VALUES (
      v_sub.data->>'name',
      v_sub.data->>'address',
      v_sub.data->>'city',
      (v_sub.data->>'geo_lat')::DECIMAL,
      (v_sub.data->>'geo_lng')::DECIMAL
    )
    RETURNING id INTO v_new_id;
    v_xp_gain := 10;
  END IF;

  -- Update submission status
  UPDATE submissions SET
    status = 'approved',
    reviewed_by = v_admin_id,
    reviewed_at = NOW()
  WHERE id = p_submission_id;

  -- Award XP to user
  UPDATE profiles SET xp = xp + v_xp_gain, updated_at = NOW() WHERE id = v_sub.user_id;

  -- Notify user
  INSERT INTO notifications (user_id, type, title, message, metadata)
  VALUES (
    v_sub.user_id,
    'submission_approved',
    CASE v_sub.type WHEN 'beer' THEN 'Biere validee !' ELSE 'Bar valide !' END,
    'Ta soumission "' || (v_sub.data->>'name') || '" a ete approuvee. +' || v_xp_gain || ' XP',
    jsonb_build_object('type', v_sub.type, 'name', v_sub.data->>'name', 'xp_gained', v_xp_gain, 'new_id', v_new_id)
  );

  RETURN jsonb_build_object('success', TRUE, 'new_id', v_new_id, 'xp_awarded', v_xp_gain);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 8. RPC: Reject submission ───
CREATE OR REPLACE FUNCTION reject_submission(p_submission_id UUID, p_reason TEXT DEFAULT 'Non conforme')
RETURNS JSONB AS $$
DECLARE
  v_admin_id UUID;
  v_sub RECORD;
BEGIN
  v_admin_id := auth.uid();

  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_admin_id AND is_admin = TRUE) THEN
    RAISE EXCEPTION 'Acces refuse';
  END IF;

  SELECT * INTO v_sub FROM submissions WHERE id = p_submission_id AND status = 'pending';
  IF v_sub IS NULL THEN
    RAISE EXCEPTION 'Soumission introuvable ou deja traitee';
  END IF;

  -- Update submission
  UPDATE submissions SET
    status = 'rejected',
    admin_note = p_reason,
    reviewed_by = v_admin_id,
    reviewed_at = NOW()
  WHERE id = p_submission_id;

  -- Notify user
  INSERT INTO notifications (user_id, type, title, message, metadata)
  VALUES (
    v_sub.user_id,
    'submission_rejected',
    CASE v_sub.type WHEN 'beer' THEN 'Biere refusee' ELSE 'Bar refuse' END,
    'Ta soumission "' || (v_sub.data->>'name') || '" n''a pas ete retenue. Raison : ' || p_reason,
    jsonb_build_object('type', v_sub.type, 'name', v_sub.data->>'name', 'reason', p_reason)
  );

  RETURN jsonb_build_object('success', TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 9. RPC: Admin stats ───
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE) THEN
    RAISE EXCEPTION 'Acces refuse';
  END IF;

  SELECT jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'total_beers', (SELECT COUNT(*) FROM beers WHERE is_active = TRUE),
    'total_bars', (SELECT COUNT(*) FROM bars),
    'total_glupps', (SELECT COUNT(*) FROM user_beers),
    'total_duels', (SELECT COUNT(*) FROM duels),
    'total_reviews', (SELECT COUNT(*) FROM bar_reviews),
    'pending_submissions', (SELECT COUNT(*) FROM submissions WHERE status = 'pending'),
    'users_today', (SELECT COUNT(*) FROM profiles WHERE created_at >= CURRENT_DATE),
    'glupps_today', (SELECT COUNT(*) FROM user_beers WHERE tasted_at >= CURRENT_DATE),
    'duels_today', (SELECT COUNT(*) FROM duels WHERE created_at >= CURRENT_DATE),
    'top_users', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM (
        SELECT id, username, display_name, avatar_url, xp, beers_tasted
        FROM profiles ORDER BY xp DESC LIMIT 5
      ) t
    ),
    'recent_submissions', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM (
        SELECT s.id, s.type, s.status, s.data, s.created_at,
          p.username as submitted_by
        FROM submissions s
        JOIN profiles p ON p.id = s.user_id
        ORDER BY s.created_at DESC LIMIT 5
      ) t
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 10. RPC: Admin award XP ───
CREATE OR REPLACE FUNCTION admin_award_xp(p_user_id UUID, p_amount INTEGER, p_reason TEXT)
RETURNS JSONB AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE) THEN
    RAISE EXCEPTION 'Acces refuse';
  END IF;

  UPDATE profiles SET xp = xp + p_amount, updated_at = NOW() WHERE id = p_user_id;

  INSERT INTO notifications (user_id, type, title, message, metadata)
  VALUES (
    p_user_id,
    'xp_reward',
    'Bonus XP !',
    '+' || p_amount || ' XP : ' || p_reason,
    jsonb_build_object('xp_amount', p_amount, 'reason', p_reason)
  );

  RETURN jsonb_build_object('success', TRUE, 'xp_awarded', p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 11. Enable RLS on beers and bars if not already ───
ALTER TABLE beers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bars ENABLE ROW LEVEL SECURITY;

-- Public read access for beers and bars
CREATE POLICY "Beers viewable by everyone" ON beers FOR SELECT USING (true);
CREATE POLICY "Bars viewable by everyone" ON bars FOR SELECT USING (true);

-- Allow insert on bars for regular users (from GluppModal)
CREATE POLICY "Users can insert bars" ON bars
  FOR INSERT WITH CHECK (true);
