-- Sevya — appliqué à la main le 17/10/2026.
-- Un client déjà connecté (session anonyme "Découvrir sans compte" ou compte particulier/pro)
-- a le rôle "authenticated", pas "anon" : les règles anon ne s'appliquaient pas → upload refusé.
-- Même contrôle que pour anon : le 1er dossier du chemin doit être un token de lien valide.
begin;

drop policy if exists "pro_brief_photos_auth_insert" on storage.objects;
create policy "pro_brief_photos_auth_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'pro-brief-photos'
    and public.is_valid_brief_token((storage.foldername(storage.objects.name))[1])
  );

drop policy if exists "pro_brief_photos_auth_select_token" on storage.objects;
create policy "pro_brief_photos_auth_select_token"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'pro-brief-photos'
    and public.is_valid_brief_token((storage.foldername(storage.objects.name))[1])
  );

commit;
