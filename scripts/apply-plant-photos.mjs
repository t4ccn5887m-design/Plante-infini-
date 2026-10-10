#!/usr/bin/env node
/**
 * Applique les photos validées (originale ou fond blanc) au catalogue.
 * Usage : node scripts/apply-plant-photos.mjs
 */

import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import {
  ROOT,
  loadCatalogueJson,
  listCataloguePlantsForScripts,
} from "./plantCatalogueIds.mjs";
import { runRembgWhiteBackground, isRembgAvailable } from "./rembgRunner.mjs";

const CHOICES_PATH = path.join(ROOT, "sevya/photo-choices.json");
const CATALOGUE_PATH = path.join(ROOT, "sevya/catalogue-vegetal.json");
const REMBG_CACHE_DIR = path.join(ROOT, "sevya/photo-rembg-cache");
const OUT_DIR = path.join(ROOT, "public/catalogue/vegetal");
const DELAY_MS = 1100;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function downloadBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download ${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function loadImageForChoice(choice) {
  const variant = choice.displayVariant || "original";
  const candidate = choice.candidate;

  if (variant === "white_bg") {
    if (choice.rembgCacheFile) {
      const cachePath = path.join(REMBG_CACHE_DIR, choice.rembgCacheFile);
      return fs.readFile(cachePath);
    }
    const buf = await downloadBuffer(candidate.hdUrl || candidate.thumbnailUrl);
    if (!(await isRembgAvailable())) {
      throw new Error("rembg indisponible — générez l’aperçu « Fond blanc » dans /admin/photos");
    }
    return runRembgWhiteBackground(buf);
  }

  return downloadBuffer(candidate.hdUrl || candidate.thumbnailUrl);
}

async function main() {
  let choices;
  try {
    choices = JSON.parse(await fs.readFile(CHOICES_PATH, "utf8"));
  } catch {
    console.error("sevya/photo-choices.json introuvable ou invalide.");
    process.exit(1);
  }

  const plants = await listCataloguePlantsForScripts();
  const byCatalogueId = new Map(plants.map((p) => [p.catalogueId, p]));

  const catalogue = loadCatalogueJson();
  const jsonById = new Map(catalogue.map((row) => [row.id, row]));

  await fs.mkdir(OUT_DIR, { recursive: true });

  let applied = 0;
  let skipped = 0;

  for (const [catalogueId, choice] of Object.entries(choices)) {
    if (!choice || choice.status === "none") {
      skipped += 1;
      continue;
    }
    if (choice.status !== "selected" || !choice.candidate) {
      skipped += 1;
      continue;
    }

    const meta = byCatalogueId.get(catalogueId);
    if (!meta) {
      console.warn(`Id catalogue inconnu : ${catalogueId}`);
      continue;
    }

    const candidate = choice.candidate;
    const detouree = (choice.displayVariant || "original") === "white_bg";

    console.log(`Traitement ${catalogueId} (${detouree ? "fond blanc" : "original"})…`);
    const buf = await loadImageForChoice(choice);
    await sleep(DELAY_MS);

    const webp = await sharp(buf)
      .rotate()
      .resize({
        width: 900,
        height: 900,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toBuffer();

    const outFile = `${catalogueId}.webp`;
    await fs.writeFile(path.join(OUT_DIR, outFile), webp);

    const row = jsonById.get(meta.jsonId);
    if (row) {
      row.photo_url = `/catalogue/vegetal/${outFile}`;
      row.photo_source = candidate.source || "";
      row.photo_auteur = candidate.author || "";
      row.photo_licence = candidate.licenseName || "";
      row.photo_licence_url = candidate.licenseUrl || "";
      row.photo_lien = candidate.pageUrl || "";
      row.photo_detouree = detouree ? "oui" : "non";
    }

    applied += 1;
  }

  await fs.writeFile(CATALOGUE_PATH, `${JSON.stringify(catalogue, null, 2)}\n`, "utf8");

  console.log(`\n${applied} photo(s) appliquée(s), ${skipped} entrée(s) ignorée(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
