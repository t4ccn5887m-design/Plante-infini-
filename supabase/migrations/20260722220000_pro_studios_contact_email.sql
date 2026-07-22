-- =============================================================================
-- Wilder Pro / Amont — pro_studios.contact_email
-- À coller dans : Supabase → SQL Editor → Run
-- Idempotent. Ne touche PAS aux autres tables.
-- =============================================================================

alter table public.pro_studios
  add column if not exists contact_email text;

notify pgrst, 'reload schema';
