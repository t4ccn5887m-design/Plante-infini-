export const ONBOARDING_SEEN_KEY = "wilder_onboarding_seen";
const LEGACY_WELCOME_KEY = "wilder-welcome-slides-v1";

function migrateLegacyKey() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(ONBOARDING_SEEN_KEY) != null) return;
  if (localStorage.getItem(LEGACY_WELCOME_KEY) === "1") {
    localStorage.setItem(ONBOARDING_SEEN_KEY, "1");
  }
}

export function isWelcomeSlidesComplete() {
  if (typeof window === "undefined") return true;
  migrateLegacyKey();
  return localStorage.getItem(ONBOARDING_SEEN_KEY) === "1";
}

export function completeWelcomeSlides() {
  if (typeof window === "undefined") return;
  localStorage.setItem(ONBOARDING_SEEN_KEY, "1");
  localStorage.removeItem(LEGACY_WELCOME_KEY);
}

/** Premier lancement uniquement — utilisateurs existants ignorés. */
export function shouldShowWelcomeSlides(hasDiscoveries = false) {
  if (isWelcomeSlidesComplete()) return false;
  if (hasDiscoveries) {
    completeWelcomeSlides();
    return false;
  }
  return true;
}
