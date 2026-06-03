import { supabase } from "./supabase";

const ANALYSES_COLUMNS =
  "id, image_url, result, created_at, lieu, latitude, longitude";

function rowToDiscovery(row) {
  const result =
    row.result && typeof row.result === "object" ? row.result : {};
  const placeName =
    row.lieu || result.placeName || result.place_name || null;
  const { placeName: _pn, place_name: _pn2, ...rest } = result;
  return {
    ...rest,
    id: row.id != null ? String(row.id) : row.id,
    photo: row.image_url,
    discoveredAt: row.created_at,
    ...(placeName ? { placeName } : {}),
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
  const { placeName: _pn, place_name: _pn2, ...resultFields } = result;
  const lieu =
    placeName || result.placeName || result.place_name || null;

  const row = {
    image_url: photo,
    result: resultFields,
    created_at: discoveredAt || new Date().toISOString(),
    lieu,
    latitude: latitude ?? null,
    longitude: longitude ?? null,
  };

  if (id != null) row.id = String(id);

  return row;
}

export async function fetchDiscoveries() {
  if (!supabase) {
    console.warn("[Wilder] Supabase non configuré — découvertes vides");
    return [];
  }

  const { data, error } = await supabase
    .from("analyses")
    .select(ANALYSES_COLUMNS)
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
  let payload = row;

  const tryInsert = async (body) => {
    const { data, error } = await supabase
      .from("analyses")
      .insert(body)
      .select("id")
      .single();
    return { data, error };
  };

  let { data, error } = await tryInsert(payload);

  if (
    error &&
    row.id != null &&
    (error.message.includes("bigint") ||
      error.message.includes("invalid input syntax"))
  ) {
    const { id: _omit, ...withoutId } = payload;
    ({ data, error } = await tryInsert(withoutId));
  }

  if (error) {
    console.error("[Wilder] insertDiscovery:", error.message);
    return { ok: false, error: error.message };
  }

  const savedId = data?.id != null ? String(data.id) : discovery.id;
  console.log("[Wilder] insertDiscovery:", savedId);
  return { ok: true, id: savedId };
}
