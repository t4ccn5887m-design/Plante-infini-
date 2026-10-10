/**
 * Helpers Idées accueil + catalogue unifié (écrans sevya 5 & 6).
 */

import { filterCatalogueDeco, getActiveCatalogueDeco } from "@/lib/catalogueDeco";
import {
  CATALOGUE_ENVIE_TAGS,
  filterCataloguePlants,
  getActiveCataloguePlants,
} from "@/lib/cataloguePlants";
import { filterCatalogueMinerals, getActiveCatalogueMinerals } from "@/lib/catalogueMinerals";
import { decoToAnalysisResult } from "@/lib/catalogueDeco";
import { mineralToAnalysisResult } from "@/lib/catalogueMinerals";
import { plantToAnalysisResult } from "@/lib/cataloguePlants";

const PLACEHOLDER_COLORS = ["#8C7AB0", "#7E8F6A", "#5F7BB0", "#A8925F", "#B9667F"];

export function hashCatalogueColor(name) {
  let h = 0;
  const s = String(name || "");
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return PLACEHOLDER_COLORS[Math.abs(h) % PLACEHOLDER_COLORS.length];
}

export function normalizeCatalogueSearch(q) {
  return String(q || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function matchesName(nom, query) {
  if (!query) return true;
  return normalizeCatalogueSearch(nom).includes(normalizeCatalogueSearch(query));
}

/** Pastilles « Selon vos envies » — maquette 5 ; pastilles sans filtre catalogue sont masquées. */
export const ENVIE_PILL_DEFS = [
  { id: "sans_entretien", label: "Peu d'entretien", kind: "envie", value: "sans_entretien" },
  { id: "ombre", label: "Ombre & fraîcheur", kind: "envie", value: "ombre" },
  { id: "persistant", label: "Persistant", kind: "envie", value: "persistant" },
  { id: "brise_vue", label: "Haie & brise-vue", kind: "envie", value: "brise_vue" },
  { id: "floraison_violette", label: "Floraison violette", kind: "envie", value: "floraison_violette" },
  { id: "soleil", label: "Plein soleil", kind: "exposition", value: "soleil" },
  { id: "mi-ombre", label: "Mi-ombre", kind: "exposition", value: "mi-ombre" },
  /* Non branchables (données absentes) — laissés pour trace doc, jamais affichés :
     Parfumée, Grimpante, Couvre-sol, Méditerranéen, Zen, Contemporain */
];

export function filterPlantsForEnviePill(pill, plants = getActiveCataloguePlants()) {
  if (!pill) return plants;
  if (pill.kind === "envie") {
    return filterCataloguePlants({ plants, envieTag: pill.value });
  }
  if (pill.kind === "exposition") {
    return plants.filter((p) => p.exposition === pill.value);
  }
  return plants;
}

export function getVisibleEnviePills(plants = getActiveCataloguePlants()) {
  return ENVIE_PILL_DEFS.filter((pill) => filterPlantsForEnviePill(pill, plants).length > 0);
}

const FR_MONTH_NUM = {
  janvier: 1,
  fevrier: 2,
  février: 2,
  mars: 3,
  avril: 4,
  mai: 5,
  juin: 6,
  juillet: 7,
  aout: 8,
  août: 8,
  septembre: 9,
  octobre: 10,
  novembre: 11,
  decembre: 12,
  décembre: 12,
};

const SEASON_MONTHS = {
  printemps: [3, 4, 5],
  ete: [6, 7, 8],
  été: [6, 7, 8],
  automne: [9, 10, 11],
  hiver: [12, 1, 2],
};

function monthInRange(month, from, to) {
  if (from <= to) return month >= from && month <= to;
  return month >= from || month <= to;
}

function textMatchesMonth(raw, month) {
  for (const [name, months] of Object.entries(SEASON_MONTHS)) {
    if (raw.includes(name) && months.includes(month)) return true;
  }

  const rangeMatch = raw.match(/([a-zàâäéèêëïîôùûü]+)\s*[àa]\s*([a-zàâäéèêëïîôùûü]+)/);
  if (rangeMatch) {
    const from = FR_MONTH_NUM[rangeMatch[1]];
    const to = FR_MONTH_NUM[rangeMatch[2]];
    if (from && to && monthInRange(month, from, to)) return true;
  }

  for (const [name, num] of Object.entries(FR_MONTH_NUM)) {
    if (raw.includes(name) && num === month) return true;
  }

  return false;
}

/** Floraison / intérêt saisonnier à partir du champ floraison textuel. */
export function plantMatchesCurrentMonth(plant, date = new Date()) {
  const raw = String(plant?.floraison || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
  if (!raw.trim()) return false;
  return textMatchesMonth(raw, date.getMonth() + 1);
}

export function getPlantsInSeason(plants = getActiveCataloguePlants(), date = new Date()) {
  return plants.filter((p) => plantMatchesCurrentMonth(p, date));
}

export function searchAllCatalogue(query) {
  const q = normalizeCatalogueSearch(query);
  if (!q) return [];

  const results = [];

  for (const p of getActiveCataloguePlants()) {
    if (matchesName(p.nom, q) || matchesName(p.nom_latin, q)) {
      results.push({
        key: `v-${p.id}`,
        universe: "vegetal",
        nom: p.nom,
        photo_url: p.photo_url,
        subtitle: buildCatalogueSubtitle({ kind: "vegetal", raw: p }, null),
        raw: p,
      });
    }
  }
  for (const m of getActiveCatalogueMinerals()) {
    if (matchesName(m.nom, q)) {
      results.push({
        key: `m-${m.id}`,
        universe: "mineral",
        nom: m.nom,
        photo_url: m.photo_url,
        subtitle: buildCatalogueSubtitle({ kind: "mineral", raw: m }, null),
        raw: m,
      });
    }
  }
  for (const d of getActiveCatalogueDeco()) {
    if (matchesName(d.nom, q)) {
      results.push({
        key: `d-${d.id}`,
        universe: "deco",
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

export function formatExpositionLabel(exposition) {
  if (!exposition) return null;
  return String(exposition)
    .replace("-", " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

export function buildCatalogueSubtitle(item, t) {
  const kind = item.kind || item.universe;
  const raw = item.raw || item;

  if (kind === "vegetal") {
    const catKey = raw.famille ? `catalogue.famille_${raw.famille}` : null;
    const cat = catKey && t ? t(catKey) : raw.famille || "Plante";
    const entretien =
      raw.tags_envie?.includes("sans_entretien") && t
        ? t("catalogue.envie_sans_entretien")
        : raw.tags_envie?.includes("sans_entretien")
          ? "Peu d'entretien"
          : null;
    const expo = formatExpositionLabel(raw.exposition);
    const info = entretien || expo || raw.resume?.split("·").pop()?.trim() || "—";
    return `${cat} · ${info}`;
  }

  if (kind === "mineral") {
    const catKey = raw.famille ? `catalogue.mineral_famille_${raw.famille}` : null;
    const cat = catKey && t ? t(catKey) : raw.famille || "Minéral";
    const info = raw.materiau || raw.resume?.split("·")[0]?.trim() || "—";
    return `${cat} · ${info}`;
  }

  const catKey = raw.famille ? `catalogue.deco_famille_${raw.famille}` : null;
  const cat = catKey && t ? t(catKey) : raw.famille || "Aménagement";
  const info = raw.materiau || raw.resume?.split("·")[0]?.trim() || "—";
  return `${cat} · ${info}`;
}

export function vegetalEnvieTagLabel(tag, t) {
  if (t && CATALOGUE_ENVIE_TAGS.includes(tag)) {
    return t(`catalogue.envie_${tag}`);
  }
  return tag;
}
