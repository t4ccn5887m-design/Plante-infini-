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

export const MINERAL_LEGACY_JSON_ID_LINKS = {
  "dalles-travertin": "travertin",
  "bordure-acier-corten": "bordure-en-acier-corten",
  "gravier-blanc": "gravier-de-marbre-blanc",
  "galet-riviere": "galets-roules",
  "pas-japonais-gres": "pas-japonais-en-pierre-naturelle",
  "ardoise-concassee": "paillage-d-ardoise",
  "rocher-ardoise": "rochers-decoratifs",
};

export const AMENAGEMENT_LEGACY_JSON_ID_LINKS = {
  "claustra-bois": "claustra-en-bois",
  "pot-terre-cuite": "pots-en-terre-cuite",
  "borne-solaire": "balisage-solaire",
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

export function loadCatalogueJson(univers = "vegetal") {
  const file =
    univers === "mineral"
      ? "sevya/catalogue-mineral.json"
      : univers === "amenagements"
        ? "sevya/catalogue-amenagements.json"
        : "sevya/catalogue-vegetal.json";
  const raw = fs.readFileSync(path.join(ROOT, file), "utf8");
  return JSON.parse(raw);
}

export function saveCatalogueJson(univers, rows) {
  const file =
    univers === "mineral"
      ? "sevya/catalogue-mineral.json"
      : univers === "amenagements"
        ? "sevya/catalogue-amenagements.json"
        : "sevya/catalogue-vegetal.json";
  fs.writeFileSync(path.join(ROOT, file), `${JSON.stringify(rows, null, 2)}\n`, "utf8");
}

export function publicCatalogueDir(univers = "vegetal") {
  if (univers === "mineral") return path.join(ROOT, "public/catalogue/mineral");
  if (univers === "amenagements") return path.join(ROOT, "public/catalogue/amenagements");
  return path.join(ROOT, "public/catalogue/vegetal");
}

async function resolveLegacyIdForJsonRow(row, legacyItems, manualLinks) {
  const byNom = new Map();
  for (const item of legacyItems) {
    byNom.set(normalizeKey(item.nom), item);
  }
  const jsonIdToLegacyId = new Map(
    Object.entries(manualLinks).map(([legacyId, jsonId]) => [jsonId, legacyId])
  );
  const linkedLegacyId = jsonIdToLegacyId.get(row.id);
  if (linkedLegacyId) return linkedLegacyId;
  const legacy = byNom.get(normalizeKey(row.nom));
  return legacy ? legacy.id : row.id;
}

export async function listCataloguePlantsForScripts() {
  const rows = loadCatalogueJson("vegetal");
  const legacy = await getLegacyPlants();
  return Promise.all(
    rows.map(async (row) => ({
      univers: "vegetal",
      catalogueId: await resolveCatalogueIdForJsonRow(row, legacy),
      jsonId: row.id,
      nom: row.nom,
      nom_latin: row.nom_latin || "",
      categorie: row.categorie || "",
      row,
    }))
  );
}

let legacyMineralCache = null;
let legacyAmenCache = null;

async function getLegacyMinerals() {
  if (!legacyMineralCache) {
    const mod = await import(pathToFileURL(path.join(ROOT, "lib/legacyCatalogueMinerals.js")).href);
    legacyMineralCache = mod.LEGACY_CATALOGUE_MINERALS;
  }
  return legacyMineralCache;
}

async function getLegacyAmenagements() {
  if (!legacyAmenCache) {
    const mod = await import(pathToFileURL(path.join(ROOT, "lib/legacyCatalogueAmenagements.js")).href);
    legacyAmenCache = mod.LEGACY_CATALOGUE_AMENAGEMENTS;
  }
  return legacyAmenCache;
}

export async function listCatalogueEntriesForUnivers(univers) {
  if (univers === "vegetal") return listCataloguePlantsForScripts();

  if (univers === "mineral") {
    const rows = loadCatalogueJson("mineral");
    const legacy = await getLegacyMinerals();
    return Promise.all(
      rows.map(async (row) => ({
        univers: "mineral",
        catalogueId: await resolveLegacyIdForJsonRow(row, legacy, MINERAL_LEGACY_JSON_ID_LINKS),
        jsonId: row.id,
        nom: row.nom,
        nom_latin: "",
        categorie: row.categorie || "",
        row,
      }))
    );
  }

  if (univers === "amenagements") {
    const rows = loadCatalogueJson("amenagements");
    const legacy = await getLegacyAmenagements();
    return Promise.all(
      rows.map(async (row) => ({
        univers: "amenagements",
        catalogueId: await resolveLegacyIdForJsonRow(row, legacy, AMENAGEMENT_LEGACY_JSON_ID_LINKS),
        jsonId: row.id,
        nom: row.nom,
        nom_latin: "",
        categorie: row.categorie || "",
        row,
      }))
    );
  }

  throw new Error(`Univers inconnu : ${univers}`);
}

export function parseUniversArg(argv = process.argv.slice(2)) {
  const idx = argv.indexOf("--univers");
  if (idx === -1) return "vegetal";
  const value = argv[idx + 1];
  if (!value || !["vegetal", "mineral", "amenagements"].includes(value)) {
    throw new Error("Usage: --univers vegetal|mineral|amenagements");
  }
  return value;
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
