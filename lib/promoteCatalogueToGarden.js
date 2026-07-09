import { resolveAnalysisRowId } from "@/lib/analysesStorage";
import {
  catalogueClientId,
  plantToAnalysisResult,
} from "@/lib/cataloguePlants";
import { isPermanentAuthUser } from "@/lib/authUser";
import {
  addZoneItems,
  ensureSujetsIsolesZone,
  fetchPaletteItems,
  fetchPalettes,
  removePaletteItem,
} from "@/lib/paletteStorage";
import {
  defaultQuantityForType,
  inferPaletteItemType,
  normalizePaletteItemPayload,
} from "@/lib/palettePlants";
import { ensureDefaultPalette } from "@/lib/promoteScanToGarden";
import { supabase } from "@/lib/supabase";

async function getPermanentUserId() {
  if (!supabase) return { userId: null, error: "cloud_unavailable" };
  const { data, error } = await supabase.auth.getSession();
  if (error) return { userId: null, error: error.message };
  const user = data?.session?.user;
  if (!user?.id) return { userId: null, error: "not_authenticated" };
  if (!isPermanentAuthUser(user)) return { userId: null, error: "guest_local_only" };
  return { userId: String(user.id), error: null };
}

/** Crée ou résout analyses.id pour une plante catalogue (client_id catalogue:{id}). */
export async function ensureCatalogueAnalysisRowId(plant) {
  if (!plant?.id) return { rowId: null, error: "invalid_input" };

  const auth = await getPermanentUserId();
  if (auth.error) return { rowId: null, error: auth.error };

  const clientId = catalogueClientId(plant.id);
  const resolved = await resolveAnalysisRowId(auth.userId, clientId);
  if (resolved.rowId != null) return { rowId: resolved.rowId, error: null };
  if (resolved.error) return { rowId: null, error: resolved.error };

  const result = plantToAnalysisResult(plant);
  const { data, error } = await supabase
    .from("analyses")
    .insert({
      user_id: auth.userId,
      client_id: clientId,
      result,
      image_url: plant.photo_url || null,
      created_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) return { rowId: null, error: error.message };
  return { rowId: data.id, error: null };
}

function buildCatalogueGardenIndex(items) {
  const inGarden = new Set();
  const itemIdsByPlant = new Map();

  for (const item of items) {
    const plantId = item.discovery?.catalogue_plant_id;
    if (!plantId) continue;
    inGarden.add(plantId);
    const list = itemIdsByPlant.get(plantId) || [];
    list.push(item.id);
    itemIdsByPlant.set(plantId, list);
  }

  return { inGarden, itemIdsByPlant };
}

export async function loadCatalogueGardenState() {
  const palettesRes = await fetchPalettes();
  if (!palettesRes.ok || !palettesRes.data?.length) {
    return { inGarden: new Set(), itemIdsByPlant: new Map() };
  }

  const paletteId = palettesRes.data[0].id;
  const itemsRes = await fetchPaletteItems(paletteId);
  const items = itemsRes.ok ? itemsRes.data : [];
  return buildCatalogueGardenIndex(items);
}

export async function promoteCataloguePlantToGarden(plant, t) {
  const analysisResult = await ensureCatalogueAnalysisRowId(plant);
  if (!analysisResult.rowId) {
    return { ok: false, error: analysisResult.error || "analysis_not_found" };
  }

  const paletteResult = await ensureDefaultPalette(t);
  if (!paletteResult.ok) return paletteResult;

  const zoneResult = await ensureSujetsIsolesZone(
    paletteResult.paletteId,
    t("palette.zone.sujets_isoles_name")
  );
  if (!zoneResult.ok) return zoneResult;

  const itemType =
    plant.palette_type || inferPaletteItemType({ type: plant.type || "plante" });
  const normalized = normalizePaletteItemPayload({
    type: itemType,
    quantite: defaultQuantityForType(itemType),
    note: null,
  });
  if (!normalized.ok) return { ok: false, error: normalized.error };

  return addZoneItems(zoneResult.data.id, [
    {
      analysisId: analysisResult.rowId,
      ...normalized.data,
    },
  ]);
}

export async function demoteCataloguePlantFromGarden(plantId, itemIdsByPlant) {
  const itemIds = itemIdsByPlant.get(plantId) || [];
  for (const itemId of itemIds) {
    const result = await removePaletteItem(itemId);
    if (!result.ok) return result;
  }
  return { ok: true };
}
