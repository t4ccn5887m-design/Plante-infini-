/**
 * Idées de jardins — ambiances mock (Option C).
 * Structure = modèle de la future table Supabase `garden_ideas` + `garden_idea_items`.
 * Les items pointent vers le catalogue végétal/minéral (pas de duplication).
 */

import { CATALOGUE_PLANTS } from "@/lib/cataloguePlants";
import { CATALOGUE_MINERALS } from "@/lib/catalogueMinerals";

const plantById = new Map(CATALOGUE_PLANTS.map((p) => [p.id, p]));
const mineralById = new Map(CATALOGUE_MINERALS.map((m) => [m.id, m]));

export const HERO_GRADIENTS = {
  med: "linear-gradient(160deg,#cfd8b8 0%,#b7995f 60%,#9c7b3f 100%)",
  jap: "linear-gradient(160deg,#9fb6a3 0%,#5f7d68 60%,#3c5344 100%)",
  cot: "linear-gradient(160deg,#e2b9cf 0%,#b98db0 55%,#8a9b62 100%)",
  sec: "linear-gradient(160deg,#e4d3a6 0%,#c9a86a 55%,#a9823f 100%)",
};

export const GARDEN_IDEAS = [
  {
    id: "jardin-mediterraneen",
    nom: "Jardin méditerranéen",
    badge_conditions: "Plein soleil · sec",
    description:
      "Lavande, oliviers, graminées et gravier clair. Peu d'eau, plein soleil, esprit vacances.",
    hero_key: "med",
    image_url: null,
    ordre: 1,
    actif: true,
    items: [
      { kind: "vegetal", ref_id: "lavande-officinale" },
      { kind: "vegetal", ref_id: "chene-vert" },
      { kind: "vegetal", ref_id: "buddleia" },
      { kind: "vegetal", ref_id: "photinia-red-robin" },
      { kind: "vegetal", ref_id: "gaura-lindheimeri" },
      { kind: "vegetal", ref_id: "pittosporum" },
      { kind: "vegetal", ref_id: "rosier-rugosa" },
      { kind: "vegetal", ref_id: "geranium-rozanne" },
      { kind: "vegetal", ref_id: "heuchere" },
    ],
  },
  {
    id: "jardin-japonais",
    nom: "Jardin japonais",
    badge_conditions: "Mi-ombre · zen",
    description:
      "Érables, mousses, fougères, pierres et pas japonais. Calme, structuré, feuillages fins.",
    hero_key: "jap",
    image_url: null,
    ordre: 2,
    actif: true,
    items: [
      { kind: "vegetal", ref_id: "erable-japon" },
      { kind: "vegetal", ref_id: "hosta" },
      { kind: "vegetal", ref_id: "heuchere" },
      { kind: "vegetal", ref_id: "hortensia-macrophylla" },
      { kind: "vegetal", ref_id: "pittosporum" },
      { kind: "vegetal", ref_id: "cedre-liban" },
      { kind: "vegetal", ref_id: "geranium-rozanne" },
      { kind: "vegetal", ref_id: "buddleia" },
      { kind: "mineral", ref_id: "pas-japonais-gres" },
      { kind: "mineral", ref_id: "galet-riviere" },
      { kind: "mineral", ref_id: "lanterne-pierre" },
    ],
  },
  {
    id: "cottage-anglais",
    nom: "Cottage anglais",
    badge_conditions: "Soleil · fleuri",
    description: "Rosiers, vivaces généreuses, floraisons mêlées. Romantique, foisonnant, coloré.",
    hero_key: "cot",
    image_url: null,
    ordre: 3,
    actif: true,
    items: [
      { kind: "vegetal", ref_id: "rose-new-dawn" },
      { kind: "vegetal", ref_id: "rosier-rugosa" },
      { kind: "vegetal", ref_id: "hortensia-macrophylla" },
      { kind: "vegetal", ref_id: "geranium-rozanne" },
      { kind: "vegetal", ref_id: "aster-novae-angliae" },
      { kind: "vegetal", ref_id: "heuchere" },
      { kind: "vegetal", ref_id: "gaura-lindheimeri" },
      { kind: "vegetal", ref_id: "buddleia" },
      { kind: "vegetal", ref_id: "lavande-officinale" },
      { kind: "vegetal", ref_id: "hosta" },
      { kind: "vegetal", ref_id: "photinia-red-robin" },
      { kind: "vegetal", ref_id: "pittosporum" },
    ],
  },
  {
    id: "jardin-sec",
    nom: "Jardin sec",
    badge_conditions: "Plein soleil · 0 arrosage",
    description: "Graminées, plantes grasses, minéral. Zéro entretien, résiste à la sécheresse.",
    hero_key: "sec",
    image_url: null,
    ordre: 4,
    actif: true,
    items: [
      { kind: "vegetal", ref_id: "gaura-lindheimeri" },
      { kind: "vegetal", ref_id: "photinia-red-robin" },
      { kind: "vegetal", ref_id: "lavande-officinale" },
      { kind: "vegetal", ref_id: "buddleia" },
      { kind: "vegetal", ref_id: "rosier-rugosa" },
      { kind: "vegetal", ref_id: "geranium-rozanne" },
      { kind: "vegetal", ref_id: "chene-vert" },
      { kind: "mineral", ref_id: "gravier-blanc" },
      { kind: "mineral", ref_id: "ardoise-concassee" },
    ],
  },
];

export function getActiveGardenIdeas() {
  return GARDEN_IDEAS.filter((idea) => idea.actif !== false).sort((a, b) => a.ordre - b.ordre);
}

export function resolveAmbianceItems(ambiance) {
  const vegetal = [];
  const mineral = [];
  const missing = [];

  for (const item of ambiance?.items || []) {
    if (item.kind === "vegetal") {
      const plant = plantById.get(item.ref_id);
      if (plant) vegetal.push(plant);
      else missing.push(item);
    } else if (item.kind === "mineral") {
      const article = mineralById.get(item.ref_id);
      if (article) mineral.push(article);
      else missing.push(item);
    } else {
      missing.push(item);
    }
  }

  return { vegetal, mineral, missing };
}

export function countAmbianceItems(ambiance) {
  let plants = 0;
  let minerals = 0;

  for (const item of ambiance?.items || []) {
    if (item.kind === "vegetal") plants += 1;
    else if (item.kind === "mineral") minerals += 1;
  }

  return { plants, minerals };
}

export function isAmbianceComplete(ambiance, inGardenPlants, inGardenMinerals) {
  for (const item of ambiance?.items || []) {
    if (item.kind === "vegetal" && !inGardenPlants.has(item.ref_id)) return false;
    if (item.kind === "mineral" && !inGardenMinerals.has(item.ref_id)) return false;
  }
  return (ambiance?.items?.length ?? 0) > 0;
}
