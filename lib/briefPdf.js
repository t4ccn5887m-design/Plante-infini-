import { canSharePalettePdf, deliverPalettePdf, fetchImageDataUrl, initPdfMake } from "@/lib/palettePdf";

const SEVYA_GREEN = "#2F5E3F";
const MUTED = "#5B6359";
const BOX_BORDER = "#DDD6CB";

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

function sectionTitle(text) {
  return { text, style: "sectionTitle", margin: [0, 0, 0, 8] };
}

function buildHeader(displayFirstName, dateLabel) {
  const who = (displayFirstName || "").trim() || "moi";
  return {
    margin: [0, 0, 0, 18],
    stack: [
      { text: `Dossier jardin de ${who}`, style: "title" },
      dateLabel ? { text: dateLabel, style: "subtitle", margin: [0, 4, 0, 0] } : null,
    ].filter(Boolean),
  };
}

function buildAmbianceBlock(ambianceName) {
  const name = (ambianceName || "").trim();
  if (!name) return null;
  return {
    margin: [0, 0, 0, 16],
    stack: [
      sectionTitle("Mon ambiance"),
      {
        text: name,
        bold: true,
        fontSize: 14,
        color: SEVYA_GREEN,
      },
    ],
  };
}

function buildCoupsBlock(coupsWithImages) {
  if (!coupsWithImages?.length) return null;

  const rows = coupsWithImages.map((item) => {
    const cols = [];
    if (item.image) {
      cols.push({
        image: item.image,
        width: 44,
        height: 44,
        margin: [0, 2, 8, 2],
      });
    }
    cols.push({
      stack: [
        { text: item.nom || "—", bold: true, fontSize: 10 },
        item.subtitle
          ? { text: item.subtitle, color: MUTED, fontSize: 8, margin: [0, 2, 0, 0] }
          : null,
      ].filter(Boolean),
      margin: [0, 4, 0, 4],
    });
    return cols.length === 1 ? [cols[0], {}] : cols;
  });

  return {
    margin: [0, 0, 0, 16],
    stack: [
      sectionTitle("Mes coups de cœur"),
      {
        table: {
          widths: rows.some((r) => r.length > 1) ? [52, "*"] : ["*"],
          body: rows.map((r) => (r.length > 1 ? r : [r[0]])),
        },
        layout: "noBorders",
      },
    ],
  };
}

function buildIntentionBlock(intention) {
  const text = (intention || "").trim();
  if (!text) return null;
  return {
    margin: [0, 0, 0, 16],
    stack: [
      sectionTitle("Mon mot pour le paysagiste"),
      {
        table: {
          widths: ["*"],
          body: [[{ text: `« ${text} »`, margin: [10, 8, 10, 8], lineHeight: 1.4, italics: true }]],
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => BOX_BORDER,
          vLineColor: () => BOX_BORDER,
          fillColor: () => "#F4F1E8",
        },
      },
    ],
  };
}

function buildTerrainBlock(terrainPhotoDataUrls, terrainLines) {
  const photos = (terrainPhotoDataUrls || []).filter(Boolean);
  const lines = (terrainLines || []).filter(Boolean);
  if (!photos.length && !lines.length) return null;

  const stack = [sectionTitle("Mon terrain")];

  if (photos.length) {
    const thumbWidth = photos.length >= 4 ? 80 : 100;
    stack.push({
      columns: photos.slice(0, 6).map((img) => ({
        image: img,
        width: thumbWidth,
        margin: [0, 0, 6, 8],
      })),
      columnGap: 4,
      margin: [0, 0, 0, 8],
    });
  }

  if (lines.length) {
    stack.push({
      ul: lines,
      color: "#1F2A22",
      fontSize: 10,
      lineHeight: 1.35,
      margin: [0, 0, 0, 0],
    });
  }

  return { margin: [0, 0, 0, 16], stack };
}

function buildBudgetBlock(budgetLabel) {
  const label = (budgetLabel || "").trim();
  if (!label) return null;
  return {
    margin: [0, 0, 0, 16],
    stack: [
      sectionTitle("Budget indicatif"),
      { text: label, fontSize: 12, bold: true, color: SEVYA_GREEN },
      {
        text: "Indication pour le paysagiste — pas un engagement.",
        fontSize: 8,
        color: MUTED,
        italics: true,
        margin: [0, 4, 0, 0],
      },
    ],
  };
}

function buildFooter() {
  return {
    margin: [0, 8, 0, 0],
    text: "Préparé avec Sevya · sevya.app",
    fontSize: 9,
    color: MUTED,
    alignment: "center",
  };
}

function buildBriefDocDefinition(params) {
  const {
    displayFirstName,
    dateLabel,
    ambianceName,
    coupsWithImages,
    intention,
    terrainPhotoDataUrls,
    terrainLines,
    budgetLabel,
  } = params;

  const content = [
    buildHeader(displayFirstName, dateLabel),
    buildAmbianceBlock(ambianceName),
    buildCoupsBlock(coupsWithImages),
    buildIntentionBlock(intention),
    buildTerrainBlock(terrainPhotoDataUrls, terrainLines),
    buildBudgetBlock(budgetLabel),
    buildFooter(),
  ].filter(Boolean);

  return {
    pageSize: "A4",
    pageMargins: [40, 44, 40, 52],
    content,
    styles: {
      title: { fontSize: 22, bold: true, color: SEVYA_GREEN },
      subtitle: { fontSize: 11, color: MUTED },
      sectionTitle: { fontSize: 12, bold: true, color: SEVYA_GREEN },
    },
    defaultStyle: {
      font: "Roboto",
      fontSize: 10,
      color: "#1F2A22",
    },
  };
}

/** Prépare les images coups de cœur pour le PDF. */
export async function prepareCoupsForPdf(coupsItems) {
  const items = Array.isArray(coupsItems) ? coupsItems : [];
  const prepared = [];
  for (const item of items) {
    let image = null;
    if (item.photo) {
      image = await fetchImageDataUrl(item.photo);
    }
    prepared.push({
      nom: item.nom,
      subtitle: item.originLabel || "",
      image,
    });
  }
  return prepared;
}

export async function buildGardenBriefPdfParams({
  displayFirstName,
  ambianceName,
  intention,
  coupsItems,
  terrainPhotoDataUrls,
  terrainLines,
  budgetLabel,
}) {
  const coupsWithImages = await prepareCoupsForPdf(coupsItems);
  return {
    displayFirstName,
    dateLabel: formatPdfDate(),
    ambianceName,
    coupsWithImages,
    intention,
    terrainPhotoDataUrls: terrainPhotoDataUrls || [],
    terrainLines: terrainLines || [],
    budgetLabel,
  };
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

  const pdfMake = await initPdfMake();
  const pdfDoc = pdfMake.createPdf(buildBriefDocDefinition(params));
  const filename = sanitizeFilename(params.displayFirstName);

  const blob = await new Promise((resolve, reject) => {
    try {
      pdfDoc.getBlob((result) => {
        if (result) resolve(result);
        else reject(new Error("pdf_blob_failed"));
      });
    } catch (error) {
      reject(error);
    }
  });

  return { ok: true, blob, filename };
}

export async function shareBriefPdf(params) {
  if (typeof window === "undefined") return { ok: false, error: "client_only" };

  const pdfMake = await initPdfMake();
  const pdfDoc = pdfMake.createPdf(buildBriefDocDefinition(params));
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
