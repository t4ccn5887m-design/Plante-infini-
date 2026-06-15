import { isPermanentAuthUser } from "./authUser";

const ONBOARDING_VU_KEY = "wilder_onboarding_vu";

export function isOnboardingVu() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ONBOARDING_VU_KEY) === "true";
}

/** Valeur brute du flag local (null si absent). */
export function readOnboardingVuFlag() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ONBOARDING_VU_KEY);
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
 * Slides si l'onboarding n'a pas été marqué vu et que l'utilisateur
 * n'est pas connecté avec un compte permanent (is_anonymous = false).
 * Une session anonyme ne masque pas les slides.
 */
export function shouldShowWelcomeSlides(session) {
  if (typeof window === "undefined") return false;
  if (isOnboardingVu()) return false;
  if (isPermanentAuthUser(session?.user)) return false;
  return true;
}

/** Log de vérification au boot : flag localStorage + is_anonymous JWT. */
export function logOnboardingBootState(session) {
  const user = session?.user;
  const flag = readOnboardingVuFlag();
  const isAnonymous = user?.is_anonymous ?? null;
  console.info("[wilder:onboarding] boot", {
    wilder_onboarding_vu: flag,
    is_anonymous: isAnonymous,
    showSlides: shouldShowWelcomeSlides(session),
  });
}
