import {
  canSharePalettePdf,
  dataUrlForPdfMake,
  deliverPalettePdf,
  getPdfBlob,
  initPdfMake,
} from "@/lib/palettePdf";
import { GARDEN_PDF_USER_ERROR } from "@/lib/gardenBriefPdfDelivery";
import { buildPointFlagMap } from "@/lib/gardenCoupsAnalysisId";
import { enrichGardenCoupsItemForPdf, groupCoupsForPdf } from "@/lib/gardenCoupsPdfMeta";
import { getGardenPdfLeafLogoDataUrl } from "@/lib/gardenPdfLogo";
import { buildGardenDossierDocDefinition } from "@/lib/gardenDossierPdfDoc";
import { ensureQuicksandFonts, gardenPdfFontFamily } from "@/lib/pdfQuicksandFonts";

function sanitizeFilename(displayFirstName) {
  const base = (displayFirstName || "jardin")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `dossier-jardin-${base || "sevya"}.pdf`;
}

function formatPdfDate(date = new Date()) {
  try {
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

/** Prépare les coups de cœur pour le PDF (groupés, sans libellé « Idée »). */
export async function prepareCoupsForPdf(coupsItems, gardenAnalysis = null) {
  const items = Array.isArray(coupsItems) ? coupsItems : [];
  const flagMap = buildPointFlagMap(gardenAnalysis?.points);
  const prepared = [];

  for (const raw of items) {
    const item = enrichGardenCoupsItemForPdf(raw);
    let image = null;
    if (item.photo) {
      image = await dataUrlForPdfMake(item.photo, { maxSide: 112, quality: 0.78 });
    }
    const analysisId = item.analysisId || null;
    prepared.push({
      nom: item.nom,
      pdfKind: item.pdfKind,
      categoryLabel: item.categoryLabel,
      image,
      analysisId,
      pointLabel: analysisId ? flagMap.get(analysisId) || null : null,
    });
  }

  return {
    groups: groupCoupsForPdf(prepared),
    items: prepared,
  };
}

async function prepareTerrainPhotosForPdf(urls) {
  const list = Array.isArray(urls) ? urls : [];
  const prepared = [];
  for (const url of list) {
    const jpeg = await dataUrlForPdfMake(url, { maxSide: 520, quality: 0.75 });
    if (jpeg) prepared.push(jpeg);
  }
  return prepared;
}

export async function buildGardenBriefPdfParams({
  displayFirstName,
  clientContact,
  ambianceName,
  intention,
  coupsItems,
  terrainPhotoDataUrls,
  terrainStats,
  terrainLines,
  budgetLabel,
  gardenAnalysis,
}) {
  const coupsPrepared = await prepareCoupsForPdf(coupsItems, gardenAnalysis);
  const terrainPhotos = await prepareTerrainPhotosForPdf(terrainPhotoDataUrls);
  const leafLogoDataUrl = getGardenPdfLeafLogoDataUrl();
  const stats = {
    ...(terrainStats || {}),
    budgetLabel: terrainStats?.budgetLabel ?? budgetLabel ?? "",
  };

  return {
    displayFirstName,
    clientContact: clientContact || null,
    dateLabel: formatPdfDate(),
    ambianceName,
    coupsGroups: coupsPrepared.groups,
    coupsItems: coupsPrepared.items,
    intention,
    terrainPhotoDataUrls: terrainPhotos,
    terrainStats: stats,
    terrainLines: terrainLines || [],
    budgetLabel,
    gardenAnalysis: gardenAnalysis || null,
    leafLogoDataUrl,
  };
}

function buildBriefDocDefinition(params, font) {
  return buildGardenDossierDocDefinition(params, font);
}

export function buildBriefSummaryText({
  displayFirstName,
  ambianceName,
  intention,
  coupsItems,
  terrainLines,
  budgetLabel,
}) {
  const who = (displayFirstName || "").trim() || "moi";
  const lines = [`Dossier jardin de ${who}`, ""];

  if (ambianceName) {
    lines.push("Mon ambiance", ambianceName, "");
  }
  if (coupsItems?.length) {
    lines.push("Mes coups de cœur");
    for (const item of coupsItems) {
      lines.push(`• ${item.nom}`);
    }
    lines.push("");
  }
  const trimmed = (intention || "").trim();
  if (trimmed) {
    lines.push("Mon mot pour le paysagiste", trimmed, "");
  }
  if (terrainLines?.length) {
    lines.push("Mon terrain");
    terrainLines.forEach((l) => lines.push(`• ${l}`));
    lines.push("");
  }
  if (budgetLabel) {
    lines.push("Budget indicatif", budgetLabel, "");
  }
  lines.push("Préparé avec Sevya · sevya.app");
  return lines.join("\n");
}

export async function createBriefPdfBlob(params) {
  if (typeof window === "undefined") return { ok: false, error: "client_only" };

  try {
    const pdfMake = await initPdfMake();
    await ensureQuicksandFonts(pdfMake);
    const font = gardenPdfFontFamily(pdfMake);
    const pdfDoc = pdfMake.createPdf(buildBriefDocDefinition(params, font));
    const filename = sanitizeFilename(params.displayFirstName);
    const blob = await getPdfBlob(pdfDoc);
    return { ok: true, blob, filename };
  } catch (error) {
    console.error("[Sevya] pdf:", error);
    return { ok: false, error: GARDEN_PDF_USER_ERROR };
  }
}

export async function shareBriefPdf(params) {
  if (typeof window === "undefined") return { ok: false, error: "client_only" };

  const pdfMake = await initPdfMake();
  await ensureQuicksandFonts(pdfMake);
  const font = gardenPdfFontFamily(pdfMake);
  const pdfDoc = pdfMake.createPdf(buildBriefDocDefinition(params, font));
  return deliverPalettePdf(pdfDoc, sanitizeFilename(params.displayFirstName));
}

export async function downloadBriefPdfBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename || "dossier-jardin-sevya.pdf";
    anchor.rel = "noopener";
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    return { ok: true, method: "download" };
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
}

export { canSharePalettePdf };

export function buildBriefMailtoUrl(summaryText) {
  const subject = encodeURIComponent("Mon dossier jardin — Sevya");
  const body = encodeURIComponent(summaryText);
  return `mailto:?subject=${subject}&body=${body}`;
}
