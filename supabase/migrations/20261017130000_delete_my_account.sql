-- =============================================================================
-- Sevya — suppression de compte par l'utilisateur lui-même (RGPD, art. 17)
--
-- delete_my_account() : supprime TOUTES les données de l'utilisateur connecté
-- (auth.uid()) puis le compte lui-même, dans une seule transaction.
-- Si une étape échoue, rien n'est supprimé.
--
-- Les PHOTOS (Storage) ne sont pas supprimées ici : l'app les efface d'abord
-- via l'API Storage (images/{uid}/…, pro-project-photos/{studio}/…,
-- pro-brief-photos/{token}/…), puis appelle cette fonction.
--
-- Particulier : palettes (+ zones, items), analyses, dossier jardin, quota IA,
--               profil. Les journaux de scan sont anonymisés (user_id = null).
-- Pro         : le studio, et par cascade ses liens, briefs, rendez-vous,
--               réalisations et photos de réalisations.
-- Idempotent (CREATE OR REPLACE).
-- =============================================================================

create or replace function public.delete_my_account()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return false;
  end if;

  -- Particulier
  if to_regclass('public.palettes') is not null then
    execute 'delete from public.palettes where user_id = $1' using v_uid::text;
  end if;
  if to_regclass('public.analyses') is not null then
    execute 'delete from public.analyses where user_id = $1' using v_uid::text;
  end if;
  if to_regclass('public.garden_dossiers') is not null then
    execute 'delete from public.garden_dossiers where user_id = $1' using v_uid;
  end if;
  if to_regclass('public.ai_usage') is not null then
    execute 'delete from public.ai_usage where user_id = $1' using v_uid;
  end if;
  if to_regclass('public.user_profiles') is not null then
    execute 'delete from public.user_profiles where user_id = $1' using v_uid;
  end if;

  -- Journaux : on garde les chiffres, sans lien avec la personne
  if to_regclass('public.scan_counts') is not null then
    execute 'update public.scan_counts set user_id = null where user_id = $1' using v_uid;
  end if;
  if to_regclass('public.scan_logs') is not null then
    execute 'update public.scan_logs set user_id = null where user_id = $1' using v_uid;
  end if;

  -- Pro : cascade vers liens, briefs, rendez-vous, réalisations, photos
  delete from public.pro_studios where pro_user_id = v_uid;

  -- Le compte lui-même
  delete from auth.users where id = v_uid;

  return true;
end;
$$;

revoke all on function public.delete_my_account() from public;
revoke all on function public.delete_my_account() from anon;
grant execute on function public.delete_my_account() to authenticated;

notify pgrst, 'reload schema';
