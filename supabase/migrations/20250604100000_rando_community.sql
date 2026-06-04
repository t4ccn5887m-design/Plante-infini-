-- Carnets de rando partagés, commentaires et likes sur les découvertes
create table if not exists public.rando_community_journals (
  id uuid primary key default gen_random_uuid(),
  local_album_id text,
  author_name text not null default 'Randonneur·euse',
  name text not null,
  place_name text,
  distance_km double precision,
  discovery_count integer not null default 0,
  cover_photo text,
  latitude double precision not null,
  longitude double precision not null,
  ended_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists rando_community_journals_created_at_idx
  on public.rando_community_journals (created_at desc);

create table if not exists public.rando_community_comments (
  id uuid primary key default gen_random_uuid(),
  journal_id uuid not null references public.rando_community_journals (id) on delete cascade,
  author_name text not null default 'Randonneur·euse',
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists rando_community_comments_journal_idx
  on public.rando_community_comments (journal_id, created_at asc);

create table if not exists public.rando_community_discovery_likes (
  id uuid primary key default gen_random_uuid(),
  journal_id uuid not null references public.rando_community_journals (id) on delete cascade,
  discovery_key text not null,
  voter_id text not null,
  created_at timestamptz not null default now(),
  unique (journal_id, discovery_key, voter_id)
);

create index if not exists rando_community_likes_journal_idx
  on public.rando_community_discovery_likes (journal_id, discovery_key);

alter table public.rando_community_journals enable row level security;
alter table public.rando_community_comments enable row level security;
alter table public.rando_community_discovery_likes enable row level security;

drop policy if exists "rando_community_journals_select" on public.rando_community_journals;
create policy "rando_community_journals_select"
on public.rando_community_journals for select to anon, authenticated using (true);

drop policy if exists "rando_community_journals_insert" on public.rando_community_journals;
create policy "rando_community_journals_insert"
on public.rando_community_journals for insert to anon, authenticated with check (true);

drop policy if exists "rando_community_comments_select" on public.rando_community_comments;
create policy "rando_community_comments_select"
on public.rando_community_comments for select to anon, authenticated using (true);

drop policy if exists "rando_community_comments_insert" on public.rando_community_comments;
create policy "rando_community_comments_insert"
on public.rando_community_comments for insert to anon, authenticated with check (true);

drop policy if exists "rando_community_likes_select" on public.rando_community_discovery_likes;
create policy "rando_community_likes_select"
on public.rando_community_discovery_likes for select to anon, authenticated using (true);

drop policy if exists "rando_community_likes_insert" on public.rando_community_discovery_likes;
create policy "rando_community_likes_insert"
on public.rando_community_discovery_likes for insert to anon, authenticated with check (true);

drop policy if exists "rando_community_likes_delete" on public.rando_community_discovery_likes;
create policy "rando_community_likes_delete"
on public.rando_community_discovery_likes for delete to anon, authenticated using (true);

notify pgrst, 'reload schema';
