import fs from "fs";
import path from "path";
import { getActiveCatalogueAmenagements } from "@/lib/catalogueAmenagements";
import { getActiveCatalogueMinerals } from "@/lib/catalogueMinerals";
import { getActiveCataloguePlants } from "@/lib/cataloguePlants";
import { isLocalPhotoAdminEnabled } from "@/lib/localPhotoAdmin";
import { getCandidateBucketSync, readCandidatesStoreSync } from "@/lib/photoCandidatesStore";

const ROOT = process.cwd();
const CHOICES_PATH = path.join(ROOT, "sevya/photo-choices.json");

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function plantsForUnivers(univers) {
  if (univers === "mineral") {
    return getActiveCatalogueMinerals().map((p) => ({
      id: p.id,
      nom: p.nom,
      nom_latin: "",
      categorie: p.categorie,
    }));
  }
  if (univers === "amenagements") {
    return getActiveCatalogueAmenagements().map((p) => ({
      id: p.id,
      nom: p.nom,
      nom_latin: "",
      categorie: p.categorie,
    }));
  }
  return getActiveCataloguePlants().map((p) => ({
    id: p.id,
    nom: p.nom,
    nom_latin: p.nom_latin,
    categorie: p.categorie,
  }));
}

export default function handler(req, res) {
  if (!isLocalPhotoAdminEnabled()) {
    return res.status(404).end();
  }

  const univers = String(req.query.univers || "vegetal");
  if (!["vegetal", "mineral", "amenagements"].includes(univers)) {
    return res.status(400).json({ error: "invalid_univers" });
  }

  if (req.method === "GET") {
    const store = readCandidatesStoreSync();
    const candidates = getCandidateBucketSync(store, univers);
    const choices = readJson(CHOICES_PATH, {});
    const plants = plantsForUnivers(univers);

    return res.status(200).json({
      univers,
      plants,
      candidates,
      choices,
    });
  }

  if (req.method === "POST") {
    const {
      catalogueId,
      status,
      candidateIndex,
      candidate,
      displayVariant,
      rembgCacheFile,
      univers: bodyUnivers,
    } = req.body || {};

    if (!catalogueId || !status) {
      return res.status(400).json({ error: "invalid_body" });
    }

    const choices = readJson(CHOICES_PATH, {});

    if (status === "none") {
      choices[catalogueId] = {
        status: "none",
        univers: bodyUnivers || univers,
        updatedAt: new Date().toISOString(),
      };
    } else if (status === "selected") {
      if (candidateIndex == null || !candidate) {
        return res.status(400).json({ error: "missing_candidate" });
      }
      choices[catalogueId] = {
        status: "selected",
        candidateIndex,
        candidate,
        univers: bodyUnivers || univers,
        displayVariant: displayVariant === "white_bg" ? "white_bg" : "original",
        rembgCacheFile: rembgCacheFile || null,
        updatedAt: new Date().toISOString(),
      };
    } else {
      return res.status(400).json({ error: "invalid_status" });
    }

    writeJson(CHOICES_PATH, choices);
    return res.status(200).json({ ok: true, choices });
  }

  return res.status(405).json({ error: "method_not_allowed" });
}

export const config = {
  api: { bodyParser: { sizeLimit: "512kb" } },
};
