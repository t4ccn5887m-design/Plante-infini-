-- Découvertes persistées (photo, résultat d'analyse, date)
create table if not exists public.analyses (
  id text primary key,
  image_url text not null,
  result jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.analyses add column if not exists id text;
alter table public.analyses add column if not exists image_url text;

alter table public.analyses enable row level security;

drop policy if exists "analyses_anon_select" on public.analyses;
create policy "analyses_anon_select"
on public.analyses for select
to anon, authenticated
using (true);

drop policy if exists "analyses_anon_insert" on public.analyses;
create policy "analyses_anon_insert"
on public.analyses for insert
to anon, authenticated
with check (true);
