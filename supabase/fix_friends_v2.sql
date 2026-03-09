-- Fix friends v2 (idempotent — safe to run multiple times)
-- Fixes:
--   1. initiated_by column + backfill
--   2. send_friend_request stores the initiator
--   3. update_friend_request: only receiver can accept, notification sent to sender when accepted
--   4. cancel_friend_request: new RPC for the sender to withdraw their request
--   5. get_friends: returns initiated_by
--   6. get_notifications: only shows pending requests to the RECEIVER (not sender)
--   7. notifications.type constraint includes 'friend_accepted'

-- ─── 1. Column ───────────────────────────────────────────────────────────────
ALTER TABLE friendships ADD COLUMN IF NOT EXISTS initiated_by UUID REFERENCES profiles(id);

-- Backfill existing pending rows (user_a is a safe guess for legacy rows)
UPDATE friendships
SET initiated_by = user_a
WHERE initiated_by IS NULL AND status = 'pending';

-- ─── 2. Notifications type constraint ─────────────────────────────────────────
-- Drop and recreate to include 'friend_accepted' (keeps all existing types)
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN (
  'submission_approved', 'submission_rejected', 'xp_reward',
  'friend_request', 'activity_tag', 'admin_new_submission', 'system',
  'trophy', 'ban_status', 'friend_accepted'
));

-- ─── 3. send_friend_request — stores initiated_by ────────────────────────────
CREATE OR REPLACE FUNCTION send_friend_request(p_from_user_id UUID, p_to_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_a UUID;
  v_user_b UUID;
  v_existing TEXT;
BEGIN
  IF p_from_user_id = p_to_user_id THEN
    RAISE EXCEPTION 'Tu ne peux pas t''ajouter toi-même !';
  END IF;

  v_user_a := LEAST(p_from_user_id, p_to_user_id);
  v_user_b := GREATEST(p_from_user_id, p_to_user_id);

  SELECT status INTO v_existing
  FROM friendships
  WHERE user_a = v_user_a AND user_b = v_user_b;

  IF v_existing = 'accepted' THEN
    RAISE EXCEPTION 'Vous êtes déjà amis !';
  ELSIF v_existing = 'pending' THEN
    RAISE EXCEPTION 'Demande déjà envoyée !';
  ELSIF v_existing = 'blocked' THEN
    RAISE EXCEPTION 'Utilisateur bloqué';
  END IF;

  INSERT INTO friendships (user_a, user_b, status, initiated_by)
  VALUES (v_user_a, v_user_b, 'pending', p_from_user_id);

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 4. update_friend_request — only receiver can accept; notif to sender ────
CREATE OR REPLACE FUNCTION update_friend_request(p_friendship_id UUID, p_user_id UUID, p_action TEXT)
RETURNS JSONB AS $$
DECLARE
  v_initiator_id UUID;
  v_accepter_name TEXT;
BEGIN
  -- Block the sender from accepting their own request
  IF EXISTS (
    SELECT 1 FROM friendships
    WHERE id = p_friendship_id
      AND initiated_by = p_user_id
      AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'Tu ne peux pas accepter ta propre demande !';
  END IF;

  -- Verify the user is part of this friendship
  IF NOT EXISTS (
    SELECT 1 FROM friendships
    WHERE id = p_friendship_id
      AND (user_a = p_user_id OR user_b = p_user_id)
  ) THEN
    RAISE EXCEPTION 'Demande introuvable';
  END IF;

  IF p_action = 'accept' THEN
    -- Get initiator + accepter info for notification
    SELECT f.initiated_by INTO v_initiator_id
    FROM friendships f
    WHERE f.id = p_friendship_id;

    SELECT COALESCE(display_name, username) INTO v_accepter_name
    FROM profiles WHERE id = p_user_id;

    -- Update friendship status
    UPDATE friendships
    SET status = 'accepted'
    WHERE id = p_friendship_id
      AND (user_a = p_user_id OR user_b = p_user_id)
      AND status = 'pending';

    -- Send notification to the person who sent the request
    IF v_initiator_id IS NOT NULL AND v_initiator_id != p_user_id THEN
      INSERT INTO notifications (user_id, type, title, message, metadata)
      VALUES (
        v_initiator_id,
        'friend_accepted',
        '🤝 Demande acceptée !',
        v_accepter_name || ' a accepté ta demande d''ami',
        jsonb_build_object('accepter_id', p_user_id, 'accepter_name', v_accepter_name)
      );
    END IF;

  ELSIF p_action = 'reject' THEN
    DELETE FROM friendships
    WHERE id = p_friendship_id
      AND (user_a = p_user_id OR user_b = p_user_id);

  ELSE
    RAISE EXCEPTION 'Action invalide : %', p_action;
  END IF;

  RETURN jsonb_build_object('success', true, 'action', p_action);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 5. cancel_friend_request — new RPC for the sender ──────────────────────
CREATE OR REPLACE FUNCTION cancel_friend_request(p_friendship_id UUID, p_user_id UUID)
RETURNS JSONB AS $$
BEGIN
  DELETE FROM friendships
  WHERE id = p_friendship_id
    AND initiated_by = p_user_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Demande introuvable ou non annulable';
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 6. get_friends — now returns initiated_by ───────────────────────────────
-- Must DROP first because the return type changes
DROP FUNCTION IF EXISTS get_friends(UUID);
CREATE OR REPLACE FUNCTION get_friends(p_user_id UUID)
RETURNS TABLE (
  friendship_id UUID,
  friend_id UUID,
  friendship_status TEXT,
  friend_since TIMESTAMPTZ,
  initiated_by UUID,
  friend_data JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id AS friendship_id,
    CASE WHEN f.user_a = p_user_id THEN f.user_b ELSE f.user_a END AS friend_id,
    f.status AS friendship_status,
    f.created_at AS friend_since,
    f.initiated_by,
    jsonb_build_object(
      'id', p.id, 'username', p.username, 'display_name', p.display_name,
      'avatar_url', p.avatar_url, 'xp', p.xp, 'beers_tasted', p.beers_tasted,
      'duels_played', p.duels_played, 'photos_taken', p.photos_taken
    ) AS friend_data
  FROM friendships f
  JOIN profiles p ON p.id = CASE WHEN f.user_a = p_user_id THEN f.user_b ELSE f.user_a END
  WHERE f.user_a = p_user_id OR f.user_b = p_user_id
  ORDER BY f.status ASC, f.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 7. get_notifications — friend requests only shown to RECEIVER ────────────
CREATE OR REPLACE FUNCTION get_notifications(p_user_id UUID, p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  notif_id TEXT,
  notif_type TEXT,
  created_at TIMESTAMPTZ,
  data JSONB
) AS $$
BEGIN
  -- Pending friend requests — only for the RECEIVER, not the sender
  RETURN QUERY
  SELECT
    'fr_' || f.id::TEXT AS notif_id,
    'friend_request'::TEXT AS notif_type,
    f.created_at,
    jsonb_build_object(
      'friendship_id', f.id,
      'from_user', jsonb_build_object(
        'id', p.id, 'username', p.username,
        'display_name', p.display_name, 'avatar_url', p.avatar_url, 'xp', p.xp
      )
    ) AS data
  FROM friendships f
  JOIN profiles p ON p.id = f.initiated_by
  WHERE (f.user_a = p_user_id OR f.user_b = p_user_id)
    AND f.status = 'pending'
    AND f.initiated_by IS DISTINCT FROM p_user_id  -- only receiver sees this

  UNION ALL

  -- Activity tags
  SELECT
    'tag_' || at2.activity_id::TEXT AS notif_id,
    'activity_tag'::TEXT AS notif_type,
    a.created_at,
    jsonb_build_object(
      'activity_id', a.id,
      'from_user', jsonb_build_object(
        'id', p.id, 'username', p.username,
        'display_name', p.display_name, 'avatar_url', p.avatar_url
      ),
      'beer', CASE WHEN b.id IS NOT NULL
        THEN jsonb_build_object('id', b.id, 'name', b.name)
        ELSE NULL
      END
    ) AS data
  FROM activity_tags at2
  JOIN activities a ON a.id = at2.activity_id
  JOIN profiles p ON p.id = a.user_id
  LEFT JOIN beers b ON b.id = a.beer_id
  WHERE at2.tagged_user_id = p_user_id AND a.user_id != p_user_id

  ORDER BY created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
