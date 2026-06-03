-- Colonnes géo + lieu (si ajoutées manuellement, idempotent)
alter table public.analyses add column if not exists lieu text;
alter table public.analyses add column if not exists latitude double precision;
alter table public.analyses add column if not exists longitude double precision;

-- IDs client au format texte (ex. 1741234567890-abc1234) : convertir bigint → text si besoin
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'analyses'
      and column_name = 'id'
      and data_type in ('bigint', 'integer', 'smallint')
  ) then
    alter table public.analyses alter column id drop identity if exists;
    alter table public.analyses alter column id type text using id::text;
  end if;
exception
  when others then
    raise notice 'analyses.id type conversion skipped: %', sqlerrm;
end $$;

-- Recharge le cache PostgREST (corrige "schema cache" pour lieu / latitude / longitude)
notify pgrst, 'reload schema';
