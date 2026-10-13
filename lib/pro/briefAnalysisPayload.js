import { normalizeBriefDetails } from "@/lib/brief/briefDetails";
import {
  areaRangeLabel,
  budgetLabel,
  materialLabel,
  plantLabel,
  tasteLabel,
  timelineLabel,
  utilitiesLabel,
} from "@/lib/pro/briefLabels";
import { normalizeBriefAnswers } from "@/lib/pro/briefDerive";
import { dataUrlForPdfMake } from "@/lib/palettePdf";

function budgetDisplayLabel(budgetId) {
  if (!budgetId) return "";
  if (budgetId === "unknown") return "Je ne sais pas encore";
  return budgetLabel(budgetId);
}

function coupsFromBrief(a) {
  const items = [];
  for (const id of a.tastes) {
    items.push({
      id: `taste-${id}`,
      nom: tasteLabel(id),
      univers: "ambiance",
      categorie: "Style",
    });
  }
  for (const id of a.plants) {
    items.push({
      id: `plant-${id}`,
      nom: plantLabel(id),
      univers: "vegetal",
      categorie: "Végétal",
    });
  }
  for (const id of a.materials) {
    items.push({
      id: `mat-${id}`,
      nom: materialLabel(id),
      univers: "mineral",
      categorie: "Matière",
    });
  }
  return items;
}

/**
 * Corps POST /api/garden-analysis pour un brief pro.
 * @param {object} brief — ligne pro_briefs
 * @param {{ city?: string, postalCode?: string }} client
 * @param {string[]} photoSignedUrls — max 2
 */
export async function buildProBriefAnalysisBody(brief, client, photoSignedUrls = []) {
  const a = normalizeBriefAnswers(brief);
  const d = normalizeBriefDetails(brief?.details ?? a?.details);

  const terrainPhotos = [];
  for (const url of (photoSignedUrls || []).slice(0, 2)) {
    if (typeof url !== "string" || !url.startsWith("http")) continue;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const jpeg = await dataUrlForPdfMake(dataUrl, { maxSide: 640, quality: 0.78 });
      if (jpeg?.startsWith("data:image/jpeg")) {
        terrainPhotos.push(jpeg.split(",")[1]);
      }
    } catch {
      /* ignore bad photo */
    }
  }

  const whenLabel =
    d.upkeep.when || (a.timeline ? timelineLabel(a.timeline) : "");

  return {
    commune: client?.city || "",
    codePostal: client?.postalCode || "",
    ambiance: a.tastes[0] ? tasteLabel(a.tastes[0]) : "",
    intention: a.message?.trim() || "",
    coupsDeCoeur: coupsFromBrief(a),
    terrain: {
      surface: a.areaRange ? areaRangeLabel(a.areaRange) : "",
      calendrier: whenLabel,
      utilities: a.utilities ? utilitiesLabel(a.utilities) : "",
      orientation: d.existing.orientation || "",
      slope: d.existing.slope || "",
      soil: d.existing.soil || "",
      keep: d.existing.keep || "",
      remove: d.existing.remove || "",
      household: d.household,
      avoid: d.avoid,
      upkeep: d.upkeep,
    },
    budget: budgetDisplayLabel(a.budget),
    terrainPhotos,
  };
}

export function buildProBriefAnalysisFingerprint(body) {
  return {
    commune: body.commune,
    codePostal: body.codePostal,
    ambiance: body.ambiance,
    intention: body.intention,
    coupsDeCoeur: body.coupsDeCoeur,
    terrain: body.terrain,
    budget: body.budget,
    photoCount: body.terrainPhotos?.length || 0,
  };
}
