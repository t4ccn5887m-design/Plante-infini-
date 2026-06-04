import {
  guessEmojiForPlant,
  inferHealthFromEtatSante,
} from "@/lib/potagerHealth";
import { loadPotagerPlants, savePotagerPlants } from "@/lib/potagerStorage";

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createPotagerPlantFromDiscovery(discovery) {
  return {
    id: generateId(),
    name: discovery.nom || "Plante",
    emoji: guessEmojiForPlant(discovery.nom, discovery.type),
    health: inferHealthFromEtatSante(discovery.etat_sante),
    bedId: 0,
    discoveryId: discovery.id,
    readyToHarvest: false,
    addedAt: new Date().toISOString(),
  };
}

/** Add or refresh a plant from a scan (matched by discoveryId). */
export function upsertPotagerPlantFromDiscovery(discovery, analysis) {
  const merged = {
    ...discovery,
    nom: analysis?.nom || discovery.nom,
    type: analysis?.type || discovery.type,
    etat_sante: analysis?.etat_sante ?? discovery.etat_sante,
  };
  const plants = loadPotagerPlants();
  const idx = plants.findIndex((p) => p.discoveryId === merged.id);
  const fresh = createPotagerPlantFromDiscovery(merged);
  if (idx >= 0) {
    plants[idx] = {
      ...plants[idx],
      name: fresh.name,
      emoji: fresh.emoji,
      health: fresh.health,
      discoveryId: merged.id,
    };
  } else {
    plants.push(fresh);
  }
  savePotagerPlants(plants);
  return plants;
}
