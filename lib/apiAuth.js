import { isPermanentAuthUser } from "@/lib/authUser";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/** Utilisateur Supabase non-anonyme depuis Authorization Bearer. */
export async function resolveAuthUser(req) {
  if (!supabaseAdmin) return null;

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return null;
  if (!isPermanentAuthUser(data.user)) return null;
  return data.user;
}
