-- Compteur de scans freemium (source de vérité côté serveur)
create table if not exists public.scan_counts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  visitor_key text not null,
  count integer not null default 0 check (count >= 0),
  is_premium boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint scan_counts_visitor_key_unique unique (visitor_key)
);

create index if not exists scan_counts_user_id_idx on public.scan_counts (user_id);

alter table public.scan_counts enable row level security;

-- Aucune policy : accès réservé au service role (API Next.js)

create or replace function public.ensure_scan_count_row(
  p_visitor_key text,
  p_user_id uuid default null
)
returns public.scan_counts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.scan_counts;
begin
  insert into public.scan_counts (visitor_key, user_id)
  values (p_visitor_key, p_user_id)
  on conflict (visitor_key) do update
    set user_id = coalesce(excluded.user_id, public.scan_counts.user_id),
        updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

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
    'can_scan', v_row.is_premium or v_row.count < p_limit
  );
end;
$$;

create or replace function public.check_scan_allowed(
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

  if v_row.is_premium then
    return jsonb_build_object(
      'allowed', true,
      'count', v_row.count,
      'limit', p_limit,
      'is_premium', true
    );
  end if;

  if v_row.count >= p_limit then
    return jsonb_build_object(
      'allowed', false,
      'count', v_row.count,
      'limit', p_limit,
      'is_premium', false,
      'reason', 'quota_exceeded'
    );
  end if;

  return jsonb_build_object(
    'allowed', true,
    'count', v_row.count,
    'limit', p_limit,
    'is_premium', false
  );
end;
$$;

create or replace function public.increment_scan_count(
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

  if not v_row.is_premium then
    update public.scan_counts
    set count = count + 1,
        user_id = coalesce(p_user_id, user_id),
        updated_at = now()
    where visitor_key = p_visitor_key
    returning * into v_row;
  end if;

  return jsonb_build_object(
    'count', v_row.count,
    'limit', p_limit,
    'is_premium', v_row.is_premium,
    'can_scan', v_row.is_premium or v_row.count < p_limit
  );
end;
$$;

create or replace function public.activate_scan_premium(
  p_visitor_key text,
  p_user_id uuid default null
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

  update public.scan_counts
  set is_premium = true,
      user_id = coalesce(p_user_id, user_id),
      updated_at = now()
  where visitor_key = p_visitor_key
  returning * into v_row;

  return jsonb_build_object(
    'count', v_row.count,
    'limit', 15,
    'is_premium', true,
    'can_scan', true
  );
end;
$$;

notify pgrst, 'reload schema';
