-- Ajoute client_id : UUID local de la trouvaille (discovery.id côté client).
-- Permet upsert sans doublon et résolution discovery.id → analyses.id (bigint).
-- À exécuter après analyses_sync_rls_fix si pas déjà fait.

alter table public.analyses add column if not exists client_id text;

update public.analyses set client_id = result->>'id' where client_id is null and result->>'id' is not null and trim(result->>'id') <> '';

create unique index if not exists analyses_user_client_id_idx on public.analyses (user_id, client_id) where client_id is not null;

notify pgrst, 'reload schema';
