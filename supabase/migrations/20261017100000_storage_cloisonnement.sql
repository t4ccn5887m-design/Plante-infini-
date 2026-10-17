-- Sevya — cloisonnement Storage (§14 bis) — appliqué à la main dans le SQL Editor le 17/10/2026
-- 1. pro-project-photos : lecture / modification / suppression limitées au studio du pro
--    (chemin = {studio_id}/{project_id}/{uuid}.jpg). L'insert existant (déjà cloisonné) n'est pas modifié.
-- 2. images : lecture publique conservée ; écriture réservée à un compte connecté dans son dossier {user_id}/...
--    Supprime "Public upload" (n'importe qui pouvait déposer des fichiers sans compte).
begin;

drop policy if exists "pro_project_photos_storage_select" on storage.objects;
drop policy if exists "pro_project_photos_storage_update" on storage.objects;
drop policy if exists "pro_project_photos_storage_delete" on storage.objects;

create policy "pro_project_photos_storage_select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'pro-project-photos'
    and exists (
      select 1 from public.pro_studios s
      where s.id::text = (storage.foldername(name))[1]
        and s.pro_user_id = auth.uid()
    )
  );

create policy "pro_project_photos_storage_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'pro-project-photos'
    and exists (
      select 1 from public.pro_studios s
      where s.id::text = (storage.foldername(name))[1]
        and s.pro_user_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'pro-project-photos'
    and exists (
      select 1 from public.pro_studios s
      where s.id::text = (storage.foldername(name))[1]
        and s.pro_user_id = auth.uid()
    )
  );

create policy "pro_project_photos_storage_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'pro-project-photos'
    and exists (
      select 1 from public.pro_studios s
      where s.id::text = (storage.foldername(name))[1]
        and s.pro_user_id = auth.uid()
    )
  );

drop policy if exists "Public upload" on storage.objects;
drop policy if exists "public upload" on storage.objects;
drop policy if exists "images_owner_insert" on storage.objects;
drop policy if exists "images_owner_update" on storage.objects;
drop policy if exists "images_owner_delete" on storage.objects;

create policy "images_owner_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "images_owner_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "images_owner_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);

commit;

-- 3. pro-brief-photos : fix des règles pro (appliqué le 17/10/2026).
--    Avant : "name" était résolu en pro_studios.name (nom du studio) → condition toujours fausse,
--    le pro ne voyait jamais les photos terrain de ses clients. On qualifie storage.objects.name.
begin;

drop policy if exists "pro_brief_photos_pro_select" on storage.objects;
drop policy if exists "pro_brief_photos_pro_delete" on storage.objects;

create policy "pro_brief_photos_pro_select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'pro-brief-photos'
    and exists (
      select 1
      from public.pro_links l
      join public.pro_studios s on s.id = l.studio_id
      where l.token = (storage.foldername(storage.objects.name))[1]
        and s.pro_user_id = auth.uid()
    )
  );

create policy "pro_brief_photos_pro_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'pro-brief-photos'
    and exists (
      select 1
      from public.pro_links l
      join public.pro_studios s on s.id = l.studio_id
      where l.token = (storage.foldername(storage.objects.name))[1]
        and s.pro_user_id = auth.uid()
    )
  );

commit;
