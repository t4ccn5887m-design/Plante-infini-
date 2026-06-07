export const AUTH_WELCOME_KEY = "wilder-auth-welcome-v1";
export const REMEMBER_ME_KEY = "wilder-auth-remember";

export function isAuthWelcomeComplete() {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(AUTH_WELCOME_KEY) === "1";
}

export function completeAuthWelcome() {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_WELCOME_KEY, "1");
}

export function loadRememberMe() {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(REMEMBER_ME_KEY) !== "0";
}

export function saveRememberMe(checked) {
  if (typeof window === "undefined") return;
  localStorage.setItem(REMEMBER_ME_KEY, checked ? "1" : "0");
}

/** Utilisateurs existants avant l’écran auth : ne pas bloquer. */
export function shouldShowAuthWelcome(hasDiscoveries = false) {
  if (isAuthWelcomeComplete()) return false;
  if (hasDiscoveries) {
    completeAuthWelcome();
    return false;
  }
  return true;
}

/** Session Supabase déjà active (retour OAuth ou visite précédente). */
export async function shouldSkipAuthWelcomeForSession(getSession) {
  if (isAuthWelcomeComplete()) return true;
  try {
    const session = await getSession();
    if (session?.user && !session.user.is_anonymous) {
      completeAuthWelcome();
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}
