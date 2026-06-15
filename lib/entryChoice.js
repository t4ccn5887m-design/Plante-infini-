import { isPermanentAuthUser } from "./authUser";
import { isOnboardingVu } from "./welcomeSlides";

const ENTRY_CHOICE_DONE_KEY = "wilder_entry_choice_done";

export function isEntryChoiceDone() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ENTRY_CHOICE_DONE_KEY) === "true";
}

export function markEntryChoiceDone() {
  if (typeof window === "undefined") return;
  localStorage.setItem(ENTRY_CHOICE_DONE_KEY, "true");
}

/**
 * Écran de choix après les slides : vu marketing + pas compte permanent + pas déjà passé.
 */
export function shouldShowEntryChoice(session) {
  if (typeof window === "undefined") return false;
  if (isEntryChoiceDone()) return false;
  if (isPermanentAuthUser(session?.user)) return false;
  if (!isOnboardingVu()) return false;
  return true;
}
