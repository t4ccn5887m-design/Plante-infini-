-- Sevya particulier — BLOC 2 : dossier jardin synchronisé (compte connecté)
-- Une ligne par utilisateur auth ; invités = localStorage uniquement (pas de RLS anon).
--
-- Colonne data (jsonb) — champs applicatifs :
-- {
--   "intention": "string",          -- mot au paysagiste (ex wilder-garden-intention)
--   "ambiance": "string",           -- nom d'ambiance choisi
--   "budget": "string",             -- id fourchette budget
--   "terrain": {
--     "areaRange": "string|null",
--     "timeline": "string|null",
--     "utilities": "string|null"
--   },
--   "details": { ... }              -- même forme que pro_briefs.details (briefDetails.js)
-- }
-- Photos terrain : hors table (IndexedDB / appareil jusqu'à V2).
-- Fusion à la connexion : côté app (comparer updated_at cloud vs horodatage local).

-- ── 0. updated_at (identique Ma Palette) ─────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── 1. Table ─────────────────────────────────────────────────────────────────
create table if not exists public.garden_dossiers (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

comment on table public.garden_dossiers is
  'Dossier particulier (ambiance, budget, terrain champs, details brief) — 1 / compte.';
comment on column public.garden_dossiers.data is
  'intention, ambiance, budget, terrain (sans photos), details (format brief pro).';

-- ── 2. updated_at automatique ────────────────────────────────────────────────
drop trigger if exists garden_dossiers_set_updated_at on public.garden_dossiers;
create trigger garden_dossiers_set_updated_at
  before update on public.garden_dossiers
  for each row execute function public.set_updated_at();

-- ── 3. RLS (authenticated uniquement ; anon = aucune policy) ─────────────────
alter table public.garden_dossiers enable row level security;

drop policy if exists "garden_dossiers_select_own" on public.garden_dossiers;
create policy "garden_dossiers_select_own"
  on public.garden_dossiers for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "garden_dossiers_insert_own" on public.garden_dossiers;
create policy "garden_dossiers_insert_own"
  on public.garden_dossiers for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "garden_dossiers_update_own" on public.garden_dossiers;
create policy "garden_dossiers_update_own"
  on public.garden_dossiers for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── 4. Droits API (pas de GRANT pour anon) ───────────────────────────────────
grant select, insert, update on table public.garden_dossiers to authenticated;
