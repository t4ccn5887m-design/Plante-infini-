import { localDayKey, calendarDaysBetween } from "./potagerEngagement";
import { loadNatureStreak } from "./natureStreak";
import { BADGE_DEFS, computeUnlockedBadgeIds } from "./badges";
import { buildBiodexCollection } from "./biodex";

export const MONTHLY_SPECIES_GOAL = 5;

const RANKS = [
  { min: 0, key: "seedling" },
  { min: 1, key: "curious" },
  { min: 5, key: "watcher" },
  { min: 15, key: "explorer" },
  { min: 30, key: "naturalist" },
  { min: 75, key: "expert" },
  { min: 150, key: "master" },
];

export function discoveryDayKey(discoveredAt) {
  if (!discoveredAt) return null;
  return localDayKey(new Date(discoveredAt));
}

export function hasDiscoveredToday(discoveries) {
  const today = localDayKey();
  return discoveries.some((d) => discoveryDayKey(d.discoveredAt) === today);
}

export function getStreakUrgency() {
  const { streak, lastActiveDate } = loadNatureStreak();
  const today = localDayKey();
  if (!streak || !lastActiveDate) return { status: "none", streak: 0 };
  if (lastActiveDate === today) return { status: "safe", streak };
  if (calendarDaysBetween(lastActiveDate, today) === 1) {
    return { status: "at_risk", streak };
  }
  return { status: "lost", streak: 0 };
}

export function getNaturalistRank(discoveryCount) {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (discoveryCount >= r.min) rank = r;
  }
  const next = RANKS[RANKS.indexOf(rank) + 1];
  return {
    key: rank.key,
    nextKey: next?.key || null,
    progress: next
      ? (discoveryCount - rank.min) / (next.min - rank.min)
      : 1,
    current: discoveryCount,
    nextAt: next?.min ?? null,
  };
}

export function getMonthlyChallenge(stats) {
  const current = stats.thisMonth || 0;
  return {
    current,
    target: MONTHLY_SPECIES_GOAL,
    done: current >= MONTHLY_SPECIES_GOAL,
    ratio: Math.min(1, current / MONTHLY_SPECIES_GOAL),
  };
}

export function getDailyMission(discoveries) {
  const done = hasDiscoveredToday(discoveries);
  return { id: "scan_one", done, target: 1, current: done ? 1 : 0 };
}

export function getHomeProgress(discoveries, stats) {
  const biodex = buildBiodexCollection(discoveries);
  const unlockedBadges = discoveries.length > 0
    ? computeUnlockedBadgeIds(discoveries).length
    : 0;

  return {
    biodex,
    badges: { unlocked: unlockedBadges, total: BADGE_DEFS.length },
    rank: getNaturalistRank(discoveries.length),
    monthly: getMonthlyChallenge(stats),
    mission: getDailyMission(discoveries),
    streak: getStreakUrgency(),
  };
}
