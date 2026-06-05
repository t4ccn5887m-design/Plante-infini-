export const POTAGER_CARE_JOURNAL_KEY = "wilder-potager-care-journal";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeEntry(raw) {
  const date = String(raw?.date || "").slice(0, 10);
  const nom = String(raw?.nom || "").trim();
  const action = String(raw?.action || "").trim();
  if (!date || !nom || !action) return null;
  return {
    id: raw?.id || `cj-${date}-${nom}-${action}`,
    date,
    nom,
    action,
    health: raw?.health || null,
    completedAt: raw?.completedAt || `${date}T12:00:00.000Z`,
  };
}

export function loadCareJournal() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(POTAGER_CARE_JOURNAL_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    const entries = Array.isArray(data?.entries) ? data.entries : Array.isArray(data) ? data : [];
    return entries.map(normalizeEntry).filter(Boolean);
  } catch {
    return [];
  }
}

export function saveCareJournal(entries) {
  if (typeof window === "undefined") return { ok: false };
  try {
    localStorage.setItem(POTAGER_CARE_JOURNAL_KEY, JSON.stringify({ entries }));
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export function recordCareJournalTask(task) {
  if (!task?.done) return loadCareJournal();

  const entries = loadCareJournal();
  const date = todayKey();
  const nom = String(task.nom || "").trim();
  const action = String(task.action || "").trim();
  if (!nom || !action) return entries;

  const alreadyToday = entries.some(
    (e) => e.date === date && e.nom === nom && e.action === action
  );
  if (alreadyToday) return entries;

  const entry = {
    id: `cj-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    date,
    nom,
    action,
    health: task.health || null,
    completedAt: new Date().toISOString(),
  };

  const updated = [entry, ...entries];
  saveCareJournal(updated);
  return updated;
}

export function removeCareJournalTask(task) {
  if (task?.done) return loadCareJournal();

  const entries = loadCareJournal();
  const date = todayKey();
  const nom = String(task.nom || "").trim();
  const action = String(task.action || "").trim();
  if (!nom || !action) return entries;

  const idx = entries.findIndex(
    (e) => e.date === date && e.nom === nom && e.action === action
  );
  if (idx === -1) return entries;

  const updated = [...entries.slice(0, idx), ...entries.slice(idx + 1)];
  saveCareJournal(updated);
  return updated;
}

export function groupCareJournalByDate(entries) {
  const byDate = new Map();
  for (const entry of entries) {
    if (!byDate.has(entry.date)) byDate.set(entry.date, []);
    byDate.get(entry.date).push(entry);
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({
      date,
      items: items.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)),
    }));
}
