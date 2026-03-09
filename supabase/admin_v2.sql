-- ═══════════════════════════════════════════
-- GLUPP — Admin v2 : Ban, Trophées, GOTW, Détail User
-- Exécuter dans Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════

-- ─── 1. Colonne is_banned sur profiles ───
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;

-- ─── 2. Étendre les types de notifications ───
-- On supprime et recrée la contrainte pour ajouter 'trophy' et 'ban_status'
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN (
  'submission_approved', 'submission_rejected', 'xp_reward',
  'friend_request', 'activity_tag', 'admin_new_submission', 'system',
  'trophy', 'ban_status'
));

-- ─── 3. RPC : Bannir / Débannir un utilisateur ───
CREATE OR REPLACE FUNCTION admin_toggle_ban(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_new_status BOOLEAN;
  v_username TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  -- Toggle
  UPDATE profiles
  SET is_banned = NOT COALESCE(is_banned, FALSE), updated_at = NOW()
  WHERE id = p_user_id
  RETURNING is_banned, username INTO v_new_status, v_username;

  IF v_new_status THEN
    -- Notifier l'utilisateur banni
    INSERT INTO notifications (user_id, type, title, message, metadata)
    VALUES (
      p_user_id,
      'ban_status',
      'Compte suspendu',
      'Votre compte a été suspendu par un administrateur.',
      jsonb_build_object('banned', TRUE)
    );
  END IF;

  RETURN jsonb_build_object('success', TRUE, 'is_banned', v_new_status, 'username', v_username);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 4. RPC : Attribuer XP (mise à jour — gère les négatifs) ───
CREATE OR REPLACE FUNCTION admin_award_xp(p_user_id UUID, p_amount INTEGER, p_reason TEXT)
RETURNS JSONB AS $$
DECLARE
  v_current_xp INTEGER;
  v_new_xp INTEGER;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  SELECT xp INTO v_current_xp FROM profiles WHERE id = p_user_id;
  v_new_xp := GREATEST(0, v_current_xp + p_amount);

  UPDATE profiles SET xp = v_new_xp, updated_at = NOW() WHERE id = p_user_id;

  INSERT INTO notifications (user_id, type, title, message, metadata)
  VALUES (
    p_user_id,
    'xp_reward',
    CASE WHEN p_amount >= 0 THEN 'Bonus XP !' ELSE 'Ajustement XP' END,
    CASE WHEN p_amount >= 0
      THEN '+' || p_amount || ' XP : ' || p_reason
      ELSE p_amount || ' XP : ' || p_reason
    END,
    jsonb_build_object('xp_amount', p_amount, 'xp_final', v_new_xp, 'reason', p_reason)
  );

  RETURN jsonb_build_object('success', TRUE, 'xp_awarded', p_amount, 'xp_final', v_new_xp);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 5. RPC : Attribuer un trophée manuellement ───
CREATE OR REPLACE FUNCTION admin_award_trophy(p_user_id UUID, p_trophy_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_trophy RECORD;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  SELECT name, emoji, xp_reward INTO v_trophy FROM trophies WHERE id = p_trophy_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Trophée introuvable';
  END IF;

  INSERT INTO user_trophies (user_id, trophy_id, progress, completed, completed_at)
  VALUES (p_user_id, p_trophy_id, 100, TRUE, NOW())
  ON CONFLICT (user_id, trophy_id) DO UPDATE
    SET completed = TRUE, completed_at = COALESCE(user_trophies.completed_at, NOW());

  -- Donner l'XP du trophée
  IF v_trophy.xp_reward > 0 THEN
    UPDATE profiles SET xp = xp + v_trophy.xp_reward, updated_at = NOW() WHERE id = p_user_id;
  END IF;

  -- Notification
  INSERT INTO notifications (user_id, type, title, message, metadata)
  VALUES (
    p_user_id,
    'trophy',
    v_trophy.emoji || ' Nouveau trophée !',
    'Tu as obtenu le trophée "' || v_trophy.name || '"' ||
      CASE WHEN v_trophy.xp_reward > 0 THEN ' (+' || v_trophy.xp_reward || ' XP)' ELSE '' END || ' !',
    jsonb_build_object('trophy_id', p_trophy_id, 'trophy_name', v_trophy.name, 'xp_reward', v_trophy.xp_reward)
  );

  RETURN jsonb_build_object('success', TRUE, 'trophy_name', v_trophy.name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 6. RPC : Définir le Glupp of the Week ───
CREATE OR REPLACE FUNCTION admin_set_gotw(
  p_beer_id UUID,
  p_week_start DATE,
  p_week_end DATE,
  p_bonus_xp INTEGER DEFAULT 50
)
RETURNS JSONB AS $$
DECLARE
  v_beer_name TEXT;
  v_gotw_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  SELECT name INTO v_beer_name FROM beers WHERE id = p_beer_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bière introuvable';
  END IF;

  INSERT INTO glupp_of_week (beer_id, week_start, week_end, bonus_xp, participants)
  VALUES (p_beer_id, p_week_start, p_week_end, p_bonus_xp, 0)
  RETURNING id INTO v_gotw_id;

  RETURN jsonb_build_object('success', TRUE, 'id', v_gotw_id, 'beer_name', v_beer_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 7. RPC : Détail complet d'un utilisateur (pour admin) ───
CREATE OR REPLACE FUNCTION get_user_admin_detail(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  SELECT jsonb_build_object(
    'profile', row_to_json(p),
    'recent_beers', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT
          b.name AS beer_name,
          b.brewery,
          b.style,
          b.rarity,
          ub.tasted_at,
          ub.rating
        FROM user_beers ub
        JOIN beers b ON b.id = ub.beer_id
        WHERE ub.user_id = p_user_id
        ORDER BY ub.tasted_at DESC
        LIMIT 5
      ) t
    ),
    'trophies', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT
          tr.name,
          tr.emoji,
          tr.category,
          tr.xp_reward,
          ut.completed_at
        FROM user_trophies ut
        JOIN trophies tr ON tr.id = ut.trophy_id
        WHERE ut.user_id = p_user_id AND ut.completed = TRUE
        ORDER BY ut.completed_at DESC
      ) t
    )
  )
  INTO v_result
  FROM profiles p
  WHERE p.id = p_user_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
