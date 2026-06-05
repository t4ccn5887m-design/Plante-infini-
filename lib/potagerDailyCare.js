import { recordCareJournalTask, removeCareJournalTask } from "@/lib/potagerCareJournal";
import { HEALTH, inferHealthFromEtatSante } from "@/lib/potagerHealth";

export const POTAGER_DAILY_CARE_KEY = "wilder-potager-daily-care";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function makeId() {
  return `dc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function mapSanteToHealth(sante) {
  const s = String(sante || "").toLowerCase().trim();
  if (/urgent|critique|grave|critical/.test(s)) return HEALTH.critical;
  if (/attention|surveill|warning|moyen/.test(s)) return HEALTH.warning;
  if (/bon|good|sain|ras/.test(s)) return HEALTH.good;
  return HEALTH.warning;
}

export function normalizeDailyCarePlant(raw) {
  const nom = String(raw?.nom || raw?.name || "").trim();
  if (!nom) return null;

  const etat = String(raw?.etat_sante || raw?.etatSante || "").trim();
  const health =
    raw?.health && Object.values(HEALTH).includes(raw.health)
      ? raw.health
      : mapSanteToHealth(raw?.sante) || inferHealthFromEtatSante(etat);

  let action = String(raw?.action_aujourdhui || raw?.action || "").trim();
  if (!action) {
    if (health === HEALTH.critical) action = "Soins urgents aujourd'hui";
    else if (health === HEALTH.warning) action = "À surveiller aujourd'hui";
    else action = "RAS, tout va bien";
  }

  return {
    id: raw?.id || makeId(),
    nom,
    etat_sante: etat,
    health,
    action,
    done: Boolean(raw?.done),
  };
}

export function buildDailyCareSession({ photo, plantes }) {
  const tasks = (Array.isArray(plantes) ? plantes : [])
    .map(normalizeDailyCarePlant)
    .filter(Boolean);

  return {
    date: todayKey(),
    photo: photo || null,
    createdAt: new Date().toISOString(),
    tasks,
  };
}

export function loadDailyCare() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(POTAGER_DAILY_CARE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || data.date !== todayKey()) return null;
    const tasks = (Array.isArray(data.tasks) ? data.tasks : [])
      .map(normalizeDailyCarePlant)
      .filter(Boolean);
    return { ...data, tasks };
  } catch {
    return null;
  }
}

export function saveDailyCare(session) {
  if (typeof window === "undefined") return { ok: false };
  try {
    localStorage.setItem(POTAGER_DAILY_CARE_KEY, JSON.stringify(session));
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export function toggleDailyCareTask(taskId) {
  const session = loadDailyCare();
  if (!session) return null;

  const task = session.tasks.find((t) => t.id === taskId);
  if (!task) return null;

  const toggled = { ...task, done: !task.done };
  const tasks = session.tasks.map((t) => (t.id === taskId ? toggled : t));
  const updated = { ...session, tasks };
  saveDailyCare(updated);

  if (toggled.done) recordCareJournalTask(toggled);
  else removeCareJournalTask(toggled);

  return updated;
}

export function dailyCareProgress(session) {
  if (!session?.tasks?.length) return { done: 0, total: 0 };
  const total = session.tasks.length;
  const done = session.tasks.filter((t) => t.done).length;
  return { done, total };
}

export function healthEmoji(health) {
  if (health === HEALTH.critical) return "🔴";
  if (health === HEALTH.warning) return "⚠️";
  return "✅";
}
