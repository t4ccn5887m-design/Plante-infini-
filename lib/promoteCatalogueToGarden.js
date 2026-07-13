import { resolveAnalysisRowId } from "@/lib/analysesStorage";
import {
  catalogueClientId,
  plantToAnalysisResult,
} from "@/lib/cataloguePlants";
import {
  catalogueMineralClientId,
  mineralToAnalysisResult,
} from "@/lib/catalogueMinerals";
import {
  catalogueDecoClientId,
  decoToAnalysisResult,
} from "@/lib/catalogueDeco";
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

/** Crée ou résout analyses.id pour un article minéral (client_id catalogue-mineral:{id}). */
export async function ensureCatalogueMineralAnalysisRowId(article) {
  if (!article?.id) return { rowId: null, error: "invalid_input" };

  const auth = await getPermanentUserId();
  if (auth.error) return { rowId: null, error: auth.error };

  const clientId = catalogueMineralClientId(article.id);
  const resolved = await resolveAnalysisRowId(auth.userId, clientId);
  if (resolved.rowId != null) return { rowId: resolved.rowId, error: null };
  if (resolved.error) return { rowId: null, error: resolved.error };

  const result = mineralToAnalysisResult(article);
  const { data, error } = await supabase
    .from("analyses")
    .insert({
      user_id: auth.userId,
      client_id: clientId,
      result,
      image_url: article.photo_url || null,
      created_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) return { rowId: null, error: error.message };
  return { rowId: data.id, error: null };
}

function buildCatalogueMineralGardenIndex(items) {
  const inGarden = new Set();
  const itemIdsByMineral = new Map();

  for (const item of items) {
    const mineralId = item.discovery?.catalogue_mineral_id;
    if (!mineralId) continue;
    inGarden.add(mineralId);
    const list = itemIdsByMineral.get(mineralId) || [];
    list.push(item.id);
    itemIdsByMineral.set(mineralId, list);
  }

  return { inGarden, itemIdsByMineral };
}

export async function loadCatalogueMineralGardenState() {
  const palettesRes = await fetchPalettes();
  if (!palettesRes.ok || !palettesRes.data?.length) {
    return { inGarden: new Set(), itemIdsByMineral: new Map() };
  }

  const paletteId = palettesRes.data[0].id;
  const itemsRes = await fetchPaletteItems(paletteId);
  const items = itemsRes.ok ? itemsRes.data : [];
  return buildCatalogueMineralGardenIndex(items);
}

export async function promoteCatalogueMineralToGarden(article, t) {
  const analysisResult = await ensureCatalogueMineralAnalysisRowId(article);
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

  const normalized = normalizePaletteItemPayload({
    type: "massif",
    quantite: null,
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

export async function demoteCatalogueMineralFromGarden(mineralId, itemIdsByMineral) {
  const itemIds = itemIdsByMineral.get(mineralId) || [];
  for (const itemId of itemIds) {
    const result = await removePaletteItem(itemId);
    if (!result.ok) return result;
  }
  return { ok: true };
}

/** Crée ou résout analyses.id pour un article déco (client_id catalogue-deco:{id}). */
export async function ensureCatalogueDecoAnalysisRowId(article) {
  if (!article?.id) return { rowId: null, error: "invalid_input" };

  const auth = await getPermanentUserId();
  if (auth.error) return { rowId: null, error: auth.error };

  const clientId = catalogueDecoClientId(article.id);
  const resolved = await resolveAnalysisRowId(auth.userId, clientId);
  if (resolved.rowId != null) return { rowId: resolved.rowId, error: null };
  if (resolved.error) return { rowId: null, error: resolved.error };

  const result = decoToAnalysisResult(article);
  const { data, error } = await supabase
    .from("analyses")
    .insert({
      user_id: auth.userId,
      client_id: clientId,
      result,
      image_url: article.photo_url || null,
      created_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) return { rowId: null, error: error.message };
  return { rowId: data.id, error: null };
}

function buildCatalogueDecoGardenIndex(items) {
  const inGarden = new Set();
  const itemIdsByDeco = new Map();

  for (const item of items) {
    const decoId = item.discovery?.catalogue_deco_id;
    if (!decoId) continue;
    inGarden.add(decoId);
    const list = itemIdsByDeco.get(decoId) || [];
    list.push(item.id);
    itemIdsByDeco.set(decoId, list);
  }

  return { inGarden, itemIdsByDeco };
}

export async function loadCatalogueDecoGardenState() {
  const palettesRes = await fetchPalettes();
  if (!palettesRes.ok || !palettesRes.data?.length) {
    return { inGarden: new Set(), itemIdsByDeco: new Map() };
  }

  const paletteId = palettesRes.data[0].id;
  const itemsRes = await fetchPaletteItems(paletteId);
  const items = itemsRes.ok ? itemsRes.data : [];
  return buildCatalogueDecoGardenIndex(items);
}

export async function promoteCatalogueDecoToGarden(article, t) {
  const analysisResult = await ensureCatalogueDecoAnalysisRowId(article);
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

  const normalized = normalizePaletteItemPayload({
    type: "massif",
    quantite: null,
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

export async function demoteCatalogueDecoFromGarden(decoId, itemIdsByDeco) {
  const itemIds = itemIdsByDeco.get(decoId) || [];
  for (const itemId of itemIds) {
    const result = await removePaletteItem(itemId);
    if (!result.ok) return result;
  }
  return { ok: true };
}

/** Ajoute tous les items d'une ambiance (plantes + minéraux + déco) en un seul batch. */
export async function promoteAmbianceToGarden(ambiance, resolveItems, t) {
  if (!ambiance?.items?.length) return { ok: false, error: "invalid_input" };

  const { vegetal, mineral, deco, missing } = resolveItems(ambiance);
  if (missing.length > 0) return { ok: false, error: "invalid_ambiance" };

  const paletteResult = await ensureDefaultPalette(t);
  if (!paletteResult.ok) return paletteResult;

  const zoneResult = await ensureSujetsIsolesZone(
    paletteResult.paletteId,
    t("palette.zone.sujets_isoles_name")
  );
  if (!zoneResult.ok) return zoneResult;

  const batch = [];

  for (const plant of vegetal) {
    const analysisResult = await ensureCatalogueAnalysisRowId(plant);
    if (!analysisResult.rowId) {
      return { ok: false, error: analysisResult.error || "analysis_not_found" };
    }

    const itemType =
      plant.palette_type || inferPaletteItemType({ type: plant.type || "plante" });
    const normalized = normalizePaletteItemPayload({
      type: itemType,
      quantite: defaultQuantityForType(itemType),
      note: null,
    });
    if (!normalized.ok) return { ok: false, error: normalized.error };

    batch.push({
      analysisId: analysisResult.rowId,
      ...normalized.data,
    });
  }

  for (const article of mineral) {
    const analysisResult = await ensureCatalogueMineralAnalysisRowId(article);
    if (!analysisResult.rowId) {
      return { ok: false, error: analysisResult.error || "analysis_not_found" };
    }

    const normalized = normalizePaletteItemPayload({
      type: "massif",
      quantite: null,
      note: null,
    });
    if (!normalized.ok) return { ok: false, error: normalized.error };

    batch.push({
      analysisId: analysisResult.rowId,
      ...normalized.data,
    });
  }

  for (const article of deco) {
    const analysisResult = await ensureCatalogueDecoAnalysisRowId(article);
    if (!analysisResult.rowId) {
      return { ok: false, error: analysisResult.error || "analysis_not_found" };
    }

    const normalized = normalizePaletteItemPayload({
      type: "massif",
      quantite: null,
      note: null,
    });
    if (!normalized.ok) return { ok: false, error: normalized.error };

    batch.push({
      analysisId: analysisResult.rowId,
      ...normalized.data,
    });
  }

  if (batch.length === 0) {
    return { ok: true, added: 0, skipped: 0, total: 0 };
  }

  const total = batch.length;
  const result = await addZoneItems(zoneResult.data.id, batch);
  if (!result.ok) return result;

  const added = result.data?.length ?? 0;
  const skipped = total - added;

  return { ok: true, added, skipped, total };
}
