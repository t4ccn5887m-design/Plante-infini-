#!/usr/bin/env node
/**
 * Applique les photos validées au catalogue (végétal, minéral, aménagements).
 * Usage : node scripts/apply-plant-photos.mjs --univers vegetal|mineral|amenagements
 */

import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { loadChoices } from "./photoCatalogueStore.mjs";
import {
  listCatalogueEntriesForUnivers,
  loadCatalogueJson,
  parseUniversArg,
  publicCatalogueDir,
  saveCatalogueJson,
} from "./plantCatalogueIds.mjs";
import { runRembgWhiteBackground, isRembgAvailable } from "./rembgRunner.mjs";

const REMBG_CACHE_DIR = path.join(process.cwd(), "sevya/photo-rembg-cache");
const DELAY_MS = 1100;
const WIKIMEDIA_USER_AGENT =
  "SevyaCatalogue/1.0 (contact : emilien.gaillard9@gmail.com)";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function downloadBuffer(url) {
  const headers = {};
  if (String(url).includes("wikimedia.org")) {
    headers["User-Agent"] = WIKIMEDIA_USER_AGENT;
  }

  while (true) {
    const res = await fetch(url, { headers });
    if (res.status === 429) {
      console.warn("Download 429 — pause 30 s…");
      await sleep(30000);
      continue;
    }
    if (!res.ok) throw new Error(`Download ${res.status} ${url}`);
    return Buffer.from(await res.arrayBuffer());
  }
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
  const univers = parseUniversArg();
  const choices = await loadChoices();

  const entries = await listCatalogueEntriesForUnivers(univers);
  const byCatalogueId = new Map(entries.map((p) => [p.catalogueId, p]));

  const catalogue = loadCatalogueJson(univers);
  const jsonById = new Map(catalogue.map((row) => [row.id, row]));

  const outDir = publicCatalogueDir(univers);
  await fs.mkdir(outDir, { recursive: true });

  let applied = 0;
  let skipped = 0;

  for (const [catalogueId, choice] of Object.entries(choices)) {
    const meta = byCatalogueId.get(catalogueId);
    if (!meta) {
      continue;
    }

    if (!choice || choice.status === "none") {
      skipped += 1;
      continue;
    }
    if (choice.status !== "selected" || !choice.candidate) {
      skipped += 1;
      continue;
    }

    const candidate = choice.candidate;
    const detouree = (choice.displayVariant || "original") === "white_bg";

    console.log(`Traitement ${catalogueId} (${univers}, ${detouree ? "fond blanc" : "original"})…`);
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
    await fs.writeFile(path.join(outDir, outFile), webp);

    const row = jsonById.get(meta.jsonId);
    if (row) {
      const publicSegment =
        univers === "mineral" ? "mineral" : univers === "amenagements" ? "amenagements" : "vegetal";
      row.photo_url = `/catalogue/${publicSegment}/${outFile}`;
      row.photo_source = candidate.source || "";
      row.photo_auteur = candidate.author || "";
      row.photo_licence = candidate.licenseName || "";
      row.photo_licence_url = candidate.licenseUrl || "";
      row.photo_lien = candidate.pageUrl || "";
      row.photo_detouree = detouree ? "oui" : "non";
    }

    applied += 1;
  }

  saveCatalogueJson(univers, catalogue);

  console.log(`\n${applied} photo(s) appliquée(s) (${univers}), ${skipped} entrée(s) ignorée(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
