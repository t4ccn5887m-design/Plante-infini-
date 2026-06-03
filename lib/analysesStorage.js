import { supabase } from "./supabase";

function rowToDiscovery(row) {
  const result =
    row.result && typeof row.result === "object" ? row.result : {};
  return {
    ...result,
    id: row.id,
    photo: row.image_url,
    discoveredAt: row.created_at,
    ...(row.latitude != null ? { latitude: row.latitude } : {}),
    ...(row.longitude != null ? { longitude: row.longitude } : {}),
  };
}

function discoveryToRow(discovery) {
  const {
    id,
    photo,
    discoveredAt,
    placeName,
    latitude,
    longitude,
    ...result
  } = discovery;
  return {
    id,
    image_url: photo,
    result: {
      ...result,
      ...(placeName ? { placeName } : {}),
    },
    created_at: discoveredAt || new Date().toISOString(),
    latitude: latitude ?? null,
    longitude: longitude ?? null,
  };
}

export async function fetchDiscoveries() {
  if (!supabase) {
    console.warn("[Wilder] Supabase non configuré — découvertes vides");
    return [];
  }

  const { data, error } = await supabase
    .from("analyses")
    .select("id, image_url, result, created_at, latitude, longitude")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Wilder] fetchDiscoveries:", error.message);
    throw error;
  }

  const items = (data || []).map(rowToDiscovery);
  console.log("[Wilder] fetchDiscoveries:", items.length, "découverte(s)");
  return items;
}

export async function insertDiscovery(discovery) {
  if (!supabase) {
    return { ok: false, error: "supabase_not_configured" };
  }

  const row = discoveryToRow(discovery);
  const { error } = await supabase.from("analyses").insert(row);

  if (error) {
    console.error("[Wilder] insertDiscovery:", error.message);
    return { ok: false, error: error.message };
  }

  console.log("[Wilder] insertDiscovery:", discovery.id);
  return { ok: true };
}
