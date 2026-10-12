import { getCatalogueDecoById } from "@/lib/catalogueDeco";
import { getCatalogueMineralById } from "@/lib/catalogueMinerals";
import { getCataloguePlantById } from "@/lib/cataloguePlants";
import { loadClientContactFromCache } from "@/lib/clientContact";
import { loadGardenAmbianceChoice } from "@/lib/gardenAmbianceChoice";
import { loadGardenBudgetChoice } from "@/lib/gardenBudgetChoice";
import { gardenCoupsAnalysisId } from "@/lib/gardenCoupsAnalysisId";
import { loadGardenCoupsItems } from "@/lib/gardenCoupsItems";
import { loadGardenIntention } from "@/lib/gardenIntention";
import { loadGardenTerrainFields } from "@/lib/gardenTerrainFields";
import { loadGardenTerrainPhotoDataUrls } from "@/lib/gardenTerrainPhotos";
import {
  areaRangeLabel,
  budgetLabel,
  timelineLabel,
  utilitiesLabel,
} from "@/lib/pro/briefLabels";
import { dataUrlForPdfMake } from "@/lib/palettePdf";

function budgetDisplayLabel(budgetId) {
  if (!budgetId) return "";
  if (budgetId === "unknown") return "Je ne sais pas encore";
  return budgetLabel(budgetId);
}

function coupsPayloadItem(item) {
  const d = item.discovery || {};
  const id = gardenCoupsAnalysisId(item);
  let univers = "vegetal";
  let categorie = "";

  if (d.catalogue_mineral_id) {
    univers = "mineral";
    const m = getCatalogueMineralById(d.catalogue_mineral_id);
    categorie = m?.categorie || m?.famille || "";
  } else if (d.catalogue_deco_id) {
    univers = "amenagement";
    const a = getCatalogueDecoById(d.catalogue_deco_id);
    categorie = a?.categorie || a?.famille || "";
  } else if (d.catalogue_plant_id) {
    const p = getCataloguePlantById(d.catalogue_plant_id);
    categorie = p?.categorie || "";
    return {
      id,
      nom: item.nom || p?.nom || "Plante",
      univers,
      categorie,
      exposition: p?.exposition || null,
      entretien: p?.entretien || null,
      arrosage: p?.arrosage || null,
      rusticite_c: p?.rusticite_c ?? null,
      a_savoir: p?.a_savoir || null,
    };
  } else {
    categorie = d.nom_latin ? "Scan" : "Plante";
  }

  return {
    id,
    nom: item.nom || "—",
    univers,
    categorie,
  };
}

export async function buildGardenAnalysisRequestBody() {
  const contact = loadClientContactFromCache();
  const fields = loadGardenTerrainFields();
  const budgetId = loadGardenBudgetChoice();
  const { items } = await loadGardenCoupsItems();
  const photoUrls = await loadGardenTerrainPhotoDataUrls();

  const terrainPhotos = [];
  for (const url of photoUrls.slice(0, 3)) {
    const jpeg = await dataUrlForPdfMake(url, { maxSide: 800, quality: 0.82 });
    if (jpeg?.startsWith("data:image/jpeg")) {
      terrainPhotos.push(jpeg.split(",")[1]);
    }
  }

  return {
    commune: contact.city || "",
    codePostal: contact.postalCode || "",
    ambiance: loadGardenAmbianceChoice() || "",
    intention: loadGardenIntention() || "",
    coupsDeCoeur: items.map(coupsPayloadItem).filter((c) => c.id),
    terrain: {
      surface: fields.areaRange ? areaRangeLabel(fields.areaRange) : "",
      calendrier: fields.timeline ? timelineLabel(fields.timeline) : "",
      utilities: fields.utilities ? utilitiesLabel(fields.utilities) : "",
      orientation: fields.orientation || "",
    },
    budget: budgetDisplayLabel(budgetId),
    terrainPhotos,
  };
}

/** Données pour l'empreinte cache (sans photos). */
export async function buildGardenAnalysisFingerprintPayload() {
  const body = await buildGardenAnalysisRequestBody();
  return {
    commune: body.commune,
    codePostal: body.codePostal,
    ambiance: body.ambiance,
    intention: body.intention,
    coupsDeCoeur: body.coupsDeCoeur,
    terrain: body.terrain,
    budget: body.budget,
    photoCount: body.terrainPhotos.length,
  };
}
