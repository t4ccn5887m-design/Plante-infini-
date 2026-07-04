-- Étend les valeurs autorisées pour palettes.style (japonais, contemporain)
-- À exécuter manuellement sur Supabase après relecture.

alter table public.palettes drop constraint if exists palettes_style_check;

alter table public.palettes add constraint palettes_style_check
  check (
    style is null
    or style in ('anglais', 'francais', 'mediterraneen', 'japonais', 'contemporain')
  );

notify pgrst, 'reload schema';
