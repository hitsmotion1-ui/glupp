-- ══════════════════════════════════════════════════════════════════════════════
-- fix_bar_and_friend_xp.sql
--
-- 1. register_glupp   — Bar sélectionné = position validée (+20 XP), même sans GPS
-- 2. update_friend_request — Accepter = +5 XP pour les deux parties + notif avec XP
-- ══════════════════════════════════════════════════════════════════════════════

-- ─── 1. register_glupp — position XP si bar sélectionné ─────────────────────
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
  v_xp_gain INTEGER := 5;  -- Base
  v_beer_rarity TEXT;
  v_tagged UUID;
BEGIN
  -- Vérifier pas déjà dans collection
  IF EXISTS (SELECT 1 FROM user_beers WHERE user_id = p_user_id AND beer_id = p_beer_id) THEN
    RAISE EXCEPTION 'Tu as déjà gluppé cette bière !';
  END IF;

  -- Calculer XP
  -- Un bar sélectionné vaut aussi comme preuve de localisation → même XP que le GPS
  IF p_photo_url IS NOT NULL AND (p_geo_lat IS NOT NULL OR p_bar_name IS NOT NULL) THEN
    v_xp_gain := 40;  -- Photo + Localisation (GPS ou Bar)
  ELSIF p_photo_url IS NOT NULL THEN
    v_xp_gain := 20;  -- Photo seule
  END IF;

  -- Bonus rareté
  SELECT rarity INTO v_beer_rarity FROM beers WHERE id = p_beer_id;
  IF v_beer_rarity = 'rare'      THEN v_xp_gain := v_xp_gain + 10;
  ELSIF v_beer_rarity = 'epic'   THEN v_xp_gain := v_xp_gain + 30;
  ELSIF v_beer_rarity = 'legendary' THEN v_xp_gain := v_xp_gain + 50;
  END IF;

  -- Ajouter à la collection
  INSERT INTO user_beers (user_id, beer_id, photo_url, geo_lat, geo_lng, bar_name)
  VALUES (p_user_id, p_beer_id, p_photo_url, p_geo_lat, p_geo_lng, p_bar_name);

  -- XP + stats profil
  UPDATE profiles SET
    xp            = xp + v_xp_gain,
    beers_tasted  = beers_tasted + 1,
    photos_taken  = photos_taken + CASE WHEN p_photo_url IS NOT NULL THEN 1 ELSE 0 END,
    updated_at    = NOW()
  WHERE id = p_user_id;

  -- Activité (feed des amis)
  INSERT INTO activities (user_id, type, beer_id, photo_url, geo_lat, geo_lng, metadata)
  VALUES (p_user_id, 'glupp', p_beer_id, p_photo_url, p_geo_lat, p_geo_lng,
    jsonb_build_object('xp', v_xp_gain, 'bar', p_bar_name, 'rarity', v_beer_rarity));

  -- Tag amis (ajouter dans leur collection)
  FOREACH v_tagged IN ARRAY p_tagged_users
  LOOP
    INSERT INTO user_beers (user_id, beer_id, bar_name)
    VALUES (v_tagged, p_beer_id, p_bar_name)
    ON CONFLICT (user_id, beer_id) DO NOTHING;

    UPDATE profiles SET beers_tasted = beers_tasted + 1, xp = xp + 10, updated_at = NOW()
    WHERE id = v_tagged;

    v_xp_gain := v_xp_gain + 10;
  END LOOP;

  -- XP supplémentaire pour les tags
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


-- ─── 2. update_friend_request — +5 XP pour les deux parties à l'acceptation ─
CREATE OR REPLACE FUNCTION update_friend_request(p_friendship_id UUID, p_user_id UUID, p_action TEXT)
RETURNS JSONB AS $$
DECLARE
  v_initiator_id UUID;
  v_accepter_name TEXT;
BEGIN
  -- Bloquer l'émetteur pour qu'il n'accepte pas sa propre demande
  -- (NULL-safe : les anciennes lignes sans initiated_by peuvent être acceptées par l'un ou l'autre)
  IF EXISTS (
    SELECT 1 FROM friendships
    WHERE id = p_friendship_id
      AND initiated_by IS NOT NULL
      AND initiated_by = p_user_id
      AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'Tu ne peux pas accepter ta propre demande !';
  END IF;

  -- Vérifier que l'utilisateur fait bien partie de cette amitié
  IF NOT EXISTS (
    SELECT 1 FROM friendships
    WHERE id = p_friendship_id
      AND (user_a = p_user_id OR user_b = p_user_id)
  ) THEN
    RAISE EXCEPTION 'Demande introuvable';
  END IF;

  IF p_action = 'accept' THEN
    -- Récupérer l'initiateur et le nom de l'accepteur
    SELECT f.initiated_by INTO v_initiator_id
    FROM friendships f
    WHERE f.id = p_friendship_id;

    SELECT COALESCE(display_name, username) INTO v_accepter_name
    FROM profiles WHERE id = p_user_id;

    -- Mettre à jour le statut
    UPDATE friendships
    SET status = 'accepted'
    WHERE id = p_friendship_id
      AND (user_a = p_user_id OR user_b = p_user_id)
      AND status = 'pending';

    -- ── +5 XP pour l'accepteur (p_user_id) ────────────────────────────────
    UPDATE profiles SET xp = xp + 5 WHERE id = p_user_id;

    -- ── +5 XP pour l'émetteur + notification ──────────────────────────────
    IF v_initiator_id IS NOT NULL AND v_initiator_id != p_user_id THEN
      -- XP
      UPDATE profiles SET xp = xp + 5 WHERE id = v_initiator_id;

      -- Notification (inclut le gain XP dans le message)
      INSERT INTO notifications (user_id, type, title, message, metadata)
      VALUES (
        v_initiator_id,
        'friend_accepted',
        '🤝 Demande acceptée ! +5 XP',
        v_accepter_name || ' a accepté ta demande d''ami — tu gagnes 5 XP !',
        jsonb_build_object('accepter_id', p_user_id, 'accepter_name', v_accepter_name, 'xp', 5)
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
