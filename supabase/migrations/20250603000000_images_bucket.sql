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

-- Lecture publique
create policy "images_public_read"
on storage.objects for select
to public
using (bucket_id = 'images');

-- Upload via clé anon (API Next.js)
create policy "images_anon_insert"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'images');
