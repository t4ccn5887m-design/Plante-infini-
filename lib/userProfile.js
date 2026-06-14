import { supabase } from "./supabase";
import { CGU_VERSION, CGV_VERSION } from "./legal";

async function upsertProfileFields(userId, fields) {
  if (!supabase || !userId) return { ok: false, error: "cloud_unavailable" };

  const row = {
    user_id: userId,
    ...fields,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("user_profiles").upsert(row, { onConflict: "user_id" });
  if (error) {
    console.error("[Wilder] user_profiles upsert:", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/** Enregistre l'acceptation des CGU + politique de confidentialité. */
export async function recordCguConsent(version = CGU_VERSION) {
  if (!supabase) return { ok: false, error: "cloud_unavailable" };

  const { data } = await supabase.auth.getSession();
  const user = data?.session?.user;
  if (!user) return { ok: false, error: "not_authenticated" };

  const at = new Date().toISOString();
  const meta = {
    cgu_consent_at: at,
    cgu_consent_version: version,
    privacy_consent_at: at,
    privacy_consent_version: version,
  };

  await supabase.auth.updateUser({ data: meta }).catch(() => {});

  return upsertProfileFields(user.id, {
    cgu_consent_at: at,
    cgu_consent_version: version,
    privacy_consent_at: at,
    privacy_consent_version: version,
  });
}

/** Enregistre l'acceptation des CGV avant paiement. */
export async function recordCgvConsent(version = CGV_VERSION) {
  if (!supabase) return { ok: false, error: "cloud_unavailable" };

  const { data } = await supabase.auth.getSession();
  const user = data?.session?.user;
  if (!user) return { ok: false, error: "not_authenticated" };

  const at = new Date().toISOString();
  const meta = {
    cgv_consent_at: at,
    cgv_consent_version: version,
  };

  await supabase.auth.updateUser({ data: meta }).catch(() => {});

  return upsertProfileFields(user.id, {
    cgv_consent_at: at,
    cgv_consent_version: version,
  });
}
