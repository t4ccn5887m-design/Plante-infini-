-- Découvertes persistées (résultat d'analyse + date)
create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  result jsonb not null default '{}',
  created_at timestamptz not null default now()
);

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
