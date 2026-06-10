export const WELCOME_SLIDES_KEY = "wilder-welcome-slides-v1";

export function isWelcomeSlidesComplete() {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(WELCOME_SLIDES_KEY) === "1";
}

export function completeWelcomeSlides() {
  if (typeof window === "undefined") return;
  localStorage.setItem(WELCOME_SLIDES_KEY, "1");
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
