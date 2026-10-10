import { compressToJpegBlob } from "@/lib/compressImage";

const DB_NAME = "sevya-garden-terrain-v1";
const STORE = "photos";
const COUNT_KEY = "wilder-garden-terrain-photo-count";
export const GARDEN_TERRAIN_MAX_PHOTOS = 6;

function readCount() {
  if (typeof window === "undefined") return 0;
  try {
    const n = parseInt(localStorage.getItem(COUNT_KEY) || "0", 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

function writeCount(n) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(COUNT_KEY, String(Math.max(0, n)));
  } catch {
    /* ignore */
  }
}

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onerror = () => reject(req.error || new Error("idb_open_failed"));
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function getGardenTerrainPhotoCountSync() {
  return readCount();
}

export async function listGardenTerrainPhotos() {
  if (typeof window === "undefined") return [];
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const req = store.getAll();
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const rows = (req.result || []).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      resolve(
        rows.map((row) => ({
          id: row.id,
          sortOrder: row.sortOrder ?? 0,
          objectUrl: row.blob ? URL.createObjectURL(row.blob) : null,
        }))
      );
    };
    tx.oncomplete = () => db.close();
  });
}

export async function addGardenTerrainPhotosFromFiles(fileList) {
  if (typeof window === "undefined") return { ok: false, error: "client_only" };
  const current = readCount();
  const room = Math.max(0, GARDEN_TERRAIN_MAX_PHOTOS - current);
  const files = Array.from(fileList || [])
    .filter((f) => f.type?.startsWith("image/"))
    .slice(0, room);
  if (!files.length) return { ok: true, added: 0 };

  const db = await openDb();
  let added = 0;
  let sortOrder = current;

  for (const file of files) {
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const compressed = await compressToJpegBlob(dataUrl, 1200, 0.75);
      if (!compressed.ok) continue;
      const id = crypto.randomUUID();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.onerror = () => reject(tx.error);
        tx.oncomplete = () => resolve();
        tx.objectStore(STORE).put({
          id,
          sortOrder,
          blob: compressed.blob,
          updatedAt: Date.now(),
        });
      });
      sortOrder += 1;
      added += 1;
    } catch {
      /* skip bad file */
    }
  }

  await syncPhotoCount(db);
  db.close();
  return { ok: true, added };
}

async function syncPhotoCount(db) {
  const rows = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result || []);
  });
  writeCount(rows.length);
}

export async function removeGardenTerrainPhoto(id) {
  if (typeof window === "undefined" || !id) return;
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => resolve();
    tx.objectStore(STORE).delete(id);
  });
  await syncPhotoCount(db);
  db.close();
}

/** Data URLs for PDF export */
export async function loadGardenTerrainPhotoDataUrls() {
  if (typeof window === "undefined") return [];
  const db = await openDb();
  const rows = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result || []);
    tx.oncomplete = () => db.close();
  });

  const sorted = rows.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const urls = [];
  for (const row of sorted) {
    if (!row.blob) continue;
    try {
      urls.push(await blobToDataUrl(row.blob));
    } catch {
      /* skip */
    }
  }
  return urls;
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
