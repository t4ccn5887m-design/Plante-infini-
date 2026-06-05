import { supabase } from "./supabase";
import {
  fetchDiscoveries as fetchCloudDiscoveries,
  insertDiscovery as insertCloudDiscovery,
} from "./analysesStorage";
import { loadDiscoveries, saveDiscoveries } from "./discoveriesStorage";

const SESSION_KEY = "wilder-cloud-session";

export function isCloudAvailable() {
  return Boolean(supabase);
}

export function loadCloudSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveCloudSession(session) {
  if (typeof window === "undefined") return;
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

export async function signInWithEmail(email, password) {
  if (!supabase) return { ok: false, error: "cloud_unavailable" };
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
  saveCloudSession({
    userId: data.user?.id,
    email: data.user?.email,
  });
  return { ok: true, user: data.user };
}

export async function signUpWithEmail(email, password) {
  if (!supabase) return { ok: false, error: "cloud_unavailable" };
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { ok: false, error: error.message };
  if (data.user) {
    saveCloudSession({
      userId: data.user.id,
      email: data.user.email,
    });
  }
  return { ok: true, user: data.user };
}

export async function signOutCloud() {
  if (supabase) await supabase.auth.signOut();
  saveCloudSession(null);
  return { ok: true };
}

export async function syncDiscoveriesToCloud() {
  if (!isCloudAvailable()) return { ok: false, error: "cloud_unavailable" };
  const local = loadDiscoveries();
  let synced = 0;
  let failed = 0;

  for (const discovery of local) {
    const result = await insertCloudDiscovery(discovery);
    if (result.ok) synced += 1;
    else failed += 1;
  }

  return { ok: true, synced, failed, total: local.length };
}

export async function pullDiscoveriesFromCloud() {
  if (!isCloudAvailable()) return { ok: false, error: "cloud_unavailable" };
  try {
    const remote = await fetchCloudDiscoveries();
    if (remote.length === 0) return { ok: true, merged: 0 };

    const local = loadDiscoveries();
    const localIds = new Set(local.map((d) => d.id));
    const toAdd = remote.filter((d) => !localIds.has(d.id));
    const merged = [...local, ...toAdd];
    saveDiscoveries(merged);
    return { ok: true, merged: toAdd.length, discoveries: merged };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
