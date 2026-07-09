import { supabase, getOAuthRedirectUrl } from "./supabase";
import { isPermanentAuthUser } from "./authUser";
import { setRememberMe } from "./authStorage";
import {
  fetchDiscoveries as fetchCloudDiscoveries,
  upsertDiscovery,
  deleteDiscovery as deleteCloudRow,
  resolveAnalysisRowId,
  resolveDiscoveryCloudImageUrl,
} from "./analysesStorage";
import { isValidDiscoveryPhoto, pickValidDiscoveryPhoto, resolveDiscoveryPhoto } from "./discoveryPhoto";
import { loadDiscoveries, saveDiscoveries, saveAlbums } from "./discoveriesStorage";
import { recordSyncError, recordSyncSkip, loadLastSyncError } from "./syncDiagnostics";

const PENDING_KEY = "wilder-cloud-pending";
const SYNC_META_KEY = "wilder-cloud-meta";
const DELETED_KEY = "wilder-deleted-discovery-ids";

const AUTH_ERROR_FR = {
  "user already registered":
    "Un compte existe déjà avec cet email. Clique sur Se connecter.",
  "invalid login credentials": "Email ou mot de passe incorrect.",
  "password should be at least 6 characters":
    "Ton mot de passe doit faire au moins 6 caractères.",
};

function translateAuthError(message) {
  if (!message || typeof message !== "string") return message;
  const translated = AUTH_ERROR_FR[message.trim().toLowerCase()];
  return translated || message;
}

function loadDeletedIds() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DELETED_KEY);
    const ids = JSON.parse(raw || "[]");
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

function saveDeletedIds(ids) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DELETED_KEY, JSON.stringify([...new Set(ids)].slice(-500)));
}

export function markDiscoveryDeleted(id) {
  if (!id) return;
  saveDeletedIds([...loadDeletedIds(), id]);
}

export function isDiscoveryDeleted(id) {
  return loadDeletedIds().includes(id);
}

function loadPendingIds() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    const ids = JSON.parse(raw || "[]");
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

function savePendingIds(ids) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PENDING_KEY, JSON.stringify([...new Set(ids)]));
}

function addPendingId(id) {
  if (!id) return;
  savePendingIds([...loadPendingIds(), id]);
}

function removePendingId(id) {
  savePendingIds(loadPendingIds().filter((x) => x !== id));
}

function saveSyncMeta(meta) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SYNC_META_KEY, JSON.stringify({ ...meta, at: Date.now() }));
}

export function loadSyncMeta() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(SYNC_META_KEY) || "null");
  } catch {
    return null;
  }
}

export function isCloudAvailable() {
  return Boolean(supabase);
}

export async function getCloudSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session || null;
}

async function resolveAuthUser({ createAnonymous = false } = {}) {
  if (!supabase) return { ok: false, error: "cloud_unavailable" };

  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData?.session?.user) {
    const user = sessionData.session.user;
    return {
      ok: true,
      user,
      isAnonymous: user.is_anonymous === true,
      isPermanent: isPermanentAuthUser(user),
    };
  }

  if (!createAnonymous) {
    return { ok: false, error: "not_authenticated" };
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.error("[Wilder] ensureCloudAuth:", error.message);
    return { ok: false, error: translateAuthError(error.message) };
  }

  return { ok: true, user: data.user, isAnonymous: true, isPermanent: false };
}

/**
 * Écoute la session Supabase (INITIAL_SESSION + changements).
 * Appelle onReady une fois la première session connue.
 */
export function subscribeToAuthSession(onSession, onReady) {
  if (!supabase) {
    onSession(null);
    onReady?.();
    return () => {};
  }

  let ready = false;
  const markReady = () => {
    if (!ready) {
      ready = true;
      onReady?.();
    }
  };

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    onSession(session ?? null);
    markReady();
  });

  const fallbackTimer = setTimeout(async () => {
    if (ready) return;
    const session = await getCloudSession();
    onSession(session);
    markReady();
  }, 2500);

  return () => {
    clearTimeout(fallbackTimer);
    subscription.unsubscribe();
  };
}

/** Connexion anonyme automatique — aucune action utilisateur requise. */
export async function ensureCloudAuth() {
  return resolveAuthUser({ createAnonymous: true });
}

export function mergeDiscoveries(local, remote) {
  const byId = new Map();
  const deleted = new Set(loadDeletedIds());

  for (const d of local) {
    if (d?.id && !deleted.has(d.id)) byId.set(d.id, d);
  }

  for (const remoteItem of remote) {
    if (!remoteItem?.id || deleted.has(remoteItem.id)) continue;

    let existing = byId.get(remoteItem.id);

    if (!existing && /^\d+$/.test(String(remoteItem.id))) {
      for (const localItem of byId.values()) {
        if (!localItem?.id || /^\d+$/.test(String(localItem.id))) continue;
        if (!localItem.nom || !remoteItem.nom || localItem.nom !== remoteItem.nom) continue;
        const localTs = new Date(localItem.discoveredAt || 0).getTime();
        const remoteTs = new Date(remoteItem.discoveredAt || 0).getTime();
        if (localTs === remoteTs || Math.abs(localTs - remoteTs) < 60_000) {
          existing = localItem;
          break;
        }
      }
    }

    const mergedPhoto = resolveDiscoveryPhoto({
      photo:
        new Date(remoteItem.discoveredAt || 0).getTime() >=
        new Date(existing?.discoveredAt || 0).getTime()
          ? remoteItem?.photo
          : existing?.photo,
      cloudImageUrl: remoteItem?.cloudImageUrl || existing?.cloudImageUrl,
      image_url: remoteItem?.cloudImageUrl || existing?.cloudImageUrl,
    }) || pickValidDiscoveryPhoto(
      remoteItem?.cloudImageUrl,
      existing?.cloudImageUrl,
      remoteItem?.photo,
      existing?.photo
    );

    if (!existing) {
      byId.set(remoteItem.id, {
        ...remoteItem,
        photo: mergedPhoto,
        cloudImageUrl: remoteItem.cloudImageUrl || mergedPhoto || null,
      });
      continue;
    }

    const existingDate = new Date(existing.discoveredAt || 0).getTime();
    const remoteDate = new Date(remoteItem.discoveredAt || 0).getTime();
    const newer = remoteDate >= existingDate ? remoteItem : existing;
    const older = remoteDate >= existingDate ? existing : remoteItem;
    const canonicalId = /^\d+$/.test(String(existing.id)) ? remoteItem.id : existing.id;

    byId.set(canonicalId, {
      ...older,
      ...newer,
      id: canonicalId,
      photo: mergedPhoto,
      cloudImageUrl:
        remoteItem.cloudImageUrl || existing.cloudImageUrl || mergedPhoto || null,
      cloudSyncedAt: remoteItem.cloudSyncedAt || existing.cloudSyncedAt || null,
    });

    if (String(remoteItem.id) !== String(canonicalId)) {
      byId.delete(remoteItem.id);
    }
  }

  return [...byId.values()].sort(
    (a, b) => new Date(b.discoveredAt || 0) - new Date(a.discoveredAt || 0)
  );
}

function logPushFailure(discovery, result, source) {
  recordSyncError({
    discoveryId: discovery?.id,
    discoveryName: discovery?.nom || null,
    operation: result.operation || "pushDiscoveryToCloud",
    error: result.error || result.reason || "unknown",
    code: result.code || result.reason || null,
    details: result.details || result.hint || null,
    source,
  });
}

export async function pushDiscoveryToCloud(discovery, { source = "push" } = {}) {
  if (!isCloudAvailable() || !discovery?.id) {
    const result = { ok: false, error: "cloud_unavailable" };
    logPushFailure(discovery, result, source);
    return result;
  }

  const auth = await resolveAuthUser({ createAnonymous: false });
  if (!auth.ok) {
    const result = { ok: false, error: auth.error, localOnly: true, code: "not_authenticated" };
    addPendingId(discovery.id);
    logPushFailure(discovery, result, source);
    return result;
  }

  if (!auth.isPermanent) {
    const result = {
      ok: false,
      skipped: true,
      localOnly: true,
      reason: "guest_local_only",
      error: "guest_local_only",
      code: "guest_local_only",
      details: {
        isAnonymous: auth.user?.is_anonymous ?? null,
        email: auth.user?.email || null,
      },
    };
    recordSyncSkip({
      discoveryId: discovery.id,
      reason: "guest_local_only",
      source,
      details: result.details,
    });
    return result;
  }

  let imageUrl = await resolveDiscoveryCloudImageUrl(discovery, auth.user.id);
  if (!imageUrl && discovery.photo?.startsWith("data:")) {
    console.warn("[Wilder] pushDiscoveryToCloud: photo upload failed, continuing without image", {
      discoveryId: discovery.id,
    });
  }

  const result = await upsertDiscovery(discovery, auth.user.id, imageUrl);
  if (!result.ok) {
    addPendingId(discovery.id);
    logPushFailure(discovery, result, source);
    return result;
  }

  removePendingId(discovery.id);

  const syncedImageUrl = result.imageUrl;
  if (syncedImageUrl && isValidDiscoveryPhoto(syncedImageUrl)) {
    const local = loadDiscoveries();
    const idx = local.findIndex((item) => item.id === discovery.id);
    if (idx >= 0) {
      const next = [...local];
      next[idx] = {
        ...next[idx],
        photo: syncedImageUrl,
        cloudImageUrl: syncedImageUrl,
      };
      saveDiscoveries(next);
    }
  }

  saveSyncMeta({
    lastSync: new Date().toISOString(),
    userId: auth.user.id,
    isAnonymous: false,
  });

  return { ok: true, imageUrl: result.imageUrl };
}

/**
 * Résout analyses.id pour une trouvaille locale ; pousse vers Supabase si absent.
 * Utilisé par Ma Palette quand une trouvaille n'a pas encore d'analysis_id bigint.
 */
export async function ensureDiscoveryAnalysisRowId(discoveryId) {
  if (!discoveryId) return { rowId: null, error: "invalid_input" };

  const auth = await resolveAuthUser({ createAnonymous: false });
  if (!auth.ok) return { rowId: null, error: auth.error || "not_authenticated" };
  if (!auth.isPermanent) {
    return { rowId: null, error: "guest_local_only" };
  }

  const userId = auth.user.id;
  let resolved = await resolveAnalysisRowId(userId, discoveryId);
  if (resolved.rowId != null) return { rowId: resolved.rowId, error: null };

  const discovery = loadDiscoveries().find((item) => item.id === discoveryId);
  if (!discovery) return { rowId: null, error: "discovery_not_found" };

  const sync = await pushDiscoveryToCloud(discovery);
  if (!sync.ok) {
    return { rowId: null, error: sync.error || "sync_failed" };
  }

  resolved = await resolveAnalysisRowId(userId, discoveryId);
  if (resolved.rowId != null) return { rowId: resolved.rowId, error: null };

  return { rowId: null, error: resolved.error || "analysis_not_found" };
}

/** Supprime une découverte du cloud (et la marque supprimée pour éviter la réapparition au sync). */
export async function deleteDiscoveryFromCloud(discoveryId) {
  if (!discoveryId) return { ok: false, error: "missing_id" };

  markDiscoveryDeleted(discoveryId);
  removePendingId(discoveryId);

  if (!isCloudAvailable()) return { ok: true, localOnly: true };

  const auth = await resolveAuthUser({ createAnonymous: false });
  if (!auth.ok || !auth.isPermanent) return { ok: true, localOnly: true };

  return deleteCloudRow(discoveryId, auth.user.id);
}

/** Sync en arrière-plan après chaque scan — comptes permanents uniquement. */
export function scheduleDiscoverySync(discovery) {
  if (!isCloudAvailable() || !discovery?.id) return;

  void (async () => {
    try {
      const session = await getCloudSession();
      if (!isPermanentAuthUser(session?.user)) {
        recordSyncSkip({
          discoveryId: discovery.id,
          reason: "not_permanent_session",
          source: "scan",
          details: {
            isAnonymous: session?.user?.is_anonymous ?? null,
            email: session?.user?.email || null,
          },
        });
        addPendingId(discovery.id);
        return;
      }
      await pushDiscoveryToCloud(discovery, { source: "scan" });
    } catch (e) {
      addPendingId(discovery.id);
      recordSyncError({
        discoveryId: discovery.id,
        discoveryName: discovery.nom || null,
        operation: "scheduleDiscoverySync",
        error: e?.message || String(e),
        source: "scan",
      });
    }
  })();
}

export async function flushPendingSync() {
  if (!isCloudAvailable()) return { ok: false, pushed: 0 };

  const auth = await resolveAuthUser({ createAnonymous: false });
  if (!auth.ok || !auth.isPermanent) return { ok: false, pushed: 0, skipped: true };

  const local = loadDiscoveries();
  const pending = new Set(loadPendingIds());
  let pushed = 0;

  for (const id of pending) {
    const d = local.find((x) => x.id === id);
    if (!d) {
      removePendingId(id);
      continue;
    }
    const result = await pushDiscoveryToCloud(d);
    if (result.ok) pushed += 1;
  }

  return { ok: true, pushed };
}

/** Au démarrage : session existante, pull cloud pour comptes permanents, push des items en attente. */
export async function bootstrapCloudSync() {
  if (!isCloudAvailable()) return { ok: false, error: "cloud_unavailable" };

  const auth = await resolveAuthUser({ createAnonymous: false });
  const local = loadDiscoveries();

  if (!auth.ok) {
    return { ok: true, discoveries: local, user: null, remoteCount: 0, localOnly: true };
  }

  if (!auth.isPermanent) {
    return {
      ok: true,
      discoveries: local,
      user: auth.user,
      remoteCount: 0,
      localOnly: true,
      guest: true,
    };
  }

  let remote = [];
  try {
    remote = await fetchCloudDiscoveries();
  } catch (e) {
    console.error("[Wilder] bootstrapCloudSync pull:", e);
    await flushPendingSync();
    return { ok: false, error: e.message, discoveries: local, user: auth.user };
  }

  const merged = mergeDiscoveries(local, remote);
  if (merged.length !== local.length || remote.length > 0) {
    saveDiscoveries(merged);
  }

  const remoteIds = new Set(remote.map((d) => d.id));
  for (const d of merged) {
    if (!remoteIds.has(d.id)) {
      addPendingId(d.id);
    }
  }

  await flushPendingSync();

  saveSyncMeta({
    lastBootstrap: new Date().toISOString(),
    userId: auth.user.id,
    isAnonymous: false,
    remoteCount: remote.length,
    localCount: merged.length,
  });

  return { ok: true, discoveries: loadDiscoveries(), user: auth.user, remoteCount: remote.length };
}

export async function signInWithOAuth(provider, options = {}) {
  if (!supabase) return { ok: false, error: "cloud_unavailable" };

  setRememberMe(options.rememberMe !== false);

  const redirectTo = getOAuthRedirectUrl();
  const session = await getCloudSession();
  const isAnonymous = session?.user?.is_anonymous;

  if (options.pendingCheckoutPlan) {
    void options.pendingCheckoutPlan;
  }

  if (isAnonymous) {
    const { error } = await supabase.auth.linkIdentity({
      provider,
      options: { redirectTo },
    });
    if (error) return { ok: false, error: translateAuthError(error.message) };
    return { ok: true, redirecting: true };
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  });
  if (error) return { ok: false, error: translateAuthError(error.message) };
  return { ok: true, redirecting: true };
}

export async function continueAnonymously() {
  const result = await bootstrapCloudSync();
  return result;
}

export async function completeAuthSession() {
  const bootstrap = await bootstrapCloudSync();
  return bootstrap;
}

export async function signInWithEmail(email, password, { rememberMe = true } = {}) {
  if (!supabase) return { ok: false, error: "cloud_unavailable" };

  setRememberMe(rememberMe);

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: translateAuthError(error.message) };

  const bootstrap = await bootstrapCloudSync();
  return { ok: true, user: data.user, ...bootstrap };
}

export async function resetPasswordForEmail(email) {
  if (!supabase) return { ok: false, error: "cloud_unavailable" };

  const trimmed = String(email || "").trim();
  if (!trimmed) return { ok: false, error: "email_required" };

  const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
    redirectTo: getOAuthRedirectUrl(),
  });
  if (error) return { ok: false, error: translateAuthError(error.message) };

  return { ok: true };
}

/** Lie l’utilisateur anonyme existant à un e-mail — conserve user_id et découvertes cloud. */
export async function signUpWithEmail(email, password) {
  if (!supabase) return { ok: false, error: "cloud_unavailable" };

  const trimmed = email.trim();
  await ensureCloudAuth();
  const session = await getCloudSession();

  if (session?.user?.is_anonymous) {
    const { data, error } = await supabase.auth.updateUser({
      email: trimmed,
      password,
    });
    if (error) return { ok: false, error: translateAuthError(error.message) };
    const bootstrap = await bootstrapCloudSync();
    return { ok: true, user: data.user, ...bootstrap };
  }

  const { data, error } = await supabase.auth.signUp({
    email: trimmed,
    password,
  });
  if (error) return { ok: false, error: translateAuthError(error.message) };

  const bootstrap = await bootstrapCloudSync();
  return { ok: true, user: data.user, ...bootstrap };
}

export async function signOutCloud() {
  if (!supabase) return { ok: false };
  await supabase.auth.signOut();
  localStorage.removeItem(SYNC_META_KEY);
  saveDiscoveries([]);
  saveAlbums([]);
  await ensureCloudAuth();
  return { ok: true };
}

export async function getCloudStatus() {
  if (!isCloudAvailable()) return { available: false };
  const session = await getCloudSession();
  const meta = loadSyncMeta();
  const pending = loadPendingIds().length;
  const user = session?.user || null;
  return {
    available: true,
    authenticated: Boolean(user),
    isAnonymous: user?.is_anonymous ?? true,
    isPermanent: isPermanentAuthUser(user),
    email: user?.email || null,
    pending,
    meta,
    lastSyncError: loadLastSyncError(),
  };
}

/** Compatibilité écran compte — sync manuelle de secours (comptes permanents). */
export async function syncDiscoveriesToCloud() {
  const session = await getCloudSession();
  if (!isPermanentAuthUser(session?.user)) {
    return { ok: true, skipped: true, synced: 0, failed: 0, total: 0 };
  }

  const local = loadDiscoveries();
  let synced = 0;
  let failed = 0;
  const errors = [];
  for (const d of local) {
    const result = await pushDiscoveryToCloud(d, { source: "force_sync" });
    if (result.ok) synced += 1;
    else if (!result.skipped) {
      failed += 1;
      errors.push({
        discoveryId: d.id,
        discoveryName: d.nom || null,
        error: result.error || "unknown",
        code: result.code || null,
      });
    }
  }
  return { ok: true, synced, failed, total: local.length, errors };
}

export async function pullDiscoveriesFromCloud() {
  const result = await bootstrapCloudSync();
  if (!result.ok) return result;
  return { ok: true, merged: result.discoveries?.length || 0, discoveries: result.discoveries };
}
