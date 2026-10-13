/**
 * Dossier particulier — agrégat local + sync Supabase (garden_dossiers).
 * Invité : localStorage uniquement. Compte permanent : merge à la connexion puis upsert à chaque changement.
 * Photos terrain : hors scope (IndexedDB).
 */

import { normalizeBriefDetails, EMPTY_BRIEF_DETAILS } from "@/lib/brief/briefDetails";
import { loadGardenAmbianceChoice, saveGardenAmbianceChoice } from "@/lib/gardenAmbianceChoice";
import { loadGardenBudgetChoice, saveGardenBudgetChoice } from "@/lib/gardenBudgetChoice";
import { loadGardenIntention, saveGardenIntention } from "@/lib/gardenIntention";
import { loadGardenTerrainFields, saveGardenTerrainFields } from "@/lib/gardenTerrainFields";
import { loadGardenBriefDetails, saveGardenBriefDetails } from "@/lib/gardenBriefDetails";
import { getCloudSession } from "@/lib/cloudSync";
import { isPermanentAuthUser } from "@/lib/authUser";
import { supabase } from "@/lib/supabase";

export const GARDEN_DOSSIER_LOCAL_UPDATED_KEY = "wilder-garden-dossier-local-updated-at";

const cloudSyncTimers = new Map();
let suppressGardenDossierTouch = false;

function emptyTerrain() {
  return { areaRange: null, timeline: null, utilities: null };
}

/** Snapshot canonique pour cloud.data */
export function assembleGardenDossierData() {
  const terrain = loadGardenTerrainFields();
  return {
    intention: loadGardenIntention() || "",
    ambiance: loadGardenAmbianceChoice() || "",
    budget: loadGardenBudgetChoice() || "",
    terrain: {
      areaRange: terrain.areaRange || null,
      timeline: terrain.timeline || null,
      utilities: terrain.utilities || null,
    },
    details: normalizeBriefDetails(loadGardenBriefDetails()),
  };
}

export function applyGardenDossierData(data, { touchLocalTimestamp = true } = {}) {
  suppressGardenDossierTouch = true;
  try {
    const src = data && typeof data === "object" ? data : {};
    if (typeof src.intention === "string") saveGardenIntention(src.intention);
    if (typeof src.ambiance === "string") saveGardenAmbianceChoice(src.ambiance);
    if (typeof src.budget === "string") saveGardenBudgetChoice(src.budget);
    const tr = src.terrain && typeof src.terrain === "object" ? src.terrain : emptyTerrain();
    saveGardenTerrainFields({
      areaRange: tr.areaRange || null,
      timeline: tr.timeline || null,
      utilities: tr.utilities || null,
    });
    saveGardenBriefDetails(normalizeBriefDetails(src.details || EMPTY_BRIEF_DETAILS));
  } finally {
    suppressGardenDossierTouch = false;
  }
  if (touchLocalTimestamp) markGardenDossierLocalUpdated();
}

export function getGardenDossierLocalUpdatedMs() {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(GARDEN_DOSSIER_LOCAL_UPDATED_KEY);
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function markGardenDossierLocalUpdated(at = Date.now()) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GARDEN_DOSSIER_LOCAL_UPDATED_KEY, String(at));
  } catch {
    /* quota */
  }
}

function hasDossierContent(data) {
  const d = data && typeof data === "object" ? data : {};
  if (String(d.intention || "").trim()) return true;
  if (String(d.ambiance || "").trim()) return true;
  if (String(d.budget || "").trim()) return true;
  const tr = d.terrain || {};
  if (tr.areaRange || tr.timeline || tr.utilities) return true;
  const details = normalizeBriefDetails(d.details);
  const h = details.household;
  if (h.children || h.pets.length || h.uses.length) return true;
  if (details.avoid.items.length || details.avoid.other?.trim()) return true;
  if (details.existing.orientation) return true;
  if (details.upkeep.who || details.upkeep.when) return true;
  return false;
}

async function fetchCloudGardenDossier(userId) {
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from("garden_dossiers")
    .select("data, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.warn("[Wilder] garden_dossiers fetch:", error.message);
    return null;
  }
  return data;
}

async function upsertCloudGardenDossier(userId, payload) {
  if (!supabase || !userId) return { ok: false, error: "cloud_unavailable" };
  const { error } = await supabase.from("garden_dossiers").upsert(
    {
      user_id: userId,
      data: payload,
    },
    { onConflict: "user_id" }
  );
  if (error) {
    console.warn("[Wilder] garden_dossiers upsert:", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/** Fusion local ↔ cloud (le plus récent gagne). */
export async function mergeGardenDossierOnLogin(userId) {
  if (!userId) return { ok: true, skipped: true };

  const localData = assembleGardenDossierData();
  let localMs = getGardenDossierLocalUpdatedMs();
  if (!localMs && hasDossierContent(localData)) {
    localMs = Date.now();
    markGardenDossierLocalUpdated(localMs);
  }
  const remote = await fetchCloudGardenDossier(userId);

  if (!remote) {
    if (hasDossierContent(localData)) {
      await upsertCloudGardenDossier(userId, localData);
    }
    return { ok: true, direction: "local_to_cloud" };
  }

  const remoteMs = remote.updated_at ? new Date(remote.updated_at).getTime() : 0;
  const remoteData = remote.data && typeof remote.data === "object" ? remote.data : {};

  if (localMs > remoteMs) {
    await upsertCloudGardenDossier(userId, localData);
    return { ok: true, direction: "local_to_cloud" };
  }

  if (remoteMs > localMs || !hasDossierContent(localData)) {
    applyGardenDossierData(remoteData, { touchLocalTimestamp: false });
    markGardenDossierLocalUpdated(remoteMs || Date.now());
    return { ok: true, direction: "cloud_to_local" };
  }

  return { ok: true, direction: "unchanged" };
}

export async function syncGardenDossierToCloudIfLoggedIn() {
  const session = await getCloudSession();
  const user = session?.user;
  if (!user || !isPermanentAuthUser(user)) return { ok: true, localOnly: true };

  markGardenDossierLocalUpdated();
  const payload = assembleGardenDossierData();
  return upsertCloudGardenDossier(user.id, payload);
}

/** Debounce upsert cloud après une écriture locale. */
export function scheduleGardenDossierCloudSync(delayMs = 400) {
  if (typeof window === "undefined") return;
  const key = "default";
  if (cloudSyncTimers.has(key)) clearTimeout(cloudSyncTimers.get(key));
  cloudSyncTimers.set(
    key,
    setTimeout(() => {
      cloudSyncTimers.delete(key);
      void syncGardenDossierToCloudIfLoggedIn();
    }, delayMs)
  );
}

/** À appeler après toute modification locale du dossier (hors photos terrain). */
export function touchGardenDossierAfterLocalSave() {
  if (suppressGardenDossierTouch) return;
  markGardenDossierLocalUpdated();
  scheduleGardenDossierCloudSync();
}
