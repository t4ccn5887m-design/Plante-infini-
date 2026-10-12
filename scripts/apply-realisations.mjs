#!/usr/bin/env node
/**
 * Photos paysagiste (sevya/realisations-choix.json + sevya/realisations/, gitignoré)
 * → public/catalogue/realisations/<clé>-<n>.webp
 * → sevya/catalogue-styles-realisations.json
 * → met à jour sevya/catalogue-amenagements.json (bordures)
 */

import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

const ROOT = process.cwd();
const CHOIX_PATH = path.join(ROOT, "sevya/realisations-choix.json");
const SRC_DIR = path.join(ROOT, "sevya/realisations");
const OUT_DIR = path.join(ROOT, "public/catalogue/realisations");
const STYLES_JSON = path.join(ROOT, "sevya/catalogue-styles-realisations.json");
const AMENAGEMENTS_JSON = path.join(ROOT, "sevya/catalogue-amenagements.json");

const STYLE_KEYS = ["styles_realisations", "styles_projets3d"];

const BORDURE_TO_CATALOGUE = {
  bordure_acier: "bordure-corten",
  bordure_pierre: "bordure-pierre-naturelle",
  bordure_bois: "bordure-traverse-bois",
  bordure_beton: "bordure-beton",
};

function targetSize(aspect) {
  if (aspect === "1:1") return { width: 1600, height: 1600 };
  return { width: 1600, height: 1200 };
}

async function processToWebp(srcPath, outPath, aspect) {
  const { width, height } = targetSize(aspect);
  await sharp(srcPath)
    .rotate()
    .resize(width, height, { fit: "cover", position: "centre" })
    .webp({ quality: 80 })
    .toFile(outPath);
}

async function main() {
  const choix = JSON.parse(await fs.readFile(CHOIX_PATH, "utf8"));
  await fs.mkdir(OUT_DIR, { recursive: true });

  const styleEntries = [];

  for (const key of STYLE_KEYS) {
    const files = Array.isArray(choix[key]) ? choix[key] : [];
    const aspect = "4:3";
    let n = 0;
    for (const file of files) {
      n += 1;
      const srcPath = path.join(SRC_DIR, file);
      try {
        await fs.access(srcPath);
      } catch {
        console.warn(`Fichier manquant : ${file}`);
        continue;
      }
      const outName = `${key}-${n}.webp`;
      const outPath = path.join(OUT_DIR, outName);
      console.log(`${key} ${file} → ${outName}`);
      await processToWebp(srcPath, outPath, aspect);

      const isProjet = key === "styles_projets3d";
      styleEntries.push({
        id: `${key}-${n}`,
        nom: isProjet ? "Projet" : "Réalisation",
        photo_url: `/catalogue/realisations/${outName}`,
        photo_source: "Réalisation",
        photo_auteur: "",
        photo_licence: "",
        photo_licence_url: "",
        photo_lien: "",
        photo_detouree: "non",
        origin: isProjet ? "projet3d" : "realisation",
        pastille: isProjet ? "Projet" : "Réalisation",
      });
    }
  }

  await fs.writeFile(STYLES_JSON, `${JSON.stringify(styleEntries, null, 2)}\n`, "utf8");
  console.log(`\n${styleEntries.length} entrée(s) styles → catalogue-styles-realisations.json`);

  const amenagements = JSON.parse(await fs.readFile(AMENAGEMENTS_JSON, "utf8"));
  const byId = new Map(amenagements.map((row, index) => [row.id, index]));

  for (const [choixKey, catalogueId] of Object.entries(BORDURE_TO_CATALOGUE)) {
    const files = Array.isArray(choix[choixKey]) ? choix[choixKey] : [];
    const urls = [];
    let n = 0;
    for (const file of files) {
      const srcPath = path.join(SRC_DIR, file);
      try {
        await fs.access(srcPath);
      } catch {
        console.warn(`Bordure — fichier manquant : ${file}`);
        continue;
      }
      n += 1;
      const outName = `${choixKey}-${n}.webp`;
      const outPath = path.join(OUT_DIR, outName);
      console.log(`${choixKey} ${file} → ${outName}`);
      await processToWebp(srcPath, outPath, "1:1");
      urls.push(`/catalogue/realisations/${outName}`);
    }

    const idx = byId.get(catalogueId);
    if (idx == null) {
      console.warn(`Fiche introuvable : ${catalogueId}`);
      continue;
    }
    if (!urls.length) continue;

    amenagements[idx] = {
      ...amenagements[idx],
      photo_url: urls[0],
      photo_gallery: urls,
      photo_source: "Réalisation",
      photo_auteur: "",
      photo_licence: "",
      photo_licence_url: "",
      photo_lien: "",
    };

    if (catalogueId === "bordure-corten") {
      amenagements[idx].nom = "Bordure en acier";
      amenagements[idx].aspect = "Acier brut ou corten, ligne fine";
    }
  }

  await fs.writeFile(AMENAGEMENTS_JSON, `${JSON.stringify(amenagements, null, 2)}\n`, "utf8");
  console.log("catalogue-amenagements.json mis à jour (bordures).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
