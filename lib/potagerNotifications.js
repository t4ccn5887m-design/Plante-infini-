import { createT, detectLang } from "@/lib/i18n";
import {
  canShowPotagerNotify,
  getDaysSincePotagerVisit,
  getDaysSinceWatering,
  loadPotagerEngagement,
  localDayKey,
  markPotagerNotifyShown,
} from "@/lib/potagerEngagement";

const NOTIFY_TAG_WAITING = "potager-waiting";
const NOTIFY_TAG_WATER = "potager-water-3d";

export function isPotagerNotificationSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export async function requestPotagerNotificationPermission() {
  if (!isPotagerNotificationSupported()) {
    return { ok: false, permission: "unsupported" };
  }
  if (Notification.permission === "granted") {
    return { ok: true, permission: "granted" };
  }
  if (Notification.permission === "denied") {
    return { ok: false, permission: "denied" };
  }
  const permission = await Notification.requestPermission();
  return { ok: permission === "granted", permission };
}

export async function showPotagerNotification(tag, title, body) {
  if (!isPotagerNotificationSupported() || Notification.permission !== "granted") {
    return false;
  }

  const options = {
    body,
    tag,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: "/", screen: "potager" },
  };

  try {
    const reg = await navigator.serviceWorker?.ready;
    if (reg?.showNotification) {
      await reg.showNotification(title, options);
    } else {
      new Notification(title, options);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Rappels push : plantes en attente (≥1 jour sans visite), arrosage (≥3 jours).
 */
export async function checkPotagerReminders(lang) {
  if (!isPotagerNotificationSupported() || Notification.permission !== "granted") {
    return;
  }

  const t = createT(lang || detectLang());
  const today = localDayKey();
  const { lastVisitDate } = loadPotagerEngagement();
  const title = t("themes.potager.notify_title");

  const daysSinceVisit = getDaysSincePotagerVisit();
  const visitedToday = lastVisitDate === today;

  if (!visitedToday && daysSinceVisit != null && daysSinceVisit >= 1 && canShowPotagerNotify("waiting")) {
    const shown = await showPotagerNotification(
      NOTIFY_TAG_WAITING,
      title,
      t("themes.potager.notify_waiting")
    );
    if (shown) markPotagerNotifyShown("waiting");
  }

  const daysSinceWater = getDaysSinceWatering();
  if (daysSinceWater != null && daysSinceWater >= 3 && canShowPotagerNotify("water")) {
    const shown = await showPotagerNotification(
      NOTIFY_TAG_WATER,
      title,
      t("themes.potager.notify_water_3d")
    );
    if (shown) markPotagerNotifyShown("water");
  }
}
