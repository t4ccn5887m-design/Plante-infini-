/**
 * API Réalisations — dossiers chantier + photos privées (signed URLs).
 */
import { supabase } from "@/lib/supabase";
import { compressToJpegBlob } from "@/lib/compressImage";

export const PRO_PROJECT_PHOTOS_BUCKET = "pro-project-photos";
const SIGNED_URL_TTL_SEC = 60 * 60;

function mapProject(row, photos = []) {
  if (!row || typeof row !== "object") return null;
  const list = Array.isArray(photos) ? photos : [];
  return {
    id: row.id,
    studioId: row.studio_id,
    title: String(row.title || ""),
    description: String(row.description || ""),
    location: String(row.location || ""),
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
    photos: list.map(mapPhoto).filter(Boolean),
    coverPath: list[0]?.path || null,
  };
}

function mapPhoto(row) {
  if (!row || typeof row !== "object") return null;
  return {
    id: row.id,
    projectId: row.project_id,
    path: String(row.path || ""),
    sortOrder: Number(row.sort_order) || 0,
    createdAt: row.created_at || null,
  };
}

function newUuid(fallbackSeed = 0) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${fallbackSeed}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Liste les réalisations d’un studio (photos incluses, 1ʳᵉ = couverture).
 */
export async function listProProjects(studioId) {
  if (!supabase) return { ok: false, error: "cloud_unavailable" };
  if (!studioId) return { ok: false, error: "studio_missing" };

  try {
    const { data, error } = await supabase
      .from("pro_projects")
      .select(
        `
        id,
        studio_id,
        title,
        description,
        location,
        created_at,
        updated_at
      `
      )
      .eq("studio_id", studioId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Wilder Pro] listProjects:", error.message);
      return {
        ok: false,
        error: "projects_load_failed",
        detail: error.message || String(error),
      };
    }

    const rows = data || [];
    /** @type {Record<string, object[]>} */
    const photosByProject = {};
    let photosDegraded = false;

    if (rows.length > 0) {
      const ids = rows.map((r) => r.id);
      const { data: photos, error: photoErr } = await supabase
        .from("pro_project_photos")
        .select("id, project_id, path, sort_order, created_at")
        .in("project_id", ids);

      if (photoErr) {
        console.warn(
          "[Wilder Pro] project photos enrichment skipped:",
          photoErr.message
        );
        photosDegraded = true;
      } else {
        for (const p of photos || []) {
          if (!p?.project_id) continue;
          if (!photosByProject[p.project_id]) photosByProject[p.project_id] = [];
          photosByProject[p.project_id].push(p);
        }
      }
    }

    const items = rows
      .map((row) => {
        const photos = [...(photosByProject[row.id] || [])].sort((a, b) => {
          const so = (a.sort_order || 0) - (b.sort_order || 0);
          if (so !== 0) return so;
          return String(a.created_at || "").localeCompare(
            String(b.created_at || "")
          );
        });
        return mapProject(row, photos);
      })
      .filter(Boolean);

    return { ok: true, items, photosDegraded };
  } catch (e) {
    console.error("[Wilder Pro] listProjects:", e);
    return {
      ok: false,
      error: "projects_load_failed",
      detail: e?.message ? String(e.message) : String(e),
    };
  }
}

/**
 * Crée un dossier (sans photos).
 */
export async function createProProject(studioId, fields) {
  if (!supabase) return { ok: false, error: "cloud_unavailable" };
  if (!studioId) return { ok: false, error: "studio_missing" };

  const title = typeof fields?.title === "string" ? fields.title.trim() : "";
  if (!title) return { ok: false, error: "project_title_required" };

  const description =
    typeof fields?.description === "string" ? fields.description.trim() : "";
  const location =
    typeof fields?.location === "string" ? fields.location.trim() : "";

  try {
    const { data, error } = await supabase
      .from("pro_projects")
      .insert({
        studio_id: studioId,
        title,
        description,
        location,
      })
      .select(
        "id, studio_id, title, description, location, created_at, updated_at"
      )
      .single();

    if (error) {
      console.error("[Wilder Pro] createProject:", error.message);
      return { ok: false, error: "project_create_failed" };
    }

    return { ok: true, project: mapProject(data, []) };
  } catch (e) {
    console.error("[Wilder Pro] createProject:", e);
    return { ok: false, error: "project_create_failed" };
  }
}

/**
 * Met à jour titre / description / lieu.
 */
export async function updateProProject(projectId, fields) {
  if (!supabase) return { ok: false, error: "cloud_unavailable" };
  if (!projectId) return { ok: false, error: "project_missing" };

  const patch = { updated_at: new Date().toISOString() };
  if (typeof fields?.title === "string") {
    const title = fields.title.trim();
    if (!title) return { ok: false, error: "project_title_required" };
    patch.title = title;
  }
  if (typeof fields?.description === "string") {
    patch.description = fields.description.trim();
  }
  if (typeof fields?.location === "string") {
    patch.location = fields.location.trim();
  }

  try {
    const { data, error } = await supabase
      .from("pro_projects")
      .update(patch)
      .eq("id", projectId)
      .select(
        "id, studio_id, title, description, location, created_at, updated_at"
      )
      .single();

    if (error) {
      console.error("[Wilder Pro] updateProject:", error.message);
      return { ok: false, error: "project_update_failed" };
    }

    return { ok: true, project: mapProject(data, []) };
  } catch (e) {
    console.error("[Wilder Pro] updateProject:", e);
    return { ok: false, error: "project_update_failed" };
  }
}

/**
 * Signed URLs ~1 h. Retourne un tableau aligné sur paths (null si échec).
 */
export async function getProjectPhotoSignedUrls(paths) {
  const list = Array.isArray(paths) ? paths.filter(Boolean) : [];
  if (!list.length || !supabase) return [];

  try {
    const { data, error } = await supabase.storage
      .from(PRO_PROJECT_PHOTOS_BUCKET)
      .createSignedUrls(list, SIGNED_URL_TTL_SEC);

    if (error) {
      console.error("[Wilder Pro] projectSignedUrls:", error.message);
      return list.map(() => null);
    }

    return (data || []).map((row) =>
      typeof row?.signedUrl === "string" && row.signedUrl.length > 0
        ? row.signedUrl
        : null
    );
  } catch (e) {
    console.error("[Wilder Pro] projectSignedUrls:", e);
    return list.map(() => null);
  }
}

/**
 * Upload multi data-URL → JPEG compressé → Storage + rows photos.
 * Continue les autres fichiers si l’un échoue ; renvoie les erreurs.
 */
export async function uploadProjectPhotos({
  studioId,
  projectId,
  photoDataUrls,
  startSort = 0,
}) {
  if (!supabase) return { ok: false, error: "cloud_unavailable", photos: [] };
  if (!studioId) return { ok: false, error: "studio_missing", photos: [] };
  if (!projectId) return { ok: false, error: "project_missing", photos: [] };

  const list = Array.isArray(photoDataUrls)
    ? photoDataUrls.filter((u) => typeof u === "string" && u.startsWith("data:"))
    : [];
  if (!list.length) return { ok: true, photos: [], failures: 0 };

  const uploaded = [];
  let failures = 0;
  let lastError = null;

  for (let i = 0; i < list.length; i += 1) {
    const compressed = await compressToJpegBlob(list[i], 1600, 0.82);
    if (!compressed.ok) {
      failures += 1;
      lastError = compressed.error;
      continue;
    }

    const path = `${studioId}/${projectId}/${newUuid(i)}.jpg`;
    const { error: upErr } = await supabase.storage
      .from(PRO_PROJECT_PHOTOS_BUCKET)
      .upload(path, compressed.blob, {
        upsert: false,
        contentType: "image/jpeg",
        cacheControl: "31536000",
      });

    if (upErr) {
      console.error("[Wilder Pro] project photo upload:", upErr.message);
      failures += 1;
      lastError = "photo_upload_failed";
      continue;
    }

    const { data: row, error: rowErr } = await supabase
      .from("pro_project_photos")
      .insert({
        project_id: projectId,
        path,
        sort_order: startSort + uploaded.length,
      })
      .select("id, project_id, path, sort_order, created_at")
      .single();

    if (rowErr) {
      console.error("[Wilder Pro] project photo row:", rowErr.message);
      await supabase.storage.from(PRO_PROJECT_PHOTOS_BUCKET).remove([path]);
      failures += 1;
      lastError = "photo_save_failed";
      continue;
    }

    uploaded.push(mapPhoto(row));
  }

  if (!uploaded.length && failures > 0) {
    return { ok: false, error: lastError || "photo_upload_failed", photos: [] };
  }

  return {
    ok: true,
    photos: uploaded,
    failures,
    error: failures > 0 ? lastError : null,
  };
}

/**
 * Supprime une photo (row + fichier Storage).
 */
export async function deleteProjectPhoto(photo) {
  if (!supabase) return { ok: false, error: "cloud_unavailable" };
  if (!photo?.id) return { ok: false, error: "photo_missing" };

  const path = photo.path;

  try {
    const { error } = await supabase
      .from("pro_project_photos")
      .delete()
      .eq("id", photo.id);

    if (error) {
      console.error("[Wilder Pro] deletePhoto:", error.message);
      return { ok: false, error: "photo_delete_failed" };
    }

    if (path) {
      const { error: storageErr } = await supabase.storage
        .from(PRO_PROJECT_PHOTOS_BUCKET)
        .remove([path]);
      if (storageErr) {
        console.error("[Wilder Pro] deletePhoto storage:", storageErr.message);
        // Row already gone — surface soft warning but treat as ok for UI
      }
    }

    return { ok: true };
  } catch (e) {
    console.error("[Wilder Pro] deletePhoto:", e);
    return { ok: false, error: "photo_delete_failed" };
  }
}

/**
 * Supprime un dossier + toutes ses photos Storage (pas d’orphelins).
 */
export async function deleteProProject(project) {
  if (!supabase) return { ok: false, error: "cloud_unavailable" };
  if (!project?.id) return { ok: false, error: "project_missing" };

  try {
    const { data: rows, error: listErr } = await supabase
      .from("pro_project_photos")
      .select("path")
      .eq("project_id", project.id);

    if (listErr) {
      console.error("[Wilder Pro] deleteProject list photos:", listErr.message);
      return { ok: false, error: "project_delete_failed" };
    }

    const fromDb = (rows || []).map((r) => r.path).filter(Boolean);
    const fromUi = (project.photos || []).map((p) => p.path).filter(Boolean);
    const paths = [...new Set([...fromDb, ...fromUi])];

    if (paths.length) {
      const { error: storageErr } = await supabase.storage
        .from(PRO_PROJECT_PHOTOS_BUCKET)
        .remove(paths);
      if (storageErr) {
        console.error(
          "[Wilder Pro] deleteProject storage:",
          storageErr.message
        );
        return { ok: false, error: "project_storage_purge_failed" };
      }
    }

    const { error } = await supabase
      .from("pro_projects")
      .delete()
      .eq("id", project.id);

    if (error) {
      console.error("[Wilder Pro] deleteProject:", error.message);
      return { ok: false, error: "project_delete_failed" };
    }

    return { ok: true };
  } catch (e) {
    console.error("[Wilder Pro] deleteProject:", e);
    return { ok: false, error: "project_delete_failed" };
  }
}

export function proProjectsErrorMessage(code, detail) {
  let base;
  switch (code) {
    case "cloud_unavailable":
      base = "Service indisponible. Vérifiez votre connexion et réessayez.";
      break;
    case "studio_missing":
      base = "Studio introuvable. Rechargez la page.";
      break;
    case "project_missing":
      base = "Réalisation introuvable.";
      break;
    case "project_title_required":
      base = "Indiquez un titre pour cette réalisation.";
      break;
    case "project_create_failed":
      base = "Impossible de créer la réalisation. Réessayez.";
      break;
    case "project_update_failed":
      base = "Impossible d’enregistrer. Réessayez.";
      break;
    case "project_delete_failed":
      base = "Impossible de supprimer la réalisation. Réessayez.";
      break;
    case "project_storage_purge_failed":
      base = "Impossible de supprimer les photos. Réessayez.";
      break;
    case "projects_load_failed":
      base = "Impossible de charger vos réalisations.";
      break;
    case "photo_missing":
      base = "Photo introuvable.";
      break;
    case "photo_invalid":
    case "photo_undecodable":
      base =
        "Cette photo n’a pas pu être lue (HEIC non supporté ici). Essayez JPEG ou PNG.";
      break;
    case "photo_encode_failed":
      base = "Compression impossible. Essayez une autre photo.";
      break;
    case "photo_upload_failed":
    case "photo_save_failed":
      base = "Upload échoué pour une ou plusieurs photos. Réessayez.";
      break;
    case "photo_delete_failed":
      base = "Impossible de supprimer la photo. Réessayez.";
      break;
    default:
      base = "Une erreur est survenue. Réessayez.";
  }
  const extra = typeof detail === "string" ? detail.trim() : "";
  if (extra && extra !== base) return `${base} (${extra})`;
  return base;
}
