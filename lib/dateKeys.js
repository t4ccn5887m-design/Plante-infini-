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
