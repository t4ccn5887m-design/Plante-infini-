/** Arbre ou arbuste avec estimation d'âge visible. */
export function isTreeLikeAnalysis(data) {
  if (!data) return false;
  if (data.type === "arbre") return true;
  const age = data.age_approximatif;
  if (age == null || age === "") return false;
  return String(age).trim().length > 0;
}

export function parseDiameterCm(value) {
  if (value == null || value === "") return null;
  const n = Number(String(value).replace(",", ".").trim());
  if (!Number.isFinite(n) || n <= 0 || n > 2000) return null;
  return Math.round(n * 10) / 10;
}
