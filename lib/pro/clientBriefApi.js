/**
 * API client invité — questionnaire /b/[token]
 * Aucun compte : RPC security definer + Storage par token.
 */
import { supabase } from "@/lib/supabase";
import { compressDataUrl } from "@/lib/compressImage";

export const PRO_BRIEF_PHOTOS_BUCKET = "pro-brief-photos";

function dataUrlToBlob(dataUrl) {
  const [header, body] = String(dataUrl || "").split(",");
  if (!body) return null;
  const mimeMatch = /data:([^;]+)/.exec(header || "");
  const mime = mimeMatch?.[1] || "image/jpeg";
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function mapStudio(raw) {
  if (!raw || typeof raw !== "object") return null;
  return {
    name: String(raw.name || "Studio"),
    contactFirstName: String(raw.contact_first_name || ""),
    initials: String(raw.initials || "?"),
    color: String(raw.color || "#2F5E3F"),
    logoUrl: raw.logo_url ? String(raw.logo_url) : null,
  };
}

function mapLink(raw) {
  if (!raw || typeof raw !== "object") return null;
  return {
    token: String(raw.token || ""),
    status: String(raw.status || "sent"),
    clientName: raw.client_name ? String(raw.client_name) : "",
    openedAt: raw.opened_at || null,
    filledAt: raw.filled_at || null,
  };
}

/**
 * Charge le lien + branding studio. Marque sent → opened côté SQL.
 * @returns {{ ok: true, link, studio } | { ok: false, error: string }}
 */
export async function loadProLinkByToken(token) {
  const trimmed = typeof token === "string" ? token.trim() : "";
  if (!trimmed) {
    return { ok: false, error: "missing_token" };
  }
  if (!supabase) {
    return { ok: false, error: "cloud_unavailable" };
  }

  const { data, error } = await supabase.rpc("get_pro_link_by_token", {
    p_token: trimmed,
  });

  if (error) {
    console.error("[Wilder Pro] get_pro_link_by_token:", error.message);
    return { ok: false, error: "rpc_failed" };
  }

  if (!data?.ok) {
    const code = data?.error || "not_found";
    return { ok: false, error: code };
  }

  const studio = mapStudio(data.studio);
  const link = mapLink(data.link);
  if (!studio || !link) {
    return { ok: false, error: "invalid_payload" };
  }

  return { ok: true, studio, link };
}

/**
 * Upload les data-URL vers Storage : {token}/{uuid}.jpg
 * @returns {{ ok: true, paths: string[] } | { ok: false, error: string }}
 */
export async function uploadBriefPhotos(token, photoDataUrls) {
  const trimmed = typeof token === "string" ? token.trim() : "";
  const list = Array.isArray(photoDataUrls)
    ? photoDataUrls.filter((u) => typeof u === "string" && u.startsWith("data:"))
    : [];

  if (!list.length) return { ok: true, paths: [] };
  if (!supabase) return { ok: false, error: "cloud_unavailable" };
  if (!trimmed) return { ok: false, error: "missing_token" };

  const paths = [];
  for (let i = 0; i < list.length; i += 1) {
    const compressed = await compressDataUrl(list[i], 1600, 0.82);
    const blob = dataUrlToBlob(compressed);
    if (!blob) return { ok: false, error: "photo_encode_failed" };

    const ext = blob.type.includes("png") ? "png" : "jpg";
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 10)}`;
    const path = `${trimmed}/${id}.${ext}`;

    const { error } = await supabase.storage
      .from(PRO_BRIEF_PHOTOS_BUCKET)
      .upload(path, blob, {
        upsert: false,
        contentType: blob.type || "image/jpeg",
        cacheControl: "31536000",
      });

    if (error) {
      console.error("[Wilder Pro] photo upload:", error.message);
      return { ok: false, error: "photo_upload_failed" };
    }
    paths.push(path);
  }

  return { ok: true, paths };
}

/**
 * Soumet le brief (photos d’abord, puis RPC submit_pro_brief).
 * @returns {{ ok: true, briefId: string } | { ok: false, error: string }}
 */
export async function submitClientBrief(token, answers) {
  const trimmed = typeof token === "string" ? token.trim() : "";
  if (!trimmed) return { ok: false, error: "missing_token" };
  if (!supabase) return { ok: false, error: "cloud_unavailable" };

  const photos = Array.isArray(answers?.photos) ? answers.photos : [];
  const upload = await uploadBriefPhotos(trimmed, photos);
  if (!upload.ok) return upload;

  const payload = {
    tastes: Array.isArray(answers?.tastes) ? answers.tastes : [],
    plants: Array.isArray(answers?.plants) ? answers.plants : [],
    materials: Array.isArray(answers?.materials) ? answers.materials : [],
    priorities: Array.isArray(answers?.priorities) ? answers.priorities : [],
    garden_users: Array.isArray(answers?.users) ? answers.users : [],
    maintenance: answers?.maintenance || null,
    photo_urls: upload.paths,
    budget: answers?.budget || null,
    message: typeof answers?.message === "string" ? answers.message : "",
  };

  const { data, error } = await supabase.rpc("submit_pro_brief", {
    p_token: trimmed,
    p_answers: payload,
  });

  if (error) {
    console.error("[Wilder Pro] submit_pro_brief:", error.message);
    return { ok: false, error: "rpc_failed" };
  }

  if (!data?.ok) {
    return { ok: false, error: data?.error || "submit_failed" };
  }

  return { ok: true, briefId: data.brief_id };
}

/** Messages FR pour l’UI invité */
export function clientBriefErrorMessage(code) {
  switch (code) {
    case "missing_token":
      return "Lien invalide.";
    case "invalid_token":
      return "Ce lien n’est pas valide.";
    case "not_found":
      return "Ce lien est introuvable. Demandez un nouveau lien à votre paysagiste.";
    case "studio_missing":
      return "Ce lien n’est plus associé à un studio.";
    case "already_filled":
      return "Ce brief a déjà été envoyé. Merci !";
    case "cloud_unavailable":
      return "Service indisponible pour le moment. Réessayez plus tard.";
    case "photo_upload_failed":
    case "photo_encode_failed":
      return "Impossible d’envoyer les photos. Réessayez ou continuez sans photo.";
    case "rpc_failed":
    case "submit_failed":
    case "invalid_payload":
      return "Une erreur est survenue. Réessayez dans un instant.";
    default:
      return "Une erreur est survenue. Réessayez dans un instant.";
  }
}
