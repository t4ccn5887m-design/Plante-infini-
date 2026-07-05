const LAST_ERROR_KEY = "wilder-sync-last-error";
const ERROR_LOG_KEY = "wilder-sync-error-log";
const MAX_LOG_ENTRIES = 30;

function safeParse(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function readLog() {
  if (typeof window === "undefined") return [];
  const items = safeParse(localStorage.getItem(ERROR_LOG_KEY) || "[]", []);
  return Array.isArray(items) ? items : [];
}

function writeLog(items) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(items.slice(-MAX_LOG_ENTRIES)));
}

/**
 * Enregistre une erreur de sync (console + localStorage + événement UI).
 */
export function recordSyncError({
  discoveryId = null,
  discoveryName = null,
  operation = "sync",
  error = "unknown",
  code = null,
  details = null,
  source = null,
} = {}) {
  const entry = {
    at: new Date().toISOString(),
    discoveryId,
    discoveryName,
    operation,
    error: String(error || "unknown"),
    code: code || null,
    details: details || null,
    source: source || null,
  };

  console.error("[Wilder] sync error:", entry);

  if (typeof window !== "undefined") {
    localStorage.setItem(LAST_ERROR_KEY, JSON.stringify(entry));
    const log = readLog();
    log.push(entry);
    writeLog(log);
    window.dispatchEvent(new CustomEvent("wilder-sync-error", { detail: entry }));
  }

  return entry;
}

export function recordSyncSkip({ discoveryId = null, reason = "skipped", source = null, details = null } = {}) {
  const entry = {
    at: new Date().toISOString(),
    discoveryId,
    reason,
    source,
    details,
  };
  console.warn("[Wilder] sync skipped:", entry);
  return entry;
}

export function loadLastSyncError() {
  if (typeof window === "undefined") return null;
  return safeParse(localStorage.getItem(LAST_ERROR_KEY) || "null", null);
}

export function loadSyncErrorLog() {
  return readLog();
}

export function clearLastSyncError() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LAST_ERROR_KEY);
}
