import crypto from "crypto";
import fs from "fs";
import path from "path";
import { isLocalPhotoAdminEnabled } from "@/lib/localPhotoAdmin";
import { runRembgWhiteBackground, isRembgAvailable } from "@/lib/rembgLocal";

const ROOT = process.cwd();
const CACHE_DIR = path.join(ROOT, "sevya/photo-rembg-cache");

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function cacheFileName(cacheKey) {
  const hash = crypto.createHash("sha256").update(cacheKey).digest("hex").slice(0, 24);
  return `${hash}.png`;
}

export default async function handler(req, res) {
  if (!isLocalPhotoAdminEnabled()) {
    return res.status(404).end();
  }

  ensureCacheDir();

  if (req.method === "GET") {
    const file = req.query.file;
    if (!file || !/^[a-f0-9]{24}\.png$/.test(file)) {
      return res.status(400).end();
    }
    const filePath = path.join(CACHE_DIR, file);
    if (!fs.existsSync(filePath)) {
      return res.status(404).end();
    }
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "private, max-age=86400");
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  if (req.method === "POST") {
    const { cacheKey, imageUrl } = req.body || {};
    if (!cacheKey || !imageUrl) {
      return res.status(400).json({ error: "missing_params" });
    }

    const fileName = cacheFileName(String(cacheKey));
    const filePath = path.join(CACHE_DIR, fileName);

    if (fs.existsSync(filePath)) {
      return res.status(200).json({
        ok: true,
        rembgCacheFile: fileName,
        previewUrl: `/api/local/plant-photo-rembg?file=${fileName}`,
      });
    }

    if (!(await isRembgAvailable())) {
      return res.status(503).json({
        error: "rembg_unavailable",
        hint: "python3 -m venv scripts/.venv-rembg && ./scripts/.venv-rembg/bin/pip install -r scripts/requirements-rembg.txt",
      });
    }

    try {
      const dl = await fetch(imageUrl);
      if (!dl.ok) throw new Error(`download ${dl.status}`);
      const buf = Buffer.from(await dl.arrayBuffer());
      const out = await runRembgWhiteBackground(buf);
      fs.writeFileSync(filePath, out);
      return res.status(200).json({
        ok: true,
        rembgCacheFile: fileName,
        previewUrl: `/api/local/plant-photo-rembg?file=${fileName}`,
      });
    } catch (e) {
      return res.status(500).json({ error: "rembg_failed", message: e.message });
    }
  }

  return res.status(405).json({ error: "method_not_allowed" });
}

export const config = {
  api: { bodyParser: { sizeLimit: "64kb" } },
};
