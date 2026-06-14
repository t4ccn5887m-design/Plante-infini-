const ONBOARDING_VU_KEY = "wilder_onboarding_vu";

export function isOnboardingVu() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ONBOARDING_VU_KEY) === "true";
}

/** Marque l'onboarding marketing comme vu (persistance locale). */
export function markOnboardingVu() {
  if (typeof window === "undefined") return;
  localStorage.setItem(ONBOARDING_VU_KEY, "true");
}

/** Alias historique — fin des slides ou création de compte. */
export function completeWelcomeSlides() {
  markOnboardingVu();
}

/**
 * Slides uniquement sans session Supabase et si l'onboarding n'a pas été marqué vu.
 */
export function shouldShowWelcomeSlides(session) {
  if (typeof window === "undefined") return false;
  if (session?.user) return false;
  if (isOnboardingVu()) return false;
  return true;
}
