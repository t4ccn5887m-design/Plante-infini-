import {
  addZoneItems,
  createPalette,
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

function buildGardenIndex(items) {
  const inGarden = new Set();
  const itemIdsByDiscovery = new Map();

  for (const item of items) {
    const discoveryId = item.discovery?.id;
    if (!discoveryId) continue;
    inGarden.add(discoveryId);
    const list = itemIdsByDiscovery.get(discoveryId) || [];
    list.push(item.id);
    itemIdsByDiscovery.set(discoveryId, list);
  }

  return { inGarden, itemIdsByDiscovery };
}

export async function ensureDefaultPalette(t) {
  const palettesRes = await fetchPalettes();
  if (palettesRes.ok && palettesRes.data?.length) {
    return { ok: true, paletteId: palettesRes.data[0].id };
  }

  const created = await createPalette(t("palette.default_name"));
  if (!created.ok) return { ok: false, error: created.error };
  return { ok: true, paletteId: created.data.id };
}

export async function loadScanGardenState() {
  const palettesRes = await fetchPalettes();
  if (!palettesRes.ok || !palettesRes.data?.length) {
    return { inGarden: new Set(), itemIdsByDiscovery: new Map(), paletteId: null };
  }

  const paletteId = palettesRes.data[0].id;
  const itemsRes = await fetchPaletteItems(paletteId);
  const items = itemsRes.ok ? itemsRes.data : [];
  const { inGarden, itemIdsByDiscovery } = buildGardenIndex(items);

  return { inGarden, itemIdsByDiscovery, paletteId };
}

export async function promoteScanToGarden(discovery, t) {
  const paletteResult = await ensureDefaultPalette(t);
  if (!paletteResult.ok) return paletteResult;

  const zoneResult = await ensureSujetsIsolesZone(
    paletteResult.paletteId,
    t("palette.zone.sujets_isoles_name")
  );
  if (!zoneResult.ok) return zoneResult;

  const itemType = inferPaletteItemType(discovery);
  const normalized = normalizePaletteItemPayload({
    type: itemType,
    quantite: defaultQuantityForType(itemType),
    note: null,
  });
  if (!normalized.ok) return { ok: false, error: normalized.error };

  return addZoneItems(zoneResult.data.id, [
    {
      discoveryId: discovery.id,
      ...normalized.data,
    },
  ]);
}

export async function demoteScanFromGarden(discoveryId, itemIdsByDiscovery) {
  const itemIds = itemIdsByDiscovery.get(discoveryId) || [];
  for (const itemId of itemIds) {
    const result = await removePaletteItem(itemId);
    if (!result.ok) return result;
  }
  return { ok: true };
}
