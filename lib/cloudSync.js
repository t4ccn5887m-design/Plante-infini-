import { supabase, getOAuthRedirectUrl } from "./supabase";
import {
  fetchDiscoveries as fetchCloudDiscoveries,
  uploadDiscoveryPhoto,
  upsertDiscovery,
} from "./analysesStorage";
import { loadDiscoveries, saveDiscoveries } from "./discoveriesStorage";

const PENDING_KEY = "wilder-cloud-pending";
const SYNC_META_KEY = "wilder-cloud-meta";

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

/** Connexion anonyme automatique — aucune action utilisateur requise. */
export async function ensureCloudAuth() {
  if (!supabase) return { ok: false, error: "cloud_unavailable" };

  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData?.session?.user) {
    return { ok: true, user: sessionData.session.user, isAnonymous: sessionData.session.user.is_anonymous };
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.error("[Wilder] ensureCloudAuth:", error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true, user: data.user, isAnonymous: true };
}

export function mergeDiscoveries(local, remote) {
  const byId = new Map();

  for (const d of local) {
    if (d?.id) byId.set(d.id, d);
  }

  for (const remoteItem of remote) {
    if (!remoteItem?.id) continue;
    const existing = byId.get(remoteItem.id);
    const remotePhoto = remoteItem.cloudImageUrl || remoteItem.photo;

    if (!existing) {
      byId.set(remoteItem.id, {
        ...remoteItem,
        photo: remotePhoto || null,
      });
      continue;
    }

    const existingDate = new Date(existing.discoveredAt || 0).getTime();
    const remoteDate = new Date(remoteItem.discoveredAt || 0).getTime();
    const newer = remoteDate >= existingDate ? remoteItem : existing;
    const older = remoteDate >= existingDate ? existing : remoteItem;

    byId.set(remoteItem.id, {
      ...older,
      ...newer,
      photo: existing.photo || remotePhoto || null,
      cloudImageUrl: remoteItem.cloudImageUrl || existing.cloudImageUrl || null,
      cloudSyncedAt: remoteItem.cloudSyncedAt || existing.cloudSyncedAt || null,
    });
  }

  return [...byId.values()].sort(
    (a, b) => new Date(b.discoveredAt || 0) - new Date(a.discoveredAt || 0)
  );
}

export async function pushDiscoveryToCloud(discovery) {
  if (!isCloudAvailable() || !discovery?.id) {
    return { ok: false, error: "cloud_unavailable" };
  }

  const auth = await ensureCloudAuth();
  if (!auth.ok) {
    addPendingId(discovery.id);
    return { ok: false, error: auth.error };
  }

  let imageUrl = discovery.cloudImageUrl || null;
  if (discovery.photo?.startsWith("data:")) {
    imageUrl = await uploadDiscoveryPhoto(auth.user.id, discovery.id, discovery.photo);
  }

  const result = await upsertDiscovery(discovery, auth.user.id, imageUrl);
  if (!result.ok) {
    addPendingId(discovery.id);
    return result;
  }

  removePendingId(discovery.id);
  saveSyncMeta({
    lastSync: new Date().toISOString(),
    userId: auth.user.id,
    isAnonymous: auth.isAnonymous,
  });

  return { ok: true, imageUrl: result.imageUrl };
}

/** Sync en arrière-plan après chaque scan — fire & forget. */
export function scheduleDiscoverySync(discovery) {
  if (!isCloudAvailable() || !discovery?.id) return;

  pushDiscoveryToCloud(discovery).catch(() => {
    addPendingId(discovery.id);
  });
}

export async function flushPendingSync() {
  if (!isCloudAvailable()) return { ok: false, pushed: 0 };

  const auth = await ensureCloudAuth();
  if (!auth.ok) return { ok: false, pushed: 0 };

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

/** Au démarrage : auth auto, fusion cloud ↔ local, push des items en attente. */
export async function bootstrapCloudSync() {
  if (!isCloudAvailable()) return { ok: false, error: "cloud_unavailable" };

  const auth = await ensureCloudAuth();
  if (!auth.ok) return { ok: false, error: auth.error };

  let remote = [];
  try {
    remote = await fetchCloudDiscoveries();
  } catch (e) {
    console.error("[Wilder] bootstrapCloudSync pull:", e);
    await flushPendingSync();
    return { ok: false, error: e.message };
  }

  const local = loadDiscoveries();
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
    isAnonymous: auth.isAnonymous,
    remoteCount: remote.length,
    localCount: merged.length,
  });

  return { ok: true, discoveries: loadDiscoveries(), user: auth.user };
}

export async function signInWithOAuth(provider) {
  if (!supabase) return { ok: false, error: "cloud_unavailable" };

  const redirectTo = getOAuthRedirectUrl();
  const session = await getCloudSession();
  const isAnonymous = session?.user?.is_anonymous;

  if (isAnonymous) {
    const { error } = await supabase.auth.linkIdentity({
      provider,
      options: { redirectTo },
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, redirecting: true };
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  });
  if (error) return { ok: false, error: error.message };
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

export async function signInWithEmail(email, password) {
  if (!supabase) return { ok: false, error: "cloud_unavailable" };

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };

  const bootstrap = await bootstrapCloudSync();
  return { ok: true, user: data.user, ...bootstrap };
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
    if (error) return { ok: false, error: error.message };
    const bootstrap = await bootstrapCloudSync();
    return { ok: true, user: data.user, ...bootstrap };
  }

  const { data, error } = await supabase.auth.signUp({
    email: trimmed,
    password,
  });
  if (error) return { ok: false, error: error.message };

  const bootstrap = await bootstrapCloudSync();
  return { ok: true, user: data.user, ...bootstrap };
}

export async function signOutCloud() {
  if (!supabase) return { ok: false };
  await supabase.auth.signOut();
  localStorage.removeItem(SYNC_META_KEY);
  await ensureCloudAuth();
  return { ok: true };
}

export async function getCloudStatus() {
  if (!isCloudAvailable()) return { available: false };
  const session = await getCloudSession();
  const meta = loadSyncMeta();
  const pending = loadPendingIds().length;
  return {
    available: true,
    authenticated: Boolean(session?.user),
    isAnonymous: session?.user?.is_anonymous ?? true,
    email: session?.user?.email || null,
    pending,
    meta,
  };
}

/** Compatibilité écran compte — sync manuelle de secours */
export async function syncDiscoveriesToCloud() {
  const local = loadDiscoveries();
  let synced = 0;
  let failed = 0;
  for (const d of local) {
    const result = await pushDiscoveryToCloud(d);
    if (result.ok) synced += 1;
    else failed += 1;
  }
  return { ok: true, synced, failed, total: local.length };
}

export async function pullDiscoveriesFromCloud() {
  const result = await bootstrapCloudSync();
  if (!result.ok) return result;
  return { ok: true, merged: result.discoveries?.length || 0, discoveries: result.discoveries };
}
