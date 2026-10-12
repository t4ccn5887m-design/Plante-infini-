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
import { loadClientContact } from "@/lib/clientContact";

function displayFirstNameFromContact(contact) {
  const first = contact?.firstName?.trim() || "";
  if (first) return first;
  const full = [contact?.firstName, contact?.lastName].filter(Boolean).join(" ").trim();
  return full.split(/\s+/)[0] || "";
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

function buildTerrainStats(fields, budgetId) {
  return {
    surfaceLabel: fields.areaRange ? areaRangeLabel(fields.areaRange) : "",
    budgetLabel: budgetDisplayLabel(budgetId),
    timelineLabel: fields.timeline ? timelineLabel(fields.timeline) : "",
    utilitiesLabel: fields.utilities ? utilitiesLabel(fields.utilities) : "",
    orientationLabel: "",
    accessLabel: "",
  };
}

export async function buildGardenDossierPdfParamsFromStorage({ gardenAnalysis = null } = {}) {
  const { items } = await loadGardenCoupsItems();
  const terrainPhotoDataUrls = await loadGardenTerrainPhotoDataUrls();
  const fields = loadGardenTerrainFields();
  const clientContact = await loadClientContact();
  const budgetId = loadGardenBudgetChoice();
  return buildGardenBriefPdfParams({
    displayFirstName: displayFirstNameFromContact(clientContact),
    clientContact,
    ambianceName: loadGardenAmbianceChoice(),
    intention: loadGardenIntention(),
    coupsItems: items,
    terrainPhotoDataUrls,
    terrainStats: buildTerrainStats(fields, budgetId),
    terrainLines: terrainSummaryLines(fields),
    budgetLabel: budgetDisplayLabel(budgetId),
    gardenAnalysis,
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
