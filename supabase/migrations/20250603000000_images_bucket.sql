-- Bucket public "images" pour les photos de découvertes
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'images',
  'images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Politiques Storage (idempotent — à exécuter dans le SQL Editor si upload refusé)
drop policy if exists "images_public_read" on storage.objects;
drop policy if exists "images_anon_insert" on storage.objects;
drop policy if exists "Public read" on storage.objects;
drop policy if exists "Public upload" on storage.objects;

create policy "Public read"
on storage.objects for select
to public
using (bucket_id = 'images');

create policy "Public upload"
on storage.objects for insert
to public
with check (bucket_id = 'images');
