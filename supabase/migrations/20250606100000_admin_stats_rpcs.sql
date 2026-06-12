-- Agrégats admin pour scan_counts (contourne RLS via SECURITY DEFINER + service role)
CREATE OR REPLACE FUNCTION public.admin_scan_counts_summary()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total_scans', COALESCE(SUM(count), 0),
    'unique_visitors', COUNT(DISTINCT visitor_key),
    'paywall_hits', COUNT(*) FILTER (WHERE count >= 15),
    'premium_converted', COUNT(*) FILTER (WHERE count >= 15 AND is_premium)
  )
  FROM public.scan_counts;
$$;

-- Série journalière des scans (30 derniers jours) depuis scan_logs
CREATE OR REPLACE FUNCTION public.admin_scan_daily_series(p_days int DEFAULT 30)
RETURNS TABLE(day date, scan_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH days AS (
    SELECT generate_series(
      (CURRENT_DATE - (GREATEST(p_days, 1) - 1)),
      CURRENT_DATE,
      interval '1 day'
    )::date AS day
  )
  SELECT
    d.day,
    COALESCE(COUNT(l.id), 0)::bigint AS scan_count
  FROM days d
  LEFT JOIN public.scan_logs l
    ON (l.created_at AT TIME ZONE 'UTC')::date = d.day
  GROUP BY d.day
  ORDER BY d.day;
$$;

-- Comptes réels (hors anonymes) via auth.users
CREATE OR REPLACE FUNCTION public.admin_auth_accounts_summary(p_days int DEFAULT 7)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total', (
      SELECT COUNT(*)::bigint
      FROM auth.users u
      WHERE COALESCE(u.is_anonymous, false) = false
    ),
    'last_n_days', (
      SELECT COUNT(*)::bigint
      FROM auth.users u
      WHERE COALESCE(u.is_anonymous, false) = false
        AND u.created_at >= now() - make_interval(days => GREATEST(p_days, 0))
    )
  );
$$;
