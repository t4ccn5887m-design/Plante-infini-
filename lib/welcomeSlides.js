import { getCloudSession } from "./cloudSync";
import { isPremium } from "./freemium";
import { refreshScanQuota } from "./scanQuotaClient";

const WELCOME_DISMISSED_SESSION = "wilder-welcome-dismissed-session";

export function isWelcomeSlidesDismissedThisSession() {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(WELCOME_DISMISSED_SESSION) === "1";
}

/** Masque les slides pour la session en cours (pas de persistance entre ouvertures). */
export function completeWelcomeSlides() {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(WELCOME_DISMISSED_SESSION, "1");
}

export function clearWelcomeSlidesSessionDismiss() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(WELCOME_DISMISSED_SESSION);
}

/**
 * Affiche les slides tant que l'utilisateur n'a pas de compte réel ET Premium actif.
 */
export function shouldShowWelcomeSlides({ hasRealAccount = false, isPremiumActive = false } = {}) {
  if (typeof window === "undefined") return false;
  if (isWelcomeSlidesDismissedThisSession()) return false;
  if (hasRealAccount && isPremiumActive) return false;
  return true;
}

export async function shouldShowWelcomeSlidesOnLaunch() {
  if (typeof window === "undefined") return false;

  try {
    await refreshScanQuota();
  } catch {
    /* ignore */
  }

  const session = await getCloudSession();
  const hasRealAccount = Boolean(session?.user && !session.user.is_anonymous);

  return shouldShowWelcomeSlides({
    hasRealAccount,
    isPremiumActive: isPremium(),
  });
}
