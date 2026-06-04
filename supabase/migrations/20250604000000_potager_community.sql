-- Partages de récolte et alertes surplus entre voisins (géolocalisés)
create table if not exists public.potager_community_posts (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('harvest', 'surplus')),
  comment text,
  photo text,
  plants jsonb not null default '[]'::jsonb,
  latitude double precision not null,
  longitude double precision not null,
  place_name text,
  created_at timestamptz not null default now()
);

create index if not exists potager_community_posts_created_at_idx
  on public.potager_community_posts (created_at desc);

alter table public.potager_community_posts enable row level security;

drop policy if exists "potager_community_anon_select" on public.potager_community_posts;
create policy "potager_community_anon_select"
on public.potager_community_posts for select
to anon, authenticated
using (true);

drop policy if exists "potager_community_anon_insert" on public.potager_community_posts;
create policy "potager_community_anon_insert"
on public.potager_community_posts for insert
to anon, authenticated
with check (true);

notify pgrst, 'reload schema';
