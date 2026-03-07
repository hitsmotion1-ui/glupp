-- ═══════════════════════════════════════════════════════════════
-- Fix: RPC functions for approving/rejecting beers
-- These use SECURITY DEFINER to bypass RLS issues when admin
-- needs to update another user's profile or user_beers
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. Approve beer RPC ───
CREATE OR REPLACE FUNCTION approve_beer(p_beer_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_beer RECORD;
  v_profile RECORD;
BEGIN
  -- Check admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE) THEN
    RAISE EXCEPTION 'Acces refuse';
  END IF;

  -- 1. Update beer status
  UPDATE beers SET status = 'approved' WHERE id = p_beer_id AND status = 'pending'
  RETURNING * INTO v_beer;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Biere non trouvee ou deja traitee';
  END IF;

  -- 2. If beer was proposed by a user, reward them
  IF v_beer.added_by IS NOT NULL THEN
    -- Award +25 XP and increment beers_tasted
    UPDATE profiles
    SET xp = COALESCE(xp, 0) + 25,
        beers_tasted = COALESCE(beers_tasted, 0) + 1,
        updated_at = NOW()
    WHERE id = v_beer.added_by;

    -- Auto-glupp: add beer to proposer's collection
    INSERT INTO user_beers (user_id, beer_id)
    VALUES (v_beer.added_by, p_beer_id)
    ON CONFLICT (user_id, beer_id) DO NOTHING;

    -- Send notification
    INSERT INTO notifications (user_id, type, title, message, metadata)
    VALUES (
      v_beer.added_by,
      'submission_approved',
      'Biere validee !',
      'Ta biere "' || v_beer.name || '" a ete validee par l''equipe Glupp ! +25 XP Decouvreur',
      jsonb_build_object('beer_id', p_beer_id, 'xp_gained', 25)
    );
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'beer_id', p_beer_id,
    'beer_name', v_beer.name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 2. Reject beer RPC ───
CREATE OR REPLACE FUNCTION reject_beer(p_beer_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  v_beer RECORD;
  v_message TEXT;
BEGIN
  -- Check admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE) THEN
    RAISE EXCEPTION 'Acces refuse';
  END IF;

  -- 1. Update beer status
  UPDATE beers SET status = 'rejected' WHERE id = p_beer_id AND status = 'pending'
  RETURNING * INTO v_beer;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Biere non trouvee ou deja traitee';
  END IF;

  -- 2. Notify proposer
  IF v_beer.added_by IS NOT NULL THEN
    v_message := 'Ta proposition "' || v_beer.name || '" n''a pas ete retenue.';
    IF p_reason IS NOT NULL AND p_reason != '' THEN
      v_message := v_message || ' Raison : ' || p_reason;
    END IF;

    INSERT INTO notifications (user_id, type, title, message, metadata)
    VALUES (
      v_beer.added_by,
      'submission_rejected',
      'Biere non retenue',
      v_message,
      jsonb_build_object('beer_id', p_beer_id, 'reason', COALESCE(p_reason, ''))
    );
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'beer_id', p_beer_id,
    'beer_name', v_beer.name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
