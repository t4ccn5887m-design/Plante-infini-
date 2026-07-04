import { verifyAnalysisRowId } from "./analysesStorage";
import { pickValidDiscoveryPhoto } from "./discoveryPhoto";
import { normalizePaletteItemPayload } from "./palettePlants";
import { supabase } from "./supabase";

const PALETTE_COLUMNS = "id, nom, style, created_at, updated_at";
const ZONE_COLUMNS =
  "id, palette_id, nom, surface_m2, exposition, is_sujets_isoles, ordre, note, created_at, updated_at";
const ITEM_COLUMNS = "id, zone_id, analysis_id, type, quantite, note, ordre, created_at";

function mapJoinedAnalysis(analysisRow) {
  if (!analysisRow) return null;
  const result = analysisRow.result && typeof analysisRow.result === "object" ? analysisRow.result : {};
  const discoveryId = result.id || (analysisRow.id != null ? String(analysisRow.id) : null);
  return {
    ...result,
    id: discoveryId,
    nom: result.nom || result.name || "—",
    nom_latin: result.nom_latin || result.latin || null,
    discoveredAt: analysisRow.created_at || result.discoveredAt,
    photo: pickValidDiscoveryPhoto(analysisRow.image_url, result.cloudImageUrl, result.photo),
    type: result.type || null,
  };
}

function mapPaletteItemRow(row) {
  const discovery = mapJoinedAnalysis(row.analyses);
  return {
    id: row.id,
    zone_id: row.zone_id,
    analysis_id: row.analysis_id,
    type: row.type,
    quantite: row.quantite,
    note: row.note,
    ordre: row.ordre,
    created_at: row.created_at,
    discovery,
  };
}

async function getSessionUserId() {
  if (!supabase) return { userId: null, error: "cloud_unavailable" };
  const { data, error } = await supabase.auth.getSession();
  if (error) return { userId: null, error: error.message };
  const userId = data?.session?.user?.id;
  if (!userId) return { userId: null, error: "not_authenticated" };
  return { userId: String(userId), error: null };
}

export async function fetchPalettes() {
  const { userId, error: authError } = await getSessionUserId();
  if (authError) return { ok: false, error: authError, data: [] };

  const { data, error } = await supabase
    .from("palettes")
    .select(PALETTE_COLUMNS)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[Wilder] fetchPalettes:", error.message);
    return { ok: false, error: error.message, data: [] };
  }

  return { ok: true, data: data || [] };
}

export async function createPalette(nom) {
  const { userId, error: authError } = await getSessionUserId();
  if (authError) return { ok: false, error: authError };

  const { data, error } = await supabase
    .from("palettes")
    .insert({ user_id: userId, nom: nom || "Nouvelle palette" })
    .select(PALETTE_COLUMNS)
    .single();

  if (error) {
    console.error("[Wilder] createPalette:", error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true, data };
}

export async function renamePalette(paletteId, nom) {
  const trimmed = (nom || "").trim();
  if (!paletteId || !trimmed) return { ok: false, error: "invalid_input" };

  const { userId, error: authError } = await getSessionUserId();
  if (authError) return { ok: false, error: authError };

  const { data, error } = await supabase
    .from("palettes")
    .update({ nom: trimmed })
    .eq("id", paletteId)
    .eq("user_id", userId)
    .select(PALETTE_COLUMNS)
    .single();

  if (error) {
    console.error("[Wilder] renamePalette:", error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true, data };
}

export async function deletePalette(paletteId) {
  if (!paletteId) return { ok: false, error: "invalid_input" };

  const { userId, error: authError } = await getSessionUserId();
  if (authError) return { ok: false, error: authError };

  const { error } = await supabase
    .from("palettes")
    .delete()
    .eq("id", paletteId)
    .eq("user_id", userId);

  if (error) {
    console.error("[Wilder] deletePalette:", error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function fetchPalette(paletteId) {
  if (!paletteId) return { ok: false, error: "invalid_input" };

  const { userId, error: authError } = await getSessionUserId();
  if (authError) return { ok: false, error: authError };

  const { data, error } = await supabase
    .from("palettes")
    .select(PALETTE_COLUMNS)
    .eq("id", paletteId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[Wilder] fetchPalette:", error.message);
    return { ok: false, error: error.message };
  }
  if (!data) return { ok: false, error: "not_found" };

  return { ok: true, data };
}

export async function fetchZones(paletteId) {
  if (!paletteId) return { ok: false, error: "invalid_input", data: [] };

  const { userId, error: authError } = await getSessionUserId();
  if (authError) return { ok: false, error: authError, data: [] };

  const paletteCheck = await fetchPalette(paletteId);
  if (!paletteCheck.ok) return { ok: false, error: paletteCheck.error, data: [] };

  const { data, error } = await supabase
    .from("palette_zones")
    .select(ZONE_COLUMNS)
    .eq("palette_id", paletteId)
    .order("is_sujets_isoles", { ascending: true })
    .order("ordre", { ascending: true });

  if (error) {
    console.error("[Wilder] fetchZones:", error.message);
    return { ok: false, error: error.message, data: [] };
  }

  return { ok: true, data: data || [] };
}

export async function ensureSujetsIsolesZone(paletteId, nom) {
  if (!paletteId || !nom) return { ok: false, error: "invalid_input" };

  const zonesResult = await fetchZones(paletteId);
  if (!zonesResult.ok) return zonesResult;

  const existing = zonesResult.data.find((z) => z.is_sujets_isoles);
  if (existing) return { ok: true, data: existing };

  const maxOrdre = zonesResult.data.reduce((max, z) => Math.max(max, z.ordre ?? 0), -1);

  const { data, error } = await supabase
    .from("palette_zones")
    .insert({
      palette_id: paletteId,
      nom,
      is_sujets_isoles: true,
      surface_m2: null,
      ordre: maxOrdre + 1,
    })
    .select(ZONE_COLUMNS)
    .single();

  if (error) {
    console.error("[Wilder] ensureSujetsIsolesZone:", error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true, data };
}

function nextMassifNumber(zones) {
  const massifs = zones.filter((z) => !z.is_sujets_isoles);
  let maxNum = 0;
  for (const zone of massifs) {
    const match = /^Massif\s+(\d+)$/i.exec((zone.nom || "").trim());
    if (match) maxNum = Math.max(maxNum, Number(match[1]));
  }
  return Math.max(maxNum, massifs.length) + 1;
}

export async function createZone(paletteId, nom, options = {}) {
  if (!paletteId || !nom) return { ok: false, error: "invalid_input" };

  const zonesResult = await fetchZones(paletteId);
  if (!zonesResult.ok) return zonesResult;

  const massifs = zonesResult.data.filter((z) => !z.is_sujets_isoles);
  const ordre =
    massifs.length > 0 ? Math.max(...massifs.map((z) => z.ordre ?? 0)) + 1 : 0;

  const insertPayload = {
    palette_id: paletteId,
    nom,
    is_sujets_isoles: false,
    ordre,
  };

  if (options.exposition) {
    insertPayload.exposition = options.exposition;
  }

  const { data, error } = await supabase
    .from("palette_zones")
    .insert(insertPayload)
    .select(ZONE_COLUMNS)
    .single();

  if (error) {
    console.error("[Wilder] createZone:", error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true, data };
}

export async function updateZone(zoneId, fields = {}) {
  if (!zoneId) return { ok: false, error: "invalid_input" };

  const payload = {};

  if (fields.nom !== undefined) {
    const trimmed = String(fields.nom).trim();
    if (!trimmed) return { ok: false, error: "invalid_input" };
    payload.nom = trimmed;
  }

  if (fields.surface_m2 !== undefined) {
    if (fields.surface_m2 === null || fields.surface_m2 === "") {
      payload.surface_m2 = null;
    } else {
      const value = Number(fields.surface_m2);
      if (!Number.isFinite(value) || value <= 0) {
        return { ok: false, error: "invalid_surface" };
      }
      payload.surface_m2 = value;
    }
  }

  if (fields.exposition !== undefined) {
    payload.exposition =
      fields.exposition === null || fields.exposition === ""
        ? null
        : fields.exposition;
  }

  if (Object.keys(payload).length === 0) {
    return { ok: false, error: "invalid_input" };
  }

  const { data, error } = await supabase
    .from("palette_zones")
    .update(payload)
    .eq("id", zoneId)
    .select(ZONE_COLUMNS)
    .single();

  if (error) {
    console.error("[Wilder] updateZone:", error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true, data };
}

export async function deleteZone(zoneId) {
  if (!zoneId) return { ok: false, error: "invalid_input" };

  const { data: zone, error: fetchError } = await supabase
    .from("palette_zones")
    .select("id, is_sujets_isoles")
    .eq("id", zoneId)
    .maybeSingle();

  if (fetchError) {
    console.error("[Wilder] deleteZone fetch:", fetchError.message);
    return { ok: false, error: fetchError.message };
  }
  if (!zone) return { ok: false, error: "not_found" };
  if (zone.is_sujets_isoles) return { ok: false, error: "protected_zone" };

  const { error } = await supabase.from("palette_zones").delete().eq("id", zoneId);

  if (error) {
    console.error("[Wilder] deleteZone:", error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export function buildDefaultMassifName(zones, labelForNumber) {
  const n = nextMassifNumber(zones);
  return labelForNumber(n);
}

export async function setPaletteStyle(paletteId, styleId) {
  if (!paletteId || !styleId) return { ok: false, error: "invalid_input" };

  const { userId, error: authError } = await getSessionUserId();
  if (authError) return { ok: false, error: authError };

  const { error } = await supabase
    .from("palettes")
    .update({ style: styleId })
    .eq("id", paletteId)
    .eq("user_id", userId);

  if (error) {
    console.warn("[Wilder] setPaletteStyle:", error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

/** Ajoute les zones d'un style (sans toucher aux zones existantes ni recréer Sujets isolés). */
export async function applyPaletteStyle(paletteId, styleId, zoneDefs = []) {
  if (!paletteId || !styleId || !Array.isArray(zoneDefs) || zoneDefs.length === 0) {
    return { ok: false, error: "invalid_input", data: [] };
  }

  const zonesResult = await fetchZones(paletteId);
  if (!zonesResult.ok) return { ok: false, error: zonesResult.error, data: [] };

  const massifs = zonesResult.data.filter((z) => !z.is_sujets_isoles);
  let ordre =
    massifs.length > 0 ? Math.max(...massifs.map((z) => z.ordre ?? 0)) + 1 : 0;

  const payloads = zoneDefs.map((def) => {
    const row = {
      palette_id: paletteId,
      nom: def.nom,
      is_sujets_isoles: false,
      surface_m2: null,
      ordre,
    };
    ordre += 1;
    if (def.exposition) row.exposition = def.exposition;
    return row;
  });

  const { data, error } = await supabase
    .from("palette_zones")
    .insert(payloads)
    .select(ZONE_COLUMNS);

  if (error) {
    console.error("[Wilder] applyPaletteStyle:", error.message);
    return { ok: false, error: error.message, data: [] };
  }

  const styleResult = await setPaletteStyle(paletteId, styleId);
  if (!styleResult.ok) {
    console.warn("[Wilder] applyPaletteStyle style not saved:", styleResult.error);
  }

  return { ok: true, data: data || [], styleSaved: styleResult.ok };
}

export async function fetchPaletteItems(paletteId) {
  if (!paletteId) return { ok: false, error: "invalid_input", data: [] };

  const zonesResult = await fetchZones(paletteId);
  if (!zonesResult.ok) return { ok: false, error: zonesResult.error, data: [] };

  const zoneIds = zonesResult.data.map((z) => z.id);
  if (zoneIds.length === 0) return { ok: true, data: [] };

  const { data, error } = await supabase
    .from("palette_items")
    .select(`${ITEM_COLUMNS}, analyses ( id, result, image_url, created_at )`)
    .in("zone_id", zoneIds)
    .order("ordre", { ascending: true });

  if (error) {
    console.error("[Wilder] fetchPaletteItems:", error.message);
    return { ok: false, error: error.message, data: [] };
  }

  return { ok: true, data: (data || []).map(mapPaletteItemRow) };
}

export async function addZoneItems(zoneId, items = []) {
  if (!zoneId || !Array.isArray(items) || items.length === 0) {
    return { ok: false, error: "invalid_input", data: [] };
  }

  const { userId, error: authError } = await getSessionUserId();
  if (authError) return { ok: false, error: authError, data: [] };

  const existingResult = await supabase
    .from("palette_items")
    .select("analysis_id, ordre")
    .eq("zone_id", zoneId);

  if (existingResult.error) {
    console.error("[Wilder] addZoneItems existing:", existingResult.error.message);
    return { ok: false, error: existingResult.error.message, data: [] };
  }

  const existingIds = new Set((existingResult.data || []).map((r) => r.analysis_id));
  let nextOrdre =
    (existingResult.data || []).reduce((max, row) => Math.max(max, row.ordre ?? 0), -1) + 1;

  const payloads = [];

  for (const item of items) {
    const verified = await verifyAnalysisRowId(userId, item.analysisId);
    if (!verified.ok) {
      return { ok: false, error: verified.error || "analysis_not_found", data: [] };
    }

    if (existingIds.has(verified.rowId)) {
      continue;
    }

    const normalized = normalizePaletteItemPayload({
      type: item.type,
      quantite: item.quantite,
      note: item.note,
    });
    if (!normalized.ok) return { ok: false, error: normalized.error, data: [] };

    payloads.push({
      zone_id: zoneId,
      analysis_id: verified.rowId,
      type: normalized.data.type,
      quantite: normalized.data.quantite,
      note: normalized.data.note,
      ordre: nextOrdre,
    });
    nextOrdre += 1;
    existingIds.add(verified.rowId);
  }

  if (payloads.length === 0) {
    return { ok: true, data: [], skipped: true };
  }

  const { data, error } = await supabase
    .from("palette_items")
    .insert(payloads)
    .select(`${ITEM_COLUMNS}, analyses ( id, result, image_url, created_at )`);

  if (error) {
    console.error("[Wilder] addZoneItems:", error.message);
    return { ok: false, error: error.message, data: [] };
  }

  return { ok: true, data: (data || []).map(mapPaletteItemRow) };
}

export async function updatePaletteItem(itemId, fields = {}) {
  if (!itemId) return { ok: false, error: "invalid_input" };

  const currentResult = await supabase
    .from("palette_items")
    .select("id, type, quantite, note")
    .eq("id", itemId)
    .maybeSingle();

  if (currentResult.error) {
    console.error("[Wilder] updatePaletteItem fetch:", currentResult.error.message);
    return { ok: false, error: currentResult.error.message };
  }
  if (!currentResult.data) return { ok: false, error: "not_found" };

  const current = currentResult.data;
  const normalized = normalizePaletteItemPayload({
    type: fields.type !== undefined ? fields.type : current.type,
    quantite: fields.quantite !== undefined ? fields.quantite : current.quantite,
    note: fields.note !== undefined ? fields.note : current.note,
  });
  if (!normalized.ok) return { ok: false, error: normalized.error };

  const { data, error } = await supabase
    .from("palette_items")
    .update(normalized.data)
    .eq("id", itemId)
    .select(`${ITEM_COLUMNS}, analyses ( id, result, image_url, created_at )`)
    .single();

  if (error) {
    console.error("[Wilder] updatePaletteItem:", error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true, data: mapPaletteItemRow(data) };
}

export async function removePaletteItem(itemId) {
  if (!itemId) return { ok: false, error: "invalid_input" };

  const { error } = await supabase.from("palette_items").delete().eq("id", itemId);

  if (error) {
    console.error("[Wilder] removePaletteItem:", error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
