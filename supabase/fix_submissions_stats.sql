-- ═══════════════════════════════════════════════════════════════
-- Fix: Update get_admin_stats to count pending beers
-- from the beers table (new flow) + legacy submissions table
-- ═══════════════════════════════════════════════════════════════

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
    'total_beers', (SELECT COUNT(*) FROM beers WHERE is_active = TRUE AND status = 'approved'),
    'total_bars', (SELECT COUNT(*) FROM bars),
    'total_glupps', (SELECT COUNT(*) FROM user_beers),
    'total_duels', (SELECT COUNT(*) FROM duels),
    'total_reviews', (SELECT COUNT(*) FROM bar_reviews),
    'pending_submissions', (
      (SELECT COUNT(*) FROM submissions WHERE status = 'pending') +
      (SELECT COUNT(*) FROM beers WHERE status = 'pending' AND is_active = TRUE AND added_by IS NOT NULL)
    ),
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
        -- Merge legacy submissions + pending beers
        (
          SELECT s.id, s.type, s.status, s.data, s.created_at,
            p.username as submitted_by
          FROM submissions s
          JOIN profiles p ON p.id = s.user_id
          ORDER BY s.created_at DESC LIMIT 5
        )
        UNION ALL
        (
          SELECT b.id::text, 'beer'::text as type, b.status,
            jsonb_build_object('name', b.name, 'brewery', b.brewery, 'style', b.style) as data,
            b.created_at,
            p.username as submitted_by
          FROM beers b
          JOIN profiles p ON p.id = b.added_by
          WHERE b.status = 'pending' AND b.is_active = TRUE AND b.added_by IS NOT NULL
          ORDER BY b.created_at DESC LIMIT 5
        )
        ORDER BY created_at DESC
        LIMIT 5
      ) t
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
