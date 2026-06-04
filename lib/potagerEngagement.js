export const POTAGER_ENGAGEMENT_KEY = "wilder-potager-engagement";

const DEFAULT_ENGAGEMENT = {
  streak: 0,
  lastVisitDate: null,
  lastWateredAt: null,
  lastNotifyWaitingDay: null,
  lastNotifyWaterDay: null,
};

export function localDayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function dayKeyToDate(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function calendarDaysBetween(fromKey, toKey) {
  if (!fromKey || !toKey) return 0;
  const ms = dayKeyToDate(toKey).getTime() - dayKeyToDate(fromKey).getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

export function loadPotagerEngagement() {
  if (typeof window === "undefined") return { ...DEFAULT_ENGAGEMENT };
  try {
    const raw = localStorage.getItem(POTAGER_ENGAGEMENT_KEY);
    const data = raw ? JSON.parse(raw) : {};
    return { ...DEFAULT_ENGAGEMENT, ...data };
  } catch {
    return { ...DEFAULT_ENGAGEMENT };
  }
}

export function savePotagerEngagement(data) {
  if (typeof window === "undefined") return { ok: false };
  try {
    localStorage.setItem(POTAGER_ENGAGEMENT_KEY, JSON.stringify(data));
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/** Enregistre une visite du potager (streak type Duolingo). */
export function recordPotagerVisit() {
  const today = localDayKey();
  const data = loadPotagerEngagement();
  let { streak, lastVisitDate } = data;

  if (lastVisitDate === today) {
    return { streak, isNewDay: false, streakExtended: false };
  }

  if (lastVisitDate && calendarDaysBetween(lastVisitDate, today) === 1) {
    streak = (streak || 0) + 1;
  } else {
    streak = 1;
  }

  lastVisitDate = today;
  savePotagerEngagement({ ...data, streak, lastVisitDate });
  return { streak, isNewDay: true, streakExtended: streak > 1 };
}

export function recordPotagerWatering() {
  const data = loadPotagerEngagement();
  savePotagerEngagement({ ...data, lastWateredAt: Date.now() });
}

export function getPotagerStreak() {
  const { streak, lastVisitDate } = loadPotagerEngagement();
  const today = localDayKey();
  if (!lastVisitDate) return 0;
  const gap = calendarDaysBetween(lastVisitDate, today);
  if (gap > 1) return 0;
  return streak || 0;
}

export function getDaysSincePotagerVisit() {
  const { lastVisitDate } = loadPotagerEngagement();
  if (!lastVisitDate) return null;
  return calendarDaysBetween(lastVisitDate, localDayKey());
}

export function getDaysSinceWatering() {
  const { lastWateredAt, lastVisitDate } = loadPotagerEngagement();
  if (lastWateredAt) {
    return Math.floor((Date.now() - lastWateredAt) / 86_400_000);
  }
  if (lastVisitDate) {
    return calendarDaysBetween(lastVisitDate, localDayKey());
  }
  return null;
}

export function markPotagerNotifyShown(type) {
  const today = localDayKey();
  const data = loadPotagerEngagement();
  if (type === "water") {
    savePotagerEngagement({ ...data, lastNotifyWaterDay: today });
  } else {
    savePotagerEngagement({ ...data, lastNotifyWaitingDay: today });
  }
}

export function canShowPotagerNotify(type) {
  const today = localDayKey();
  const data = loadPotagerEngagement();
  if (type === "water") return data.lastNotifyWaterDay !== today;
  return data.lastNotifyWaitingDay !== today;
}
