import { supabase } from "./supabase";

const ANALYSES_COLUMNS = "id, result, created_at";

function rowToDiscovery(row) {
  const result =
    row.result && typeof row.result === "object" ? row.result : {};
  return {
    ...result,
    id: row.id != null ? String(row.id) : row.id,
    discoveredAt: row.created_at,
  };
}

function discoveryToRow(discovery) {
  const { id, discoveredAt, photo, image_url, ...result } = discovery;
  return {
    result,
    created_at: discoveredAt || new Date().toISOString(),
  };
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

  const payload = discoveryToRow(discovery);

  const { data, error } = await supabase
    .from("analyses")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    console.error("[Wilder] insertDiscovery:", error.message);
    return { ok: false, error: error.message };
  }

  const savedId = data?.id != null ? String(data.id) : discovery.id;
  console.log("[Wilder] insertDiscovery:", savedId);
  return { ok: true, id: savedId };
}
