/** Filtres communs — plante entière, pas de gros plan / herbier. */

export const MACRO_TITLE_KEYWORDS = [
  "flower",
  "leaf",
  "macro",
  "detail",
  "close-up",
  "closeup",
  "petal",
  "bokeh",
  "herbarium",
  "illustration",
  "drawing",
  "specimen",
  "fleur",
  "feuille",
  "détail",
  "detail",
];

export const MIN_IMAGE_WIDTH = 800;
export const MAX_CANDIDATES = 8;
export const DELAY_MS = 1100;

export const WIKIMEDIA_USER_AGENT =
  "SevyaCatalogue/1.0 (contact : emilien.gaillard9@gmail.com)";

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function stripHtml(html) {
  if (!html) return "";
  return String(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function textLooksLikeMacro(...parts) {
  const blob = parts
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return MACRO_TITLE_KEYWORDS.some((kw) => blob.includes(kw.toLowerCase()));
}

/**
 * Licences Wikimedia acceptées : CC0, domaine public, CC BY*, CC BY-SA*.
 * Rejette NC, ND, GFDL seul, licence absente ou ambiguë.
 */
export function isWikimediaLicenseAccepted(licenseShortName, licenseUrl) {
  const name = String(licenseShortName || "").trim();
  const url = String(licenseUrl || "").trim();
  if (!name && !url) return false;

  const combined = `${name} ${url}`.toLowerCase();

  if (/\bnc\b|non-?commercial|no derivatives|\bnd\b/.test(combined)) return false;

  if (/cc0|cc zero|public domain|\bpd\b|domaine public/.test(combined)) return true;

  if (/cc by-sa|cc-by-sa|by-sa|by sa|creativecommons.org\/licenses\/by-sa/.test(combined)) {
    return !/\bnc\b|\bnd\b/.test(combined);
  }

  if (/cc by|cc-by|creativecommons.org\/licenses\/by[^-]|creativecommons.org\/licenses\/by$/.test(combined)) {
    return !/\bnc\b|\bnd\b/.test(combined);
  }

  if (/gfdl/.test(combined) && !/cc by|cc-by|cc0|public domain/.test(combined)) {
    return false;
  }

  return false;
}

export function pixabayTagsLookLikeMacro(tags) {
  const blob = Array.isArray(tags) ? tags.join(" ") : String(tags || "");
  return textLooksLikeMacro(blob);
}

export function candidateKey(candidate) {
  if (candidate.source === "Pixabay" && candidate.pixabayId != null) {
    return `px:${candidate.pixabayId}`;
  }
  if (candidate.wikimediaTitle) return `wm:${candidate.wikimediaTitle}`;
  return `url:${candidate.pageUrl || candidate.hdUrl}`;
}
