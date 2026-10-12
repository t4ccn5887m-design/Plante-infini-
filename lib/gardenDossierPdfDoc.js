/** Mise en page PDF « Dossier jardin » v2 — maquette sevya/10-pdf-dossier.html */

const GREEN = "#2F5E3F";
const GREEN_SOFT = "#E6F0E3";
const INK = "#1F2A22";
const MUTED = "#5B6359";
const LINE = "#E4DDD2";
const GREIGE = "#EFEAE2";
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

function buildLogoHeader(rightStack, font) {
  const logoMark = {
    table: {
      widths: [22],
      heights: [22],
      body: [[{ text: "", fillColor: GREEN }]],
    },
    layout: {
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0,
    },
  };

  return {
    columns: [
      {
        width: "*",
        columns: [
          logoMark,
          {
            width: "auto",
            text: "Sevya",
            font,
            fontSize: 18,
            bold: true,
            color: GREEN,
            margin: [8, 2, 0, 0],
          },
        ],
        columnGap: 0,
      },
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

/** Étape 2 IA — blocs lavande / ambre (masqués si pas de données). */
export function buildGardenAnalysisPdfBlocks(gardenAnalysis) {
  if (!gardenAnalysis?.profileSummary && !gardenAnalysis?.vigilanceItems?.length) {
    return [];
  }
  return [];
}

function buildSynthèsePage(params, font) {
  const { clientContact, dateLabel, ambianceName, intention, terrainStats, gardenAnalysis } = params;
  const fullName = [clientContact?.firstName, clientContact?.lastName].filter(Boolean).join(" ").trim();

  const blocks = [
    buildLogoHeader(
      [
        { text: "Dossier jardin", fontSize: 10, color: MUTED, alignment: "right" },
        { text: `préparé le ${dateLabel}`, fontSize: 10, color: MUTED, alignment: "right" },
      ],
      font
    ),
    horizontalRule(),
    {
      columns: [
        {
          width: "*",
          stack: [
            eyebrow("Client"),
            { text: fullName || "—", fontSize: 24, bold: true, color: INK, margin: [0, 0, 0, 0] },
            {
              text: clientMetaLine(clientContact) || "—",
              fontSize: 11,
              color: MUTED,
              margin: [0, 6, 0, 0],
            },
          ],
        },
        ambianceName
          ? {
              width: "auto",
              table: {
                body: [
                  [
                    {
                      text: `Ambiance : ${ambianceName}`,
                      color: GREEN,
                      bold: true,
                      fontSize: 11,
                      fillColor: GREEN_SOFT,
                      margin: [12, 8, 12, 8],
                    },
                  ],
                ],
              },
              layout: "noBorders",
            }
          : { width: 0, text: "" },
      ],
      columnGap: 12,
      margin: [0, 4, 0, 14],
    },
    buildStatsBand(terrainStats),
    buildQuoteBlock(intention),
    ...buildGardenAnalysisPdfBlocks(gardenAnalysis),
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
  return Boolean(
    photos.length || s.surfaceLabel || s.utilitiesLabel || s.orientationLabel || s.accessLabel
  );
}

function buildTerrainPage(params, font) {
  const { clientContact, terrainPhotoDataUrls, terrainStats } = params;
  const fullName = [clientContact?.firstName, clientContact?.lastName].filter(Boolean).join(" ").trim();
  const cityShort = [clientContact?.city, clientContact?.postalCode ? `(${clientContact.postalCode})` : ""]
    .filter(Boolean)
    .join(" ");
  const photos = (terrainPhotoDataUrls || []).filter(Boolean);
  const s = terrainStats || {};

  return [
    buildLogoHeader([{ text: `${fullName}${cityShort ? ` · ${cityShort}` : ""}`, fontSize: 10, color: MUTED }], font),
    horizontalRule(),
    {
      columns: [
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
        widths: ["*", "*", "*", "*"],
        body: [
          [
            factCell("Surface", s.surfaceLabel, !s.surfaceLabel),
            factCell("Eau / électricité", s.utilitiesLabel, !s.utilitiesLabel),
            factCell("Orientation", s.orientationLabel, !s.orientationLabel),
            factCell("Accès engins", s.accessLabel || null, !s.accessLabel, "Non renseigné"),
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

function coupCard(item, tileSize) {
  const imgSrc = item.image || placeholderImage(item.pdfKind || "vegetal");
  return {
    stack: [
      imgSrc
        ? { image: imgSrc, width: tileSize, height: tileSize, borderRadius: 8 }
        : { text: "", margin: [0, tileSize, 0, 0] },
      { text: item.nom || "—", fontSize: 9, bold: true, margin: [0, 5, 0, 0], lineHeight: 1.2 },
      item.categoryLabel
        ? { text: item.categoryLabel, fontSize: 8, color: MUTED, bold: true, margin: [0, 1, 0, 0] }
        : null,
    ].filter(Boolean),
    margin: [0, 0, 6, 8],
  };
}

function buildCoupsGroup(group, tileSize) {
  const rows = [];
  for (let i = 0; i < group.items.length; i += 6) {
    const slice = group.items.slice(i, i + 6);
    const row = slice.map((it) => coupCard(it, tileSize));
    while (row.length < 6) row.push({ text: "" });
    rows.push(row);
  }

  return {
    stack: [
      {
        columns: [
          { text: group.title, fontSize: 11, bold: true, color: GREEN, width: "auto" },
          {
            width: "auto",
            table: {
              body: [
                [
                  {
                    text: String(group.items.length),
                    fontSize: 9,
                    bold: true,
                    color: GREEN,
                    fillColor: GREEN_SOFT,
                    margin: [6, 2, 6, 2],
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
      },
      {
        table: {
          widths: Array(6).fill(tileSize + 2),
          body: rows,
        },
        layout: "noBorders",
      },
    ],
    margin: [0, 0, 0, 10],
  };
}

function buildCoupsPage(params, font) {
  const groups = params.coupsGroups || [];
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  if (!total) return [];

  const fullName = [params.clientContact?.firstName, params.clientContact?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const cityShort = [params.clientContact?.city, params.clientContact?.postalCode ? `(${params.clientContact.postalCode})` : ""]
    .filter(Boolean)
    .join(" ");

  const tileSize = Math.floor((CONTENT_WIDTH - 5 * 6) / 6);

  return [
    buildLogoHeader([{ text: `${fullName}${cityShort ? ` · ${cityShort}` : ""}`, fontSize: 10, color: MUTED }], font),
    horizontalRule(),
    {
      columns: [
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
  ];
}

export function buildGardenDossierDocDefinition(params, font = "Roboto") {
  const content = [...buildSynthèsePage(params, font)];

  if (hasTerrainPage(params)) {
    content.push({ text: "", pageBreak: "before" });
    content.push(...buildTerrainPage(params, font));
  }

  const coupsBlocks = buildCoupsPage(params, font);
  if (coupsBlocks.length) {
    content.push({ text: "", pageBreak: "before" });
    content.push(...coupsBlocks);
  }

  return {
    pageSize: "A4",
    pageMargins: [56, 48, 56, 52],
    content,
    footer(currentPage, pageCount) {
      return {
        margin: [56, 8, 56, 24],
        columns: [
          { text: "Préparé avec Sevya · sevya.app", fontSize: 9, color: MUTED, width: "*" },
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
