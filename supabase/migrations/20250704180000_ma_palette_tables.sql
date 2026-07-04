-- Ma Palette végétale — palettes, zones, liens trouvailles
-- Prérequis : public.analyses (id int8/bigint, user_id text)
-- À exécuter manuellement sur Supabase après relecture.

-- ── 1. palettes ──────────────────────────────────────────────
create table if not exists public.palettes (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  nom         text not null default 'Nouvelle palette',
  style       text check (style is null or style in ('anglais', 'francais', 'mediterraneen')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists palettes_user_id_idx
  on public.palettes (user_id);

-- ── 2. palette_zones ─────────────────────────────────────────
create table if not exists public.palette_zones (
  id               uuid primary key default gen_random_uuid(),
  palette_id       uuid not null references public.palettes (id) on delete cascade,
  nom              text not null default 'Massif 1',
  surface_m2       numeric(8, 2) check (surface_m2 is null or surface_m2 > 0),
  exposition       text check (
    exposition is null
    or exposition in ('soleil', 'mi-ombre', 'ombre')
  ),
  is_sujets_isoles boolean not null default false,
  ordre            int not null default 0,
  note             text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists palette_zones_palette_id_idx
  on public.palette_zones (palette_id);

create unique index if not exists palette_zones_one_sujets_isoles_idx
  on public.palette_zones (palette_id)
  where is_sujets_isoles = true;

-- ── 3. palette_items (lien trouvaille ↔ zone) ───────────────
create table if not exists public.palette_items (
  id          uuid primary key default gen_random_uuid(),
  zone_id     uuid not null references public.palette_zones (id) on delete cascade,
  analysis_id bigint not null references public.analyses (id) on delete cascade,
  type        text not null check (type in ('sujet', 'massif')),
  quantite    int check (
    (type = 'sujet' and quantite is not null and quantite > 0)
    or (type = 'massif' and quantite is null)
  ),
  note        text,
  ordre       int not null default 0,
  created_at  timestamptz not null default now(),
  unique (zone_id, analysis_id)
);

create index if not exists palette_items_zone_id_idx
  on public.palette_items (zone_id);

create index if not exists palette_items_analysis_id_idx
  on public.palette_items (analysis_id);

-- ── 4. updated_at ────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists palettes_set_updated_at on public.palettes;
create trigger palettes_set_updated_at
  before update on public.palettes
  for each row execute function public.set_updated_at();

drop trigger if exists palette_zones_set_updated_at on public.palette_zones;
create trigger palette_zones_set_updated_at
  before update on public.palette_zones
  for each row execute function public.set_updated_at();

-- ── 5. Cohérence : la trouvaille appartient au propriétaire de la palette
create or replace function public.check_palette_item_analysis_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  palette_owner text;
  analysis_owner text;
begin
  select p.user_id into palette_owner
  from public.palette_zones z
  join public.palettes p on p.id = z.palette_id
  where z.id = new.zone_id;

  select a.user_id into analysis_owner
  from public.analyses a
  where a.id = new.analysis_id;

  if palette_owner is null then
    raise exception 'palette_zone_not_found';
  end if;

  if analysis_owner is distinct from palette_owner then
    raise exception 'analysis_not_owned_by_palette_user';
  end if;

  return new;
end;
$$;

drop trigger if exists palette_items_check_analysis_owner on public.palette_items;
create trigger palette_items_check_analysis_owner
  before insert or update on public.palette_items
  for each row execute function public.check_palette_item_analysis_owner();

-- ── 6. RLS ───────────────────────────────────────────────────
alter table public.palettes enable row level security;
alter table public.palette_zones enable row level security;
alter table public.palette_items enable row level security;

-- palettes
drop policy if exists "palettes_select_own" on public.palettes;
create policy "palettes_select_own"
  on public.palettes for select to authenticated
  using (user_id = auth.uid()::text);

drop policy if exists "palettes_insert_own" on public.palettes;
create policy "palettes_insert_own"
  on public.palettes for insert to authenticated
  with check (user_id = auth.uid()::text);

drop policy if exists "palettes_update_own" on public.palettes;
create policy "palettes_update_own"
  on public.palettes for update to authenticated
  using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

drop policy if exists "palettes_delete_own" on public.palettes;
create policy "palettes_delete_own"
  on public.palettes for delete to authenticated
  using (user_id = auth.uid()::text);

-- palette_zones
drop policy if exists "palette_zones_select_own" on public.palette_zones;
create policy "palette_zones_select_own"
  on public.palette_zones for select to authenticated
  using (
    exists (
      select 1 from public.palettes p
      where p.id = palette_id and p.user_id = auth.uid()::text
    )
  );

drop policy if exists "palette_zones_insert_own" on public.palette_zones;
create policy "palette_zones_insert_own"
  on public.palette_zones for insert to authenticated
  with check (
    exists (
      select 1 from public.palettes p
      where p.id = palette_id and p.user_id = auth.uid()::text
    )
  );

drop policy if exists "palette_zones_update_own" on public.palette_zones;
create policy "palette_zones_update_own"
  on public.palette_zones for update to authenticated
  using (
    exists (
      select 1 from public.palettes p
      where p.id = palette_id and p.user_id = auth.uid()::text
    )
  )
  with check (
    exists (
      select 1 from public.palettes p
      where p.id = palette_id and p.user_id = auth.uid()::text
    )
  );

drop policy if exists "palette_zones_delete_own" on public.palette_zones;
create policy "palette_zones_delete_own"
  on public.palette_zones for delete to authenticated
  using (
    exists (
      select 1 from public.palettes p
      where p.id = palette_id and p.user_id = auth.uid()::text
    )
  );

-- palette_items
drop policy if exists "palette_items_select_own" on public.palette_items;
create policy "palette_items_select_own"
  on public.palette_items for select to authenticated
  using (
    exists (
      select 1
      from public.palette_zones z
      join public.palettes p on p.id = z.palette_id
      where z.id = zone_id and p.user_id = auth.uid()::text
    )
  );

drop policy if exists "palette_items_insert_own" on public.palette_items;
create policy "palette_items_insert_own"
  on public.palette_items for insert to authenticated
  with check (
    exists (
      select 1
      from public.palette_zones z
      join public.palettes p on p.id = z.palette_id
      where z.id = zone_id and p.user_id = auth.uid()::text
    )
  );

drop policy if exists "palette_items_update_own" on public.palette_items;
create policy "palette_items_update_own"
  on public.palette_items for update to authenticated
  using (
    exists (
      select 1
      from public.palette_zones z
      join public.palettes p on p.id = z.palette_id
      where z.id = zone_id and p.user_id = auth.uid()::text
    )
  )
  with check (
    exists (
      select 1
      from public.palette_zones z
      join public.palettes p on p.id = z.palette_id
      where z.id = zone_id and p.user_id = auth.uid()::text
    )
  );

drop policy if exists "palette_items_delete_own" on public.palette_items;
create policy "palette_items_delete_own"
  on public.palette_items for delete to authenticated
  using (
    exists (
      select 1
      from public.palette_zones z
      join public.palettes p on p.id = z.palette_id
      where z.id = zone_id and p.user_id = auth.uid()::text
    )
  );

notify pgrst, 'reload schema';
