-- À exécuter dans le SQL Editor Supabase si lieu/latitude/longitude
-- existent en base mais PostgREST renvoie encore "schema cache".
notify pgrst, 'reload schema';
