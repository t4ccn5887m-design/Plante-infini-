/** Préférence « Rester connecté » — stockée en localStorage (hors session Supabase). */
export const REMEMBER_ME_KEY = "wilder_remember_me";

export function getRememberMe() {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(REMEMBER_ME_KEY) !== "false";
}

export function setRememberMe(remember) {
  if (typeof window === "undefined") return;
  localStorage.setItem(REMEMBER_ME_KEY, remember ? "true" : "false");
}

function primaryAuthStore() {
  if (typeof window === "undefined") return null;
  return getRememberMe() ? localStorage : sessionStorage;
}

function secondaryAuthStore() {
  if (typeof window === "undefined") return null;
  return getRememberMe() ? sessionStorage : localStorage;
}

/** Adaptateur Supabase : localStorage si « rester connecté », sinon sessionStorage. */
export const supabaseAuthStorage = {
  getItem(key) {
    const primary = primaryAuthStore();
    const secondary = secondaryAuthStore();
    if (!primary) return null;
    return primary.getItem(key) ?? secondary?.getItem(key) ?? null;
  },
  setItem(key, value) {
    const primary = primaryAuthStore();
    const secondary = secondaryAuthStore();
    if (!primary) return;
    primary.setItem(key, value);
    secondary?.removeItem(key);
  },
  removeItem(key) {
    primaryAuthStore()?.removeItem(key);
    secondaryAuthStore()?.removeItem(key);
  },
};
