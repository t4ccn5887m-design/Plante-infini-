/** Types végétaux éligibles dans une palette. */
export const PALETTE_PLANT_TYPES = new Set([
  "arbre",
  "fleur",
  "plante",
  "mauvaise_herbe",
  "fruit",
  "legume",
  "champignon",
]);

export function isPaletteEligiblePlant(discovery) {
  return PALETTE_PLANT_TYPES.has(discovery?.type);
}

/** Proposition type palette_items selon la catégorie scan. */
export function inferPaletteItemType(discovery) {
  if (discovery?.type === "arbre") return "sujet";
  return "massif";
}

export function defaultQuantityForType(type) {
  return type === "sujet" ? 1 : null;
}

export function normalizePaletteItemPayload({ type, quantite, note }) {
  const normalizedType = type === "sujet" ? "sujet" : "massif";
  let normalizedQty = null;

  if (normalizedType === "sujet") {
    const n = Number(quantite);
    if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) {
      return { ok: false, error: "invalid_quantity" };
    }
    normalizedQty = n;
  }

  const trimmedNote = note == null ? null : String(note).trim() || null;

  return {
    ok: true,
    data: {
      type: normalizedType,
      quantite: normalizedQty,
      note: trimmedNote,
    },
  };
}
