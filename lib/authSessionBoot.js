import { getRememberMe } from "@/lib/authStorage";
import { isPermanentAuthUser } from "@/lib/authUser";
import { getCloudSession } from "@/lib/cloudSync";
import { getProAuthUser } from "@/lib/pro/proStudioApi";

const SUPABASE_AUTH_KEY = "wilder-auth-token";

/** Reprend une session Supabase laissée en sessionStorage alors que « rester connecté » est actif. */
export function migratePersistedAuthSession() {
  if (typeof window === "undefined") return;
  if (!getRememberMe()) return;
  try {
    const fromSession = sessionStorage.getItem(SUPABASE_AUTH_KEY);
    if (fromSession && !localStorage.getItem(SUPABASE_AUTH_KEY)) {
      localStorage.setItem(SUPABASE_AUTH_KEY, fromSession);
      sessionStorage.removeItem(SUPABASE_AUTH_KEY);
    }
  } catch {
    /* ignore */
  }
}

/**
 * Redirige si une session permanente existe (particulier → /jardin, pro → /pro).
 * @returns {Promise<boolean>} true si redirection effectuée
 */
export async function redirectIfAuthenticated({ profile = "particulier" } = {}) {
  const session = await getCloudSession();
  const user = session?.user;
  if (!user || user.is_anonymous) return false;

  if (profile === "pro") {
    const pro = await getProAuthUser();
    if (pro.ok) {
      window.location.replace("/pro");
      return true;
    }
    return false;
  }

  if (isPermanentAuthUser(user)) {
    window.location.replace("/jardin");
    return true;
  }
  return false;
}
