-- RLS trouvailles (table public.analyses) — déjà appliqué par les migrations existantes.
-- Exécuter uniquement si les policies manquent sur un projet Supabase vierge.

alter table public.analyses add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.analyses add column if not exists client_id text;
alter table public.analyses add column if not exists image_url text;

create unique index if not exists analyses_user_client_id_idx
  on public.analyses (user_id, client_id);

alter table public.analyses enable row level security;

drop policy if exists "analyses_select_own" on public.analyses;
drop policy if exists "analyses_insert_own" on public.analyses;
drop policy if exists "analyses_update_own" on public.analyses;
drop policy if exists "analyses_delete_own" on public.analyses;

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

create policy "analyses_delete_own"
on public.analyses for delete
to authenticated
using (auth.uid() = user_id);

notify pgrst, 'reload schema';
