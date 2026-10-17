-- =============================================================================
-- Sevya — quota d'analyses IA par utilisateur et par jour (en base)
--
-- Remplace la limite gardée en mémoire du serveur (lib/gardenAnalysisRateLimit.js),
-- inefficace sur Vercel (chaque serveur a sa propre mémoire, effacée souvent).
--
-- consume_ai_quota(p_limit) : appelée par /api/garden-analysis AVEC le jeton de
-- l'utilisateur (auth.uid()). Incrémente le compteur du jour de façon atomique
-- et renvoie true si l'utilisateur est encore sous la limite, false sinon.
-- La table n'est lisible ni modifiable directement par personne (RLS sans policy).
-- Idempotent.
-- =============================================================================

create table if not exists public.ai_usage (
  user_id    uuid not null references auth.users(id) on delete cascade,
  day        date not null default (now() at time zone 'Europe/Paris')::date,
  count      integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

alter table public.ai_usage enable row level security;
-- Aucune policy : accès uniquement via la fonction ci-dessous.

create or replace function public.consume_ai_quota(p_limit integer default 10)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_day   date := (now() at time zone 'Europe/Paris')::date;
  v_count integer;
begin
  if v_uid is null then
    return false;
  end if;

  insert into public.ai_usage as u (user_id, day, count, updated_at)
  values (v_uid, v_day, 1, now())
  on conflict (user_id, day) do update
    set count = u.count + 1, updated_at = now()
    where u.count < greatest(p_limit, 1)
  returning count into v_count;

  -- Pas de ligne renvoyée = limite déjà atteinte
  return v_count is not null;
end;
$$;

revoke all on function public.consume_ai_quota(integer) from public;
grant execute on function public.consume_ai_quota(integer) to authenticated;

notify pgrst, 'reload schema';
