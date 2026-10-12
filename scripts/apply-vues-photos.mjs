#!/usr/bin/env node
/**
 * Applique les vues retenues (sevya/photo-picks-vues.json) → WebP + sevya/catalogue-styles.json
 * Réalisations paysagiste : scripts/apply-realisations.mjs (sevya/realisations-choix.json).
 */

import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

const ROOT = process.cwd();
const PICKS_PATH = path.join(ROOT, "sevya/photo-picks-vues.json");
const CANDIDATES_PATH = path.join(ROOT, "sevya/photo-candidates-materiaux.json");
const OUT_JSON = path.join(ROOT, "sevya/catalogue-styles.json");
const OUT_DIR = path.join(ROOT, "public/catalogue/styles");
const DELAY_MS = 900;
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

function slugId(searchId, index) {
  return `${searchId}-${index}`;
}

async function main() {
  const picks = JSON.parse(await fs.readFile(PICKS_PATH, "utf8"));
  const store = JSON.parse(await fs.readFile(CANDIDATES_PATH, "utf8"));
  const vuesItems = store?.vues?.items || {};

  await fs.mkdir(OUT_DIR, { recursive: true });

  const styles = [];
  const usedIds = new Set();

  for (const [searchId, indices] of Object.entries(picks)) {
    const meta = vuesItems[searchId];
    if (!meta?.candidates) {
      console.warn(`Ignoré (pas dans vues.items) : ${searchId}`);
      continue;
    }
    const list = Array.isArray(indices) ? indices : [];
    for (const index of list) {
      const candidate = meta.candidates[index];
      if (!candidate?.hdUrl) {
        console.warn(`Pas de candidat ${searchId}[${index}]`);
        continue;
      }
      const id = slugId(searchId, index);
      if (usedIds.has(id)) continue;
      usedIds.add(id);

      console.log(`Traitement ${id}…`);
      const buf = await downloadBuffer(candidate.hdUrl);
      await sleep(DELAY_MS);

      const webp = await sharp(buf)
        .rotate()
        .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();

      const outFile = `${id}.webp`;
      await fs.writeFile(path.join(OUT_DIR, outFile), webp);

      styles.push({
        id,
        nom: meta.nom || searchId,
        photo_url: `/catalogue/styles/${outFile}`,
        photo_source: candidate.source || "",
        photo_auteur: candidate.author || "",
        photo_licence: candidate.licenseName || "",
        photo_licence_url: candidate.licenseUrl || "",
        photo_lien: candidate.pageUrl || "",
        photo_detouree: "non",
        origin: "vues",
        searchId,
        candidateIndex: index,
      });
    }
  }

  await fs.writeFile(OUT_JSON, `${JSON.stringify(styles, null, 2)}\n`, "utf8");
  console.log(`\n${styles.length} style(s) écrit(s) dans catalogue-styles.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
