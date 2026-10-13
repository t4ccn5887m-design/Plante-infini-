/**
 * Catégories accueil Projets + filtres Mes clients (BLOC 6).
 */

export const CLIENT_FILTERS = {
  cours: "cours",
  won: "won",
  lost: "lost",
  arch: "arch",
};

function isArchived(item) {
  return Boolean(item?.archivedAt);
}

/** Demande Partenaires — vide tant qu’il n’y a pas de source backend. */
export function isDemandePartenaire(_item) {
  return false;
}

/** Brief rempli, sans RDV planifié ni suivi stage. */
export function isBriefPret(item) {
  if (!item || isArchived(item)) return false;
  if (isDemandePartenaire(item)) return false;
  return (
    item.linkStatus === "filled" &&
    !item.hasAppointment &&
    !item.stage
  );
}

/** Lien envoyé ou ouvert, brief pas encore rempli. */
export function isEnAttente(item) {
  if (!item || isArchived(item)) return false;
  if (isDemandePartenaire(item)) return false;
  if (item.linkStatus === "filled") return false;
  return (
    item.linkStatus === "sent" ||
    item.linkStatus === "opened" ||
    item.status === "wait"
  );
}

/** Tout sauf brief prêt, en attente, demande. */
export function isMesClient(item) {
  if (!item) return false;
  if (isDemandePartenaire(item)) return false;
  if (isBriefPret(item)) return false;
  if (isEnAttente(item)) return false;
  return true;
}

export function filterByListCategory(items, category) {
  const list = items || [];
  switch (category) {
    case "demandes":
      return list.filter(isDemandePartenaire);
    case "ready":
      return list.filter(isBriefPret);
    case "wait":
      return list.filter(isEnAttente);
    case "clients":
      return list.filter(isMesClient);
    default:
      return list;
  }
}

export function filterMesClients(items, { query = "", filter = CLIENT_FILTERS.cours } = {}) {
  const q = String(query || "")
    .trim()
    .toLowerCase();
  return filterByListCategory(items, "clients").filter((item) => {
    const name = String(item.name || "").toLowerCase();
    if (q && !name.includes(q)) return false;

    const archived = isArchived(item);
    if (filter === CLIENT_FILTERS.arch) return archived;
    if (archived) return false;

    const stage = item.stage || null;
    if (filter === CLIENT_FILTERS.won) return stage === "won";
    if (filter === CLIENT_FILTERS.lost) return stage === "lost";

    if (stage === "won" || stage === "lost") return false;
    return (
      item.status === "rdv" ||
      item.hasAppointment ||
      stage === "done" ||
      stage === "proposal"
    );
  });
}

export function bucketCounts(items) {
  const list = items || [];
  return {
    demandes: list.filter(isDemandePartenaire).length,
    ready: list.filter(isBriefPret).length,
    wait: list.filter(isEnAttente).length,
    clients: list.filter(isMesClient).length,
  };
}

function parseTs(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function relativeTimeFr(iso) {
  const d = parseTs(iso);
  if (!d) return "";
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days} j`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function shortClientLabel(name) {
  const parts = String(name || "Client")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "Client";
  if (parts.length === 1) return parts[0];
  const lastInitial = parts[parts.length - 1][0] || "";
  return `${parts[0]} ${lastInitial}.`;
}

export function bucketActivityHint(items, category) {
  const list = filterByListCategory(items, category);
  if (!list.length) return "Rien pour le moment";

  if (category === "clients") {
    const pool = list.filter((i) => !isArchived(i));
    const enCours = pool.filter(
      (i) =>
        i.status === "rdv" ||
        i.hasAppointment ||
        i.stage === "done" ||
        i.stage === "proposal"
    ).length;
    const gagnes = pool.filter((i) => i.stage === "won").length;
    const gPart =
      gagnes > 0 ? `${gagnes} gagné${gagnes > 1 ? "s" : ""}` : "0 gagné";
    return `${enCours} en cours · ${gPart}`;
  }

  const sorted = [...list].sort((a, b) => {
    const tb =
      parseTs(b.filledAt || b.openedAt || b.createdAt)?.getTime() || 0;
    const ta =
      parseTs(a.filledAt || a.openedAt || a.createdAt)?.getTime() || 0;
    return tb - ta;
  });
  const c = sorted[0];
  const when = relativeTimeFr(c.filledAt || c.openedAt || c.createdAt);
  const label = shortClientLabel(c.name);
  if (category === "wait") {
    if (c.linkStatus === "opened" || c.openedAt) {
      return `${label} · a ouvert ${when || "récemment"}`;
    }
    return `${label} · lien envoyé ${when || ""}`.trim();
  }
  return `${label} · ${when || c.date || ""}`.trim();
}

/** Prochain RDV (le plus tôt). */
export function pickNextAppointment(items) {
  const withRdv = (items || []).filter(
    (i) => i.status === "rdv" && i.nextAppointmentAt
  );
  if (!withRdv.length) return null;
  return [...withRdv].sort((a, b) =>
    String(a.nextAppointmentAt).localeCompare(String(b.nextAppointmentAt))
  )[0];
}

export function formatAppointmentBlock(iso) {
  const d = parseTs(iso);
  if (!d) return { line1: "", line2: "" };
  const line1 = d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const line2 = d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return { line1, line2 };
}

export function formatTodayHeader() {
  return new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/**
 * Événements cloche (affichage seulement).
 * @returns {{ id: string, itemId: string, kind: 'filled'|'opened', title: string, when: string, at: string }[]}
 */
export function buildProNotificationEvents(items) {
  const events = [];
  for (const item of items || []) {
    const opened = parseTs(item.openedAt);
    if (opened) {
      events.push({
        id: `${item.id}-opened`,
        itemId: item.id,
        kind: "opened",
        title: `${shortClientLabel(item.name)} a ouvert le lien`,
        when: relativeTimeFr(item.openedAt),
        at: item.openedAt,
      });
    }
    const filled = parseTs(item.filledAt);
    if (filled) {
      events.push({
        id: `${item.id}-filled`,
        itemId: item.id,
        kind: "filled",
        title: `Brief rempli · ${shortClientLabel(item.name)}`,
        when: relativeTimeFr(item.filledAt),
        at: item.filledAt,
      });
    }
  }
  events.sort(
    (a, b) => (parseTs(b.at)?.getTime() || 0) - (parseTs(a.at)?.getTime() || 0)
  );
  return events.slice(0, 40);
}
