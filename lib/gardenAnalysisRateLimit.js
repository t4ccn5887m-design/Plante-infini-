const MAX_PER_DAY = 10;
const store = new Map();

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function checkGardenAnalysisRateLimit(userId) {
  if (!userId) return { ok: false, error: "missing_user" };
  const day = todayKey();
  const entry = store.get(userId);
  if (!entry || entry.day !== day) {
    return { ok: true, count: 0 };
  }
  if (entry.count >= MAX_PER_DAY) {
    return { ok: false, error: "rate_limit", count: entry.count };
  }
  return { ok: true, count: entry.count };
}

export function recordGardenAnalysisRateLimit(userId) {
  if (!userId) return;
  const day = todayKey();
  const entry = store.get(userId);
  if (!entry || entry.day !== day) {
    store.set(userId, { day, count: 1 });
    return;
  }
  entry.count += 1;
}
