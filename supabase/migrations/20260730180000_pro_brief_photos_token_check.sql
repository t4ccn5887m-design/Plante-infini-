-- =============================================================================
-- Wilder Pro — Storage pro-brief-photos : check token via SECURITY DEFINER
-- À coller dans : Supabase → SQL Editor → Run
-- Idempotent. Ne touche PAS submit_pro_brief / get_pro_link_by_token /
-- policies authenticated pro_brief_photos_pro_*.
-- =============================================================================
--
-- Contexte : les policies anon faisaient EXISTS sur public.pro_links. Le rôle
-- anon n’a pas GRANT SELECT sur cette table → "permission denied for table
-- pro_links" à l’upload. On délègue la vérif à une fonction SECURITY DEFINER
-- qui ne renvoie qu’un booléen (token sent/opened), sans exposer les lignes.
-- =============================================================================

-- ── 1. Fonction : token brief encore ouvert ? ────────────────────────────────

create or replace function public.is_valid_brief_token(p_token text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.pro_links l
    where l.token = p_token
      and l.status in ('sent', 'opened')
  );
$$;

revoke all on function public.is_valid_brief_token(text) from public;
grant execute on function public.is_valid_brief_token(text) to anon, authenticated;

-- ── 2. Policies Storage anon (réécriture — pro_* inchangées) ────────────────

drop policy if exists "pro_brief_photos_anon_insert" on storage.objects;
create policy "pro_brief_photos_anon_insert"
  on storage.objects for insert to anon
  with check (
    bucket_id = 'pro-brief-photos'
    and public.is_valid_brief_token((storage.foldername(name))[1])
  );

drop policy if exists "pro_brief_photos_anon_select" on storage.objects;
create policy "pro_brief_photos_anon_select"
  on storage.objects for select to anon
  using (
    bucket_id = 'pro-brief-photos'
    and public.is_valid_brief_token((storage.foldername(name))[1])
  );

drop policy if exists "pro_brief_photos_anon_update" on storage.objects;
create policy "pro_brief_photos_anon_update"
  on storage.objects for update to anon
  using (
    bucket_id = 'pro-brief-photos'
    and public.is_valid_brief_token((storage.foldername(name))[1])
  )
  with check (
    bucket_id = 'pro-brief-photos'
    and public.is_valid_brief_token((storage.foldername(name))[1])
  );

drop policy if exists "pro_brief_photos_anon_delete" on storage.objects;
create policy "pro_brief_photos_anon_delete"
  on storage.objects for delete to anon
  using (
    bucket_id = 'pro-brief-photos'
    and public.is_valid_brief_token((storage.foldername(name))[1])
  );

notify pgrst, 'reload schema';
