-- Corrige la sync trouvailles (table analyses) — alignement avec Ma Palette.
-- Problème probable en prod :
--   1) user_id en text mais RLS compare auth.uid() = user_id (uuid = text → policy toujours fausse)
--   2) auth_is_permanent_user() plus strict que l'app (email OK côté JS, is_anonymous=true côté SQL)
--
-- AVANT d'exécuter, vérifie ton compte :
--   select id, email, is_anonymous, created_at from auth.users where email = 'TON_EMAIL';
--
-- Si is_anonymous = true alors que tu es connecté avec email, la migration §3 corrige la fonction RLS.
-- Si besoin manuel : update auth.users set is_anonymous = false where email = 'TON_EMAIL';

-- ── 1. user_id en text (comme palettes) ─────────────────────
alter table public.analyses drop constraint if exists analyses_user_id_fkey;

alter table public.analyses
  alter column user_id type text using user_id::text;

create index if not exists analyses_user_id_text_idx
  on public.analyses (user_id);

-- ── 2. auth_is_permanent_user : même logique que lib/authUser.js ──
create or replace function public.auth_is_permanent_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select (coalesce(u.is_anonymous, false) = false)
        or (nullif(trim(coalesce(u.email, '')), '') is not null)
      from auth.users u
      where u.id = auth.uid()
    ),
    false
  );
$$;

revoke all on function public.auth_is_permanent_user() from public;
grant execute on function public.auth_is_permanent_user() to authenticated;

-- ── 3. RLS analyses : cast auth.uid()::text ─────────────────
alter table public.analyses enable row level security;

drop policy if exists "analyses_anon_select" on public.analyses;
drop policy if exists "analyses_anon_insert" on public.analyses;
drop policy if exists "analyses_select_own" on public.analyses;
drop policy if exists "analyses_insert_own" on public.analyses;
drop policy if exists "analyses_update_own" on public.analyses;
drop policy if exists "analyses_delete_own" on public.analyses;
drop policy if exists "analyses_select_permanent_own" on public.analyses;
drop policy if exists "analyses_insert_permanent_own" on public.analyses;
drop policy if exists "analyses_update_permanent_own" on public.analyses;
drop policy if exists "analyses_delete_permanent_own" on public.analyses;

create policy "analyses_select_permanent_own"
  on public.analyses for select to authenticated
  using (user_id = auth.uid()::text and public.auth_is_permanent_user());

create policy "analyses_insert_permanent_own"
  on public.analyses for insert to authenticated
  with check (user_id = auth.uid()::text and public.auth_is_permanent_user());

create policy "analyses_update_permanent_own"
  on public.analyses for update to authenticated
  using (user_id = auth.uid()::text and public.auth_is_permanent_user())
  with check (user_id = auth.uid()::text and public.auth_is_permanent_user());

create policy "analyses_delete_permanent_own"
  on public.analyses for delete to authenticated
  using (user_id = auth.uid()::text and public.auth_is_permanent_user());

notify pgrst, 'reload schema';
