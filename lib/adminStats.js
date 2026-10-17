/**
 * Statistiques admin Sevya (serveur uniquement, clé service_role).
 * Suivi des pilotes : pros, liens envoyés / ouverts / remplis, RDV, comptes, IA.
 */
import {
  supabaseAdmin,
  getSupabaseAdminDiagnostics,
  validateServiceRoleConfig,
} from "@/lib/supabaseAdmin";

const DAY_MS = 24 * 60 * 60 * 1000;

function dayKey(value) {
  return String(value || "").slice(0, 10);
}

function lastNDays(n, now = Date.now()) {
  const days = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    days.push(new Date(now - i * DAY_MS).toISOString().slice(0, 10));
  }
  return days;
}

function pct(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

/** Calcul pur (testable) à partir des lignes brutes. */
export function computeSevyaStats(raw, now = Date.now()) {
  const {
    users = [],
    studios = [],
    links = [],
    briefsCount = 0,
    appointments = [],
    dossiersCount = 0,
    favoritesCount = 0,
    aiUsage = [],
  } = raw;

  const since7 = now - 7 * DAY_MS;
  const today = new Date(now).toISOString().slice(0, 10);
  const isRecent = (iso) => iso && new Date(iso).getTime() >= since7;

  const realUsers = users.filter((u) => !u.is_anonymous);
  const emailByUser = new Map(realUsers.map((u) => [u.id, u.email || ""]));

  const linkTotals = { sent: links.length, opened: 0, filled: 0, last7: 0, filled7: 0 };
  for (const l of links) {
    if (l.status === "opened" || l.status === "filled" || l.opened_at) linkTotals.opened += 1;
    if (l.status === "filled") linkTotals.filled += 1;
    if (isRecent(l.created_at)) linkTotals.last7 += 1;
    if (isRecent(l.filled_at)) linkTotals.filled7 += 1;
  }

  const days = lastNDays(30, now);
  const sentByDay = new Map(days.map((d) => [d, 0]));
  const filledByDay = new Map(days.map((d) => [d, 0]));
  for (const l of links) {
    const c = dayKey(l.created_at);
    if (sentByDay.has(c)) sentByDay.set(c, sentByDay.get(c) + 1);
    const f = dayKey(l.filled_at);
    if (filledByDay.has(f)) filledByDay.set(f, filledByDay.get(f) + 1);
  }

  const studioRows = studios.map((s) => {
    const own = links.filter((l) => l.studio_id === s.id);
    const lastLink = own.reduce((max, l) => (l.created_at > max ? l.created_at : max), "");
    return {
      id: s.id,
      name: s.name || "—",
      contact: s.contact_first_name || "",
      email: emailByUser.get(s.pro_user_id) || "",
      createdAt: s.created_at,
      sent: own.length,
      opened: own.filter((l) => l.status !== "sent" || l.opened_at).length,
      filled: own.filter((l) => l.status === "filled").length,
      appointments: appointments.filter((a) => a.studio_id === s.id).length,
      lastLinkAt: lastLink || null,
    };
  });
  studioRows.sort((a, b) => b.sent - a.sent || String(b.createdAt).localeCompare(String(a.createdAt)));

  let aiToday = 0;
  let ai7 = 0;
  const aiUsers7 = new Set();
  for (const r of aiUsage) {
    const n = Number(r.count) || 0;
    if (dayKey(r.day) === today) aiToday += n;
    if (new Date(`${dayKey(r.day)}T12:00:00Z`).getTime() >= since7) {
      ai7 += n;
      aiUsers7.add(r.user_id);
    }
  }

  return {
    accounts: {
      total: realUsers.length,
      last7Days: realUsers.filter((u) => isRecent(u.created_at)).length,
      pros: studios.length,
      dossiers: dossiersCount,
      favorites: favoritesCount,
    },
    links: {
      ...linkTotals,
      openRate: pct(linkTotals.opened, linkTotals.sent),
      fillRate: pct(linkTotals.filled, linkTotals.sent),
      briefs: briefsCount,
      appointments: appointments.length,
      dailySeries: days.map((d) => ({ date: d, sent: sentByDay.get(d), filled: filledByDay.get(d) })),
    },
    ai: { today: aiToday, last7Days: ai7, users7: aiUsers7.size },
    studios: studioRows,
  };
}

async function listAllUsers() {
  const users = [];
  for (let page = 1; page < 50; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const batch = data?.users || [];
    users.push(...batch);
    if (batch.length < 1000) break;
  }
  return users;
}

function describeError(table, error, status) {
  const parts = [error?.message, error?.code, error?.details, error?.hint].filter(Boolean);
  return `${table} : ${parts.length ? parts.join(" — ") : `erreur HTTP ${status || "?"}`}`;
}

async function selectAll(table, columns) {
  const { data, error, status } = await supabaseAdmin.from(table).select(columns).limit(10000);
  if (error) throw new Error(describeError(table, error, status));
  return data || [];
}

async function countRows(table) {
  // GET (pas HEAD) pour obtenir un vrai message d'erreur si besoin
  const { count, error, status } = await supabaseAdmin
    .from(table)
    .select("*", { count: "exact" })
    .limit(1);
  if (error) throw new Error(describeError(table, error, status));
  return count || 0;
}

/** Exécute une source ; en cas d'échec, note l'erreur et renvoie la valeur de repli. */
async function soft(errors, promise, fallback) {
  try {
    return await promise;
  } catch (e) {
    const msg = String(e?.message || e);
    console.warn("[Sevya] admin stats:", msg);
    errors.push(msg);
    return fallback;
  }
}

export async function fetchAdminStats() {
  const generatedAt = new Date().toISOString();
  const meta = { supabase: getSupabaseAdminDiagnostics() };

  const config = validateServiceRoleConfig();
  if (!config.ok || !supabaseAdmin) {
    return { generatedAt, meta, globalError: config.error || "Supabase admin indisponible" };
  }

  const errors = [];
  const since = new Date(Date.now() - 8 * DAY_MS).toISOString().slice(0, 10);
  const [users, studios, links, briefsCount, appointments, dossiersCount, favoritesCount, aiUsage] =
    await Promise.all([
      soft(errors, listAllUsers(), []),
      soft(errors, selectAll("pro_studios", "id, name, contact_first_name, created_at, pro_user_id"), []),
      soft(errors, selectAll("pro_links", "id, studio_id, status, created_at, opened_at, filled_at"), []),
      soft(errors, countRows("pro_briefs"), 0),
      soft(errors, selectAll("pro_appointments", "id, studio_id, starts_at"), []),
      soft(errors, countRows("garden_dossiers"), 0),
      soft(errors, countRows("analyses"), 0),
      soft(errors, selectAll("ai_usage", "user_id, day, count").then((rows) => rows.filter((r) => String(r.day) >= since)), []),
    ]);

  return {
    generatedAt,
    meta,
    errors,
    ...computeSevyaStats({
      users,
      studios,
      links,
      briefsCount,
      appointments,
      dossiersCount,
      favoritesCount,
      aiUsage,
    }),
  };
}
