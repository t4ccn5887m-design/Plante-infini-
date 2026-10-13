-- Aperçu pro /b/[token]?apercu=1 — lecture seule, sans sent → opened
create or replace function public.get_pro_link_preview_by_token(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link public.pro_links;
  v_studio public.pro_studios;
begin
  if p_token is null or length(trim(p_token)) < 8 then
    return jsonb_build_object('ok', false, 'error', 'invalid_token');
  end if;

  select l.* into v_link
  from public.pro_links l
  inner join public.pro_studios s on s.id = l.studio_id
  where l.token = trim(p_token)
    and s.pro_user_id = auth.uid();

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  select * into v_studio from public.pro_studios where id = v_link.studio_id;

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

revoke all on function public.get_pro_link_preview_by_token(text) from public;
grant execute on function public.get_pro_link_preview_by_token(text) to authenticated;

notify pgrst, 'reload schema';
