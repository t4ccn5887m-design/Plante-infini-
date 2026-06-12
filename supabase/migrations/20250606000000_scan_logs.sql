-- Journal des scans pour analytics admin (Wilder)
-- Exécuter dans Supabase SQL Editor si la migration n'est pas appliquée automatiquement.

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

-- Aucune policy : accès réservé au service role (API Next.js).

CREATE OR REPLACE FUNCTION public.admin_unique_scan_visitors()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(DISTINCT fingerprint) FROM public.scan_logs;
$$;

CREATE OR REPLACE FUNCTION public.admin_top_scanned_species(p_limit int DEFAULT 10)
RETURNS TABLE(species_name text, scan_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT species_name, COUNT(*)::bigint
  FROM public.scan_logs
  WHERE species_name IS NOT NULL AND btrim(species_name) <> ''
  GROUP BY species_name
  ORDER BY scan_count DESC
  LIMIT GREATEST(p_limit, 1);
$$;
