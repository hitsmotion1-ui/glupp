-- Fix: Track who initiated a friend request
-- Prevents the sender from accepting their own request
-- Only the RECEIVER can accept/reject

-- 1. Add initiated_by column to friendships
ALTER TABLE friendships ADD COLUMN IF NOT EXISTS initiated_by UUID REFERENCES profiles(id);

-- 2. Backfill existing pending requests (best guess: user_a)
UPDATE friendships SET initiated_by = user_a WHERE initiated_by IS NULL AND status = 'pending';

-- 3. Update send_friend_request to store the initiator
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

  SELECT status INTO v_existing FROM friendships WHERE user_a = v_user_a AND user_b = v_user_b;

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

-- 4. Update update_friend_request: only RECEIVER can accept/reject
CREATE OR REPLACE FUNCTION update_friend_request(p_friendship_id UUID, p_user_id UUID, p_action TEXT)
RETURNS JSONB AS $$
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
    UPDATE friendships SET status = 'accepted'
    WHERE id = p_friendship_id
      AND (user_a = p_user_id OR user_b = p_user_id)
      AND status = 'pending';
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

-- 5. Drop then recreate get_friends (return type changed: added initiated_by)
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

-- 6. Fix get_notifications: only show friend requests to the RECEIVER
CREATE OR REPLACE FUNCTION get_notifications(p_user_id UUID, p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  notif_id TEXT,
  notif_type TEXT,
  created_at TIMESTAMPTZ,
  data JSONB
) AS $$
BEGIN
  -- Demandes d'ami en attente (only for RECEIVER, not sender)
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
    AND f.initiated_by IS DISTINCT FROM p_user_id  -- Only show to receiver

  UNION ALL

  -- Tags sur activités
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
      'beer', CASE WHEN b.id IS NOT NULL THEN jsonb_build_object('id', b.id, 'name', b.name) ELSE NULL END
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
