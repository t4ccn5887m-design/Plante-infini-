/**
 * Noms Supabase du quota scans / paywall — source unique alignée sur
 * supabase/migrations/20250605120000_scan_counts.sql
 *
 * L'application n'accède jamais à la table en direct : uniquement via RPC.
 */
export const SCAN_COUNTS_TABLE = "scan_counts";
export const SCAN_LOGS_TABLE = "scan_logs";

export const SCAN_QUOTA_RPC = {
  ensureRow: "ensure_scan_count_row",
  getQuota: "get_scan_quota",
  checkAllowed: "check_scan_allowed",
  increment: "increment_scan_count",
  activatePremium: "activate_scan_premium",
};

export const ADMIN_STATS_RPC = {
  scanCountsSummary: "admin_scan_counts_summary",
  scanDailySeries: "admin_scan_daily_series",
  uniqueScanVisitors: "admin_unique_scan_visitors",
  topScannedSpecies: "admin_top_scanned_species",
  authAccountsSummary: "admin_auth_accounts_summary",
};

/** SQL Editor — journal des scans (table scan_logs uniquement). */
export const SCAN_LOGS_SETUP_SQL = `-- Wilder — table scan_logs (analytics admin)
-- Prérequis : migration scan_counts déjà appliquée (paywall / quota).

CREATE TABLE IF NOT EXISTS public.scan_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  species_name text,
  fingerprint text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS scan_logs_created_at_idx ON public.scan_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS scan_logs_fingerprint_idx ON public.scan_logs (fingerprint);
CREATE INDEX IF NOT EXISTS scan_logs_species_name_idx ON public.scan_logs (species_name)
  WHERE species_name IS NOT NULL;

ALTER TABLE public.scan_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.admin_unique_scan_visitors()
RETURNS bigint
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COUNT(DISTINCT fingerprint) FROM public.scan_logs;
$$;

CREATE OR REPLACE FUNCTION public.admin_top_scanned_species(p_limit int DEFAULT 10)
RETURNS TABLE(species_name text, scan_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT species_name, COUNT(*)::bigint
  FROM public.scan_logs
  WHERE species_name IS NOT NULL AND btrim(species_name) <> ''
  GROUP BY species_name
  ORDER BY scan_count DESC
  LIMIT GREATEST(p_limit, 1);
$$;

CREATE OR REPLACE FUNCTION public.admin_scan_daily_series(p_days int DEFAULT 30)
RETURNS TABLE(day date, scan_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH days AS (
    SELECT generate_series(
      (CURRENT_DATE - (GREATEST(p_days, 1) - 1)),
      CURRENT_DATE,
      interval '1 day'
    )::date AS day
  )
  SELECT d.day, COALESCE(COUNT(l.id), 0)::bigint AS scan_count
  FROM days d
  LEFT JOIN public.scan_logs l ON (l.created_at AT TIME ZONE 'UTC')::date = d.day
  GROUP BY d.day ORDER BY d.day;
$$;

CREATE OR REPLACE FUNCTION public.admin_scan_counts_summary()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'total_scans', COALESCE(SUM(count), 0),
    'unique_visitors', COUNT(DISTINCT visitor_key),
    'paywall_hits', COUNT(*) FILTER (WHERE count >= 15),
    'premium_converted', COUNT(*) FILTER (WHERE count >= 15 AND is_premium)
  )
  FROM public.scan_counts;
$$;

CREATE OR REPLACE FUNCTION public.admin_auth_accounts_summary(p_days int DEFAULT 7)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'total', (
      SELECT COUNT(*)::bigint FROM auth.users u
      WHERE COALESCE(u.is_anonymous, false) = false
    ),
    'last_n_days', (
      SELECT COUNT(*)::bigint FROM auth.users u
      WHERE COALESCE(u.is_anonymous, false) = false
        AND u.created_at >= now() - make_interval(days => GREATEST(p_days, 0))
    )
  );
$$;

NOTIFY pgrst, 'reload schema';
`;
