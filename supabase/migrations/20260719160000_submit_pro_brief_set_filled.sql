-- =============================================================================
-- Wilder Pro — submit_pro_brief : insert pro_briefs + status filled (même tx)
-- SECURITY DEFINER (invité anon ne touche pas pro_links directement).
-- Idempotent : CREATE OR REPLACE.
-- =============================================================================

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

  -- Verrouille la ligne le temps de l’insert (évite double soumission concurrente)
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
