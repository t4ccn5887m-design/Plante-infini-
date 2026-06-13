import { isValidDiscoveryPhoto } from "./discoveryPhoto";
import { supabase } from "./supabase";

const ANALYSES_COLUMNS = "id, client_id, result, created_at, lieu, latitude, longitude, image_url, user_id";

function rowToDiscovery(row) {
  const result = row.result && typeof row.result === "object" ? row.result : {};
  const clientId = row.client_id || (row.id != null ? String(row.id) : null);
  return {
    ...result,
    id: clientId,
    discoveredAt: row.created_at || result.discoveredAt,
    placeName: row.lieu || result.placeName || null,
    latitude: row.latitude ?? result.latitude ?? null,
    longitude: row.longitude ?? result.longitude ?? null,
    photo: isValidDiscoveryPhoto(result.photo)
      ? result.photo.trim()
      : isValidDiscoveryPhoto(row.image_url)
        ? row.image_url.trim()
        : null,
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
    result,
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

export async function uploadDiscoveryPhoto(userId, clientId, photoDataUrl) {
  if (!supabase || !photoDataUrl?.startsWith("data:")) return null;

  try {
    const blob = dataUrlToBlob(photoDataUrl);
    const ext = blob.type.includes("png") ? "png" : "jpg";
    const path = `${userId}/${clientId}.${ext}`;

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

export async function upsertDiscovery(discovery, userId, imageUrl = null) {
  if (!supabase) {
    return { ok: false, error: "supabase_not_configured" };
  }

  if (!userId || !discovery?.id) {
    return { ok: false, error: "missing_user_or_id" };
  }

  const payload = discoveryToRow(discovery, userId, imageUrl);

  const { data, error } = await supabase
    .from("analyses")
    .upsert(payload, { onConflict: "user_id,client_id" })
    .select("id, client_id, image_url")
    .single();

  if (error) {
    console.error("[Wilder] upsertDiscovery:", error.message);
    return { ok: false, error: error.message };
  }

  return {
    ok: true,
    id: data?.client_id || discovery.id,
    imageUrl: data?.image_url || imageUrl,
  };
}

export async function deleteDiscovery(clientId, userId) {
  if (!supabase) {
    return { ok: false, error: "supabase_not_configured" };
  }
  if (!clientId || !userId) {
    return { ok: false, error: "missing_user_or_id" };
  }

  const { error } = await supabase
    .from("analyses")
    .delete()
    .eq("user_id", userId)
    .eq("client_id", clientId);

  if (error) {
    console.error("[Wilder] deleteDiscovery:", error.message);
    return { ok: false, error: error.message };
  }

  const paths = [`${userId}/${clientId}.jpg`, `${userId}/${clientId}.png`];
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
