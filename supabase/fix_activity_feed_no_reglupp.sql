-- ══════════════════════════════════════════════════════════════════════════════
-- fix_activity_feed_no_reglupp.sql
--
-- Exclure les re-glupps du fil d'activité des amis.
-- Un re-glupp est un type='glupp' avec metadata->>'reglupp' = 'true'.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_activity_feed(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  activity_type TEXT,
  beer_id UUID,
  bar_id UUID,
  crew_id UUID,
  photo_url TEXT,
  geo_lat DECIMAL,
  geo_lng DECIMAL,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  user_data JSONB,
  beer_data JSONB,
  tagged_users JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id, a.user_id, a.type AS activity_type, a.beer_id, a.bar_id, a.crew_id,
    a.photo_url, a.geo_lat, a.geo_lng, a.metadata, a.created_at,
    jsonb_build_object(
      'id', p.id, 'username', p.username,
      'display_name', p.display_name, 'avatar_url', p.avatar_url, 'xp', p.xp
    ) AS user_data,
    CASE WHEN b.id IS NOT NULL THEN jsonb_build_object(
      'id', b.id, 'name', b.name, 'brewery', b.brewery,
      'rarity', b.rarity, 'style', b.style, 'country', b.country
    ) ELSE NULL END AS beer_data,
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', tp.id, 'username', tp.username, 'display_name', tp.display_name))
      FROM activity_tags at2
      JOIN profiles tp ON tp.id = at2.tagged_user_id
      WHERE at2.activity_id = a.id
    ), '[]'::jsonb) AS tagged_users
  FROM activities a
  JOIN profiles p ON p.id = a.user_id
  LEFT JOIN beers b ON b.id = a.beer_id
  WHERE
    (
      a.user_id = p_user_id
      OR a.user_id IN (
        SELECT CASE WHEN f.user_a = p_user_id THEN f.user_b ELSE f.user_a END
        FROM friendships f
        WHERE (f.user_a = p_user_id OR f.user_b = p_user_id) AND f.status = 'accepted'
      )
    )
    -- Exclure les re-glupps (bière déjà bue, pas une découverte)
    AND NOT (a.type = 'glupp' AND (a.metadata->>'reglupp')::boolean IS TRUE)
  ORDER BY a.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
