-- Sync cloud par utilisateur : chaque découverte est liée à auth.uid()
alter table public.analyses add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.analyses add column if not exists client_id text;
alter table public.analyses add column if not exists image_url text;

create unique index if not exists analyses_user_client_id_idx
  on public.analyses (user_id, client_id);

-- RLS : chaque utilisateur ne voit que ses découvertes
drop policy if exists "analyses_anon_select" on public.analyses;
drop policy if exists "analyses_anon_insert" on public.analyses;
drop policy if exists "analyses_select_own" on public.analyses;
drop policy if exists "analyses_insert_own" on public.analyses;
drop policy if exists "analyses_update_own" on public.analyses;

create policy "analyses_select_own"
on public.analyses for select
to authenticated
using (auth.uid() = user_id);

create policy "analyses_insert_own"
on public.analyses for insert
to authenticated
with check (auth.uid() = user_id);

create policy "analyses_update_own"
on public.analyses for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

notify pgrst, 'reload schema';
