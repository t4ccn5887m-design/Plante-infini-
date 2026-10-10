/**
 * Helpers Idées accueil + catalogue unifié (sevya 5 & 6).
 */

import { filterCatalogueDeco, getActiveCatalogueDeco } from "@/lib/catalogueDeco";
import { decoToAnalysisResult } from "@/lib/catalogueDeco";
import {
  CATALOGUE_ENVIES,
  filterCataloguePlants,
  getActiveCataloguePlants,
  getCategoriePlaceholderColor,
  getPlantsBeautifulNow,
  plantToAnalysisResult,
} from "@/lib/cataloguePlants";
import { filterCatalogueMinerals, getActiveCatalogueMinerals } from "@/lib/catalogueMinerals";
import { mineralToAnalysisResult } from "@/lib/catalogueMinerals";

export { CATALOGUE_ENVIES, getCategoriePlaceholderColor, getPlantsBeautifulNow };

export function normalizeCatalogueSearch(q) {
  return String(q || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function matchesQuery(fields, query) {
  if (!query) return true;
  const q = normalizeCatalogueSearch(query);
  return fields.some((f) => normalizeCatalogueSearch(f).includes(q));
}

export function buildVegetalCardLine(plant) {
  const cat = plant.categorie || "Plante";
  const expo = plant.exposition || "—";
  return `${cat} · ${expo}`;
}

export function buildMineralCardLine(item) {
  const cat = item.categorie || item.famille || "Minéral";
  const budget = item.budget || "—";
  return `${cat} · ${budget}`;
}

export function buildAmenagementCardLine(item) {
  const cat = item.categorie || item.famille || "Aménagement";
  const budget = item.budget || "—";
  return `${cat} · ${budget}`;
}

export function buildCatalogueSubtitle(item, t) {
  const kind = item.kind || item.universe;
  const raw = item.raw || item;

  if (kind === "vegetal") {
    return buildVegetalCardLine(raw);
  }

  if (kind === "mineral") {
    return buildMineralCardLine(raw);
  }

  return buildAmenagementCardLine(raw);
}

export function searchAllCatalogue(query) {
  const q = normalizeCatalogueSearch(query);
  if (!q) return [];

  const results = [];

  for (const p of getActiveCataloguePlants()) {
    if (matchesQuery([p.nom, p.nom_latin], q)) {
      results.push({
        key: `v-${p.id}`,
        universe: "vegetal",
        id: p.id,
        nom: p.nom,
        photo_url: p.photo_url,
        categorie: p.categorie,
        subtitle: buildVegetalCardLine(p),
        raw: p,
      });
    }
  }
  for (const m of getActiveCatalogueMinerals()) {
    if (matchesQuery([m.nom, m.categorie, m.aspect], q)) {
      results.push({
        key: `m-${m.id}`,
        universe: "mineral",
        id: m.id,
        nom: m.nom,
        photo_url: m.photo_url,
        subtitle: buildCatalogueSubtitle({ kind: "mineral", raw: m }, null),
        raw: m,
      });
    }
  }
  for (const d of getActiveCatalogueDeco()) {
    if (matchesQuery([d.nom, d.categorie, d.aspect], q)) {
      results.push({
        key: `d-${d.id}`,
        universe: "deco",
        id: d.id,
        nom: d.nom,
        photo_url: d.photo_url,
        subtitle: buildCatalogueSubtitle({ kind: "deco", raw: d }, null),
        raw: d,
      });
    }
  }

  return results;
}

export function discoveryFromCatalogueItem(item) {
  if (item.kind === "vegetal" || item.universe === "vegetal") {
    return plantToAnalysisResult(item.raw);
  }
  if (item.kind === "mineral" || item.universe === "mineral") {
    return mineralToAnalysisResult(item.raw);
  }
  return decoToAnalysisResult(item.raw);
}

const MONTH_NAMES = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

export function currentMonthLabel(date = new Date()) {
  return MONTH_NAMES[date.getMonth()] || "";
}
