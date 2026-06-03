-- Coller dans Supabase → SQL Editor → Run
-- Corrige « new row violates row-level security policy » sur le bucket images

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
