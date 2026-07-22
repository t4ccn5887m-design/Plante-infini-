-- =============================================================================
-- Wilder Pro — Réalisations (dossiers chantier + photos privées)
-- À coller dans : Supabase → SQL Editor → Run
-- Idempotent. Ne touche PAS submit_pro_brief / pro_briefs / pro_appointments /
-- analyses / buckets images ou pro-brief-photos.
-- =============================================================================

-- ── 1. Tables ────────────────────────────────────────────────────────────────

create table if not exists public.pro_projects (
  id            uuid primary key default gen_random_uuid(),
  studio_id     uuid not null references public.pro_studios (id) on delete cascade,
  title         text not null,
  description   text not null default '',
  location      text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint pro_projects_title_nonempty check (length(trim(title)) > 0)
);

create index if not exists pro_projects_studio_created_idx
  on public.pro_projects (studio_id, created_at desc);

create table if not exists public.pro_project_photos (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.pro_projects (id) on delete cascade,
  path          text not null,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  constraint pro_project_photos_path_nonempty check (length(trim(path)) > 0)
);

create index if not exists pro_project_photos_project_idx
  on public.pro_project_photos (project_id, sort_order, created_at);

-- ── 2. RLS pro_projects (même pattern que pro_appointments) ──────────────────

alter table public.pro_projects enable row level security;

grant select, insert, update, delete on table public.pro_projects to authenticated;
revoke all on table public.pro_projects from anon;

drop policy if exists "pro_projects_select_own" on public.pro_projects;
create policy "pro_projects_select_own"
  on public.pro_projects for select to authenticated
  using (
    exists (
      select 1 from public.pro_studios s
      where s.id = studio_id and s.pro_user_id = auth.uid()
    )
  );

drop policy if exists "pro_projects_insert_own" on public.pro_projects;
create policy "pro_projects_insert_own"
  on public.pro_projects for insert to authenticated
  with check (
    exists (
      select 1 from public.pro_studios s
      where s.id = studio_id and s.pro_user_id = auth.uid()
    )
  );

drop policy if exists "pro_projects_update_own" on public.pro_projects;
create policy "pro_projects_update_own"
  on public.pro_projects for update to authenticated
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

drop policy if exists "pro_projects_delete_own" on public.pro_projects;
create policy "pro_projects_delete_own"
  on public.pro_projects for delete to authenticated
  using (
    exists (
      select 1 from public.pro_studios s
      where s.id = studio_id and s.pro_user_id = auth.uid()
    )
  );

-- ── 3. RLS pro_project_photos (via project → studio) ─────────────────────────

alter table public.pro_project_photos enable row level security;

grant select, insert, update, delete on table public.pro_project_photos to authenticated;
revoke all on table public.pro_project_photos from anon;

drop policy if exists "pro_project_photos_select_own" on public.pro_project_photos;
create policy "pro_project_photos_select_own"
  on public.pro_project_photos for select to authenticated
  using (
    exists (
      select 1
      from public.pro_projects p
      join public.pro_studios s on s.id = p.studio_id
      where p.id = project_id and s.pro_user_id = auth.uid()
    )
  );

drop policy if exists "pro_project_photos_insert_own" on public.pro_project_photos;
create policy "pro_project_photos_insert_own"
  on public.pro_project_photos for insert to authenticated
  with check (
    exists (
      select 1
      from public.pro_projects p
      join public.pro_studios s on s.id = p.studio_id
      where p.id = project_id and s.pro_user_id = auth.uid()
    )
  );

drop policy if exists "pro_project_photos_update_own" on public.pro_project_photos;
create policy "pro_project_photos_update_own"
  on public.pro_project_photos for update to authenticated
  using (
    exists (
      select 1
      from public.pro_projects p
      join public.pro_studios s on s.id = p.studio_id
      where p.id = project_id and s.pro_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.pro_projects p
      join public.pro_studios s on s.id = p.studio_id
      where p.id = project_id and s.pro_user_id = auth.uid()
    )
  );

drop policy if exists "pro_project_photos_delete_own" on public.pro_project_photos;
create policy "pro_project_photos_delete_own"
  on public.pro_project_photos for delete to authenticated
  using (
    exists (
      select 1
      from public.pro_projects p
      join public.pro_studios s on s.id = p.studio_id
      where p.id = project_id and s.pro_user_id = auth.uid()
    )
  );

-- ── 4. Bucket privé pro-project-photos ───────────────────────────────────────
-- Chemins : {studio_id}/{project_id}/{uuid}.jpg

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pro-project-photos',
  'pro-project-photos',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ── 5. Policies Storage (authenticated, studio owner via folder[1]) ──────────

drop policy if exists "pro_project_photos_storage_select" on storage.objects;
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

drop policy if exists "pro_project_photos_storage_insert" on storage.objects;
create policy "pro_project_photos_storage_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'pro-project-photos'
    and exists (
      select 1 from public.pro_studios s
      where s.id::text = (storage.foldername(name))[1]
        and s.pro_user_id = auth.uid()
    )
  );

drop policy if exists "pro_project_photos_storage_update" on storage.objects;
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

drop policy if exists "pro_project_photos_storage_delete" on storage.objects;
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

notify pgrst, 'reload schema';
