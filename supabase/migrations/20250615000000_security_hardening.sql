-- Wilder — durcissement sécurité : Stripe premium, RPC, RLS communauté, storage images
-- Exécuter dans l'éditeur SQL Supabase (ou via CLI migrate).

-- ── 1. scan_counts : métadonnées Stripe ──
alter table public.scan_counts
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists premium_plan text,
  add column if not exists premium_current_period_end timestamptz;

create index if not exists scan_counts_stripe_subscription_idx
  on public.scan_counts (stripe_subscription_id)
  where stripe_subscription_id is not null;

create index if not exists scan_counts_stripe_customer_idx
  on public.scan_counts (stripe_customer_id)
  where stripe_customer_id is not null;

-- ── 2. get_scan_quota : inclure plan / renouvellement ──
create or replace function public.get_scan_quota(
  p_visitor_key text,
  p_user_id uuid default null,
  p_limit integer default 15
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.scan_counts;
begin
  v_row := public.ensure_scan_count_row(p_visitor_key, p_user_id);

  return jsonb_build_object(
    'count', v_row.count,
    'limit', p_limit,
    'is_premium', v_row.is_premium,
    'can_scan', v_row.is_premium or v_row.count < p_limit,
    'premium_plan', v_row.premium_plan,
    'premium_current_period_end', v_row.premium_current_period_end
  );
end;
$$;

-- ── 3. REVOKE EXECUTE sur toutes les RPC sensibles (service_role uniquement) ──
do $$
declare
  fn text;
begin
  for fn in
    select p.oid::regprocedure::text
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'ensure_scan_count_row',
        'get_scan_quota',
        'check_scan_allowed',
        'increment_scan_count',
        'activate_scan_premium',
        'admin_scan_counts_summary',
        'admin_scan_daily_series',
        'admin_unique_scan_visitors',
        'admin_top_scanned_species',
        'admin_auth_accounts_summary'
      )
  loop
    execute format('revoke all on function %s from public', fn);
    execute format('revoke all on function %s from anon', fn);
    execute format('revoke all on function %s from authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
  end loop;
end $$;

-- ── 4. Communauté potager : author_id ──
alter table public.potager_community_posts
  add column if not exists author_id uuid references auth.users (id) on delete set null;

drop policy if exists "potager_community_anon_select" on public.potager_community_posts;
drop policy if exists "potager_community_anon_insert" on public.potager_community_posts;

create policy "potager_community_public_select"
on public.potager_community_posts for select
to anon, authenticated
using (true);

create policy "potager_community_auth_insert"
on public.potager_community_posts for insert
to authenticated
with check (auth.uid() = author_id);

create policy "potager_community_owner_update"
on public.potager_community_posts for update
to authenticated
using (auth.uid() = author_id)
with check (auth.uid() = author_id);

create policy "potager_community_owner_delete"
on public.potager_community_posts for delete
to authenticated
using (auth.uid() = author_id);

-- ── 5. Communauté rando : author_id ──
alter table public.rando_community_journals
  add column if not exists author_id uuid references auth.users (id) on delete set null;

alter table public.rando_community_comments
  add column if not exists author_id uuid references auth.users (id) on delete set null;

drop policy if exists "rando_community_journals_select" on public.rando_community_journals;
drop policy if exists "rando_community_journals_insert" on public.rando_community_journals;
drop policy if exists "rando_community_comments_select" on public.rando_community_comments;
drop policy if exists "rando_community_comments_insert" on public.rando_community_comments;
drop policy if exists "rando_community_likes_select" on public.rando_community_discovery_likes;
drop policy if exists "rando_community_likes_insert" on public.rando_community_discovery_likes;
drop policy if exists "rando_community_likes_delete" on public.rando_community_discovery_likes;

create policy "rando_journals_public_select"
on public.rando_community_journals for select
to anon, authenticated
using (true);

create policy "rando_journals_auth_insert"
on public.rando_community_journals for insert
to authenticated
with check (auth.uid() = author_id);

create policy "rando_journals_owner_update"
on public.rando_community_journals for update
to authenticated
using (auth.uid() = author_id)
with check (auth.uid() = author_id);

create policy "rando_journals_owner_delete"
on public.rando_community_journals for delete
to authenticated
using (auth.uid() = author_id);

create policy "rando_comments_public_select"
on public.rando_community_comments for select
to anon, authenticated
using (true);

create policy "rando_comments_auth_insert"
on public.rando_community_comments for insert
to authenticated
with check (auth.uid() = author_id);

create policy "rando_comments_owner_delete"
on public.rando_community_comments for delete
to authenticated
using (auth.uid() = author_id);

create policy "rando_likes_public_select"
on public.rando_community_discovery_likes for select
to anon, authenticated
using (true);

create policy "rando_likes_auth_insert"
on public.rando_community_discovery_likes for insert
to authenticated
with check (voter_id = auth.uid()::text);

create policy "rando_likes_owner_delete"
on public.rando_community_discovery_likes for delete
to authenticated
using (voter_id = auth.uid()::text);

-- ── 6. Storage bucket images : lecture publique, écriture authentifiée dans son dossier ──
drop policy if exists "Public read" on storage.objects;
drop policy if exists "Public upload" on storage.objects;
drop policy if exists "images_public_read" on storage.objects;
drop policy if exists "images_anon_insert" on storage.objects;

create policy "images_public_read"
on storage.objects for select
to public
using (bucket_id = 'images');

create policy "images_auth_insert_own_folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "images_auth_update_own_folder"
on storage.objects for update
to authenticated
using (
  bucket_id = 'images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "images_auth_delete_own_folder"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

notify pgrst, 'reload schema';
