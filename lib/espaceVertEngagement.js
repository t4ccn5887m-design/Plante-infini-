export const ESPACE_VERT_ENGAGEMENT_KEY = "wilder-espace-vert-engagement";

const DEFAULT = {
  lastSurpriseNotifyDay: null,
  lastSurpriseDismissDay: null,
};

import { localDayKey } from "@/lib/potagerEngagement";

export { localDayKey };

export function loadEspaceVertEngagement() {
  if (typeof window === "undefined") return { ...DEFAULT };
  try {
    const raw = localStorage.getItem(ESPACE_VERT_ENGAGEMENT_KEY);
    const data = raw ? JSON.parse(raw) : {};
    return { ...DEFAULT, ...data };
  } catch {
    return { ...DEFAULT };
  }
}

export function saveEspaceVertEngagement(data) {
  if (typeof window === "undefined") return { ok: false };
  try {
    localStorage.setItem(ESPACE_VERT_ENGAGEMENT_KEY, JSON.stringify(data));
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export function markSurpriseNotifyShown() {
  const today = localDayKey();
  const data = loadEspaceVertEngagement();
  saveEspaceVertEngagement({ ...data, lastSurpriseNotifyDay: today });
}

export function canShowSurpriseNotify() {
  const today = localDayKey();
  return loadEspaceVertEngagement().lastSurpriseNotifyDay !== today;
}

export function dismissSurpriseBanner() {
  const today = localDayKey();
  const data = loadEspaceVertEngagement();
  saveEspaceVertEngagement({ ...data, lastSurpriseDismissDay: today });
}

export function isSurpriseBannerDismissed() {
  return loadEspaceVertEngagement().lastSurpriseDismissDay === localDayKey();
}

/** Fenêtre matinale locale (6h–12h) pour la surprise du jour. */
export function isMorningSurpriseWindow(date = new Date()) {
  const h = date.getHours();
  return h >= 6 && h < 12;
}
