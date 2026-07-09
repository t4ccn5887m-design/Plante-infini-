import { canSharePalettePdf, deliverPalettePdf, initPdfMake } from "@/lib/palettePdf";

const FOREST = "#3d7a5c";
const MUTED = "#5a6b62";
const PURPLE = "#6a58a2";
const PURPLE_BG = "#efedfb";
const BOX_BORDER = "#c8d9ce";

function sanitizeFilename() {
  return "brief-wilder.pdf";
}

function buildTasteBlock(chipLabels, t) {
  if (!chipLabels?.length) return null;

  return {
    margin: [0, 0, 0, 16],
    table: {
      widths: ["*"],
      body: [
        [
          {
            stack: [
              { text: t("brief.taste_title"), bold: true, color: PURPLE, margin: [0, 0, 0, 8] },
              {
                text: chipLabels.join("   ·   "),
                color: PURPLE,
                fontSize: 10,
                lineHeight: 1.4,
              },
            ],
            margin: [12, 10, 12, 10],
          },
        ],
      ],
    },
    layout: {
      hLineWidth: () => 1,
      vLineWidth: () => 1,
      hLineColor: () => "#d8d0ef",
      vLineColor: () => "#d8d0ef",
      fillColor: () => PURPLE_BG,
    },
  };
}

function buildIntentionBlock(intention, t) {
  const text = (intention || "").trim();
  if (!text) return null;

  return {
    margin: [0, 0, 0, 16],
    stack: [
      { text: t("brief.intention_title"), style: "sectionTitle" },
      {
        table: {
          widths: ["*"],
          body: [[{ text, margin: [10, 8, 10, 8], lineHeight: 1.4 }]],
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => BOX_BORDER,
          vLineColor: () => BOX_BORDER,
          fillColor: () => "#f4f1e8",
        },
      },
    ],
  };
}

function buildItemsTable(items, t) {
  const header = [
    { text: t("brief.pdf_col_name"), style: "tableHeader" },
    { text: t("brief.pdf_col_detail"), style: "tableHeader" },
    { text: t("brief.pdf_col_priority"), style: "tableHeader", alignment: "center" },
  ];

  const body = [header];

  if (!items.length) {
    body.push([
      { text: t("brief.empty_garden"), colSpan: 3, italics: true, color: MUTED },
      {},
      {},
    ]);
  } else {
    for (const item of items) {
      const kindLabel =
        item.kind === "mineral" ? t("brief.kind_mineral") : t("brief.kind_vegetal");
      body.push([
        { text: item.nom || "—", bold: true },
        {
          text: [kindLabel, item.subtitle].filter(Boolean).join(" · ") || "—",
          color: MUTED,
          fontSize: 9,
        },
        { text: item.favori ? "♥" : "—", alignment: "center", color: "#c6504c" },
      ]);
    }
  }

  return {
    margin: [0, 0, 0, 12],
    stack: [
      { text: t("brief.plants_section"), style: "sectionTitle" },
      {
        table: {
          headerRows: 1,
          widths: ["*", "*", 36],
          body,
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => BOX_BORDER,
          vLineColor: () => BOX_BORDER,
        },
      },
    ],
  };
}

function buildProFooter(t) {
  return {
    margin: [0, 14, 0, 0],
    text: t("brief.pdf_footer"),
    fontSize: 9,
    color: MUTED,
    italics: true,
  };
}

function buildBriefDocDefinition({
  tasteLabels,
  intention,
  items,
  totalCount,
  heartCount,
  t,
}) {
  return {
    pageSize: "A4",
    pageMargins: [40, 44, 40, 48],
    content: [
      { text: t("brief.title"), style: "title" },
      {
        text: t("brief.summary", { count: totalCount, hearts: heartCount }),
        style: "subtitle",
        margin: [0, 4, 0, 14],
      },
      buildTasteBlock(tasteLabels, t),
      buildIntentionBlock(intention, t),
      buildItemsTable(items, t),
      buildProFooter(t),
    ].filter(Boolean),
    styles: {
      title: { fontSize: 22, bold: true, color: FOREST },
      subtitle: { fontSize: 11, color: MUTED },
      sectionTitle: { fontSize: 12, bold: true, color: FOREST, margin: [0, 0, 0, 8] },
      tableHeader: { bold: true, fontSize: 9, color: FOREST },
    },
    defaultStyle: {
      font: "Roboto",
      fontSize: 10,
      color: "#1a2e24",
    },
  };
}

export function buildBriefSummaryText({ tasteLabels, intention, items, totalCount, heartCount, t }) {
  const lines = [
    t("brief.title"),
    t("brief.summary", { count: totalCount, hearts: heartCount }),
    "",
    t("brief.taste_title"),
    tasteLabels.length ? tasteLabels.map((l) => `• ${l}`).join("\n") : t("brief.taste_composing"),
  ];

  const trimmed = (intention || "").trim();
  if (trimmed) {
    lines.push("", t("brief.intention_title"), trimmed);
  }

  if (items.length) {
    lines.push("", t("brief.plants_section"));
    for (const item of items) {
      const heart = item.favori ? " ♥" : "";
      const sub = item.subtitle ? ` — ${item.subtitle}` : "";
      lines.push(`• ${item.nom}${sub}${heart}`);
    }
  }

  lines.push("", "wilder-nature.com");
  return lines.join("\n");
}

export async function createBriefPdfBlob(params) {
  if (typeof window === "undefined") return { ok: false, error: "client_only" };

  const pdfMake = await initPdfMake();
  const pdfDoc = pdfMake.createPdf(buildBriefDocDefinition(params));

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

  return { ok: true, blob, filename: sanitizeFilename() };
}

export async function shareBriefPdf(params) {
  if (typeof window === "undefined") return { ok: false, error: "client_only" };

  const pdfMake = await initPdfMake();
  const pdfDoc = pdfMake.createPdf(buildBriefDocDefinition(params));
  return deliverPalettePdf(pdfDoc, sanitizeFilename());
}

export async function downloadBriefPdfBlob(blob, filename = sanitizeFilename()) {
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
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
  const subject = encodeURIComponent("Mon brief jardin — Wilder");
  const body = encodeURIComponent(summaryText);
  return `mailto:?subject=${subject}&body=${body}`;
}
