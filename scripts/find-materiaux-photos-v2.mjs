#!/usr/bin/env node
/**
 * Candidats photo MINÉRAL + AMÉNAGEMENTS (Pixabay + Wikimedia Quality images), fichier séparé
 * pour pouvoir tourner en même temps que find-plant-photos-v2.mjs.
 * Usage : node scripts/find-materiaux-photos-v2.mjs   (reprend où il s'est arrêté ; --force pour tout refaire)
 * Écrit : sevya/photo-candidates-materiaux.json  · Vignettes : sevya/.photo-thumbs/<univers>/<id>/NN.jpg
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
import { ROOT, listCatalogueEntriesForUnivers, loadEnvLocal } from "./plantCatalogueIds.mjs";

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const MAX_PIXABAY = 16;
const MAX_WIKI = 6;
const MIN_WIDTH = 1000;
const THUMB_ROOT = path.join(ROOT, "sevya/.photo-thumbs");
const STORE_PATH = path.join(ROOT, "sevya/photo-candidates-materiaux.json");
const EN = {"dallage-calcaire": "limestone paving patio", "travertin": "travertine patio", "pierre-bleue": "bluestone paving", "dalles-d-ardoise": "slate paving patio", "gres-cerame-effet-pierre": "porcelain stone tiles terrace", "gres-cerame-effet-bois": "wood effect porcelain tiles terrace", "paves-de-granit": "granite cobblestones", "paves-en-terre-cuite": "clay brick paving", "opus-incertum": "crazy paving stone", "tomettes-et-dalles-en-terre-cuite": "terracotta tiles terrace", "gravier-de-marbre-blanc": "white marble chips", "gravier-calcaire-beige": "pea gravel", "galets-roules": "river pebbles garden", "gravillon-de-basalte": "black basalt gravel", "paillage-d-ardoise": "slate chippings mulch", "pouzzolane": "red lava rock", "gravier-de-granit-rose": "pink granite gravel", "galets-plats-noirs": "black pebbles", "pas-japonais-en-pierre-naturelle": "stepping stones lawn", "pas-japonais-en-ardoise": "slate stepping stones", "pas-japonais-en-beton": "concrete stepping stones", "rondins-de-bois": "wood log stepping stones", "muret-en-pierres-seches": "dry stone wall", "gabion": "gabion wall garden", "muret-en-briques": "brick garden wall", "bordure-en-acier-corten": "corten steel garden edging", "bordure-en-acier-galvanise": "steel lawn edging", "bordure-en-paves": "paver garden edging", "enrochement": "rock retaining wall boulders", "rochers-decoratifs": "decorative boulders garden", "pierre-volcanique": "volcanic rock garden", "blocs-de-gres": "sandstone blocks garden", "beton-desactive": "exposed aggregate concrete", "sable-stabilise": "stabilized gravel path", "gravier-stabilise-en-dalles-alveolaires": "gravel grid driveway", "resine-drainante": "resin bound driveway", "pergola-bois": "wooden pergola garden", "pergola-metal": "metal pergola garden", "pergola-bioclimatique": "louvered pergola", "voile-d-ombrage": "shade sail garden", "tonnelle": "garden arbor", "bassin-naturel": "natural garden pond", "bassin-miroir": "reflecting pool garden", "fontaine-murale": "wall fountain garden", "lame-d-eau": "water blade fountain", "jarre-fontaine": "jar water fountain garden", "spots-encastres-au-sol": "inground garden lights", "bornes-lumineuses": "bollard lights garden", "guirlande-guinguette": "string lights garden", "projecteur-d-arbre": "tree uplighting garden", "balisage-solaire": "solar path lights", "banc-en-pierre": "stone bench garden", "salon-de-jardin-en-teck": "teak garden furniture", "bain-de-soleil": "sun lounger garden", "hamac": "hammock garden", "brasero": "fire pit garden", "bac-en-acier-corten": "corten steel planter", "jardiniere-en-bois": "wooden planter box", "pots-en-terre-cuite": "terracotta pots garden", "vase-d-anduze": "anduze vase", "carre-sureleve": "raised garden bed", "claustra-en-bois": "wooden privacy screen garden", "ganivelle-en-chataignier": "chestnut paling fence", "brande-de-bruyere": "heather screen fence", "panneau-en-acier-decoupe": "laser cut metal screen garden", "treillage": "garden trellis", "terrasse-en-bois-exotique": "hardwood deck garden", "terrasse-en-bois-composite": "composite decking garden", "terrasse-en-pin-traite": "pine wood deck", "abri-de-jardin": "garden shed", "cuisine-d-ete": "outdoor kitchen garden", "galets-blancs": "white pebbles", "gravier-calcaire-concasse": "white crushed stone gravel", "gravier-concasse-gris": "grey gravel texture", "schiste-violet": "slate chippings plum", "ecorce-pin": "pine bark mulch", "copeaux-de-bois": "wood chips mulch", "paillette-de-lin": "straw mulch garden", "bordure-corten": "corten steel edging garden", "bordure-acier-noir": "metal lawn edging", "bordure-acier-galva": "steel garden edging lawn", "bordure-rondins": "log edging garden bed", "bordure-traverse-bois": "wooden raised bed border", "bordure-plessis": "woven willow edging", "bordure-pierre-naturelle": "stone edging garden bed", "bordure-paves": "cobblestone lawn edging", "bordure-ardoise": "slate edging garden", "bordure-galets": "pebble border garden", "bordure-briques": "brick edging garden", "bordure-beton": "concrete garden edging", "mediterraneen": "mediterranean garden lavender olive", "zen": "japanese garden", "champetre": "cottage garden flowers", "contemporain": "modern garden design", "naturel": "naturalistic garden grasses perennials", "exotique": "tropical garden", "vue-piscine": "backyard swimming pool garden landscaping", "vue-pool-house": "pool house garden", "vue-terrasse": "garden terrace lawn house", "vue-pelouse-massifs": "backyard lawn flower borders", "vue-jardin-sec": "gravel garden drought planting", "vue-maison-moderne": "modern house garden landscaping", "vue-jardin-arriere": "backyard garden house", "vue-allee": "garden path house front yard", "vue-pelouse-terrasse": "backyard lawn patio garden borders", "vue-jardin-anglais": "english cottage garden house lawn", "vue-jardin-contemporain": "contemporary garden design landscaping grasses", "vue-jardin-mediterraneen": "mediterranean garden olive lavender gravel house", "vue-petit-jardin": "small backyard garden design", "vue-jardin-graminees": "prairie planting ornamental grasses garden", "vue-jardin-devant": "front yard landscaping flower beds", "vue-terrasse-bois": "wooden deck garden lawn", "vue-coin-repas": "garden dining area pergola", "vue-jardin-ombre": "shade garden ferns hostas path", "bord2-massif-acier": "steel edging flower bed lawn", "bord2-massif-pierre": "stone edging flower bed", "bord2-massif-brique": "brick edging flower bed", "bord2-massif-bois": "wooden edging garden bed", "bord2-carre-sureleve": "raised garden bed wood", "bord2-bordure-gravier": "gravel path garden edging", "bord2-bordure-paves": "paver lawn edging", "bord2-bordure-buis": "boxwood border garden"};
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

async function collectWiki(en) {
  const lists = [];
  try { lists.push([await wikiSearchTitles(`${en} incategory:Quality_images`), "quality"]); } catch (e) { console.warn("  QI:", e.message); }
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
  const en = EN[entry.jsonId] || entry.nom;
  const queries = entry.categorie === "Vue" ? [[en, null], [entry.fr, "fr"], [`${en} aerial`, null]] : entry.categorie === "Ambiance" ? [[en, null], [`jardin ${entry.nom.toLowerCase()}`, "fr"], [`${en} landscape`, null]] : [[en, null], [entry.nom, "fr"]];
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
  let store = { mineral: { items: {} }, amenagements: { items: {} } };
  try { store = JSON.parse(await fs.readFile(STORE_PATH, "utf8")); } catch {}
  const save = () => fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2) + "\n", "utf8");

  const AMBIANCES = [["mediterraneen","Méditerranéen"],["zen","Zen"],["champetre","Champêtre"],["contemporain","Contemporain"],["naturel","Naturel"],["exotique","Exotique"]]
    .map(([id, nom]) => ({ catalogueId: id, jsonId: id, nom, categorie: "Ambiance", nom_latin: "" }));
  const REALS = [["vue-piscine", "Jardin avec piscine", "jardin piscine"], ["vue-pool-house", "Pool house", "pool house jardin"], ["vue-terrasse", "Terrasse et jardin", "terrasse jardin maison"], ["vue-pelouse-massifs", "Pelouse et massifs", "jardin pelouse massif"], ["vue-jardin-sec", "Jardin sec", "jardin sec gravier"], ["vue-maison-moderne", "Maison moderne", "maison moderne jardin"], ["vue-jardin-arriere", "Jardin de maison", "jardin maison"], ["vue-allee", "Allée de jardin", "allée jardin"], ["vue-pelouse-terrasse", "Pelouse et terrasse", "jardin pelouse terrasse"], ["vue-jardin-anglais", "Jardin fleuri", "jardin fleuri maison"], ["vue-jardin-contemporain", "Jardin contemporain", "jardin contemporain"], ["vue-jardin-mediterraneen", "Jardin méditerranéen", "jardin méditerranéen"], ["vue-petit-jardin", "Petit jardin", "petit jardin de ville"], ["vue-jardin-graminees", "Jardin de graminées", "jardin graminées vivaces"], ["vue-jardin-devant", "Jardin de façade", "jardin devant maison"], ["vue-terrasse-bois", "Terrasse bois et jardin", "terrasse bois jardin"], ["vue-coin-repas", "Coin repas au jardin", "coin repas jardin"], ["vue-jardin-ombre", "Jardin d'ombre", "jardin ombre"], ["bord2-massif-acier", "Massif bordure acier", "bordure acier massif"], ["bord2-massif-pierre", "Massif bordure pierre", "bordure pierre massif"], ["bord2-massif-brique", "Massif bordure brique", "bordure brique jardin"], ["bord2-massif-bois", "Massif bordure bois", "bordure bois massif"], ["bord2-carre-sureleve", "Massif surélevé", "massif surélevé"], ["bord2-bordure-gravier", "Massif et gravier", "allée gravier bordure"], ["bord2-bordure-paves", "Bordure pavés pelouse", "bordure pavés pelouse"], ["bord2-bordure-buis", "Bordure de buis", "bordure buis"]].map(([id, nom, fr]) => ({ catalogueId: id, jsonId: id, nom, fr, categorie: "Vue", nom_latin: "" }));
  const UNIVERS = args.includes("--vues") ? ["vues"] : args.includes("--ambiances") ? ["ambiances"] : ["mineral", "amenagements"];
  for (const univers of UNIVERS) {
    const entries = univers === "ambiances" ? AMBIANCES : univers === "vues" ? REALS : await listCatalogueEntriesForUnivers(univers);
    store[univers] ||= { items: {} };
    const bucket = store[univers].items;
    let n = 0;
    for (const entry of entries) {
      n += 1;
      const id = entry.catalogueId;
      if (ONLY && !ONLY.has(id) && !ONLY.has(entry.jsonId)) continue;
      if (!FORCE && !ONLY && bucket[id]?.candidates?.length) continue;
      console.log(`[${univers} ${n}/${entries.length}] ${entry.nom}`);
      const px = await collectPixabay(apiKey, entry);
      const wm = await collectWiki(EN[entry.jsonId] || entry.nom);
      const candidates = [];
      for (let i = 0; i < Math.max(px.length, wm.length); i++) {
        if (px[i]) candidates.push(px[i]);
        if (wm[i]) candidates.push(wm[i]);
      }
      const dir = path.join(THUMB_ROOT, univers, id);
      await fs.rm(dir, { recursive: true, force: true });
      await fs.mkdir(dir, { recursive: true });
      for (let i = 0; i < candidates.length; i++) {
        const f = `${String(i).padStart(2, "0")}.jpg`;
        const ok = await downloadThumb(candidates[i].thumbnailUrl, path.join(dir, f));
        candidates[i].thumbLocal = ok ? f : null;
        await sleep(150);
      }
      bucket[id] = { catalogueId: id, jsonId: entry.jsonId, nom: entry.nom, categorie: entry.categorie, univers,
        fetchedAt: new Date().toISOString(), fetchedBy: "v2", candidates };
      await save();
      console.log(`   → ${px.length} Pixabay + ${wm.length} Wikimedia`);
    }
  }
  console.log("\nTerminé. Vignettes dans sevya/.photo-thumbs/mineral et /amenagements");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
