import {
  demoteCatalogueDecoFromGarden,
  demoteCatalogueMineralFromGarden,
  demoteCataloguePlantFromGarden,
  demoteCatalogueStyleFromGarden,
  loadCatalogueDecoGardenState,
  loadCatalogueGardenState,
  loadCatalogueMineralGardenState,
  loadCatalogueStyleGardenState,
} from "@/lib/promoteCatalogueToGarden";
import { getGardenStyleById } from "@/lib/catalogueStyles";
import { demoteScanFromGarden, loadScanGardenState } from "@/lib/promoteScanToGarden";
import { formatMineralCoupsDisplayName } from "@/lib/catalogueMineralGrain";
import { getCataloguePlantById } from "@/lib/cataloguePlants";
import { fetchPaletteItems, fetchPalettes } from "@/lib/paletteStorage";

export function isCatalogueDiscovery(discovery) {
  if (!discovery) return false;
  return Boolean(
    discovery.catalogue_plant_id ||
      discovery.catalogue_mineral_id ||
      discovery.catalogue_deco_id ||
      discovery.catalogue_style_id
  );
}

export function isGardenStyleDiscovery(discovery) {
  return Boolean(discovery?.catalogue_style_id);
}

function normalizeCoupsItem(row) {
  const discovery = row.discovery || {};
  const isStyle = isGardenStyleDiscovery(discovery);
  const isIdea = isCatalogueDiscovery(discovery) && !isStyle;
  let photo = discovery.photo || discovery.cloudImageUrl || null;
  if (!photo && discovery.catalogue_plant_id) {
    photo = getCataloguePlantById(discovery.catalogue_plant_id)?.photo_url || null;
  }
  if (!photo && discovery.catalogue_style_id) {
    photo = getGardenStyleById(discovery.catalogue_style_id)?.photo_url || null;
  }

  let nom = discovery.nom || "Élément";
  if (discovery.catalogue_mineral_id && discovery.grain_size) {
    nom = formatMineralCoupsDisplayName(nom, discovery.grain_size);
  }

  return {
    paletteItemId: row.id,
    nom,
    photo,
    discovery,
    isIdea,
    isStyle,
    originLabel: isStyle ? "Jardin" : isIdea ? "Idée" : "Scan",
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
        itemIdsByStyle: new Map(),
      },
    };
  }

  const paletteId = palettesRes.data[0].id;
  const itemsRes = await fetchPaletteItems(paletteId);
  const raw = itemsRes.ok ? itemsRes.data : [];

  const items = raw
    .map(normalizeCoupsItem)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  const [scanState, plantState, mineralState, decoState, styleState] = await Promise.all([
    loadScanGardenState(),
    loadCatalogueGardenState(),
    loadCatalogueMineralGardenState(),
    loadCatalogueDecoGardenState(),
    loadCatalogueStyleGardenState(),
  ]);

  return {
    items,
    demote: {
      itemIdsByDiscovery: scanState.itemIdsByDiscovery,
      itemIdsByPlant: plantState.itemIdsByPlant,
      itemIdsByMineral: mineralState.itemIdsByMineral,
      itemIdsByDeco: decoState.itemIdsByDeco,
      itemIdsByStyle: styleState.itemIdsByStyle,
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
  if (d.catalogue_style_id) {
    return demoteCatalogueStyleFromGarden(d.catalogue_style_id, demoteMaps.itemIdsByStyle);
  }
  if (d.id) {
    return demoteScanFromGarden(d.id, demoteMaps.itemIdsByDiscovery);
  }
  return { ok: false, error: "unknown_origin" };
}
