/** Identifiant stable d'un coup de cœur pour l'analyse IA et le PDF. */
export function gardenCoupsAnalysisId(item) {
  const d = item?.discovery || {};
  if (d.catalogue_plant_id) return `v-${d.catalogue_plant_id}`;
  if (d.catalogue_mineral_id) return `m-${d.catalogue_mineral_id}`;
  if (d.catalogue_deco_id) return `a-${d.catalogue_deco_id}`;
  if (d.id) return `s-${d.id}`;
  if (item?.paletteItemId) return `p-${item.paletteItemId}`;
  return null;
}

export function buildPointFlagMap(points) {
  const map = new Map();
  if (!Array.isArray(points)) return map;
  for (const point of points) {
    const titre = (point?.titre || "").trim();
    for (const id of point?.ids || []) {
      if (id && titre) map.set(String(id), titre);
    }
  }
  return map;
}
