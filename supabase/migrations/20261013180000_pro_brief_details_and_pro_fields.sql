-- =============================================================================
-- Sevya Pro — BLOC 2 : details (brief), stage/archivage, projets, studio
-- À coller dans : Supabase → SQL Editor → Run (après validation Emilien)
-- Idempotent. Ne pas GRANT SELECT ON pro_links TO anon.
-- =============================================================================

-- ── 1. Colonne pour les 4 nouvelles étapes du brief ─────────────────────────

alter table public.pro_briefs
  add column if not exists details jsonb not null default '{}'::jsonb;

-- ── 2. Suivi après RDV + archivage ───────────────────────────────────────────

alter table public.pro_links
  add column if not exists stage text
    check (stage is null or stage in ('done', 'proposal', 'won', 'lost')),
  add column if not exists archived_at timestamptz;

-- ── 3. Réalisations : style + visibilité Partenaires ───────────────────────

alter table public.pro_projects
  add column if not exists style text,
  add column if not exists is_public boolean not null default true;

-- ── 4. Fiche studio ─────────────────────────────────────────────────────────

alter table public.pro_studios
  add column if not exists presentation text,
  add column if not exists years_experience int,
  add column if not exists specialties text[];

-- ── 5. submit_pro_brief — persiste details (reste identique sinon) ───────────

create or replace function public.submit_pro_brief(
  p_token   text,
  p_answers jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link     public.pro_links;
  v_brief_id uuid;
begin
  if p_token is null or length(trim(p_token)) < 8 then
    return jsonb_build_object('ok', false, 'error', 'invalid_token');
  end if;

  select * into v_link
  from public.pro_links
  where token = trim(p_token)
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  if v_link.status = 'filled' then
    return jsonb_build_object('ok', false, 'error', 'already_filled');
  end if;

  insert into public.pro_briefs (
    link_id,
    tastes,
    plants,
    materials,
    priorities,
    garden_users,
    maintenance,
    photo_urls,
    budget,
    message,
    area_range,
    timeline,
    utilities,
    details,
    submitted_at
  ) values (
    v_link.id,
    coalesce(
      (select array_agg(x) from jsonb_array_elements_text(coalesce(p_answers->'tastes', '[]'::jsonb)) as t(x)),
      '{}'
    ),
    coalesce(
      (select array_agg(x) from jsonb_array_elements_text(coalesce(p_answers->'plants', '[]'::jsonb)) as t(x)),
      '{}'
    ),
    coalesce(
      (select array_agg(x) from jsonb_array_elements_text(coalesce(p_answers->'materials', '[]'::jsonb)) as t(x)),
      '{}'
    ),
    coalesce(
      (select array_agg(x) from jsonb_array_elements_text(coalesce(p_answers->'priorities', '[]'::jsonb)) as t(x)),
      '{}'
    ),
    coalesce(
      (select array_agg(x) from jsonb_array_elements_text(
        coalesce(p_answers->'garden_users', p_answers->'users', '[]'::jsonb)
      ) as t(x)),
      '{}'
    ),
    nullif(trim(coalesce(p_answers->>'maintenance', '')), ''),
    coalesce(
      (select array_agg(x) from jsonb_array_elements_text(coalesce(p_answers->'photo_urls', '[]'::jsonb)) as t(x)),
      '{}'
    ),
    nullif(trim(coalesce(p_answers->>'budget', '')), ''),
    coalesce(p_answers->>'message', ''),
    nullif(trim(coalesce(p_answers->>'area_range', '')), ''),
    nullif(trim(coalesce(p_answers->>'timeline', '')), ''),
    nullif(trim(coalesce(p_answers->>'utilities', '')), ''),
    coalesce(p_answers->'details', '{}'::jsonb),
    now()
  )
  returning id into v_brief_id;

  update public.pro_links
  set status = 'filled',
      filled_at = now(),
      opened_at = coalesce(opened_at, now())
  where id = v_link.id;

  return jsonb_build_object('ok', true, 'brief_id', v_brief_id);
end;
$$;

revoke all on function public.submit_pro_brief(text, jsonb) from public;
grant execute on function public.submit_pro_brief(text, jsonb) to anon, authenticated;

notify pgrst, 'reload schema';
