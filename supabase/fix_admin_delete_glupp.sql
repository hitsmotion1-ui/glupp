-- ═══════════════════════════════════════════
-- GLUPP — Admin : Suppression d'un Glupp
-- Exécuter dans Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════

-- RPC admin_delete_glupp
-- Supprime définitivement une activité de type glupp + nettoie le storage si besoin
-- SECURITY DEFINER → bypass RLS, réservé aux admins

CREATE OR REPLACE FUNCTION admin_delete_glupp(p_activity_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_photo_url TEXT;
BEGIN
  -- Vérification admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE) THEN
    RAISE EXCEPTION 'Accès refusé — réservé aux administrateurs';
  END IF;

  -- Récupère l'URL photo avant suppression (pour nettoyage côté client si nécessaire)
  SELECT photo_url INTO v_photo_url
  FROM activities
  WHERE id = p_activity_id AND type = 'glupp';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Glupp introuvable';
  END IF;

  -- Suppression de l'activité
  DELETE FROM activities WHERE id = p_activity_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'photo_url', v_photo_url
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
