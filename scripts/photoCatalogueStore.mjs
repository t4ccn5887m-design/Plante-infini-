import fs from "fs/promises";
import path from "path";
import { ROOT } from "./plantCatalogueIds.mjs";

const CANDIDATES_PATH = path.join(ROOT, "sevya/photo-candidates.json");
const CHOICES_PATH = path.join(ROOT, "sevya/photo-choices.json");

function emptyStore() {
  return {
    updatedAt: null,
    vegetal: { items: {} },
    mineral: { items: {} },
    amenagements: { items: {} },
  };
}

function normalizeStore(raw) {
  if (!raw || typeof raw !== "object") return emptyStore();
  const store = emptyStore();
  if (raw.plants && typeof raw.plants === "object") {
    store.vegetal.items = raw.plants;
  }
  if (raw.vegetal?.items) store.vegetal.items = raw.vegetal.items;
  if (raw.mineral?.items) store.mineral.items = raw.mineral.items;
  if (raw.amenagements?.items) store.amenagements.items = raw.amenagements.items;
  store.updatedAt = raw.updatedAt || null;
  return store;
}

export async function loadCandidatesStore() {
  try {
    const raw = JSON.parse(await fs.readFile(CANDIDATES_PATH, "utf8"));
    return normalizeStore(raw);
  } catch {
    return emptyStore();
  }
}

export async function saveCandidatesStore(store) {
  store.updatedAt = new Date().toISOString();
  await fs.writeFile(CANDIDATES_PATH, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

export function getCandidateBucket(store, univers) {
  if (univers === "vegetal") return store.vegetal.items;
  if (univers === "mineral") return store.mineral.items;
  if (univers === "amenagements") return store.amenagements.items;
  throw new Error(`Univers inconnu : ${univers}`);
}

export async function loadChoices() {
  try {
    return JSON.parse(await fs.readFile(CHOICES_PATH, "utf8"));
  } catch {
    return {};
  }
}
