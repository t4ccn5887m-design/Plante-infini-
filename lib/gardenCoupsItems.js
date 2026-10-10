import {
  demoteCatalogueDecoFromGarden,
  demoteCatalogueMineralFromGarden,
  demoteCataloguePlantFromGarden,
  loadCatalogueDecoGardenState,
  loadCatalogueGardenState,
  loadCatalogueMineralGardenState,
} from "@/lib/promoteCatalogueToGarden";
import { demoteScanFromGarden, loadScanGardenState } from "@/lib/promoteScanToGarden";
import { getCataloguePlantById } from "@/lib/cataloguePlants";
import { fetchPaletteItems, fetchPalettes } from "@/lib/paletteStorage";

export function isCatalogueDiscovery(discovery) {
  if (!discovery) return false;
  return Boolean(
    discovery.catalogue_plant_id ||
      discovery.catalogue_mineral_id ||
      discovery.catalogue_deco_id
  );
}

function normalizeCoupsItem(row) {
  const discovery = row.discovery || {};
  const isIdea = isCatalogueDiscovery(discovery);
  let photo = discovery.photo || discovery.cloudImageUrl || null;
  if (!photo && discovery.catalogue_plant_id) {
    photo = getCataloguePlantById(discovery.catalogue_plant_id)?.photo_url || null;
  }

  return {
    paletteItemId: row.id,
    nom: discovery.nom || "Élément",
    photo,
    discovery,
    isIdea,
    originLabel: isIdea ? "Idée" : "Scan",
    createdAt: row.created_at,
  };
}

export async function loadGardenCoupsItems() {
  const palettesRes = await fetchPalettes();
  if (!palettesRes.ok || !palettesRes.data?.length) {
    return {
      items: [],
      demote: {
        itemIdsByDiscovery: new Map(),
        itemIdsByPlant: new Map(),
        itemIdsByMineral: new Map(),
        itemIdsByDeco: new Map(),
      },
    };
  }

  const paletteId = palettesRes.data[0].id;
  const itemsRes = await fetchPaletteItems(paletteId);
  const raw = itemsRes.ok ? itemsRes.data : [];

  const items = raw
    .map(normalizeCoupsItem)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  const [scanState, plantState, mineralState, decoState] = await Promise.all([
    loadScanGardenState(),
    loadCatalogueGardenState(),
    loadCatalogueMineralGardenState(),
    loadCatalogueDecoGardenState(),
  ]);

  return {
    items,
    demote: {
      itemIdsByDiscovery: scanState.itemIdsByDiscovery,
      itemIdsByPlant: plantState.itemIdsByPlant,
      itemIdsByMineral: mineralState.itemIdsByMineral,
      itemIdsByDeco: decoState.itemIdsByDeco,
    },
  };
}

export async function demoteGardenCoupsItem(item, demoteMaps) {
  const d = item?.discovery;
  if (!d) return { ok: false, error: "invalid_input" };

  if (d.catalogue_plant_id) {
    return demoteCataloguePlantFromGarden(d.catalogue_plant_id, demoteMaps.itemIdsByPlant);
  }
  if (d.catalogue_mineral_id) {
    return demoteCatalogueMineralFromGarden(d.catalogue_mineral_id, demoteMaps.itemIdsByMineral);
  }
  if (d.catalogue_deco_id) {
    return demoteCatalogueDecoFromGarden(d.catalogue_deco_id, demoteMaps.itemIdsByDeco);
  }
  if (d.id) {
    return demoteScanFromGarden(d.id, demoteMaps.itemIdsByDiscovery);
  }
  return { ok: false, error: "unknown_origin" };
}
