import { pickValidDiscoveryPhoto } from "./discoveryPhoto";
import { loadDiscoveries } from "./discoveriesStorage";
import { supabase } from "./supabase";

const ANALYSES_COLUMNS =
  "id, result, created_at, lieu, latitude, longitude, image_url, user_id, client_id";
const ANALYSES_COLUMNS_FALLBACK =
  "id, result, created_at, lieu, latitude, longitude, image_url, user_id";

async function fetchAnalysesRows() {
  if (!supabase) return { data: [], error: new Error("cloud_unavailable") };

  let { data, error } = await supabase
    .from("analyses")
    .select(ANALYSES_COLUMNS)
    .order("created_at", { ascending: false });

  if (error && /client_id/i.test(error.message || "")) {
    ({ data, error } = await supabase
      .from("analyses")
      .select(ANALYSES_COLUMNS_FALLBACK)
      .order("created_at", { ascending: false }));
  }

  return { data: data || [], error };
}

function buildAnalysisIdMap(rows) {
  const map = new Map();
  for (const row of rows) {
    if (row?.id == null) continue;
    map.set(String(row.id), row.id);
    const discovery = rowToDiscovery(row);
    if (discovery.id) map.set(String(discovery.id), row.id);
    if (row.client_id) map.set(String(row.client_id), row.id);
  }
  return map;
}

export function rowToDiscovery(row) {
  const result = row.result && typeof row.result === "object" ? row.result : {};
  const discoveryId = result.id || (row.id != null ? String(row.id) : null);
  return {
    ...result,
    id: discoveryId,
    discoveredAt: row.created_at || result.discoveredAt,
    placeName: row.lieu || result.placeName || null,
    latitude: row.latitude ?? result.latitude ?? null,
    longitude: row.longitude ?? result.longitude ?? null,
    photo: pickValidDiscoveryPhoto(
      row.image_url,
      result.cloudImageUrl,
      result.photo
    ),
    cloudImageUrl: row.image_url || null,
    cloudSyncedAt: row.created_at || null,
  };
}

function discoveryToRow(discovery, userId, imageUrl) {
  const {
    id,
    discoveredAt,
    photo,
    image_url,
    cloudImageUrl,
    cloudSyncedAt,
    placeName,
    latitude,
    longitude,
    ...result
  } = discovery;

  delete result.photo;
  delete result.image_url;
  delete result.cloudImageUrl;
  delete result.cloudSyncedAt;

  return {
    user_id: String(userId),
    client_id: id,
    result: { ...result, id },
    image_url: imageUrl || cloudImageUrl || image_url || null,
    lieu: null,
    latitude: null,
    longitude: null,
    created_at: discoveredAt || new Date().toISOString(),
  };
}

function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(",");
  const mime = header?.match(/:(.*?);/)?.[1] || "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export async function uploadDiscoveryPhoto(userId, discoveryId, photoDataUrl) {
  if (!supabase || !photoDataUrl?.startsWith("data:")) return null;

  try {
    const blob = dataUrlToBlob(photoDataUrl);
    const ext = blob.type.includes("png") ? "png" : "jpg";
    const path = `${userId}/${discoveryId}.${ext}`;

    const { error } = await supabase.storage.from("images").upload(path, blob, {
      upsert: true,
      contentType: blob.type,
      cacheControl: "31536000",
    });

    if (error) {
      console.error("[Wilder] uploadDiscoveryPhoto:", error.message);
      return null;
    }

    const { data } = supabase.storage.from("images").getPublicUrl(path);
    return data?.publicUrl || null;
  } catch (e) {
    console.error("[Wilder] uploadDiscoveryPhoto:", e);
    return null;
  }
}

export async function fetchDiscoveries() {
  const { data, error } = await fetchAnalysesRows();

  if (error) {
    console.error("[Wilder] fetchDiscoveries:", error.message);
    throw error;
  }

  return data.map(rowToDiscovery);
}

/**
 * Résout discovery.id (client UUID / legacy) → analyses.id (bigint PK).
 * Ordre : client_id indexé → PK directe (legacy) → result.id dans le JSON.
 */
export async function resolveAnalysisRowId(userId, discoveryId) {
  if (!supabase) return { rowId: null, error: "cloud_unavailable" };
  if (!userId || discoveryId == null || discoveryId === "") {
    return { rowId: null, error: "invalid_input" };
  }

  const id = String(discoveryId).trim();
  if (!id) return { rowId: null, error: "invalid_input" };

  const { data: byClient, error: clientError } = await supabase
    .from("analyses")
    .select("id")
    .eq("user_id", userId)
    .eq("client_id", id)
    .maybeSingle();

  if (clientError) {
    console.error("[Wilder] resolveAnalysisRowId client_id:", clientError.message);
    return { rowId: null, error: clientError.message };
  }
  if (byClient?.id != null) return { rowId: byClient.id, error: null };

  if (/^\d+$/.test(id)) {
    const { data: byPk, error: pkError } = await supabase
      .from("analyses")
      .select("id")
      .eq("user_id", userId)
      .eq("id", Number(id))
      .maybeSingle();

    if (pkError) {
      console.error("[Wilder] resolveAnalysisRowId pk:", pkError.message);
      return { rowId: null, error: pkError.message };
    }
    if (byPk?.id != null) return { rowId: byPk.id, error: null };
  }

  const { data: rows, error: rowsError } = await supabase
    .from("analyses")
    .select("id, result")
    .eq("user_id", userId);

  if (rowsError) {
    console.error("[Wilder] resolveAnalysisRowId result:", rowsError.message);
    return { rowId: null, error: rowsError.message };
  }

  const row = (rows || []).find((item) => item?.result?.id === id);
  if (row?.id != null) return { rowId: row.id, error: null };

  return { rowId: null, error: "analysis_not_found" };
}

async function findAnalysisRowId(userId, discoveryId) {
  const result = await resolveAnalysisRowId(userId, discoveryId);
  if (result.error && result.error !== "analysis_not_found") {
    return { rowId: null, error: result.error };
  }
  return { rowId: result.rowId ?? null, error: null };
}

/** Liste le sélecteur palette : mêmes trouvailles que Mes Trouvailles (localStorage). */
export async function fetchPlantAnalysesForPalette() {
  const discoveries = loadDiscoveries();

  if (!supabase) {
    return {
      ok: true,
      data: discoveries.map((discovery) => ({ analysisId: null, discovery })),
    };
  }

  const { data: rows, error: fetchError } = await fetchAnalysesRows();
  if (fetchError) {
    console.warn("[Wilder] fetchPlantAnalysesForPalette analyses:", fetchError.message);
  }

  const analysisByDiscoveryId = buildAnalysisIdMap(rows);
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id || null;

  const items = [];

  for (const discovery of discoveries) {
    let analysisId = analysisByDiscoveryId.get(String(discovery.id));

    if (analysisId == null && userId) {
      const resolved = await resolveAnalysisRowId(userId, discovery.id);
      if (resolved.rowId != null) analysisId = resolved.rowId;
    }

    const row = analysisId != null ? rows.find((r) => r.id === analysisId) : null;
    items.push({
      analysisId: analysisId ?? null,
      discovery: row ? rowToDiscovery(row) : discovery,
    });
  }

  return { ok: true, data: items };
}

export async function verifyAnalysisRowId(userId, analysisId) {
  if (!supabase || !userId || analysisId == null) {
    return { ok: false, error: "invalid_input", rowId: null };
  }

  const numericId = Number(analysisId);
  if (!Number.isFinite(numericId) || numericId <= 0) {
    return { ok: false, error: "invalid_input", rowId: null };
  }

  const { data, error } = await supabase
    .from("analyses")
    .select("id")
    .eq("id", numericId)
    .maybeSingle();

  if (error) {
    console.error("[Wilder] verifyAnalysisRowId:", error.message);
    return { ok: false, error: error.message, rowId: null };
  }
  if (!data?.id) return { ok: false, error: "analysis_not_found", rowId: null };

  return { ok: true, rowId: data.id, error: null };
}

export async function upsertDiscovery(discovery, userId, imageUrl = null) {
  if (!supabase) {
    return { ok: false, error: "supabase_not_configured" };
  }

  if (!userId || !discovery?.id) {
    return { ok: false, error: "missing_user_or_id" };
  }

  const payload = discoveryToRow(discovery, userId, imageUrl);
  const { rowId, error: findError } = await findAnalysisRowId(userId, discovery.id);

  if (findError) {
    console.error("[Wilder] upsertDiscovery find blocked:", {
      discoveryId: discovery.id,
      userId,
      error: findError,
    });
    return { ok: false, error: findError, code: "find_failed" };
  }

  const writePayload = {
    client_id: payload.client_id,
    result: payload.result,
    image_url: payload.image_url,
    lieu: payload.lieu,
    latitude: payload.latitude,
    longitude: payload.longitude,
    created_at: payload.created_at,
  };

  let data;
  let error;

  if (rowId) {
    ({ data, error } = await supabase
      .from("analyses")
      .update(writePayload)
      .eq("id", rowId)
      .select("id, image_url, result")
      .single());
  } else {
    ({ data, error } = await supabase
      .from("analyses")
      .insert(payload)
      .select("id, image_url, result")
      .single());
  }

  if (error) {
    const op = rowId ? "update" : "insert";
    console.error(`[Wilder] upsertDiscovery ${op} failed:`, {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      discoveryId: discovery.id,
      userId,
    });
    return {
      ok: false,
      error: error.message,
      code: error.code || null,
      details: error.details || null,
      hint: error.hint || null,
      operation: op,
    };
  }

  console.info("[Wilder] upsertDiscovery ok:", {
    discoveryId: discovery.id,
    analysisRowId: data?.id ?? null,
    op: rowId ? "update" : "insert",
  });

  return {
    ok: true,
    id: data?.result?.id || discovery.id,
    analysisRowId: data?.id ?? null,
    imageUrl: data?.image_url || imageUrl,
  };
}

export async function deleteDiscovery(discoveryId, userId) {
  if (!supabase) {
    return { ok: false, error: "supabase_not_configured" };
  }
  if (!discoveryId || !userId) {
    return { ok: false, error: "missing_user_or_id" };
  }

  const { rowId, error: findError } = await findAnalysisRowId(userId, discoveryId);

  if (findError) {
    console.error("[Wilder] deleteDiscovery find:", findError.message);
    return { ok: false, error: findError.message };
  }

  if (!rowId) {
    return { ok: true };
  }

  const { error } = await supabase.from("analyses").delete().eq("id", rowId);

  if (error) {
    console.error("[Wilder] deleteDiscovery:", error.message);
    return { ok: false, error: error.message };
  }

  const paths = [`${userId}/${discoveryId}.jpg`, `${userId}/${discoveryId}.png`];
  const { error: storageError } = await supabase.storage.from("images").remove(paths);
  if (storageError) {
    console.warn("[Wilder] deleteDiscovery photo:", storageError.message);
  }

  return { ok: true };
}

/** @deprecated Utiliser upsertDiscovery */
export async function insertDiscovery(discovery) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_authenticated" };
  return upsertDiscovery(discovery, user.id, discovery.cloudImageUrl || null);
}
