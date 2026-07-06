import { calendarDaysBetween, localDayKey } from "@/lib/dateKeys";

const STREAK_KEY = "wilder-nature-streak";

const DEFAULT = { streak: 0, lastActiveDate: null };

export function loadNatureStreak() {
  if (typeof window === "undefined") return { ...DEFAULT };
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    return { ...DEFAULT, ...(raw ? JSON.parse(raw) : {}) };
  } catch {
    return { ...DEFAULT };
  }
}

export function recordNatureActivity() {
  const today = localDayKey();
  const data = loadNatureStreak();
  let { streak, lastActiveDate } = data;

  if (lastActiveDate === today) {
    return { streak, extended: false };
  }

  if (lastActiveDate && calendarDaysBetween(lastActiveDate, today) === 1) {
    streak = (streak || 0) + 1;
  } else {
    streak = 1;
  }

  lastActiveDate = today;
  localStorage.setItem(STREAK_KEY, JSON.stringify({ streak, lastActiveDate }));
  return { streak, extended: streak > 1 };
}

export function getNatureStreak() {
  const { streak, lastActiveDate } = loadNatureStreak();
  const today = localDayKey();
  if (!lastActiveDate) return 0;
  if (calendarDaysBetween(lastActiveDate, today) > 1) return 0;
  return streak || 0;
}
