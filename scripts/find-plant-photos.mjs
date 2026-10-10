#!/usr/bin/env node
/**
 * Recherche de candidates Pixabay pour le catalogue végétal.
 * Usage : node scripts/find-plant-photos.mjs
 * Prérequis : PIXABAY_API_KEY dans .env.local
 */

import fs from "fs/promises";
import path from "path";
import {
  ROOT,
  listCataloguePlantsForScripts,
  loadEnvLocal,
} from "./plantCatalogueIds.mjs";

const CANDIDATES_PATH = path.join(ROOT, "sevya/photo-candidates.json");
const DELAY_MS = 1100;
const MAX_CANDIDATES = 6;
const MIN_RESULTS_BEFORE_FRENCH = 4;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mapHit(hit) {
  return {
    pixabayId: hit.id,
    previewUrl: hit.previewURL,
    hdUrl: hit.largeImageURL || hit.webformatURL || hit.previewURL,
    author: hit.user,
    pageUrl: hit.pageURL,
  };
}

async function fetchPixabay(query, apiKey) {
  const url = new URL("https://pixabay.com/api/");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("q", query);
  url.searchParams.set("image_type", "photo");
  url.searchParams.set("per_page", "20");
  url.searchParams.set("safesearch", "true");

  while (true) {
    const res = await fetch(url);
    if (res.status === 429) {
      console.warn("Pixabay 429 — pause 30 s puis nouvel essai…");
      await sleep(30000);
      continue;
    }
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Pixabay ${res.status}: ${text.slice(0, 200)}`);
    }
    const data = await res.json();
    return data.hits || [];
  }
}

async function collectCandidates(queries, apiKey) {
  const seen = new Set();
  const candidates = [];

  for (const query of queries) {
    if (!query?.trim()) continue;
    console.log(`  → recherche « ${query} »`);
    const hits = await fetchPixabay(query.trim(), apiKey);
    await sleep(DELAY_MS);

    for (const hit of hits) {
      if (seen.has(hit.id)) continue;
      seen.add(hit.id);
      candidates.push(mapHit(hit));
      if (candidates.length >= MAX_CANDIDATES) return candidates;
    }
  }

  return candidates;
}

async function loadExisting() {
  try {
    const raw = await fs.readFile(CANDIDATES_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return { updatedAt: null, plants: {} };
  }
}

async function main() {
  const env = loadEnvLocal();
  const apiKey = env.PIXABAY_API_KEY?.trim();
  if (!apiKey) {
    console.error("PIXABAY_API_KEY manquante dans .env.local");
    process.exit(1);
  }

  const plants = await listCataloguePlantsForScripts();
  const store = await loadExisting();
  if (!store.plants) store.plants = {};

  let processed = 0;
  let skipped = 0;

  for (const plant of plants) {
    const id = plant.catalogueId;
    const existing = store.plants[id];
    if (existing?.candidates?.length > 0) {
      skipped += 1;
      continue;
    }

    console.log(`\n[${processed + skipped + 1}/${plants.length}] ${plant.nom} (${id})`);

    let candidates = [];
    if (plant.nom_latin) {
      candidates = await collectCandidates([plant.nom_latin], apiKey);
    }
    if (candidates.length < MIN_RESULTS_BEFORE_FRENCH && plant.nom) {
      const seen = new Set(candidates.map((c) => c.pixabayId));
      const fromFrench = await collectCandidates([plant.nom], apiKey);
      for (const c of fromFrench) {
        if (seen.has(c.pixabayId)) continue;
        seen.add(c.pixabayId);
        candidates.push(c);
        if (candidates.length >= MAX_CANDIDATES) break;
      }
    }
    candidates = candidates.slice(0, MAX_CANDIDATES);

    store.plants[id] = {
      catalogueId: id,
      jsonId: plant.jsonId,
      nom: plant.nom,
      nom_latin: plant.nom_latin,
      categorie: plant.categorie,
      fetchedAt: new Date().toISOString(),
      candidates,
    };
    processed += 1;

    store.updatedAt = new Date().toISOString();
    await fs.writeFile(CANDIDATES_PATH, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  }

  store.updatedAt = new Date().toISOString();
  await fs.writeFile(CANDIDATES_PATH, `${JSON.stringify(store, null, 2)}\n`, "utf8");

  console.log(`\nTerminé. ${processed} plante(s) traitées, ${skipped} déjà en cache.`);
  console.log(`Fichier : ${CANDIDATES_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
