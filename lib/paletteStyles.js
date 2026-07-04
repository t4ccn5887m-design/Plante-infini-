/** Catalogue des styles de jardin — zones suggérées (exposition DB, surface à définir par l'utilisateur). */

export const PALETTE_STYLES = [
  {
    id: "anglais",
    emoji: "🇬🇧",
    zones: [
      { key: "mixed_border", exposition: "mi-ombre" },
      { key: "flower_border", exposition: "soleil" },
      { key: "lawn", exposition: "soleil" },
    ],
  },
  {
    id: "francais",
    emoji: "🇫🇷",
    zones: [
      { key: "parterre", exposition: "soleil" },
      { key: "allee", exposition: "soleil" },
      { key: "topiaires", exposition: "soleil" },
    ],
  },
  {
    id: "mediterraneen",
    emoji: "☀️",
    zones: [
      { key: "full_sun_bed", exposition: "soleil" },
      { key: "dry_border", exposition: "soleil" },
      { key: "terrace", exposition: "soleil" },
    ],
  },
  {
    id: "japonais",
    emoji: "⛩️",
    zones: [
      { key: "mineral", exposition: "mi-ombre" },
      { key: "water", exposition: "mi-ombre" },
      { key: "shade_bed", exposition: "ombre" },
    ],
  },
  {
    id: "contemporain",
    emoji: "◻️",
    zones: [
      { key: "graphic_bed", exposition: "soleil" },
      { key: "grasses", exposition: "soleil" },
      { key: "terrace", exposition: "soleil" },
    ],
  },
];

export const PALETTE_STYLE_IDS = PALETTE_STYLES.map((s) => s.id);

export function getPaletteStyle(styleId) {
  return PALETTE_STYLES.find((s) => s.id === styleId) || null;
}

export function isValidPaletteStyleId(styleId) {
  return PALETTE_STYLE_IDS.includes(styleId);
}

/** Résout les libellés i18n → payloads prêts pour palette_zones. */
export function resolveStyleZones(styleId, t) {
  const style = getPaletteStyle(styleId);
  if (!style) return [];

  return style.zones.map((zone) => ({
    nom: t(`palette.style.${styleId}.zones.${zone.key}`),
    exposition: zone.exposition,
  }));
}
