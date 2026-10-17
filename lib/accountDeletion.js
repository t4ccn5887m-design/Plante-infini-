import { supabase } from "@/lib/supabase";
import { PRO_BRIEF_PHOTOS_BUCKET } from "@/lib/pro/clientBriefApi";
import { PRO_PROJECT_PHOTOS_BUCKET } from "@/lib/pro/proProjectsApi";

const IMAGES_BUCKET = "images";
const LIST_LIMIT = 1000;

async function removeFilesInFolder(bucket, folder) {
  if (!supabase || !folder) return;
  const prefix = String(folder).replace(/\/$/, "");
  let offset = 0;

  for (;;) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit: LIST_LIMIT,
      offset,
    });
    if (error) {
      console.warn(`[Sevya] accountDeletion list ${bucket}/${prefix}:`, error.message);
      return;
    }

    const entries = data || [];
    const paths = entries.filter((e) => e.id).map((e) => `${prefix}/${e.name}`);
    if (paths.length) {
      const { error: remErr } = await supabase.storage.from(bucket).remove(paths);
      if (remErr) {
        console.warn(`[Sevya] accountDeletion remove ${bucket}:`, remErr.message);
      }
    }

    if (entries.length < LIST_LIMIT) break;
    offset += LIST_LIMIT;
  }
}

async function purgeImagesForUser(uid) {
  await removeFilesInFolder(IMAGES_BUCKET, uid);
}

async function purgeProProjectPhotos(studioId) {
  if (!supabase || !studioId) return;
  const root = String(studioId);
  let offset = 0;

  for (;;) {
    const { data, error } = await supabase.storage.from(PRO_PROJECT_PHOTOS_BUCKET).list(root, {
      limit: LIST_LIMIT,
      offset,
    });
    if (error) {
      console.warn(`[Sevya] accountDeletion list ${PRO_PROJECT_PHOTOS_BUCKET}/${root}:`, error.message);
      return;
    }

    const entries = data || [];
    for (const entry of entries) {
      if (entry.id) {
        const { error: remErr } = await supabase.storage
          .from(PRO_PROJECT_PHOTOS_BUCKET)
          .remove([`${root}/${entry.name}`]);
        if (remErr) {
          console.warn(`[Sevya] accountDeletion remove ${PRO_PROJECT_PHOTOS_BUCKET}:`, remErr.message);
        }
      } else if (entry.name) {
        await removeFilesInFolder(PRO_PROJECT_PHOTOS_BUCKET, `${root}/${entry.name}`);
      }
    }

    if (entries.length < LIST_LIMIT) break;
    offset += LIST_LIMIT;
  }
}

async function purgeProBriefPhotosForStudio(studioId) {
  if (!supabase || !studioId) return;

  const { data: links, error } = await supabase
    .from("pro_links")
    .select("token")
    .eq("studio_id", studioId);

  if (error) {
    console.warn("[Sevya] accountDeletion pro_links tokens:", error.message);
    return;
  }

  for (const row of links || []) {
    const token = row?.token ? String(row.token).trim() : "";
    if (token) await removeFilesInFolder(PRO_BRIEF_PHOTOS_BUCKET, token);
  }
}

async function purgeProStorage(studioId) {
  await purgeProProjectPhotos(studioId);
  await purgeProBriefPhotosForStudio(studioId);
}

export async function deleteMyAccount() {
  if (!supabase) return { ok: false, error: "cloud_unavailable" };

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const uid = session?.user?.id;
  if (!uid) return { ok: false, error: "not_signed_in" };

  await purgeImagesForUser(uid);

  const { data: studioRow, error: studioErr } = await supabase
    .from("pro_studios")
    .select("id")
    .eq("pro_user_id", uid)
    .maybeSingle();

  if (studioErr) {
    console.warn("[Sevya] accountDeletion pro_studios:", studioErr.message);
  } else if (studioRow?.id) {
    await purgeProStorage(studioRow.id);
  }

  const { data, error } = await supabase.rpc("delete_my_account");
  if (error || data !== true) {
    console.error("[Sevya] delete_my_account:", error?.message || error || data);
    return { ok: false, error: "delete_failed" };
  }

  await supabase.auth.signOut();
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }
  try {
    sessionStorage.clear();
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    window.location.href = "/";
  }
  return { ok: true };
}
