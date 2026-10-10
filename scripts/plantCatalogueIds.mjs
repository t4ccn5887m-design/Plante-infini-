/**
 * Résolution id catalogue (app) ↔ entrée JSON — même logique que lib/cataloguePlants.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..");

export const LEGACY_JSON_ID_LINKS = {
  "photinia-red-robin": "photinia",
  "geranium-rozanne": "geranium-vivace",
};

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

let legacyCache = null;

export async function getLegacyPlants() {
  if (legacyCache) return legacyCache;
  const mod = await import(pathToFileURL(path.join(ROOT, "lib/legacyCataloguePlants.js")).href);
  legacyCache = mod.LEGACY_CATALOGUE_PLANTS;
  return legacyCache;
}

export async function resolveCatalogueIdForJsonRow(row, legacyPlants) {
  const legacyByNom = new Map();
  const legacyByLatin = new Map();
  for (const p of legacyPlants) {
    legacyByNom.set(normalizeKey(p.nom), p);
    if (p.nom_latin) legacyByLatin.set(normalizeKey(p.nom_latin), p);
  }

  const jsonIdToLegacyId = new Map(
    Object.entries(LEGACY_JSON_ID_LINKS).map(([legacyId, jsonId]) => [jsonId, legacyId])
  );

  const linkedLegacyId = jsonIdToLegacyId.get(row.id);
  if (linkedLegacyId) return linkedLegacyId;

  const byNom = legacyByNom.get(normalizeKey(row.nom));
  const byLatin = row.nom_latin ? legacyByLatin.get(normalizeKey(row.nom_latin)) : null;
  const legacy = byNom || byLatin;
  return legacy ? legacy.id : row.id;
}

export function loadCatalogueJson() {
  const raw = fs.readFileSync(path.join(ROOT, "sevya/catalogue-vegetal.json"), "utf8");
  return JSON.parse(raw);
}

export async function listCataloguePlantsForScripts() {
  const rows = loadCatalogueJson();
  const legacy = await getLegacyPlants();
  return Promise.all(
    rows.map(async (row) => ({
      catalogueId: await resolveCatalogueIdForJsonRow(row, legacy),
      jsonId: row.id,
      nom: row.nom,
      nom_latin: row.nom_latin || "",
      categorie: row.categorie || "",
      row,
    }))
  );
}

export function loadEnvLocal() {
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) return {};
  const out = {};
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return out;
}
