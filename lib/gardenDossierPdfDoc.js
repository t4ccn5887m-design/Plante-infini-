/** Mise en page PDF « Dossier jardin » — maquette sevya/16-pdf-atelier.html */

import { buildBriefDetailsPdfBlocks } from "@/lib/gardenDossierPdfDetails";

const ATELIER_DARK = "#0F1A14";
const ATELIER_PAPER = "#F7F4EE";
const GREEN = "#1F3A2B";
const GREEN_SOFT = "#E6F0E3";
const INK = "#16201A";
const MUTED = "#5B6359";
const LINE = "#D8D0C4";
const GREIGE = "#EFEAE2";
const COVER_INK = "#F1ECE2";
const COVER_MUTE = "#A9B3A6";
const LAV = "#ECE6F5";
const LAV_INK = "#7A67A6";
const AMBER = "#F6E7D8";
const AMBER_INK = "#B4632A";

const CONTENT_WIDTH = 483;

const PLACEHOLDER_CACHE = {};

function placeholderImage(pdfKind) {
  if (typeof document === "undefined") return null;
  if (PLACEHOLDER_CACHE[pdfKind]) return PLACEHOLDER_CACHE[pdfKind];

  const fills = { vegetal: GREEN_SOFT, mineral: "#E7E4DF", amenagement: AMBER };
  const strokes = { vegetal: "#4E7B52", mineral: "#6E6A63", amenagement: AMBER_INK };
  const canvas = document.createElement("canvas");
  canvas.width = 96;
  canvas.height = 96;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = fills[pdfKind] || GREIGE;
  ctx.fillRect(0, 0, 96, 96);
  ctx.strokeStyle = strokes[pdfKind] || MUTED;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  if (pdfKind === "mineral") {
    ctx.moveTo(20, 70);
    ctx.lineTo(38, 28);
    ctx.lineTo(58, 48);
    ctx.lineTo(76, 22);
    ctx.lineTo(88, 70);
    ctx.closePath();
  } else if (pdfKind === "amenagement") {
    ctx.strokeRect(28, 28, 40, 40);
    ctx.moveTo(48, 28);
    ctx.lineTo(48, 68);
    ctx.moveTo(28, 48);
    ctx.lineTo(68, 48);
  } else {
    ctx.moveTo(48, 18);
    ctx.bezierCurveTo(62, 30, 72, 48, 48, 78);
    ctx.bezierCurveTo(24, 48, 34, 30, 48, 18);
    ctx.moveTo(22, 78);
    ctx.quadraticCurveTo(36, 62, 48, 58);
  }
  ctx.stroke();
  const url = canvas.toDataURL("image/jpeg", 0.82);
  PLACEHOLDER_CACHE[pdfKind] = url;
  return url;
}

function eyebrow(text) {
  return {
    text,
    fontSize: 9,
    bold: true,
    characterSpacing: 1.2,
    color: MUTED,
    margin: [0, 0, 0, 4],
  };
}

function horizontalRule() {
  return {
    canvas: [{ type: "line", x1: 0, y1: 0, x2: CONTENT_WIDTH, y2: 0, lineWidth: 1.2, lineColor: LINE }],
    margin: [0, 0, 0, 14],
  };
}

function buildLogoHeader(rightStack, font, brandLogos) {
  const sym = brandLogos?.symboleClair;
  const logoCol = sym
    ? {
        width: "auto",
        columns: [
          { image: sym, width: 16, height: 16, margin: [0, 1, 8, 0] },
          {
            width: "auto",
            text: "Sevya",
            font,
            fontSize: 14,
            bold: true,
            color: GREEN,
            margin: [0, 0, 0, 0],
          },
        ],
      }
    : {
        width: "auto",
        text: "Sevya",
        font,
        fontSize: 14,
        bold: true,
        color: GREEN,
      };

  return {
    columns: [
      logoCol,
      { width: "*", text: "" },
      {
        width: "auto",
        stack: rightStack,
        alignment: "right",
      },
    ],
    margin: [0, 0, 0, 12],
  };
}

function clientMetaLine(contact) {
  const cityPart = [contact?.city, contact?.postalCode ? `(${contact.postalCode})` : ""]
    .filter(Boolean)
    .join(" ")
    .trim();
  const parts = [cityPart, contact?.phone?.trim(), contact?.email?.trim()].filter(Boolean);
  return parts.join(" · ");
}

function statCell(label, value) {
  return {
    stack: [
      { text: label, fontSize: 9, bold: true, color: MUTED },
      { text: value || "—", fontSize: 16, bold: true, color: GREEN, margin: [0, 3, 0, 0] },
    ],
    margin: [12, 10, 12, 10],
  };
}

function buildStatsBand(terrainStats) {
  const stats = terrainStats || {};
  return {
    table: {
      widths: ["*", "*", "*", "*"],
      body: [
        [
          statCell("Surface", stats.surfaceLabel || "—"),
          statCell("Budget indicatif", stats.budgetLabel || "—"),
          statCell("Calendrier", stats.timelineLabel || "—"),
          statCell("Eau / électricité", stats.utilitiesLabel || "—"),
        ],
      ],
    },
    layout: {
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      fillColor: () => GREIGE,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0,
    },
    margin: [0, 0, 0, 14],
  };
}

function buildQuoteBlock(intention) {
  const text = (intention || "").trim();
  if (!text) return null;
  return {
    table: {
      widths: [4, "*"],
      body: [
        [
          { text: "", fillColor: GREEN, border: [false, false, false, false] },
          {
            stack: [
              eyebrow("En ses mots"),
              {
                text: `« ${text} »`,
                fontSize: 15,
                lineHeight: 1.45,
                color: INK,
                margin: [0, 2, 0, 0],
              },
            ],
            fillColor: "#FAF8F4",
            margin: [14, 14, 16, 14],
          },
        ],
      ],
    },
    layout: {
      hLineWidth: () => 0,
      vLineWidth: (i) => (i === 0 ? 0 : 0),
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0,
    },
    margin: [0, 0, 0, 14],
  };
}

function lavandeKv(label, value) {
  return {
    stack: [
      {
        text: label,
        fontSize: 9,
        bold: true,
        characterSpacing: 0.6,
        color: GREEN,
        margin: [0, 0, 0, 2],
      },
      { text: value, fontSize: 11, lineHeight: 1.42, color: INK },
    ],
    margin: [0, 0, 0, 8],
  };
}

function analysisPanel({ title, subtitle, titleColor, bodyStack }) {
  return {
    table: {
      widths: ["*"],
      body: [
        [
          {
            stack: [
              { text: title, fontSize: 12, bold: true, color: titleColor || INK, margin: [0, 0, 0, 2] },
              { text: subtitle, fontSize: 9, bold: true, color: MUTED, margin: [0, 0, 0, 10] },
              ...bodyStack,
            ],
            margin: [12, 12, 12, 12],
          },
        ],
      ],
    },
    layout: {
      hLineWidth: () => 0.8,
      vLineWidth: () => 0.8,
      hLineColor: () => LINE,
      vLineColor: () => LINE,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0,
    },
  };
}

/** Étape 2 IA — blocs lavande / ambre (masqués si pas de données). */
export function buildGardenAnalysisPdfBlocks(gardenAnalysis) {
  const style = gardenAnalysis?.profil?.style?.trim();
  if (!style) return [];

  const profil = gardenAnalysis.profil;
  const points = Array.isArray(gardenAnalysis.points) ? gardenAnalysis.points : [];
  const hasPoints = points.length > 0;

  const profilBody = [
    lavandeKv("Style", profil.style),
    profil.aime ? lavandeKv("Ce qu'il aime", profil.aime) : null,
    profil.priorites?.length
      ? {
          stack: [
            {
              text: "Priorités",
              fontSize: 9,
              bold: true,
              characterSpacing: 0.6,
              color: LAV_INK,
              margin: [0, 0, 0, 4],
            },
            {
              ol: profil.priorites.map((p) => ({ text: p, fontSize: 11, bold: true, lineHeight: 1.45 })),
              margin: [0, 0, 0, 0],
            },
          ],
        }
      : null,
  ].filter(Boolean);

  const profilPanel = analysisPanel({
    title: "Son profil jardin",
    subtitle: "Déduit par Sevya de ses choix",
    titleColor: INK,
    bodyStack: profilBody,
  });

  if (!hasPoints) {
    return [{ ...profilPanel, margin: [0, 0, 0, 14] }];
  }

  const vigItems = points.map((p) => ({
    columns: [
      {
        width: 6,
        canvas: [{ type: "ellipse", x: 0, y: 4, r1: 3, r2: 3, color: AMBER_INK }],
        margin: [0, 0, 4, 0],
      },
      {
        width: "*",
        text: [
          { text: `${p.titre} : `, bold: true, fontSize: 11 },
          { text: p.texte, fontSize: 11 },
        ],
        lineHeight: 1.42,
      },
    ],
    margin: [0, 0, 0, 7],
  }));

  const pointsPanel = analysisPanel({
    title: "Points à aborder au RDV",
    subtitle: "Repérés par Sevya dans vos choix",
    titleColor: AMBER_INK,
    bodyStack: vigItems,
  });

  return [
    {
      columns: [
        { width: "*", ...profilPanel },
        { width: "*", ...pointsPanel },
      ],
      columnGap: 14,
      margin: [0, 0, 0, 14],
    },
  ];
}

function buildCoverPage(params, font) {
  const { clientContact, dateLabel, ambianceName, terrainStats, brandLogos, terrainPhotoDataUrls } =
    params;
  const fullName = [clientContact?.firstName, clientContact?.lastName].filter(Boolean).join(" ").trim();
  const cityPart = [clientContact?.city, clientContact?.postalCode ? `(${clientContact.postalCode})` : ""]
    .filter(Boolean)
    .join(" ");
  const stats = terrainStats || {};
  const hero = (terrainPhotoDataUrls || []).filter(Boolean)[0];

  const stack = [];
  if (hero) {
    stack.push({
      image: hero,
      width: CONTENT_WIDTH,
      height: 200,
      margin: [0, 0, 0, 16],
    });
  }
  if (brandLogos?.sceauBlanc) {
    stack.push({ image: brandLogos.sceauBlanc, width: 72, height: 72, margin: [0, 0, 0, 12] });
  }
  stack.push({
    text: `Dossier jardin · ${dateLabel}`,
    fontSize: 9,
    color: COVER_MUTE,
    characterSpacing: 1,
    margin: [0, 0, 0, 10],
  });
  if (cityPart) {
    stack.push({
      text: `Projet · ${cityPart}`,
      fontSize: 9,
      color: COVER_MUTE,
      margin: [0, 0, 0, 6],
    });
  }
  stack.push({
    text: fullName ? `Le jardin\nde ${fullName}` : "Le jardin",
    font,
    fontSize: 34,
    color: COVER_INK,
    lineHeight: 1.05,
    margin: [0, 0, 0, 16],
  });
  stack.push({
    columns: [
      { width: "*", stack: [coverMeta("Surface", stats.surfaceLabel)] },
      { width: "*", stack: [coverMeta("Budget", stats.budgetLabel)] },
      { width: "*", stack: [coverMeta("Calendrier", stats.timelineLabel)] },
      { width: "*", stack: [coverMeta("Ambiance", ambianceName || "—")] },
    ],
    columnGap: 8,
    margin: [0, 0, 0, 14],
  });
  const who = clientMetaLine(clientContact);
  if (who) {
    stack.push({ text: who, fontSize: 11, color: COVER_MUTE });
  }
  return stack;
}

function coverMeta(label, value) {
  return {
    stack: [
      { text: label, fontSize: 8, color: COVER_MUTE, characterSpacing: 1.2, margin: [0, 0, 0, 3] },
      { text: value || "—", fontSize: 13, bold: true, color: COVER_INK },
    ],
  };
}

function buildSynthèsePage(params, font) {
  const { clientContact, intention, gardenAnalysis, brandLogos, briefDetails } = params;
  const fullName = [clientContact?.firstName, clientContact?.lastName].filter(Boolean).join(" ").trim();
  const cityShort = [clientContact?.city, clientContact?.postalCode ? `(${clientContact.postalCode})` : ""]
    .filter(Boolean)
    .join(" ");

  const blocks = [
    buildLogoHeader(
      [{ text: `${fullName}${cityShort ? ` · ${cityShort}` : ""}`, fontSize: 10, color: MUTED }],
      font,
      brandLogos
    ),
    horizontalRule(),
    {
      columns: [
        { text: "01", width: 28, fontSize: 11, color: "#9A8F7E", margin: [0, 4, 0, 0] },
        { text: "En ses mots", width: "*", fontSize: 20, bold: true, color: INK },
      ],
      margin: [0, 8, 0, 6],
    },
    buildQuoteBlock(intention),
    ...buildGardenAnalysisPdfBlocks(gardenAnalysis),
    ...buildBriefDetailsPdfBlocks(briefDetails),
  ].filter(Boolean);

  return blocks;
}

function factCell(label, value, missing, missingLabel = "Non renseignée") {
  const display = value?.trim() || missingLabel;
  const isMissing = missing || !value?.trim();
  return {
    stack: [
      { text: label, fontSize: 9, bold: true, color: MUTED },
      {
        text: display,
        fontSize: 11,
        bold: true,
        color: isMissing ? AMBER_INK : INK,
        margin: [0, 2, 0, 0],
      },
    ],
    margin: [8, 8, 8, 8],
  };
}

function buildTerrainPhotos(photos) {
  const list = (photos || []).filter(Boolean);
  if (!list.length) return null;

  const colGap = 8;
  const halfW = (CONTENT_WIDTH - colGap) / 2;
  const body = [];

  if (list.length === 1) {
    return {
      stack: [{ image: list[0], width: CONTENT_WIDTH, height: 175, borderRadius: 10 }],
      margin: [0, 0, 0, 12],
    };
  }

  body.push([
    {
      colSpan: 2,
      image: list[0],
      width: CONTENT_WIDTH,
      height: 175,
      borderRadius: 10,
    },
    {},
  ]);

  for (let i = 1; i < list.length; i += 2) {
    const left = list[i];
    const right = list[i + 1];
    body.push([
      left
        ? { image: left, width: halfW, height: 150, borderRadius: 10, margin: [0, 0, colGap / 2, 0] }
        : { text: "" },
      right ? { image: right, width: halfW, height: 150, borderRadius: 10 } : { text: "" },
    ]);
  }

  return {
    table: {
      widths: [halfW, halfW],
      body,
    },
    layout: "noBorders",
    margin: [0, 0, 0, 12],
  };
}

function hasTerrainPage(params) {
  const photos = (params.terrainPhotoDataUrls || []).filter(Boolean);
  const s = params.terrainStats || {};
  const ex = params.briefDetails?.existing || {};
  return Boolean(
    photos.length ||
      s.surfaceLabel ||
      s.utilitiesLabel ||
      s.orientationLabel ||
      s.accessLabel ||
      ex.soil ||
      ex.slope ||
      ex.keep?.trim() ||
      ex.remove?.trim()
  );
}

function buildTerrainPage(params, font) {
  const { clientContact, terrainPhotoDataUrls, terrainStats, brandLogos, briefDetails } = params;
  const fullName = [clientContact?.firstName, clientContact?.lastName].filter(Boolean).join(" ").trim();
  const cityShort = [clientContact?.city, clientContact?.postalCode ? `(${clientContact.postalCode})` : ""]
    .filter(Boolean)
    .join(" ");
  const photos = (terrainPhotoDataUrls || []).filter(Boolean);
  const s = terrainStats || {};
  const ex = briefDetails?.existing || {};

  return [
    buildLogoHeader(
      [{ text: `${fullName}${cityShort ? ` · ${cityShort}` : ""}`, fontSize: 10, color: MUTED }],
      font,
      brandLogos
    ),
    horizontalRule(),
    {
      columns: [
        { text: "06", width: 28, fontSize: 11, color: "#9A8F7E", margin: [0, 4, 0, 0] },
        { text: "Le terrain", fontSize: 18, bold: true, color: INK, width: "*" },
        {
          width: "auto",
          text: photos.length
            ? `${photos.length} photo${photos.length > 1 ? "s" : ""} envoyée${photos.length > 1 ? "s" : ""} par le client`
            : "",
          fontSize: 10,
          color: MUTED,
          alignment: "right",
          margin: [0, 6, 0, 0],
        },
      ],
      margin: [0, 6, 0, 10],
    },
    buildTerrainPhotos(photos),
    {
      table: {
        widths: ["*", "*", "*"],
        body: [
          [
            factCell("Surface", s.surfaceLabel, !s.surfaceLabel),
            factCell("Eau / électricité", s.utilitiesLabel, !s.utilitiesLabel),
            factCell("Orientation", s.orientationLabel || ex.orientation, !(s.orientationLabel || ex.orientation)),
          ],
          [
            factCell("Sol", ex.soil, !ex.soil),
            factCell("Pente", ex.slope, !ex.slope),
            factCell("À garder", ex.keep, !ex.keep?.trim(), "—"),
          ],
          [
            factCell("À enlever", ex.remove, !ex.remove?.trim(), "—"),
            factCell("Accès engins", s.accessLabel || null, !s.accessLabel, "Non renseigné"),
            { text: "", border: [false, false, false, false] },
          ],
        ],
      },
      layout: {
        hLineWidth: () => 1,
        vLineWidth: () => 1,
        hLineColor: () => LINE,
        vLineColor: () => LINE,
        paddingLeft: () => 0,
        paddingRight: () => 0,
        paddingTop: () => 0,
        paddingBottom: () => 0,
      },
    },
  ];
}

function coupImageCell(item, tileSize) {
  const imgSrc = item.image || placeholderImage(item.pdfKind || "vegetal");
  const flagged = Boolean(item.pointLabel);
  const inner = imgSrc
    ? { image: imgSrc, width: tileSize - (flagged ? 4 : 0), height: tileSize - (flagged ? 4 : 0) }
    : { text: "", margin: [0, tileSize, 0, 0] };

  if (!flagged) {
    return inner;
  }

  return {
    table: {
      widths: [tileSize],
      heights: [tileSize],
      body: [[inner]],
    },
    layout: {
      hLineWidth: () => 2.5,
      vLineWidth: () => 2.5,
      hLineColor: () => AMBER_INK,
      vLineColor: () => AMBER_INK,
      paddingLeft: () => 1,
      paddingRight: () => 1,
      paddingTop: () => 1,
      paddingBottom: () => 1,
    },
  };
}

function coupCard(item, tileSize) {
  return {
    stack: [
      coupImageCell(item, tileSize),
      { text: item.nom || "—", fontSize: 9, bold: true, margin: [0, 5, 0, 0], lineHeight: 1.2 },
      item.pointLabel
        ? { text: item.pointLabel, fontSize: 8, color: AMBER_INK, bold: true, margin: [0, 1, 0, 0], lineHeight: 1.15 }
        : null,
      item.categoryLabel
        ? {
            text: item.categoryLabel,
            fontSize: 8,
            color: item.pointLabel ? MUTED : MUTED,
            bold: true,
            margin: [0, 1, 0, 0],
          }
        : null,
    ].filter(Boolean),
    margin: [0, 0, 6, 8],
  };
}

function buildCoupsGroup(group, tileSize) {
  const rowBlocks = [];
  for (let i = 0; i < group.items.length; i += 6) {
    const slice = group.items.slice(i, i + 6);
    const row = slice.map((it) => coupCard(it, tileSize));
    while (row.length < 6) row.push({ text: "" });
    rowBlocks.push({
      unbreakable: true,
      table: {
        widths: Array(6).fill(tileSize + 2),
        body: [row],
      },
      layout: "noBorders",
      margin: [0, 0, 0, i + 6 >= group.items.length ? 0 : 4],
    });
  }

  const header = {
    columns: [
      { text: group.title, fontSize: 11, bold: true, color: GREEN, width: "auto", noWrap: true },
      {
        width: "auto",
        table: {
          widths: [Math.max(22, String(group.items.length).length * 7 + 14)],
          body: [
            [
              {
                text: String(group.items.length),
                fontSize: 9,
                bold: true,
                color: GREEN,
                fillColor: GREEN_SOFT,
                alignment: "center",
                noWrap: true,
                margin: [0, 2, 0, 2],
              },
            ],
          ],
        },
        layout: "noBorders",
        margin: [6, 0, 0, 0],
      },
    ],
    columnGap: 4,
    margin: [0, 0, 0, 8],
  };

  const stack = [];
  if (rowBlocks.length) {
    stack.push({ unbreakable: true, stack: [header, rowBlocks[0]] });
    stack.push(...rowBlocks.slice(1));
  } else {
    stack.push(header);
  }

  return {
    stack,
    margin: [0, 0, 0, 10],
  };
}

function buildCoupsLegend(hasFlagged) {
  if (!hasFlagged) return null;
  return {
    columns: [
      {
        width: 11,
        canvas: [
          {
            type: "rect",
            x: 0,
            y: 1,
            w: 9,
            h: 9,
            r: 2,
            lineColor: AMBER_INK,
            lineWidth: 2,
          },
        ],
        margin: [0, 0, 6, 0],
      },
      {
        width: "*",
        text: "▢ = lié à un point à discuter (page 1)",
        fontSize: 10,
        bold: true,
        color: MUTED,
      },
    ],
    margin: [0, 0, 0, 12],
  };
}

function buildCoupsPage(params, font) {
  const groups = params.coupsGroups || [];
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  if (!total) return [];

  const hasFlagged = groups.some((g) => g.items.some((it) => it.pointLabel));
  const { brandLogos } = params;

  const fullName = [params.clientContact?.firstName, params.clientContact?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const cityShort = [params.clientContact?.city, params.clientContact?.postalCode ? `(${params.clientContact.postalCode})` : ""]
    .filter(Boolean)
    .join(" ");

  const tileSize = Math.floor((CONTENT_WIDTH - 5 * 6) / 6);

  return [
    buildLogoHeader(
      [{ text: `${fullName}${cityShort ? ` · ${cityShort}` : ""}`, fontSize: 10, color: MUTED }],
      font,
      brandLogos
    ),
    horizontalRule(),
    buildCoupsLegend(hasFlagged),
    {
      columns: [
        { text: "07", width: 28, fontSize: 11, color: "#9A8F7E", margin: [0, 4, 0, 0] },
        { text: "Ses coups de cœur", fontSize: 18, bold: true, color: INK, width: "*" },
        {
          width: "auto",
          text: `${total} élément${total > 1 ? "s" : ""}`,
          fontSize: 10,
          color: MUTED,
          alignment: "right",
          margin: [0, 6, 0, 0],
        },
      ],
      margin: [0, 6, 0, 12],
    },
    ...groups.map((g) => buildCoupsGroup(g, tileSize)),
  ].filter(Boolean);
}

export function buildGardenDossierDocDefinition(params, font = "Roboto") {
  const content = [...buildCoverPage(params, font), { text: "", pageBreak: "after" }, ...buildSynthèsePage(params, font)];

  if (hasTerrainPage(params)) {
    content.push({ text: "", pageBreak: "before" });
    content.push(...buildTerrainPage(params, font));
  }

  const coupsBlocks = buildCoupsPage(params, font);
  if (coupsBlocks.length) {
    content.push({ text: "", pageBreak: "before" });
    content.push(...coupsBlocks);
  }

  const sym = params.brandLogos?.symboleClair;

  return {
    pageSize: "A4",
    pageMargins: [56, 48, 56, 52],
    background(currentPage) {
      const color = currentPage === 1 ? ATELIER_DARK : ATELIER_PAPER;
      return {
        canvas: [
          {
            type: "rect",
            x: 0,
            y: 0,
            w: 595.28,
            h: 841.89,
            color,
          },
        ],
      };
    },
    content,
    footer(currentPage, pageCount) {
      if (currentPage === 1) return null;
      const footLeft = sym
        ? {
            columns: [
              { image: sym, width: 14, height: 14, margin: [0, 0, 6, 0] },
              { text: "Préparé avec Sevya · sevya.app", fontSize: 9, color: MUTED, width: "*" },
            ],
            columnGap: 0,
            width: "*",
          }
        : { text: "Préparé avec Sevya · sevya.app", fontSize: 9, color: MUTED, width: "*" };

      return {
        margin: [56, 8, 56, 24],
        columns: [
          footLeft,
          {
            text: `${currentPage} / ${pageCount}`,
            fontSize: 9,
            color: MUTED,
            alignment: "right",
            width: "auto",
          },
        ],
      };
    },
    defaultStyle: {
      font,
      fontSize: 10,
      color: INK,
      lineHeight: 1.35,
    },
    styles: {
      muted: { color: MUTED },
    },
  };
}
