import fs from "fs";
import path from "path";

const CANDIDATES_PATH = path.join(process.cwd(), "sevya/photo-candidates.json");

function emptyStore() {
  return {
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
  return store;
}

export function readCandidatesStoreSync() {
  try {
    const raw = JSON.parse(fs.readFileSync(CANDIDATES_PATH, "utf8"));
    return normalizeStore(raw);
  } catch {
    return emptyStore();
  }
}

export function getCandidateBucketSync(store, univers) {
  if (univers === "vegetal") return store.vegetal.items;
  if (univers === "mineral") return store.mineral.items;
  if (univers === "amenagements") return store.amenagements.items;
  throw new Error(`Univers inconnu : ${univers}`);
}
