-- =============================================================================
-- Wilder Pro — étape C : contraintes uniques + policies RLS INSERT
-- À coller / appliquer sur le projet Supabase plante-infini.
-- Idempotent (IF NOT EXISTS / DROP POLICY IF EXISTS).
-- =============================================================================

-- ── 1. Un seul studio par compte (évite les doubles en race double-onglet) ───
-- La contrainte peut déjà exister sous le nom pro_studios_one_per_user.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'pro_studios_one_per_user'
      and conrelid = 'public.pro_studios'::regclass
  ) then
    alter table public.pro_studios
      add constraint pro_studios_one_per_user unique (pro_user_id);
  end if;
end $$;

create unique index if not exists pro_studios_pro_user_id_uidx
  on public.pro_studios (pro_user_id);

-- ── 2. Token de lien unique ───────────────────────────────────────────────────
create unique index if not exists pro_links_token_uidx
  on public.pro_links (token);

-- ── 3. RLS : le pro authentifié peut INSERT/SELECT/UPDATE/DELETE ses lignes ─
-- (recréation explicite — si seule SELECT était en place, INSERT manquait)

grant select, insert, update, delete on table public.pro_studios to authenticated;
grant select, insert, update, delete on table public.pro_links to authenticated;
grant select, insert, update, delete on table public.pro_briefs to authenticated;

-- pro_studios
drop policy if exists "pro_studios_select_own" on public.pro_studios;
create policy "pro_studios_select_own"
  on public.pro_studios for select to authenticated
  using (pro_user_id = auth.uid());

drop policy if exists "pro_studios_insert_own" on public.pro_studios;
create policy "pro_studios_insert_own"
  on public.pro_studios for insert to authenticated
  with check (pro_user_id = auth.uid());

drop policy if exists "pro_studios_update_own" on public.pro_studios;
create policy "pro_studios_update_own"
  on public.pro_studios for update to authenticated
  using (pro_user_id = auth.uid())
  with check (pro_user_id = auth.uid());

drop policy if exists "pro_studios_delete_own" on public.pro_studios;
create policy "pro_studios_delete_own"
  on public.pro_studios for delete to authenticated
  using (pro_user_id = auth.uid());

-- pro_links (INSERT requis pour « Envoyer le lien »)
drop policy if exists "pro_links_select_own" on public.pro_links;
create policy "pro_links_select_own"
  on public.pro_links for select to authenticated
  using (
    exists (
      select 1 from public.pro_studios s
      where s.id = studio_id and s.pro_user_id = auth.uid()
    )
  );

drop policy if exists "pro_links_insert_own" on public.pro_links;
create policy "pro_links_insert_own"
  on public.pro_links for insert to authenticated
  with check (
    exists (
      select 1 from public.pro_studios s
      where s.id = studio_id and s.pro_user_id = auth.uid()
    )
  );

drop policy if exists "pro_links_update_own" on public.pro_links;
create policy "pro_links_update_own"
  on public.pro_links for update to authenticated
  using (
    exists (
      select 1 from public.pro_studios s
      where s.id = studio_id and s.pro_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.pro_studios s
      where s.id = studio_id and s.pro_user_id = auth.uid()
    )
  );

drop policy if exists "pro_links_delete_own" on public.pro_links;
create policy "pro_links_delete_own"
  on public.pro_links for delete to authenticated
  using (
    exists (
      select 1 from public.pro_studios s
      where s.id = studio_id and s.pro_user_id = auth.uid()
    )
  );

-- pro_briefs (lecture pro ; écriture client via RPC security definer)
drop policy if exists "pro_briefs_select_own" on public.pro_briefs;
create policy "pro_briefs_select_own"
  on public.pro_briefs for select to authenticated
  using (
    exists (
      select 1
      from public.pro_links l
      join public.pro_studios s on s.id = l.studio_id
      where l.id = link_id and s.pro_user_id = auth.uid()
    )
  );

drop policy if exists "pro_briefs_insert_own" on public.pro_briefs;
create policy "pro_briefs_insert_own"
  on public.pro_briefs for insert to authenticated
  with check (
    exists (
      select 1
      from public.pro_links l
      join public.pro_studios s on s.id = l.studio_id
      where l.id = link_id and s.pro_user_id = auth.uid()
    )
  );

drop policy if exists "pro_briefs_update_own" on public.pro_briefs;
create policy "pro_briefs_update_own"
  on public.pro_briefs for update to authenticated
  using (
    exists (
      select 1
      from public.pro_links l
      join public.pro_studios s on s.id = l.studio_id
      where l.id = link_id and s.pro_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.pro_links l
      join public.pro_studios s on s.id = l.studio_id
      where l.id = link_id and s.pro_user_id = auth.uid()
    )
  );

drop policy if exists "pro_briefs_delete_own" on public.pro_briefs;
create policy "pro_briefs_delete_own"
  on public.pro_briefs for delete to authenticated
  using (
    exists (
      select 1
      from public.pro_links l
      join public.pro_studios s on s.id = l.studio_id
      where l.id = link_id and s.pro_user_id = auth.uid()
    )
  );

notify pgrst, 'reload schema';
