import { createT, detectLang } from "@/lib/i18n";
import { loadDiscoveries } from "@/lib/discoveriesStorage";
import { hasDiscoveredToday, getStreakUrgency } from "@/lib/homeEngagement";
import { localDayKey } from "@/lib/dateKeys";

const NOTIFY_META_KEY = "wilder-nature-notify-meta";
const PROMPTED_KEY = "wilder-nature-notify-prompted";

const TAG_MISSION = "nature-mission";
const TAG_STREAK = "nature-streak";

export function isNatureNotificationSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function wasNatureNotifyPromptShown() {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(PROMPTED_KEY) === "1";
}

export function markNatureNotifyPromptShown() {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROMPTED_KEY, "1");
}

function loadNotifyMeta() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(NOTIFY_META_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveNotifyMeta(meta) {
  if (typeof window === "undefined") return;
  localStorage.setItem(NOTIFY_META_KEY, JSON.stringify(meta));
}

export async function requestNatureNotificationPermission() {
  markNatureNotifyPromptShown();
  if (!isNatureNotificationSupported()) {
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

export async function showNatureNotification(tag, title, body, extra = {}) {
  if (!isNatureNotificationSupported() || Notification.permission !== "granted") {
    return false;
  }

  const options = {
    body,
    tag,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: "/", screen: "home", ...extra },
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
 * Rappels nature : mission du matin (7h–11h), série en danger le soir (19h–23h).
 */
export async function checkNatureReminders(lang) {
  if (!isNatureNotificationSupported() || Notification.permission !== "granted") {
    return;
  }

  const discoveries = loadDiscoveries();
  if (discoveries.length === 0) return;

  const t = createT(lang || detectLang());
  const today = localDayKey();
  const hour = new Date().getHours();
  const meta = loadNotifyMeta();
  const title = t("nature_notify.title");

  if (hour >= 7 && hour < 11 && meta.lastMissionDay !== today && !hasDiscoveredToday(discoveries)) {
    const shown = await showNatureNotification(TAG_MISSION, title, t("nature_notify.mission"));
    if (shown) saveNotifyMeta({ ...meta, lastMissionDay: today });
    return;
  }

  if (hour >= 19 && hour < 23 && meta.lastStreakDay !== today) {
    const streak = getStreakUrgency();
    if (streak.status === "at_risk" && streak.streak > 0) {
      const shown = await showNatureNotification(
        TAG_STREAK,
        title,
        t("nature_notify.streak", { count: streak.streak })
      );
      if (shown) saveNotifyMeta({ ...meta, lastStreakDay: today });
    }
  }
}
