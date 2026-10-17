-- =============================================================================
-- Sevya Pro — schéma de base (studios, liens client, briefs)
--
-- Ces tables ont été créées à la main dans le SQL Editor en juillet 2026, sans
-- migration. Ce fichier les reconstitue à partir d'un export de la prod
-- (17 octobre 2026) pour qu'une base vide puisse être reconstruite.
--
-- Sur la prod : NE PAS RELANCER (tout existe déjà). Le fichier est idempotent
-- par précaution (IF NOT EXISTS / DROP POLICY IF EXISTS / CREATE OR REPLACE).
-- État final des colonnes : les migrations suivantes qui ajoutent des colonnes
-- (« add column if not exists ») deviennent sans effet, c'est voulu.
-- =============================================================================

-- ---------- Tables ----------------------------------------------------------

create table if not exists public.pro_studios (
  id                 uuid primary key default gen_random_uuid(),
  pro_user_id        uuid not null references auth.users(id) on delete cascade,
  name               text not null,
  contact_first_name text not null default '',
  initials           text not null default '',
  color              text not null default '#2F5E3F',
  logo_url           text,
  intervention_zone  text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  presentation       text,
  years_experience   integer,
  specialties        text[],
  contact_email      text,
  constraint pro_studios_one_per_user unique (pro_user_id)
);

create table if not exists public.pro_links (
  id             uuid primary key default gen_random_uuid(),
  studio_id      uuid not null references public.pro_studios(id) on delete cascade,
  token          text not null,
  client_name    text not null,
  client_phone   text,
  client_address text,
  status         text not null default 'sent'
                 constraint pro_links_status_check check (status in ('sent', 'opened', 'filled')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  opened_at      timestamptz,
  filled_at      timestamptz,
  stage          text
                 constraint pro_links_stage_check check (stage is null or stage in ('done', 'proposal', 'won', 'lost')),
  archived_at    timestamptz
);

create table if not exists public.pro_briefs (
  id            uuid primary key default gen_random_uuid(),
  link_id       uuid not null references public.pro_links(id) on delete cascade,
  tastes        text[] not null default '{}',
  plants        text[] not null default '{}',
  materials     text[] not null default '{}',
  priorities    text[] not null default '{}',
  garden_users  text[] not null default '{}',
  maintenance   text
                constraint pro_briefs_maintenance_check check (maintenance is null or maintenance in ('min', 'weekend', 'love')),
  photo_urls    text[] not null default '{}',
  budget        text
                constraint pro_briefs_budget_check check (budget is null or budget in ('lt3', '3-5', '5-10', '10-20', '20+', 'unknown')),
  message       text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  submitted_at  timestamptz not null default now(),
  area_range    text,
  timeline      text,
  utilities     text,
  details       jsonb not null default '{}'::jsonb,
  constraint pro_briefs_link_id_key unique (link_id)
);

-- ---------- Index -----------------------------------------------------------

create index if not exists pro_studios_pro_user_id_idx on public.pro_studios (pro_user_id);
create unique index if not exists pro_links_token_uidx on public.pro_links (token);
create index if not exists pro_links_studio_id_idx on public.pro_links (studio_id);
create index if not exists pro_links_studio_status_idx on public.pro_links (studio_id, status);
create index if not exists pro_briefs_link_id_idx on public.pro_briefs (link_id);

-- ---------- RLS : chaque pro ne voit que son studio --------------------------
-- Le client invité (anon) n'a AUCUN accès direct : il passe par les fonctions
-- SECURITY DEFINER ci-dessous. Ne jamais faire GRANT SELECT ... TO anon.

alter table public.pro_studios enable row level security;
alter table public.pro_links   enable row level security;
alter table public.pro_briefs  enable row level security;

grant select, insert, update, delete on public.pro_studios to authenticated;
grant select, insert, update, delete on public.pro_links   to authenticated;
grant select, insert, update, delete on public.pro_briefs  to authenticated;

drop policy if exists "pro_studios_select_own" on public.pro_studios;
create policy "pro_studios_select_own" on public.pro_studios
  for select to authenticated using (pro_user_id = auth.uid());
drop policy if exists "pro_studios_insert_own" on public.pro_studios;
create policy "pro_studios_insert_own" on public.pro_studios
  for insert to authenticated with check (pro_user_id = auth.uid());
drop policy if exists "pro_studios_update_own" on public.pro_studios;
create policy "pro_studios_update_own" on public.pro_studios
  for update to authenticated using (pro_user_id = auth.uid()) with check (pro_user_id = auth.uid());
drop policy if exists "pro_studios_delete_own" on public.pro_studios;
create policy "pro_studios_delete_own" on public.pro_studios
  for delete to authenticated using (pro_user_id = auth.uid());

drop policy if exists "pro_links_select_own" on public.pro_links;
create policy "pro_links_select_own" on public.pro_links
  for select to authenticated using (exists (
    select 1 from public.pro_studios s where s.id = pro_links.studio_id and s.pro_user_id = auth.uid()));
drop policy if exists "pro_links_insert_own" on public.pro_links;
create policy "pro_links_insert_own" on public.pro_links
  for insert to authenticated with check (exists (
    select 1 from public.pro_studios s where s.id = pro_links.studio_id and s.pro_user_id = auth.uid()));
drop policy if exists "pro_links_update_own" on public.pro_links;
create policy "pro_links_update_own" on public.pro_links
  for update to authenticated
  using (exists (select 1 from public.pro_studios s where s.id = pro_links.studio_id and s.pro_user_id = auth.uid()))
  with check (exists (select 1 from public.pro_studios s where s.id = pro_links.studio_id and s.pro_user_id = auth.uid()));
drop policy if exists "pro_links_delete_own" on public.pro_links;
create policy "pro_links_delete_own" on public.pro_links
  for delete to authenticated using (exists (
    select 1 from public.pro_studios s where s.id = pro_links.studio_id and s.pro_user_id = auth.uid()));

drop policy if exists "pro_briefs_select_own" on public.pro_briefs;
create policy "pro_briefs_select_own" on public.pro_briefs
  for select to authenticated using (exists (
    select 1 from public.pro_links l join public.pro_studios s on s.id = l.studio_id
    where l.id = pro_briefs.link_id and s.pro_user_id = auth.uid()));
drop policy if exists "pro_briefs_insert_own" on public.pro_briefs;
create policy "pro_briefs_insert_own" on public.pro_briefs
  for insert to authenticated with check (exists (
    select 1 from public.pro_links l join public.pro_studios s on s.id = l.studio_id
    where l.id = pro_briefs.link_id and s.pro_user_id = auth.uid()));
drop policy if exists "pro_briefs_update_own" on public.pro_briefs;
create policy "pro_briefs_update_own" on public.pro_briefs
  for update to authenticated
  using (exists (select 1 from public.pro_links l join public.pro_studios s on s.id = l.studio_id
                 where l.id = pro_briefs.link_id and s.pro_user_id = auth.uid()))
  with check (exists (select 1 from public.pro_links l join public.pro_studios s on s.id = l.studio_id
                      where l.id = pro_briefs.link_id and s.pro_user_id = auth.uid()));
drop policy if exists "pro_briefs_delete_own" on public.pro_briefs;
create policy "pro_briefs_delete_own" on public.pro_briefs
  for delete to authenticated using (exists (
    select 1 from public.pro_links l join public.pro_studios s on s.id = l.studio_id
    where l.id = pro_briefs.link_id and s.pro_user_id = auth.uid()));

-- ---------- Fonctions appelées par le client invité --------------------------

-- Ouverture du lien /b/[token] : renvoie le prénom du client + l'identité du
-- studio, passe le lien de « sent » à « opened ». Ne renvoie jamais téléphone
-- ni adresse.
create or replace function public.get_pro_link_by_token(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link   public.pro_links;
  v_studio public.pro_studios;
begin
  if p_token is null or length(trim(p_token)) < 8 then
    return jsonb_build_object('ok', false, 'error', 'invalid_token');
  end if;

  select * into v_link from public.pro_links where token = trim(p_token);
  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  select * into v_studio from public.pro_studios where id = v_link.studio_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'studio_missing');
  end if;

  if v_link.status = 'sent' then
    update public.pro_links
    set status = 'opened', opened_at = coalesce(opened_at, now())
    where id = v_link.id
    returning * into v_link;
  end if;

  return jsonb_build_object(
    'ok', true,
    'link', jsonb_build_object(
      'token', v_link.token,
      'status', v_link.status,
      'client_name', v_link.client_name,
      'opened_at', v_link.opened_at,
      'filled_at', v_link.filled_at
    ),
    'studio', jsonb_build_object(
      'name', v_studio.name,
      'contact_first_name', v_studio.contact_first_name,
      'initials', v_studio.initials,
      'color', v_studio.color,
      'logo_url', v_studio.logo_url
    )
  );
end;
$$;

revoke all on function public.get_pro_link_by_token(text) from public;
grant execute on function public.get_pro_link_by_token(text) to anon, authenticated;

-- Utilisée par les policies Storage du bucket pro-brief-photos (anon ne peut
-- pas lire pro_links). Redéfinie à l'identique dans 20260730180000.
create or replace function public.is_valid_brief_token(p_token text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.pro_links l
    where l.token = p_token and l.status in ('sent', 'opened')
  );
$$;

revoke all on function public.is_valid_brief_token(text) from public;
grant execute on function public.is_valid_brief_token(text) to anon, authenticated;

-- submit_pro_brief : voir 20261013180000 (version actuelle).

notify pgrst, 'reload schema';
