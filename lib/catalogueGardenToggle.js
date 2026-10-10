import {
  demoteCatalogueDecoFromGarden,
  demoteCatalogueMineralFromGarden,
  demoteCataloguePlantFromGarden,
  loadCatalogueDecoGardenState,
  loadCatalogueGardenState,
  loadCatalogueMineralGardenState,
  promoteCatalogueDecoToGarden,
  promoteCatalogueMineralToGarden,
  promoteCataloguePlantToGarden,
} from "@/lib/promoteCatalogueToGarden";

export async function loadAllCatalogueGardenState() {
  const [plants, minerals, deco] = await Promise.all([
    loadCatalogueGardenState(),
    loadCatalogueMineralGardenState(),
    loadCatalogueDecoGardenState(),
  ]);
  return { plants, minerals, deco };
}

export function isCatalogueItemInGarden(universe, id, state) {
  if (universe === "vegetal") return state.plants.inGarden.has(id);
  if (universe === "mineral") return state.minerals.inGarden.has(id);
  return state.deco.inGarden.has(id);
}

export async function toggleCatalogueItemInGarden({
  universe,
  raw,
  id,
  t,
  state,
  canAddToGarden,
  onRequireAccount,
}) {
  const alreadyIn = isCatalogueItemInGarden(universe, id, state);

  if (!alreadyIn && !canAddToGarden) {
    const promote =
      universe === "vegetal"
        ? () => promoteCataloguePlantToGarden(raw, t)
        : universe === "mineral"
          ? () => promoteCatalogueMineralToGarden(raw, t)
          : () => promoteCatalogueDecoToGarden(raw, t);
    onRequireAccount?.(promote);
    return { ok: true, gated: true };
  }

  let result;
  if (universe === "vegetal") {
    result = alreadyIn
      ? await demoteCataloguePlantFromGarden(id, state.plants.itemIdsByPlant)
      : await promoteCataloguePlantToGarden(raw, t);
  } else if (universe === "mineral") {
    result = alreadyIn
      ? await demoteCatalogueMineralFromGarden(id, state.minerals.itemIdsByMineral)
      : await promoteCatalogueMineralToGarden(raw, t);
  } else {
    result = alreadyIn
      ? await demoteCatalogueDecoFromGarden(id, state.deco.itemIdsByDeco)
      : await promoteCatalogueDecoToGarden(raw, t);
  }

  return result;
}
