import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Décode le rôle JWT (service_role vs anon) pour détecter une mauvaise clé. */
export function getSupabaseKeyRole(key) {
  if (!key || typeof key !== "string") return null;
  try {
    const parts = key.split(".");
    if (parts.length < 2) return null;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
    return payload.role || null;
  } catch {
    return null;
  }
}

export function validateServiceRoleConfig() {
  if (!supabaseUrl) {
    return { ok: false, error: "NEXT_PUBLIC_SUPABASE_URL manquante" };
  }
  if (!serviceRoleKey) {
    return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY manquante côté serveur" };
  }
  const role = getSupabaseKeyRole(serviceRoleKey);
  if (role === "anon") {
    return {
      ok: false,
      error: "SUPABASE_SERVICE_ROLE_KEY contient la clé anon — utilisez la clé service_role du projet Supabase",
    };
  }
  return { ok: true, role: role || "service_role" };
}

export const supabaseAdmin =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;

export function isScanQuotaServerAvailable() {
  return Boolean(supabaseAdmin) && validateServiceRoleConfig().ok;
}

export function getSupabaseAdminDiagnostics() {
  const validation = validateServiceRoleConfig();
  return {
    configured: validation.ok,
    role: validation.role || getSupabaseKeyRole(serviceRoleKey),
    error: validation.ok ? null : validation.error,
    urlSet: Boolean(supabaseUrl),
  };
}
