-- Trouvailles : comptes permanents uniquement (pas les sessions anonymes Supabase).
-- Les utilisateurs anon ont le rôle Postgres "authenticated" : il faut filtrer is_anonymous.
-- À valider avant exécution sur le projet Supabase.

create or replace function public.auth_is_permanent_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select u.is_anonymous = false
      from auth.users u
      where u.id = auth.uid()
    ),
    false
  );
$$;

revoke all on function public.auth_is_permanent_user() from public;
grant execute on function public.auth_is_permanent_user() to authenticated;

-- Anciennes policies ouvertes (si encore présentes)
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
on public.analyses for select
to authenticated
using (auth.uid() = user_id and public.auth_is_permanent_user());

create policy "analyses_insert_permanent_own"
on public.analyses for insert
to authenticated
with check (auth.uid() = user_id and public.auth_is_permanent_user());

create policy "analyses_update_permanent_own"
on public.analyses for update
to authenticated
using (auth.uid() = user_id and public.auth_is_permanent_user())
with check (auth.uid() = user_id and public.auth_is_permanent_user());

create policy "analyses_delete_permanent_own"
on public.analyses for delete
to authenticated
using (auth.uid() = user_id and public.auth_is_permanent_user());

-- Optionnel : retirer les lignes créées sous identité anonyme (à lancer seulement si souhaité)
-- delete from public.analyses a
-- using auth.users u
-- where a.user_id = u.id and coalesce(u.is_anonymous, false) = true;

notify pgrst, 'reload schema';
