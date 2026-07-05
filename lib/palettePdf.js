const FOREST = "#3d7a5c";
const MUTED = "#5a6b62";
const BOX_BG = "#f4f1e8";
const BOX_BORDER = "#c8d9ce";

import { resolveDiscoveryPhoto } from "./discoveryPhoto";

function expositionLabel(t, value) {
  if (!value) return "";
  const key = `palette.zone.exposition_${String(value).replace("-", "_")}`;
  return t(key);
}

function formatZoneMeta(zone, t) {
  const parts = [];
  if (!zone.is_sujets_isoles && zone.surface_m2 != null && zone.surface_m2 !== "") {
    parts.push(t("palette.zone.surface_value", { n: zone.surface_m2 }));
  }
  const expo = expositionLabel(t, zone.exposition);
  if (expo) parts.push(expo);
  return parts.join(" · ");
}

function itemBadge(item, t) {
  if (item.type === "sujet") {
    return t("palette.export.badge_sujet", { n: item.quantite ?? 1 });
  }
  return t("palette.export.badge_massif");
}

function itemQtyCell(item, t) {
  if (item.type === "sujet") return String(item.quantite ?? 1);
  return t("palette.export.qty_dash");
}

function typeLabel(item, t) {
  return item.type === "sujet" ? t("palette.export.type_sujet") : t("palette.export.type_massif");
}

function discoveryPhotoUrl(item) {
  return resolveDiscoveryPhoto(item.discovery);
}

function sortItemsForExport(items, zonesById) {
  return [...items].sort((a, b) => {
    const za = zonesById.get(a.zone_id);
    const zb = zonesById.get(b.zone_id);
    const sujetA = za?.is_sujets_isoles ? 1 : 0;
    const sujetB = zb?.is_sujets_isoles ? 1 : 0;
    if (sujetA !== sujetB) return sujetA - sujetB;
    if ((za?.ordre ?? 0) !== (zb?.ordre ?? 0)) return (za?.ordre ?? 0) - (zb?.ordre ?? 0);
    return (a.ordre ?? 0) - (b.ordre ?? 0);
  });
}

async function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function fetchImageDataUrl(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (trimmed.startsWith("data:image/")) return trimmed;
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) return null;

  try {
    const response = await fetch(trimmed);
    if (!response.ok) return null;
    const blob = await response.blob();
    if (!blob.type.startsWith("image/")) return null;
    return await blobToDataUrl(blob);
  } catch {
    return null;
  }
}

async function loadItemImages(items) {
  const map = new Map();
  await Promise.all(
    items.map(async (item) => {
      const url = discoveryPhotoUrl(item);
      const dataUrl = await fetchImageDataUrl(url);
      if (dataUrl) map.set(item.id, dataUrl);
    })
  );
  return map;
}

function buildContactBlock(contact, t) {
  if (!contact) return null;

  const lines = [];
  const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(" ").trim();
  if (fullName) lines.push(fullName);
  if (contact.phone?.trim()) lines.push(contact.phone.trim());
  if (contact.email?.trim()) lines.push(contact.email.trim());
  if (contact.city?.trim()) lines.push(contact.city.trim());

  if (lines.length === 0) return null;

  return {
    margin: [0, 16, 0, 16],
    stack: [
      { text: t("palette.export.prepared_by"), style: "sectionTitle" },
      {
        table: {
          widths: ["*"],
          body: [[{ stack: lines.map((line) => ({ text: line, margin: [0, 1, 0, 1] })), margin: [10, 8, 10, 8] }]],
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => BOX_BORDER,
          vLineColor: () => BOX_BORDER,
          fillColor: () => BOX_BG,
        },
      },
    ],
  };
}

function buildSummaryTable(items, zonesById, t) {
  const header = [
    { text: t("palette.export.col_plant"), style: "tableHeader" },
    { text: t("palette.export.col_latin"), style: "tableHeader" },
    { text: t("palette.export.col_zone"), style: "tableHeader" },
    { text: t("palette.export.col_type"), style: "tableHeader" },
    { text: t("palette.export.col_qty"), style: "tableHeader", alignment: "center" },
  ];

  const body = [header];

  if (items.length === 0) {
    body.push([
      { text: t("palette.export.summary_empty"), colSpan: 5, italics: true, color: MUTED },
      {},
      {},
      {},
      {},
    ]);
  } else {
    for (const item of items) {
      const zone = zonesById.get(item.zone_id);
      const discovery = item.discovery || {};
      body.push([
        { text: discovery.nom || "—" },
        { text: discovery.nom_latin || "—", italics: true, color: MUTED },
        { text: zone?.nom || "—" },
        { text: typeLabel(item, t) },
        { text: itemQtyCell(item, t), alignment: "center" },
      ]);
    }
  }

  return {
    margin: [0, 0, 0, 20],
    stack: [
      { text: t("palette.export.summary_title"), style: "sectionTitle" },
      {
        table: {
          headerRows: 1,
          widths: ["*", "*", "*", 52, 32],
          body,
        },
        layout: {
          hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length ? 1 : 0.5),
          vLineWidth: () => 0,
          hLineColor: (i) => (i <= 1 ? FOREST : "#ddd"),
          paddingLeft: () => 6,
          paddingRight: () => 6,
          paddingTop: () => 5,
          paddingBottom: () => 5,
          fillColor: (rowIndex) => (rowIndex === 0 ? "#e8f0eb" : null),
        },
      },
    ],
  };
}

function buildPlantRow(item, imageMap, t) {
  const discovery = item.discovery || {};
  const imageData = imageMap.get(item.id);
  const textStack = {
    stack: [
      { text: discovery.nom || "—", bold: true, fontSize: 11 },
      discovery.nom_latin
        ? { text: discovery.nom_latin, italics: true, color: MUTED, fontSize: 9, margin: [0, 2, 0, 4] }
        : { text: "", margin: [0, 0, 0, 2] },
      { text: itemBadge(item, t).toUpperCase(), bold: true, color: FOREST, fontSize: 9 },
    ],
    margin: [0, 6, 0, 6],
  };

  if (imageData) {
    return {
      columns: [
        { image: imageData, width: 52, height: 52, margin: [0, 6, 10, 6] },
        textStack,
      ],
    };
  }

  return {
    columns: [
      {
        text: "🌿",
        width: 52,
        alignment: "center",
        fontSize: 22,
        margin: [0, 12, 10, 6],
        color: FOREST,
      },
      textStack,
    ],
  };
}

function buildZoneSection(zone, zoneItems, imageMap, t) {
  const meta = formatZoneMeta(zone, t);
  const sortedZoneItems = [...zoneItems].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));
  const innerStack = [
    { text: zone.nom, style: "zoneTitle" },
  ];

  if (meta) {
    innerStack.push({ text: meta, color: MUTED, fontSize: 9, margin: [0, 2, 0, 8] });
  } else {
    innerStack.push({ text: " ", margin: [0, 0, 0, 6] });
  }

  if (zoneItems.length === 0) {
    innerStack.push({ text: t("palette.export.zone_empty"), italics: true, color: MUTED, fontSize: 9 });
  } else {
    for (const item of sortedZoneItems) {
      innerStack.push(buildPlantRow(item, imageMap, t));
      innerStack.push({
        canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: "#ddd" }],
        margin: [0, 0, 0, 0],
      });
    }
    innerStack.pop();
  }

  return {
    margin: [0, 0, 0, 14],
    table: {
      widths: ["*"],
      body: [[{ stack: innerStack, margin: [12, 10, 12, 10] }]],
    },
    layout: {
      hLineWidth: () => 1,
      vLineWidth: () => 1,
      hLineColor: () => BOX_BORDER,
      vLineColor: () => BOX_BORDER,
      fillColor: () => BOX_BG,
    },
  };
}

function buildProFooter(t) {
  return {
    margin: [0, 10, 0, 0],
    table: {
      widths: ["*"],
      body: [
        [
          {
            stack: [
              { text: t("palette.export.pro_footer_title"), bold: true, color: FOREST, margin: [0, 0, 0, 6] },
              { text: t("palette.export.pro_footer_body"), fontSize: 9, color: MUTED, lineHeight: 1.35 },
              {
                text: "wilder-nature.com",
                link: "https://wilder-nature.com",
                color: FOREST,
                bold: true,
                fontSize: 9,
                margin: [0, 8, 0, 0],
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
      hLineColor: () => FOREST,
      vLineColor: () => FOREST,
      fillColor: () => "#eef5f0",
    },
  };
}

function sanitizeFilename(name) {
  return (name || "palette")
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60) || "palette";
}

async function initPdfMake() {
  const pdfMakeModule = await import("pdfmake/build/pdfmake");
  const pdfFontsModule = await import("pdfmake/build/vfs_fonts");
  const pdfMake = pdfMakeModule.default;
  pdfMake.vfs = pdfFontsModule.default?.pdfMake?.vfs || pdfFontsModule.pdfMake?.vfs;
  return pdfMake;
}

export async function downloadPalettePdf({ palette, zones, items, contact, t }) {
  if (typeof window === "undefined") return { ok: false, error: "client_only" };

  const pdfMake = await initPdfMake();
  const zonesById = new Map(zones.map((z) => [z.id, z]));
  const itemsByZone = new Map();
  for (const item of items) {
    const list = itemsByZone.get(item.zone_id) || [];
    list.push(item);
    itemsByZone.set(item.zone_id, list);
  }

  const imageMap = await loadItemImages(items);
  const sortedItems = sortItemsForExport(items, zonesById);

  const content = [
    { text: palette?.nom || t("palette.title"), style: "title" },
    { text: t("palette.export.subtitle"), style: "subtitle", margin: [0, 4, 0, 0] },
    buildContactBlock(contact, t),
    buildSummaryTable(sortedItems, zonesById, t),
    { text: t("palette.export.zones_title"), style: "sectionTitle", margin: [0, 0, 0, 10] },
  ].filter(Boolean);

  for (const zone of zones) {
    content.push(buildZoneSection(zone, itemsByZone.get(zone.id) || [], imageMap, t));
  }

  content.push(buildProFooter(t));

  const docDefinition = {
    pageSize: "A4",
    pageMargins: [40, 44, 40, 48],
    content,
    styles: {
      title: { fontSize: 22, bold: true, color: FOREST },
      subtitle: { fontSize: 11, color: MUTED, italics: true },
      sectionTitle: { fontSize: 12, bold: true, color: FOREST, margin: [0, 0, 0, 8] },
      zoneTitle: { fontSize: 13, bold: true, color: "#2a4a38" },
      tableHeader: { bold: true, fontSize: 9, color: FOREST },
    },
    defaultStyle: {
      font: "Roboto",
      fontSize: 10,
      color: "#1a2e24",
    },
  };

  const filename = `${sanitizeFilename(palette?.nom)}-wilder.pdf`;

  return new Promise((resolve) => {
    try {
      pdfMake.createPdf(docDefinition).download(filename, () => {
        resolve({ ok: true });
      });
    } catch (error) {
      console.error("[Wilder] downloadPalettePdf:", error);
      resolve({ ok: false, error: error.message || "pdf_error" });
    }
  });
}
