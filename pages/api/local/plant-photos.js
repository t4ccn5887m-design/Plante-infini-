import fs from "fs";
import path from "path";
import { getActiveCataloguePlants } from "@/lib/cataloguePlants";
import { isLocalPhotoAdminEnabled } from "@/lib/localPhotoAdmin";

const ROOT = process.cwd();
const CANDIDATES_PATH = path.join(ROOT, "sevya/photo-candidates.json");
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

export default function handler(req, res) {
  if (!isLocalPhotoAdminEnabled()) {
    return res.status(404).end();
  }

  if (req.method === "GET") {
    const candidates = readJson(CANDIDATES_PATH, { plants: {} });
    const choices = readJson(CHOICES_PATH, {});
    const plants = getActiveCataloguePlants().map((p) => ({
      id: p.id,
      nom: p.nom,
      nom_latin: p.nom_latin,
      categorie: p.categorie,
    }));

    return res.status(200).json({
      plants,
      candidates: candidates.plants || {},
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
    } = req.body || {};

    if (!catalogueId || !status) {
      return res.status(400).json({ error: "invalid_body" });
    }

    const choices = readJson(CHOICES_PATH, {});

    if (status === "none") {
      choices[catalogueId] = {
        status: "none",
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
