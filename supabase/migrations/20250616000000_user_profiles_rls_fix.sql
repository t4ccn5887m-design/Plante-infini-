-- user_profiles : RLS + GRANT pour enregistrement consentements (CGU/CGV)
-- Corrige upsert consentement côté client (authenticated, y compris comptes anonymes Supabase).

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  cgu_consent_at timestamptz,
  cgu_consent_version text,
  privacy_consent_at timestamptz,
  privacy_consent_version text,
  cgv_consent_at timestamptz,
  cgv_consent_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

drop policy if exists "user_profiles_select_own" on public.user_profiles;
drop policy if exists "user_profiles_insert_own" on public.user_profiles;
drop policy if exists "user_profiles_update_own" on public.user_profiles;

create policy "user_profiles_select_own"
  on public.user_profiles for select
  to authenticated
  using (auth.uid() = user_id);

create policy "user_profiles_insert_own"
  on public.user_profiles for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "user_profiles_update_own"
  on public.user_profiles for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update on table public.user_profiles to authenticated;
grant select on table public.user_profiles to anon;

notify pgrst, 'reload schema';
