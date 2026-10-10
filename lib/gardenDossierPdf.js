import {
  buildGardenBriefPdfParams,
  createBriefPdfBlob,
  downloadBriefPdfBlob,
  shareBriefPdf,
} from "@/lib/briefPdf";
import { loadGardenCoupsItems } from "@/lib/gardenCoupsItems";
import { loadGardenAmbianceChoice } from "@/lib/gardenAmbianceChoice";
import { loadGardenBudgetChoice } from "@/lib/gardenBudgetChoice";
import { loadGardenIntention } from "@/lib/gardenIntention";
import { loadGardenTerrainFields } from "@/lib/gardenTerrainFields";
import { loadGardenTerrainPhotoDataUrls } from "@/lib/gardenTerrainPhotos";
import {
  areaRangeLabel,
  budgetLabel,
  timelineLabel,
  utilitiesLabel,
} from "@/lib/pro/briefLabels";
import { loadPremiumProfile } from "@/lib/premiumProfile";

function firstNameFromProfile() {
  const name = loadPremiumProfile().displayName?.trim() || "";
  if (!name) return "";
  return name.split(/\s+/)[0] || name;
}

function budgetDisplayLabel(budgetId) {
  if (!budgetId) return "";
  if (budgetId === "unknown") return "Je ne sais pas encore";
  return budgetLabel(budgetId);
}

function terrainSummaryLines(fields) {
  const lines = [];
  if (fields.areaRange) lines.push(`Surface à aménager : ${areaRangeLabel(fields.areaRange)}`);
  if (fields.timeline) lines.push(`Calendrier : ${timelineLabel(fields.timeline)}`);
  if (fields.utilities) lines.push(`Eau / électricité : ${utilitiesLabel(fields.utilities)}`);
  return lines;
}

export async function buildGardenDossierPdfParamsFromStorage() {
  const { items } = await loadGardenCoupsItems();
  const terrainPhotoDataUrls = await loadGardenTerrainPhotoDataUrls();
  const fields = loadGardenTerrainFields();
  return buildGardenBriefPdfParams({
    displayFirstName: firstNameFromProfile(),
    ambianceName: loadGardenAmbianceChoice(),
    intention: loadGardenIntention(),
    coupsItems: items,
    terrainPhotoDataUrls,
    terrainLines: terrainSummaryLines(fields),
    budgetLabel: budgetDisplayLabel(loadGardenBudgetChoice()),
  });
}

export async function shareGardenDossierPdf() {
  const params = await buildGardenDossierPdfParamsFromStorage();
  return shareBriefPdf(params);
}

export async function downloadGardenDossierPdf() {
  const params = await buildGardenDossierPdfParamsFromStorage();
  const created = await createBriefPdfBlob(params);
  if (!created.ok) return created;
  await downloadBriefPdfBlob(created.blob, created.filename);
  return { ok: true };
}
