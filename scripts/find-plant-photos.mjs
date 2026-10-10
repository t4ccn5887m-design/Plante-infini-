#!/usr/bin/env node
/**
 * Candidates Wikimedia Commons + Pixabay pour le catalogue végétal (plante entière).
 * Usage : node scripts/find-plant-photos.mjs
 */

import fs from "fs/promises";
import path from "path";
import {
  DELAY_MS,
  MAX_CANDIDATES,
  MIN_IMAGE_WIDTH,
  WIKIMEDIA_USER_AGENT,
  isWikimediaLicenseAccepted,
  pixabayTagsLookLikeMacro,
  sleep,
  stripHtml,
  textLooksLikeMacro,
} from "./photoCandidateUtils.mjs";
import {
  ROOT,
  listCataloguePlantsForScripts,
  loadEnvLocal,
} from "./plantCatalogueIds.mjs";

const CANDIDATES_PATH = path.join(ROOT, "sevya/photo-candidates.json");
const COMMONS_API = "https://commons.wikimedia.org/w/api.php";

function dedupeKey(c) {
  if (c.source === "Pixabay") return `px:${c.pixabayId}`;
  return `wm:${c.wikimediaTitle || c.pageUrl}`;
}

async function wikimediaFetch(params) {
  const url = new URL(COMMONS_API);
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  while (true) {
    const res = await fetch(url, {
      headers: { "User-Agent": WIKIMEDIA_USER_AGENT },
    });
    if (res.status === 429) {
      console.warn("Wikimedia 429 — pause 30 s…");
      await sleep(30000);
      continue;
    }
    if (!res.ok) {
      throw new Error(`Wikimedia ${res.status}`);
    }
    const data = await res.json();
    if (data.error) throw new Error(data.error.info || "Wikimedia error");
    return data;
  }
}

async function listCategoryFiles(categoryTitle) {
  const files = [];
  let cmcontinue;
  do {
    const data = await wikimediaFetch({
      action: "query",
      list: "categorymembers",
      cmtitle: categoryTitle,
      cmtype: "file",
      cmlimit: "50",
      ...(cmcontinue ? { cmcontinue } : {}),
    });
    await sleep(DELAY_MS);
    const batch = data.query?.categorymembers || [];
    files.push(...batch.map((m) => m.title).filter(Boolean));
    cmcontinue = data.continue?.cmcontinue;
  } while (cmcontinue && files.length < 80);
  return files;
}

async function searchFileNamespace(query) {
  const data = await wikimediaFetch({
    action: "query",
    generator: "search",
    gsrsearch: query,
    gsrnamespace: "6",
    gsrlimit: "30",
    prop: "info",
  });
  await sleep(DELAY_MS);
  const pages = data.query?.pages || {};
  return Object.values(pages)
    .map((p) => p.title)
    .filter((t) => t?.startsWith("File:"));
}

async function fetchImageInfos(titles) {
  if (!titles.length) return [];
  const chunk = titles.slice(0, 40);
  const data = await wikimediaFetch({
    action: "query",
    titles: chunk.join("|"),
    prop: "imageinfo",
    iiprop: "url|size|extmetadata|mime",
    iiurlwidth: "800",
  });
  await sleep(DELAY_MS);

  const pages = data.query?.pages || {};
  const out = [];
  for (const page of Object.values(pages)) {
    const info = page.imageinfo?.[0];
    if (!info) continue;
    out.push({ title: page.title, info });
  }
  return out;
}

function mapWikimediaHit(title, info, searchQuery) {
  const meta = info.extmetadata || {};
  const licenseName = stripHtml(meta.LicenseShortName?.value || "");
  const licenseUrl = stripHtml(meta.LicenseUrl?.value || "");
  const artist = stripHtml(meta.Artist?.value || meta.Credit?.value || "");
  const description = stripHtml(meta.ImageDescription?.value || "");

  const width = info.width || 0;
  const mime = info.mime || "";
  if (width < MIN_IMAGE_WIDTH) return null;
  if (mime && !mime.startsWith("image/")) return null;
  if (!isWikimediaLicenseAccepted(licenseName, licenseUrl)) return null;
  if (textLooksLikeMacro(title, description)) return null;

  const hdUrl = info.url;
  const thumbnailUrl = info.thumburl || info.url;
  if (!hdUrl) return null;

  const pageUrl = `https://commons.wikimedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;

  return {
    source: "Wikimedia",
    wikimediaTitle: title,
    hdUrl,
    thumbnailUrl,
    author: artist || "Auteur inconnu",
    licenseName,
    licenseUrl,
    pageUrl,
    searchQuery,
  };
}

async function collectWikimedia(nom_latin) {
  if (!nom_latin?.trim()) return [];

  const seenTitles = new Set();
  const titleList = [];

  const catName = `Category:${nom_latin.trim()}`;
  try {
    const fromCat = await listCategoryFiles(catName);
    for (const t of fromCat) {
      if (!seenTitles.has(t)) {
        seenTitles.add(t);
        titleList.push({ title: t, searchQuery: `category:${catName}` });
      }
    }
  } catch (e) {
    console.warn(`  Wikimedia catégorie : ${e.message}`);
  }

  try {
    const fromSearch = await searchFileNamespace(nom_latin.trim());
    for (const t of fromSearch) {
      if (!seenTitles.has(t)) {
        seenTitles.add(t);
        titleList.push({ title: t, searchQuery: `search:${nom_latin.trim()}` });
      }
    }
  } catch (e) {
    console.warn(`  Wikimedia recherche : ${e.message}`);
  }

  const candidates = [];
  for (let i = 0; i < titleList.length && candidates.length < MAX_CANDIDATES; i += 40) {
    const batch = titleList.slice(i, i + 40);
    const infos = await fetchImageInfos(batch.map((b) => b.title));
    const queryByTitle = new Map(batch.map((b) => [b.title, b.searchQuery]));

    for (const { title, info } of infos) {
      const mapped = mapWikimediaHit(title, info, queryByTitle.get(title));
      if (mapped) candidates.push(mapped);
      if (candidates.length >= MAX_CANDIDATES) break;
    }
  }

  return candidates;
}

async function fetchPixabay(query, apiKey, extraParams = {}) {
  const url = new URL("https://pixabay.com/api/");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("q", query);
  url.searchParams.set("image_type", "photo");
  url.searchParams.set("per_page", "20");
  url.searchParams.set("safesearch", "true");
  for (const [k, v] of Object.entries(extraParams)) {
    url.searchParams.set(k, v);
  }

  while (true) {
    const res = await fetch(url);
    if (res.status === 429) {
      console.warn("Pixabay 429 — pause 30 s…");
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

function mapPixabayHit(hit, searchQuery) {
  const tags = hit.tags || "";
  if (pixabayTagsLookLikeMacro(tags)) return null;
  if (textLooksLikeMacro(hit.pageURL || "", tags)) return null;

  const width = hit.imageWidth || hit.webformatWidth || 0;
  if (width > 0 && width < MIN_IMAGE_WIDTH) return null;

  return {
    source: "Pixabay",
    pixabayId: hit.id,
    hdUrl: hit.largeImageURL || hit.webformatURL || hit.previewURL,
    thumbnailUrl: hit.previewURL || hit.webformatURL,
    author: hit.user || "",
    licenseName: "Pixabay License",
    licenseUrl: "https://pixabay.com/service/license/",
    pageUrl: hit.pageURL,
    searchQuery,
  };
}

function pixabayQueriesForPlant(nom_latin, categorie) {
  const latin = nom_latin.trim();
  const queries = [`${latin} whole plant`];

  const cat = categorie || "";
  if (cat === "Arbres") queries.push(`${latin} tree`);
  else if (cat === "Arbustes" || cat === "Haies") queries.push(`${latin} shrub`);
  else queries.push(`${latin} plant garden`);

  queries.push(`${latin} isolated white background`);
  return queries;
}

async function collectPixabay(plant, apiKey, slotsLeft) {
  if (!apiKey || slotsLeft <= 0) return [];

  const queries = pixabayQueriesForPlant(plant.nom_latin, plant.categorie);
  const candidates = [];
  const seen = new Set();

  for (const q of queries) {
    if (candidates.length >= slotsLeft) break;

    const variants =
      q.includes("white background") || q.includes("isolated")
        ? [{ colors: "white" }, { colors: "transparent" }, {}]
        : [{}];

    for (const extra of variants) {
      if (candidates.length >= slotsLeft) break;
      console.log(`  → Pixabay « ${q} »${extra.colors ? ` (${extra.colors})` : ""}`);
      const hits = await fetchPixabay(q, apiKey, extra);
      await sleep(DELAY_MS);

      for (const hit of hits) {
        const mapped = mapPixabayHit(hit, extra.colors ? `${q} [colors=${extra.colors}]` : q);
        if (!mapped) continue;
        const key = dedupeKey(mapped);
        if (seen.has(key)) continue;
        seen.add(key);
        candidates.push(mapped);
        if (candidates.length >= slotsLeft) break;
      }
    }
  }

  return candidates;
}

async function loadExisting() {
  try {
    return JSON.parse(await fs.readFile(CANDIDATES_PATH, "utf8"));
  } catch {
    return { updatedAt: null, plants: {} };
  }
}

async function main() {
  const env = loadEnvLocal();
  const apiKey = env.PIXABAY_API_KEY?.trim() || "";

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
    console.log("  Wikimedia Commons…");
    candidates = await collectWikimedia(plant.nom_latin);

    const slotsLeft = MAX_CANDIDATES - candidates.length;
    if (slotsLeft > 0) {
      if (!apiKey) {
        console.warn("  PIXABAY_API_KEY absente — Pixabay ignoré.");
      } else {
        console.log(`  Pixabay (jusqu'à ${slotsLeft} de plus)…`);
        const fromPx = await collectPixabay(plant, apiKey, slotsLeft);
        const seen = new Set(candidates.map(dedupeKey));
        for (const c of fromPx) {
          const k = dedupeKey(c);
          if (seen.has(k)) continue;
          seen.add(k);
          candidates.push(c);
          if (candidates.length >= MAX_CANDIDATES) break;
        }
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
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
