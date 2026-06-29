import { pickValidDiscoveryPhoto } from "./discoveryPhoto";
import { supabase } from "./supabase";

const ANALYSES_COLUMNS = "id, result, created_at, lieu, latitude, longitude, image_url, user_id";

function rowToDiscovery(row) {
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
    user_id: userId,
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
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("analyses")
    .select(ANALYSES_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Wilder] fetchDiscoveries:", error.message);
    throw error;
  }

  return (data || []).map(rowToDiscovery);
}

async function findAnalysisRowId(userId, discoveryId) {
  const { data, error } = await supabase
    .from("analyses")
    .select("id, result")
    .eq("user_id", userId);

  if (error) return { error };

  const row = (data || []).find((item) => item?.result?.id === discoveryId);
  return { rowId: row?.id || null };
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
    console.error("[Wilder] upsertDiscovery find:", findError.message);
    return { ok: false, error: findError.message };
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
    console.error("[Wilder] upsertDiscovery:", error.message);
    return { ok: false, error: error.message };
  }

  return {
    ok: true,
    id: data?.result?.id || discovery.id,
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
