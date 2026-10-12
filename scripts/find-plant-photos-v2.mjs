#!/usr/bin/env node
/**
 * V2 — candidats photo plus nombreux et de meilleure qualité pour le catalogue végétal,
 * + téléchargement de vignettes locales (pour la revue des choix).
 *
 * Sources (licences libres uniquement) :
 *   1. Pixabay (nom latin, nom français, "… garden")
 *   2. Wikimedia Commons « Quality images » et « Featured pictures »
 *   3. Wikimedia Commons, catégorie de l'espèce (complément)
 *
 * Usage :
 *   node scripts/find-plant-photos-v2.mjs            → les 200 plantes (reprend là où il s'est arrêté)
 *   node scripts/find-plant-photos-v2.mjs --only olivier,agave
 *   node scripts/find-plant-photos-v2.mjs --force    → refait tout
 *
 * Écrit : sevya/photo-candidates.json (bucket vegetal, sauvegarde dans photo-candidates.backup.json)
 * Vignettes : sevya/.photo-thumbs/vegetal/<id>/NN.jpg (non versionnées)
 */

import fs from "fs/promises";
import path from "path";
import {
  WIKIMEDIA_USER_AGENT,
  isWikimediaLicenseAccepted,
  pixabayTagsLookLikeMacro,
  sleep,
  stripHtml,
  textLooksLikeMacro,
} from "./photoCandidateUtils.mjs";
import { getCandidateBucket, loadCandidatesStore, saveCandidatesStore } from "./photoCatalogueStore.mjs";
import { ROOT, listCatalogueEntriesForUnivers, loadEnvLocal } from "./plantCatalogueIds.mjs";

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const MAX_PIXABAY = 10;
const MAX_WIKI = 8;
const MIN_WIDTH = 1000;
const THUMB_DIR = path.join(ROOT, "sevya/.photo-thumbs/vegetal");
const WIKI_DELAY = 700;

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const onlyIdx = args.indexOf("--only");
const ONLY = onlyIdx >= 0 ? new Set((args[onlyIdx + 1] || "").split(",").map((s) => s.trim()).filter(Boolean)) : null;

async function wiki(params) {
  const url = new URL(COMMONS_API);
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": WIKIMEDIA_USER_AGENT } });
    if (res.status === 429) {
      console.warn("  Wikimedia 429 — pause 30 s…");
      await sleep(30000);
      continue;
    }
    if (!res.ok) throw new Error(`Wikimedia ${res.status}`);
    const data = await res.json();
    await sleep(WIKI_DELAY);
    return data;
  }
  throw new Error("Wikimedia : trop de 429");
}

async function wikiSearchTitles(srsearch, limit = 15) {
  const data = await wiki({ action: "query", list: "search", srsearch, srnamespace: "6", srlimit: String(limit) });
  return (data.query?.search || []).map((s) => s.title);
}

async function wikiCategoryTitles(category, limit = 40) {
  const data = await wiki({ action: "query", list: "categorymembers", cmtitle: category, cmtype: "file", cmlimit: String(limit) });
  return (data.query?.categorymembers || []).map((m) => m.title);
}

async function wikiInfos(titles) {
  if (!titles.length) return [];
  const data = await wiki({
    action: "query",
    titles: titles.slice(0, 40).join("|"),
    prop: "imageinfo",
    iiprop: "url|size|extmetadata|mime",
    iiurlwidth: "480",
  });
  const pages = data.query?.pages || {};
  const byTitle = new Map();
  for (const p of Object.values(pages)) if (p.imageinfo?.[0]) byTitle.set(p.title, p.imageinfo[0]);
  return titles.map((t) => [t, byTitle.get(t)]).filter(([, i]) => i);
}

function mapWiki(title, info, searchQuery) {
  const meta = info.extmetadata || {};
  const licenseName = stripHtml(meta.LicenseShortName?.value || "");
  const licenseUrl = stripHtml(meta.LicenseUrl?.value || "");
  const description = stripHtml(meta.ImageDescription?.value || "");
  if ((info.width || 0) < MIN_WIDTH) return null;
  if (info.mime && !info.mime.startsWith("image/")) return null;
  if (/svg|gif|tiff?$/i.test(info.mime || "")) return null;
  if (!isWikimediaLicenseAccepted(licenseName, licenseUrl)) return null;
  if (textLooksLikeMacro(title, description)) return null;
  return {
    source: "Wikimedia",
    wikimediaTitle: title,
    hdUrl: info.url,
    thumbnailUrl: info.thumburl || info.url,
    author: stripHtml(meta.Artist?.value || meta.Credit?.value || "") || "Auteur inconnu",
    licenseName,
    licenseUrl,
    pageUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`,
    searchQuery,
  };
}

async function collectWiki(latin) {
  const clean = latin.replace(/['‘’"]/g, "").replace(/×/g, "").replace(/\s+/g, " ").trim();
  const species = clean.split(" ").slice(0, 2).join(" ");
  const lists = [];
  try { lists.push([await wikiSearchTitles(`${clean} incategory:Quality_images`), "quality"]); } catch (e) { console.warn("  QI:", e.message); }
  if (species !== clean) {
    try { lists.push([await wikiSearchTitles(`${species} incategory:Quality_images`), "quality"]); } catch {}
  }
  try { lists.push([await wikiSearchTitles(`${species} incategory:Featured_pictures_on_Wikimedia_Commons`, 8), "featured"]); } catch {}
  try { lists.push([await wikiCategoryTitles(`Category:${species}`), "category"]); } catch {}
  const seen = new Set();
  const out = [];
  for (const [titles, tag] of lists) {
    const fresh = titles.filter((t) => !seen.has(t));
    fresh.forEach((t) => seen.add(t));
    for (let i = 0; i < fresh.length && out.length < MAX_WIKI; i += 40) {
      for (const [t, info] of await wikiInfos(fresh.slice(i, i + 40))) {
        const c = mapWiki(t, info, `wikimedia:${tag}`);
        if (c) out.push(c);
        if (out.length >= MAX_WIKI) break;
      }
    }
    if (out.length >= MAX_WIKI) break;
  }
  return out;
}

async function pixabay(apiKey, q, lang) {
  const url = new URL("https://pixabay.com/api/");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("q", q.slice(0, 100));
  url.searchParams.set("image_type", "photo");
  url.searchParams.set("per_page", "20");
  url.searchParams.set("safesearch", "true");
  url.searchParams.set("min_width", String(MIN_WIDTH));
  if (lang) url.searchParams.set("lang", lang);
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url);
    if (res.status === 429) { console.warn("  Pixabay 429 — pause 30 s…"); await sleep(30000); continue; }
    if (!res.ok) throw new Error(`Pixabay ${res.status}`);
    const data = await res.json();
    await sleep(700);
    return data.hits || [];
  }
  return [];
}

async function collectPixabay(apiKey, entry) {
  if (!apiKey) return [];
  const latin = entry.nom_latin.replace(/['‘’"]/g, "").replace(/×/g, "").replace(/\s+/g, " ").trim();
  const queries = [[latin, null], [entry.nom, "fr"], [`${latin.split(" ").slice(0, 2).join(" ")} garden`, null]];
  const seen = new Set();
  const out = [];
  for (const [q, lang] of queries) {
    let hits = [];
    try { hits = await pixabay(apiKey, q, lang); } catch (e) { console.warn("  Pixabay:", e.message); }
    for (const h of hits) {
      if (seen.has(h.id) || out.length >= MAX_PIXABAY) continue;
      seen.add(h.id);
      if (pixabayTagsLookLikeMacro(h.tags || "")) continue;
      out.push({
        source: "Pixabay",
        pixabayId: h.id,
        hdUrl: h.largeImageURL || h.webformatURL,
        thumbnailUrl: h.webformatURL || h.previewURL,
        author: h.user || "",
        licenseName: "Pixabay License",
        licenseUrl: "https://pixabay.com/service/license/",
        pageUrl: h.pageURL,
        searchQuery: `pixabay:${q}`,
        tags: h.tags || "",
      });
    }
  }
  return out;
}

async function downloadThumb(url, dest) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": WIKIMEDIA_USER_AGENT } });
      if (res.status === 429) { await sleep(20000); continue; }
      if (!res.ok) return false;
      await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()));
      return true;
    } catch {
      await sleep(3000);
    }
  }
  return false;
}

async function main() {
  const env = loadEnvLocal();
  const apiKey = env.PIXABAY_API_KEY?.trim() || "";
  if (!apiKey) console.warn("PIXABAY_API_KEY absente de .env.local — Pixabay ignoré.");

  const candPath = path.join(ROOT, "sevya/photo-candidates.json");
  const backup = path.join(ROOT, "sevya/photo-candidates.backup.json");
  try { await fs.access(backup); } catch { await fs.copyFile(candPath, backup).catch(() => {}); }

  const entries = await listCatalogueEntriesForUnivers("vegetal");
  const store = await loadCandidatesStore();
  const bucket = getCandidateBucket(store, "vegetal");
  await fs.mkdir(THUMB_DIR, { recursive: true });

  let n = 0;
  for (const entry of entries) {
    n += 1;
    const id = entry.catalogueId;
    if (ONLY && !ONLY.has(id) && !ONLY.has(entry.jsonId)) continue;
    if (!FORCE && !ONLY && bucket[id]?.fetchedBy === "v2") continue;

    console.log(`[${n}/${entries.length}] ${entry.nom} — ${entry.nom_latin}`);
    const px = await collectPixabay(apiKey, entry);
    const wm = await collectWiki(entry.nom_latin || entry.nom);
    // alternance pour mélanger les deux sources
    const candidates = [];
    for (let i = 0; i < Math.max(px.length, wm.length); i++) {
      if (px[i]) candidates.push(px[i]);
      if (wm[i]) candidates.push(wm[i]);
    }

    const dir = path.join(THUMB_DIR, id);
    await fs.rm(dir, { recursive: true, force: true });
    await fs.mkdir(dir, { recursive: true });
    for (let i = 0; i < candidates.length; i++) {
      const ok = await downloadThumb(candidates[i].thumbnailUrl, path.join(dir, `${String(i).padStart(2, "0")}.jpg`));
      candidates[i].thumbLocal = ok ? `${String(i).padStart(2, "0")}.jpg` : null;
      await sleep(150);
    }

    bucket[id] = {
      catalogueId: id,
      jsonId: entry.jsonId,
      nom: entry.nom,
      nom_latin: entry.nom_latin || "",
      categorie: entry.categorie,
      univers: "vegetal",
      fetchedAt: new Date().toISOString(),
      fetchedBy: "v2",
      candidates,
    };
    await saveCandidatesStore(store);
    console.log(`   → ${px.length} Pixabay + ${wm.length} Wikimedia`);
  }
  console.log("\nTerminé. Vignettes dans sevya/.photo-thumbs/vegetal/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
